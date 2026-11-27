import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { FlButtonComponent } from '../../common_ui/fl_ui/fl-button/fl-button.component';
import { FlErrorStateComponent } from '../../common_ui/fl_ui/fl-error-state/fl-error-state.component';
import { FlTooltipDirective } from '../../common_ui/fl_ui/fl-tooltip/fl-tooltip.directive';
import { QuickUp } from '../../common_ui/animations/animation';
import { relativeTime } from '../../shared/utils/relative-time.util';
import {
  SubscribeService,
  SubscriptionArticleItem,
  SubscriptionSourceItem,
} from './subscribe.service';

const PAGE_SIZE = 24;
/** 三天内算「新」，卡片上给一个小 NEW 标记 */
const FRESH_MS = 3 * 24 * 60 * 60 * 1000;

interface ArticlePagePayload {
  data?: SubscriptionArticleItem[];
  total?: number;
  updatedAt?: string;
  refreshing?: boolean;
}

/**
 * 「再花的订阅」——站长自己的 RSS 阅读夹。
 *
 * 站内没有任何入口，只能直接访问 /subscribe。
 * 数据全部来自 API 的定时快照：本页只请求自己的接口，绝不在这里实时抓外部 feed。
 *
 * 交互：频道只作展示与跳转（按最新更新时间排序、自动横向滚动、悬停暂停）；
 * 文章卡片沿用友链页的行卡片，只亮当前悬停 / 聚焦的一张；
 * 首屏 24 条，滚到底自动加载下一页。
 */
@Component({
  selector: 'flower-subscribe',
  standalone: true,
  imports: [
    NgClass,
    FlButtonComponent,
    FlTooltipDirective,
    FlErrorStateComponent,
  ],
  templateUrl: './subscribe.component.html',
  styleUrl: './subscribe.component.css',
  animations: [QuickUp],
})
export class SubscribeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly subscribeService = inject(SubscribeService);

  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;

  readonly supportsIntersectionObserver =
    typeof IntersectionObserver !== 'undefined';
  readonly skeletonCards = [1, 2, 3, 4];

  loading = true;
  showSkeleton = false;
  loadError = false;

  /** 按最新更新时间从新到旧排好的频道 */
  sources: SubscriptionSourceItem[] = [];
  /** 横向跑马灯用：两份相同的频道，接成无缝循环 */
  marqueeSources: SubscriptionSourceItem[] = [];

  articles: SubscriptionArticleItem[] = [];
  total = 0;
  updatedAt = '';

  hasMore = false;
  loadingMore = false;
  loadMoreError = false;

  /** 加载失败的作者头像地址；同一张卡片重渲染时不再反复请求坏图 */
  private readonly failedAvatars = new Set<string>();

  private page = 0;
  private requestToken = 0;
  private skeletonTimer?: ReturnType<typeof setTimeout>;
  private sentinelTimer?: ReturnType<typeof setTimeout>;
  private emptyRetryTimer?: ReturnType<typeof setTimeout>;
  /** scroll 事件节流计时器 */
  private scrollTick?: ReturnType<typeof setTimeout>;
  private emptyRetryCount = 0;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.loadSources();
    this.loadFirstPage();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.sentinel) {
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.tryLoadMore();
        }
      },
      { rootMargin: '400px 0px' },
    );
    this.observer.observe(this.sentinel.nativeElement);

    // 观察器在「内容变高但哨兵始终没离开视口」等边角情况下不会补发回调，
    // 再用一个节流的滚动兜底：接近底部就接下一页。
    window.addEventListener('scroll', this.onWindowScroll, { passive: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onWindowScroll);
    }
    this.clearTimer(this.skeletonTimer);
    this.clearTimer(this.sentinelTimer);
    this.clearTimer(this.emptyRetryTimer);
    this.clearTimer(this.scrollTick);
  }

  private readonly onWindowScroll = (): void => {
    if (!isPlatformBrowser(this.platformId) || this.scrollTick !== undefined) {
      return;
    }

    this.scrollTick = setTimeout(() => {
      this.scrollTick = undefined;

      if (
        this.loading ||
        this.loadingMore ||
        !this.hasMore ||
        this.loadMoreError ||
        typeof window === 'undefined'
      ) {
        return;
      }

      const remaining =
        document.documentElement.scrollHeight -
        (window.innerHeight + window.scrollY);
      if (remaining <= 600) {
        this.loadMore();
      }
    }, 120);
  };

  // ── 模板辅助 ──

  get updatedText(): string {
    return this.updatedAt ? relativeTime(this.updatedAt) : '还没抓过';
  }

  get updatedTooltip(): string {
    if (!this.updatedAt) {
      return '服务器还没有写入过快照';
    }
    const date = new Date(this.updatedAt);
    return Number.isNaN(date.getTime())
      ? '服务器还没有写入过快照'
      : date.toLocaleString('zh-CN', { hour12: false });
  }

  /** 跑马灯时长：每个频道约 7 秒，最少 28 秒，保证是「慢慢滚动」 */
  get marqueeDuration(): string {
    return `${Math.max(28, this.sources.length * 7)}s`;
  }

  /** 跑马灯第二份用于无缝循环；后半段的链接不进入 Tab 顺序 */
  isDuplicateChannel(index: number): boolean {
    return index >= this.sources.length;
  }

  relative(timestamp: number): string {
    return relativeTime(new Date(timestamp).toISOString());
  }

  fullDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
  }

  isFresh(timestamp: number): boolean {
    return Date.now() - timestamp < FRESH_MS;
  }

  accentClass(sourceId: number): string {
    return `accent-${Math.abs(sourceId) % 5}`;
  }

  initial(name: string): string {
    return (name ?? '').trim().slice(0, 1).toUpperCase() || '?';
  }

  isAvatarFailed(url: string | undefined): boolean {
    return !!url && this.failedAvatars.has(url);
  }

  markAvatarFailed(url: string | undefined): void {
    if (url) {
      this.failedAvatars.add(url);
    }
  }

  // ── 取数 ──

  private loadSources(): void {
    this.subscribeService.getSources().subscribe({
      next: (res: any) => {
        const data = (res?.data?.data ?? []) as SubscriptionSourceItem[];
        // 频道按各自最新一篇文章的发布时间从新到旧排，没有文章的排最后
        this.sources = [...data].sort(
          (left, right) => (right.latestAt ?? 0) - (left.latestAt ?? 0),
        );
        // 少于 6 个时跑马灯跑不满一圈，改成居中静态排布
        this.marqueeSources =
          this.sources.length >= 6
            ? [...this.sources, ...this.sources]
            : this.sources;
      },
      error: () => {
        // 频道条取不到不影响文章流
        this.sources = [];
        this.marqueeSources = [];
      },
    });
  }

  reload(): void {
    this.articles = [];
    this.total = 0;
    this.emptyRetryCount = 0;
    this.loadFirstPage();
  }

  private loadFirstPage(): void {
    const token = ++this.requestToken;
    this.clearTimer(this.emptyRetryTimer);
    this.emptyRetryTimer = undefined;
    this.loading = true;
    this.loadError = false;
    this.loadMoreError = false;
    this.hasMore = false;
    this.page = 0;
    this.showSkeleton = false;
    this.scheduleSkeleton();

    this.subscribeService
      .getArticles({ page: 1, pageSize: PAGE_SIZE })
      .subscribe({
        next: (res: any) => {
          if (token !== this.requestToken) {
            return;
          }

          const payload = (res?.data ?? {}) as ArticlePagePayload;
          this.articles = payload.data ?? [];
          this.total = payload.total ?? 0;
          this.updatedAt = payload.updatedAt || this.updatedAt;
          this.page = 1;
          this.hasMore = this.articles.length < this.total;
          this.loading = false;
          this.showSkeleton = false;
          this.clearTimer(this.skeletonTimer);
          this.skeletonTimer = undefined;

          if (this.articles.length) {
            this.emptyRetryCount = 0;
          } else {
            this.scheduleEmptyRetry(payload);
          }

          this.scheduleSentinelCheck();
        },
        error: () => {
          if (token !== this.requestToken) {
            return;
          }
          this.loading = false;
          this.showSkeleton = false;
          this.clearTimer(this.skeletonTimer);
          this.skeletonTimer = undefined;
          this.loadError = true;
        },
      });
  }

  private loadMore(): void {
    if (this.loading || this.loadingMore || !this.hasMore) {
      return;
    }

    const token = this.requestToken;
    const nextPage = this.page + 1;
    this.loadingMore = true;
    this.loadMoreError = false;

    this.subscribeService
      .getArticles({ page: nextPage, pageSize: PAGE_SIZE })
      .subscribe({
        next: (res: any) => {
          if (token !== this.requestToken) {
            return;
          }

          const payload = (res?.data ?? {}) as ArticlePagePayload;
          const incoming = payload.data ?? [];
          const seen = new Set(this.articles.map((item) => item.id));
          const added = incoming.filter((item) => !seen.has(item.id));
          this.articles = [...this.articles, ...added];
          this.total = payload.total ?? this.total;
          this.updatedAt = payload.updatedAt || this.updatedAt;
          this.page = nextPage;
          // 一页全是重复 / 空页时直接收尾，避免快照在翻页途中变化后无限接页
          this.hasMore =
            added.length > 0 && this.articles.length < this.total;
          this.loadingMore = false;
          this.scheduleSentinelCheck();
        },
        error: () => {
          if (token !== this.requestToken) {
            return;
          }
          this.loadingMore = false;
          this.loadMoreError = true;
        },
      });
  }

  /** 「加载更多」按钮 / 观察器共用的入口 */
  tryLoadMore(): void {
    this.loadMore();
  }

  retryLoadMore(): void {
    this.loadMoreError = false;
    this.loadMore();
  }

  private scheduleSkeleton(): void {
    this.clearTimer(this.skeletonTimer);
    this.skeletonTimer = setTimeout(() => {
      if (this.loading && !this.articles.length) {
        this.showSkeleton = true;
      }
    }, 600);
  }

  /**
   * 首屏为空且服务器正在抓取时，安静地再问几次。
   * 这是本页唯一会重复请求的场景，且只请求自己的 API，不会打外部站点。
   */
  private scheduleEmptyRetry(payload: ArticlePagePayload): void {
    if (!payload.refreshing || this.emptyRetryCount >= 3) {
      return;
    }

    this.emptyRetryCount += 1;
    this.clearTimer(this.emptyRetryTimer);
    this.emptyRetryTimer = setTimeout(() => {
      this.emptyRetryTimer = undefined;
      this.loadFirstPage();
    }, 8000);
  }

  /**
   * 追加内容后检查哨兵是否仍在视口附近。
   * IntersectionObserver 只在「进入 / 离开」时回调，内容变高后它不会自己再触发一次，
   * 所以这里补一次位置判断，让一屏装不满时能继续接上下一页。
   */
  private scheduleSentinelCheck(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clearTimer(this.sentinelTimer);
    this.sentinelTimer = setTimeout(() => {
      if (
        !this.sentinel ||
        !this.hasMore ||
        this.loading ||
        this.loadingMore ||
        this.loadMoreError ||
        typeof window === 'undefined'
      ) {
        return;
      }

      const rect = this.sentinel.nativeElement.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 400) {
        this.loadMore();
      }
    }, 120);
  }

  private clearTimer(timer?: ReturnType<typeof setTimeout>): void {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

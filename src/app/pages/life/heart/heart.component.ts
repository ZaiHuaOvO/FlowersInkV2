import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { DatePipe, isPlatformBrowser, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { NodataComponent } from '../../../components/website/nodata/nodata.component';
import { LifeCommentsComponent } from '../../../components/life/life-comments/life-comments.component';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import { QuickUp, RefreshUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { LifeService } from '../life.service';
import { LifeUiStateService } from '../life-ui-state.service';
import { LifeDialogComponent } from './life-dialog/life-dialog.component';
import { inferOriginalImageUrl } from '../../../shared/utils/image-url.util';

type LifeCategory = '美食' | '日常' | '游戏' | '摘抄' | '';

interface LifeImageAsset {
  previewUrl: string;
  originalUrl: string;
}

interface LifeTimelineItem {
  id: number;
  title: string;
  content: string;
  source: string;
  date: Date;
  dateText: string;
  tags: string[];
  primaryTag: string;
  images: LifeImageAsset[];
  likes: number;
  commentCount: number;
}

interface TimelineSection {
  key: string;
  year: number;
  month: number;
  label: string;
  items: LifeTimelineItem[];
}

interface YearNavigator {
  year: number;
  months: Array<{ key: string; month: number; label: string }>;
}

@Component({
  selector: 'flower-heart',
  standalone: true,
  imports: [
    NgClass,
    NzAffixModule,
    NzFlexModule,
    NzIconModule,
    NzSpinModule,
    NzTypographyModule,
    NzTagModule,
    NzImageModule,
    NzModalModule,
    BlogTitleComponent,
    NodataComponent,
    LifeCommentsComponent,
    FlCardDirective,
    FlTagDirective,
  ],
  templateUrl: './heart.component.html',
  styleUrl: './heart.component.css',
  providers: [DatePipe],
  animations: [QuickUp, RefreshUp],
})
export class HeartComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly tagFilters: Array<{ label: string; value: LifeCategory }> = [
    { label: '全部', value: '' },
    { label: '美食', value: '美食' },
    { label: '日常', value: '日常' },
    { label: '游戏', value: '游戏' },
    { label: '摘抄', value: '摘抄' },
  ];

  loading = true;
  loadingMessage = '点滴整理中...';
  isMobile = false;
  errorMessage = '';
  affixOffsetTop = 84;
  isAffixDisabled = true;
  mobileNavVisible = false;

  /** Track which items are animating */
  animatingItems = new Set<number>();
  /** 详情弹窗实例引用（用于关闭后同步路由） */
  private detailModalRef: any = null;
  /** 当前弹窗展示的点滴 id */
  private activeDetailId: number | null = null;
  /** 防止路由订阅与点击事件竞态导致重复打开 */
  private detailOpening = false;
  /** 打开详情弹窗前列表的滚动位置，关闭后恢复 */
  private savedListScrollY = 0;
  /** 仅当从列表点击打开弹窗时，关闭后才恢复滚动位置（URL 直达不恢复） */
  private restoreScrollOnClose = false;

  readonly loadingMessages = [
    '正在翻找再花的日记本...',
    '数一数今天有多少条点滴...',
    '把生活的碎片拼起来...',
    '再花正在努力整理中...',
    '泡杯茶，马上就好...',
    '翻一翻再花的相册...',
  ];

  headerTick = 0;

  private readonly imageService = inject(NzImageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uiState = inject(LifeUiStateService);
  private allSections: TimelineSection[] = [];

  selectedTag: LifeCategory = '';
  sectionList: TimelineSection[] = [];
  yearNavigator: YearNavigator[] = [];
  activeSectionKey = '';
  filterMotionTick = 0;
  tagCounter: Record<string, number> = {};
  totalItemCount = 0;
  private scrollAnimationFrame: number | null = null;
  private isProgrammaticScroll = false;
  private programmaticTargetSectionKey = '';

  @ViewChildren('monthSection') monthSectionRefs!: QueryList<ElementRef<HTMLElement>>;

  constructor(
    private readonly lifeService: LifeService,
    private readonly windowService: WindowService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly modal: NzModalService,
  ) {
    this.windowService.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit(): void {
    this.pickLoadingMessage();
    this.loadLikeState();
    this.fetchTimeline();

    // 路由绑定：/life/:id 直达时打开详情弹窗；浏览器返回 /life 时关闭弹窗。
    // 卡片点击走 openDetailDialog 直接打开，不依赖此处 emit（同 id 不会重复 emit）。
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id && Number(id) > 0) {
          this.openDetailById(Number(id));
        } else {
          this.detailModalRef?.close();
          this.detailModalRef = null;
          this.detailOpening = false;
          this.activeDetailId = null;
        }
      });
  }

  ngAfterViewInit(): void {
    this.monthSectionRefs.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.syncActiveSection();
      });
  }

  ngOnDestroy(): void {
    this.cancelActiveScroll();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.syncActiveSection();
  }

  get activeSection(): TimelineSection | undefined {
    if (!this.sectionList.length) {
      return undefined;
    }

    return (
      this.sectionList.find((section) => section.key === this.activeSectionKey) ??
      this.sectionList[0]
    );
  }

  get activeYear(): number | null {
    return this.activeSection?.year ?? null;
  }

  trackSection(_: number, section: TimelineSection): string {
    return section.key;
  }

  trackItem(_: number, item: LifeTimelineItem): number {
    return item.id;
  }

  selectTag(tag: LifeCategory): void {
    if (this.selectedTag === tag) {
      return;
    }

    this.selectedTag = tag;
    this.headerTick++;
    this.applyFilterAndNavigator();
  }

  jumpToYear(year: number): void {
    this.closeMobileNav();
    const target = this.yearNavigator.find((item) => item.year === year);
    const firstMonth = target?.months?.[0];
    if (!firstMonth) {
      return;
    }
    this.scrollToSection(firstMonth.key);
  }

  jumpToMonth(sectionKey: string): void {
    this.closeMobileNav();
    this.scrollToSection(sectionKey);
  }

  retry(): void {
    this.fetchTimeline();
  }

  getTagCount(tag: LifeCategory): number {
    if (!tag) {
      return this.totalItemCount;
    }
    return this.tagCounter[tag] ?? 0;
  }

  shouldShowSource(item: LifeTimelineItem): boolean {
    return !!item.source;
  }

  getTagClass(tag: string): string {
    switch (tag) {
      case '美食':
        return 'tag-food';
      case '日常':
        return 'tag-daily';
      case '游戏':
        return 'tag-game';
      case '摘抄':
        return 'tag-excerpt';
      default:
        return 'tag-default';
    }
  }

  getLikeCount(item: LifeTimelineItem): number {
    return this.uiState.getLikeCount(item.id);
  }

  isLiked(item: LifeTimelineItem): boolean {
    return this.uiState.isLiked(item.id);
  }

  isAnimating(item: LifeTimelineItem): boolean {
    return this.animatingItems.has(item.id);
  }

  toggleLike(item: LifeTimelineItem, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    // Prevent rapid double clicks (animation is still playing)
    if (this.animatingItems.has(item.id)) return;

    // Always play the animation
    this.triggerLikeAnimation(item);

    // If already liked, skip API call; always play animation
    if (this.uiState.isLiked(item.id)) {
      return;
    }

    // Optimistic UI update
    const currentCount = this.uiState.getLikeCount(item.id);
    this.uiState.markLiked(item.id, currentCount + 1);
    this.saveLikeState();

    this.lifeService.likeLife(item.id).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.uiState.markLiked(item.id, Number(data?.likes ?? currentCount + 1));
      },
      error: () => {
        // Revert optimistic update on error
        this.uiState.revertLike(item.id, currentCount);
        this.saveLikeState();
      },
    });
  }

  /** 该条点滴的评论表单/评论区是否展开 */
  isCommentOpen(item: LifeTimelineItem): boolean {
    return this.uiState.isCommentOpen(item.id);
  }

  /** 点击评论数按钮：切换该条点滴的评论表单/评论区展开状态 */
  toggleComments(event: MouseEvent, item: LifeTimelineItem): void {
    event.stopPropagation();
    this.uiState.toggleCommentOpen(item.id);
  }

  private triggerLikeAnimation(item: LifeTimelineItem): void {
    this.animatingItems.add(item.id);
    setTimeout(() => {
      this.animatingItems.delete(item.id);
    }, 1000);
  }

  private loadLikeState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const stored = localStorage.getItem('fi_life_likes');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.dateKey === this.getTodayKey() && Array.isArray(data.ids)) {
          this.uiState.restoreLikedIds(data.ids);
        } else {
          localStorage.removeItem('fi_life_likes');
        }
      }
    } catch {
      // ignore
    }
  }

  private saveLikeState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(
        'fi_life_likes',
        JSON.stringify({
          dateKey: this.getTodayKey(),
          ids: this.uiState.getLikedIds(),
        }),
      );
    } catch {
      // ignore
    }
  }

  private getTodayKey(): string {
    const now = new Date();
    // Beijing time 9am cutoff: if before 9am, use yesterday's date
    const beijingOffsetMs = 8 * 60 * 60 * 1000;
    const beijingMs = now.getTime() + beijingOffsetMs;
    const beijingDate = new Date(beijingMs);
    if (beijingDate.getUTCHours() < 9) {
      beijingDate.setUTCDate(beijingDate.getUTCDate() - 1);
    }
    const y = beijingDate.getUTCFullYear();
    const m = String(beijingDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(beijingDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getImageGridClass(item: LifeTimelineItem): string {
    if (item.primaryTag === '游戏') {
      if (item.images.length === 1) {
        return 'grid-game-one';
      }
      if (item.images.length === 2) {
        return 'grid-game-two';
      }
      return 'grid-game-three';
    }

    if (item.images.length === 1) {
      return 'grid-default-one';
    }
    if (item.images.length === 2) {
      return 'grid-default-two';
    }
    return 'grid-default-three';
  }

  isExcerpt(item: LifeTimelineItem): boolean {
    return item.primaryTag === '摘抄';
  }

  getImageItemClass(item: LifeTimelineItem): string {
    return item.primaryTag === '游戏' && item.images.length === 1
      ? 'image-item-wrapper image-item-rect'
      : 'image-item-wrapper image-item-square';
  }

  previewCompressed(image: LifeImageAsset): void {
    this.imageService.preview([{ src: image.previewUrl }], {
      nzZoom: 0.8,
      nzRotate: 0,
    });
  }

  previewOriginal(event: MouseEvent, image: LifeImageAsset): void {
    event.stopPropagation();
    this.imageService.preview([{ src: image.originalUrl }], {
      nzZoom: 0.8,
      nzRotate: 0,
    });
  }

  // ---- 详情弹窗 ----

  /** 点击卡片：直接打开详情弹窗，并同步路由为 /life/:id */
  openDetailDialog(item: LifeTimelineItem, event?: MouseEvent): void {
    event?.stopPropagation();
    this.savedListScrollY = window.scrollY || window.pageYOffset || 0;
    this.restoreScrollOnClose = true;
    // 必须直接打开弹窗，不能只靠路由 paramMap：关闭弹窗时仅 history.replaceState
    // 同步地址栏，Router 内部状态仍停留在 /life/:id，再次点击同一条时参数未变
    // （shallowEqual 过滤）paramMap 不会重新 emit，弹窗将无法弹出。
    // openDetailById 内部 guard 保证 paramMap 的重复 emit 不会重复打开。
    this.openDetailById(item.id);
    this.router.navigate(['/life', item.id], { replaceUrl: true });
  }

  /** 打开详情弹窗（卡片点击与路由 paramMap 均会触发，内部 guard 防重复） */
  openDetailById(id: number): void {
    // 已打开同一条弹窗则跳过（路由订阅可能重复 emit）
    if (this.detailModalRef && this.activeDetailId === id) {
      return;
    }
    if (this.detailOpening) {
      return;
    }
    this.detailOpening = true;
    this.activeDetailId = id;

    // 优先从已加载列表数据中取；未加载则走详情接口
    const found = this.allSections
      .flatMap((s) => s.items)
      .find((item) => item.id === id);

    if (found) {
      this.uiState.initLikeCount(found.id, found.likes);
      this.showDetailModal(found);
    } else {
      this.lifeService.getLifeDetail(id).subscribe({
        next: (res: any) => {
          const item = this.normalizeLifeItem(res?.data ?? res);
          this.uiState.initLikeCount(item.id, item.likes);
          this.showDetailModal(item);
        },
        error: () => {
          // 详情拉取失败（如不存在），回退到 /life
          this.detailOpening = false;
          this.activeDetailId = null;
          this.router.navigate(['/life'], { replaceUrl: true });
        },
      });
    }
  }

  private showDetailModal(item: LifeTimelineItem): void {
    this.detailModalRef = this.modal.create({
      nzContent: LifeDialogComponent,
      nzData: item,
      nzFooter: null,
      nzWidth: 'min(720px, 92vw)',
      nzClosable: false,
      nzMaskClosable: true,
      nzWrapClassName: 'life-detail-modal-wrap',
      // 顶部对齐（初次加载显示在页面顶部），卡片完整高度由 wrap 滚动浏览
      nzStyle: { top: 0 },
      // 关闭自动聚焦：默认 nzAutofocus='auto' 会把焦点移到卡片中部的
      // 评论/点赞按钮，触发 wrap 自动滚动到中部，导致"顶部→中部→顶部"闪烁
      nzAutofocus: null,
    });
    // 打开后重置滚动位置到顶部（确保看到卡片开头）
    this.detailModalRef.afterOpen.subscribe(() => this.resetDetailScroll());
    // 关闭弹窗时同步 URL 回 /life，并恢复列表滚动位置（无闪烁）
    this.detailModalRef.afterClose.subscribe(() => {
      this.detailOpening = false;
      this.detailModalRef = null;
      this.activeDetailId = null;
      const restoreY = this.restoreScrollOnClose ? this.savedListScrollY : 0;
      this.restoreScrollOnClose = false;
      // 等弹窗彻底关闭、CDK 解锁文档后再同步 URL 与滚动位置。
      // 不用 router.navigate：全局 scrollPositionRestoration:'top' 会在导航完成后
      // 异步把滚动重置到顶部，导致"先到顶再回原位"的闪烁。
      // history.replaceState 只同步地址栏，不触发路由导航，滚动不会被打扰。
      this.waitForModalTeardown(() => {
        if (isPlatformBrowser(this.platformId) && window.location.pathname !== '/life') {
          window.history.replaceState({}, '', '/life');
        }
        window.scrollTo({ top: restoreY, behavior: 'instant' });
      });
    });
  }

  /** 打开弹窗后确保定位在顶部：
   *  已禁用 modal 自动聚焦（nzAutofocus: null），此处仅兜底归零 wrap 滚动，
   *  避免残留的滚动位置 */
  private resetDetailScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    const wrap = document.querySelector('.life-detail-modal-wrap') as HTMLElement | null;
    if (!wrap) {
      return;
    }
    wrap.scrollTop = 0;
  }

  /**
   * 等待详情弹窗彻底关闭：modal DOM 已移除，且 CDK 已解除 html 滚动锁。
   * 期间页面滚动保持不变，随后由调用方执行导航 + 同步恢复滚动（无中间渲染帧）。
   */
  private waitForModalTeardown(callback: () => void): void {
    if (!isPlatformBrowser(this.platformId)) {
      callback();
      return;
    }
    const html = document.documentElement;
    const modalGone = !document.querySelector('.life-detail-modal-wrap');
    const htmlUnlocked =
      !html.classList.contains('cdk-global-scrollblock') &&
      !html.getAttribute('style');
    if (modalGone && htmlUnlocked) {
      callback();
      return;
    }
    setTimeout(() => this.waitForModalTeardown(callback), 16);
  }

  private fetchTimeline(): void {
    this.loading = true;
    this.pickLoadingMessage();
    this.errorMessage = '';

    this.lifeService.getLifeList().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const normalized = list
          .map((item: any) => this.normalizeLifeItem(item))
          .sort(
            (a: LifeTimelineItem, b: LifeTimelineItem) =>
              b.date.getTime() - a.date.getTime(),
          );

        this.totalItemCount = normalized.length;
        this.tagCounter = this.buildTagCounter(normalized);
        this.allSections = this.buildSections(normalized);

        // Initialize local like counts from data
        normalized.forEach((item: LifeTimelineItem) => {
          this.uiState.initLikeCount(item.id, item.likes);
        });

        this.applyFilterAndNavigator();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = '点滴加载失败，请稍后重试。';
        this.totalItemCount = 0;
        this.allSections = [];
        this.sectionList = [];
        this.yearNavigator = [];
      },
    });
  }

  private applyFilterAndNavigator(): void {
    const selectedTag = this.selectedTag;

    if (!selectedTag) {
      this.sectionList = this.allSections;
    } else {
      this.sectionList = this.allSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.tags.includes(selectedTag)),
        }))
        .filter((section) => section.items.length > 0);
    }

    this.yearNavigator = this.buildYearNavigator(this.sectionList);
    this.activeSectionKey = this.sectionList[0]?.key ?? '';
    this.filterMotionTick += 1;

    setTimeout(() => {
      this.syncActiveSection();
    });
  }

  private buildTagCounter(items: LifeTimelineItem[]): Record<string, number> {
    const counter: Record<string, number> = {
      美食: 0,
      日常: 0,
      游戏: 0,
      摘抄: 0,
    };

    items.forEach((item) => {
      item.tags.forEach((tag) => {
        if (counter[tag] === undefined) {
          return;
        }
        counter[tag] += 1;
      });
    });

    return counter;
  }

  private buildSections(items: LifeTimelineItem[]): TimelineSection[] {
    const map = new Map<string, TimelineSection>();

    items.forEach((item) => {
      const year = item.date.getFullYear();
      const month = item.date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          year,
          month,
          label: `${year}年${month}月`,
          items: [],
        });
      }

      map.get(key)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
  }

  private buildYearNavigator(sections: TimelineSection[]): YearNavigator[] {
    const map = new Map<number, YearNavigator>();

    sections.forEach((section) => {
      if (!map.has(section.year)) {
        map.set(section.year, {
          year: section.year,
          months: [],
        });
      }

      map.get(section.year)!.months.push({
        key: section.key,
        month: section.month,
        label: `${section.month}月`,
      });
    });

    return Array.from(map.values()).sort((a, b) => b.year - a.year);
  }

  private normalizeLifeItem(item: any): LifeTimelineItem {
    const date = this.parseDate(item?.date ?? item?.createDate);
    const tags = this.normalizeTags(item?.tag);
    const images = this.normalizeImages(item?.image, item?.image_first);
    const source = String(item?.source ?? '').trim();

    return {
      id: Number(item?.id ?? 0),
      title: String(item?.title ?? '').trim() || '',
      content: String(item?.content ?? '').trim(),
      source,
      date,
      dateText: this.formatDateTime(date),
      tags,
      primaryTag: tags[0] ?? '',
      images,
      likes: Number(item?.likes ?? 0),
      commentCount: Number(item?.commentCount ?? 0),
    };
  }

  private normalizeTags(rawTag: unknown): string[] {
    const source = Array.isArray(rawTag) ? rawTag : rawTag ? [rawTag] : [];
    return source
      .map((tag) => this.normalizeTagLabel(tag))
      .filter((tag) => !!tag);
  }

  private normalizeTagLabel(rawTag: unknown): string {
    const tag = String(rawTag ?? '').trim();
    if (!tag) {
      return '';
    }

    if (tag.includes('事件')) {
      return '日常';
    }
    if (tag.includes('美食')) {
      return '美食';
    }
    if (tag.includes('日常')) {
      return '日常';
    }
    if (tag.includes('游戏')) {
      return '游戏';
    }
    if (tag.includes('摘抄')) {
      return '摘抄';
    }

    return tag;
  }

  private normalizeImages(rawImage: unknown, rawCover: unknown): LifeImageAsset[] {
    const imageList = Array.isArray(rawImage) ? rawImage : [];
    const coverList = Array.isArray(rawCover) ? rawCover : [];
    const source = imageList.length > 0 ? imageList : coverList;

    return source
      .map((img) => this.normalizeImageAsset(img))
      .filter((img): img is LifeImageAsset => !!img);
  }

  private normalizeImageAsset(rawImage: unknown): LifeImageAsset | null {
    if (!rawImage) {
      return null;
    }

    if (typeof rawImage === 'string') {
      const previewUrl = rawImage.trim();
      if (!previewUrl) {
        return null;
      }
      return {
        previewUrl,
        originalUrl: inferOriginalImageUrl(previewUrl),
      };
    }

    const record = rawImage as Record<string, unknown>;
    const previewUrl = String(record['url'] ?? '').trim();
    if (!previewUrl) {
      return null;
    }

    const originalRaw = String(record['img_url'] ?? '').trim();
    return {
      previewUrl,
      originalUrl: originalRaw || inferOriginalImageUrl(previewUrl),
    };
  }

  private parseDate(value: unknown): Date {
    const parsed = new Date(String(value ?? ''));
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }

  private scrollToSection(sectionKey: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = this.monthSectionRefs.find(
      (ref) => ref.nativeElement.dataset['sectionKey'] === sectionKey,
    );

    if (
      !target ||
      typeof (target.nativeElement as HTMLElement).scrollIntoView !== 'function'
    ) {
      return;
    }

    this.cancelActiveScroll();
    this.isProgrammaticScroll = true;
    this.programmaticTargetSectionKey = sectionKey;
    this.activeSectionKey = sectionKey;
    const targetElement = target.nativeElement as HTMLElement;
    const targetTop = targetElement.getBoundingClientRect().top + window.scrollY - 86;
    this.smoothScrollTo(targetTop, 1000);
  }

  private smoothScrollTo(targetTop: number, durationMs: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const startTop = window.scrollY || window.pageYOffset || 0;
    const delta = targetTop - startTop;
    if (Math.abs(delta) < 1) {
      this.isProgrammaticScroll = false;
      this.programmaticTargetSectionKey = '';
      this.syncActiveSection();
      return;
    }
    const startTime = performance.now();

    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const easedProgress = this.easeInOutCubic(progress);
      window.scrollTo(0, startTop + delta * easedProgress);

      if (progress < 1) {
        this.scrollAnimationFrame = window.requestAnimationFrame(step);
      } else {
        this.scrollAnimationFrame = null;
        this.isProgrammaticScroll = false;
        this.programmaticTargetSectionKey = '';
        this.syncActiveSection();
      }
    };

    this.scrollAnimationFrame = window.requestAnimationFrame(step);
  }

  private cancelActiveScroll(): void {
    if (this.scrollAnimationFrame !== null && isPlatformBrowser(this.platformId)) {
      window.cancelAnimationFrame(this.scrollAnimationFrame);
    }
    this.scrollAnimationFrame = null;
    this.isProgrammaticScroll = false;
    this.programmaticTargetSectionKey = '';
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  private syncActiveSection(): void {
    if (!isPlatformBrowser(this.platformId) || !this.monthSectionRefs?.length) {
      return;
    }

    if (this.isProgrammaticScroll) {
      if (this.programmaticTargetSectionKey) {
        this.activeSectionKey = this.programmaticTargetSectionKey;
      }
      return;
    }

    const threshold = 120;
    let activeKey = this.sectionList[0]?.key ?? '';

    this.monthSectionRefs.forEach((ref) => {
      const element = ref.nativeElement as HTMLElement;
      if (typeof element?.getBoundingClientRect !== 'function') {
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.top - threshold <= 0) {
        const key = element.dataset['sectionKey'];
        if (key) {
          activeKey = key;
        }
      }
    });

    this.activeSectionKey = activeKey;
  }

  openMobileNav(): void {
    this.mobileNavVisible = true;
  }

  closeMobileNav(): void {
    this.mobileNavVisible = false;
  }

  private pickLoadingMessage(): void {
    const idx = Math.floor(Math.random() * this.loadingMessages.length);
    this.loadingMessage = this.loadingMessages[idx];
  }
}

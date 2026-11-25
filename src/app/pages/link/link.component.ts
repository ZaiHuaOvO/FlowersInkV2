import { DatePipe, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { SlowUp, QuickUp, StaggerList, ExpandCollapse } from '../../common_ui/animations/animation';
import { FlCardDirective } from '../../common_ui/fl_ui/fl-card/fl-card.directive';
import { LinkCardComponent } from '../../components/link/link-card/link-card.component';
import { LinkService } from './link.service';
import { FlErrorStateComponent } from '../../common_ui/fl_ui/fl-error-state/fl-error-state.component';

interface ArticleItem {
  title: string;
  link: string;
  source: string;
  sourceUrl: string;
  publishDate: string;
  summary?: string;
  sourceAvatar?: string;
  sourceFavicon?: string;
}

interface LinkItem {
  name: string;
  logo: string;
  url: string;
  description: string;
  email?: string;
  /** 站内路由（申请入口）走 routerLink */
  internal?: boolean;
  /** 还没有 Logo 的条目画虚线占位框 */
  logoPlaceholder?: boolean;
}

/** 博客聚合平台：写死在前端，字段与 LinkCardComponent 对齐 */
interface CommunityItem {
  name: string;
  logo: string;
  url: string;
  description?: string;
  evaluation?: string;
  evaluationParts?: { text: string; href?: string }[];
  logoFit: 'contain';
  logoScale?: number;
}

/** 三组卡片各自独立退让，互不影响 */
type FocusSection = 'link' | 'community' | 'article';

@Component({
  selector: 'flower-link',
  standalone: true,
  imports: [
    DatePipe,
    NzFlexModule,
    NzTypographyModule,
    LinkCardComponent,
    FlCardDirective,
    FlErrorStateComponent,
  ],
  templateUrl: './link.component.html',
  styleUrls: ['./link-shared.css', './link.component.css'],
  animations: [SlowUp, QuickUp, StaggerList, ExpandCollapse],
})
export class LinkComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  loading = true;
  loadError = false;
  articleLoading = true;
  email = 'ZyZy1724@gmail.com';
  links: LinkItem[] = [];
  friendArticles: ArticleItem[] = [];
  skeletonCards = [1, 2, 3, 4, 5, 6];
  skeletonArticles = [1, 2, 3, 4, 5];

  /** 聚合平台的 Logo 留白各不相同，逐个给 contain 下的内边距与缩放 */
  readonly communities: CommunityItem[] = [
    {
      name: 'BlogsClub',
      url: 'https://www.blogsclub.org/',
      logo: 'https://api.flowersink.com/uploads/misc/webp-image-removebg-preview-1795575450508-f18a3d.webp',
      description: '你在互联网上并不孤独，你还有我们。',
      evaluation: '最爱逛，喜欢大白熊。',
      logoFit: 'contain',
    },
    {
      name: '笔墨迹',
      url: 'https://blogscn.fun/',
      logo: 'https://api.flowersink.com/uploads/misc/webp-image-removebg-preview-1-1795575035534-f54d68.webp',
      description: '链接博客，也保留博客本来的样子。',
      logoFit: 'contain',
    },
    {
      name: '十年之约',
      url: 'https://www.foreverblog.cn/',
      logo: 'https://api.flowersink.com/uploads/misc/webp-logo_v2_black-1795575178883-847ce8.webp',
      description: '不为流量写的博客，值得被人好好读。',
      logoFit: 'contain',
    },
    {
      name: 'imrss',
      url: 'https://imrss.com/',
      logo: 'https://api.flowersink.com/uploads/misc/webp-image-1795575631044-b629de.webp',
      description: '让博客重新相遇。',
      evaluationParts: [
        { text: '扶苏', href: 'https://pwsz.com/' },
        { text: '的小项目，很简约很好逛' },
      ],
      logoFit: 'contain',
      // 源图是 200×200 的白底方图，字标只占中间 79% 宽；1.25 刚好铺满又不裁掉两端
      logoScale: 1.25,
    },
    {
      name: '博友圈',
      url: 'https://www.boyouquan.com/',
      logo: 'https://www.boyouquan.com/assets/images/sites/logo/logo-small.svg',
      description: '让我们跨越山海彼此相连，一起用文字打败时间！',
      logoFit: 'contain',
    },
  ];

  /** 好朋友末尾固定挂一条申请入口，与友链同组、同款卡片 */
  readonly applyEntry: LinkItem = {
    name: '申请友链',
    description: '成为再花的好朋友！',
    url: '/link/apply',
    logo: '',
    internal: true,
    logoPlaceholder: true,
  };

  /** 指针/键盘焦点指向的条目；同一时刻每个分区只有一个 */
  hoveredLink: LinkItem | null = null;
  focusedLink: LinkItem | null = null;
  hoveredCommunity: CommunityItem | null = null;
  focusedCommunity: CommunityItem | null = null;
  hoveredArticle: ArticleItem | null = null;
  focusedArticle: ArticleItem | null = null;

  get activeLink(): LinkItem | null {
    return this.hoveredLink ?? this.focusedLink;
  }

  get activeCommunity(): CommunityItem | null {
    return this.hoveredCommunity ?? this.focusedCommunity;
  }

  get activeArticle(): ArticleItem | null {
    return this.hoveredArticle ?? this.focusedArticle;
  }

  // Profile card
  allCopied = false;
  copiedRow = '';
  selfExpanded = false;

  constructor(
    private readonly link: LinkService,
    private readonly msg: NzMessageService,
  ) {
    this.link.getLinks({ isApproved: true }).subscribe({
      next: (res: any) => {
        this.links = res['data']?.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.links = [];
        this.loadError = true;
        this.loading = false;
      },
    });

    this.getFriendArticles();
  }

  /** 错误态里的「重新加载」 */
  reloadLinks(): void {
    this.loadError = false;
    this.loading = true;
    this.link.getLinks({ isApproved: true }).subscribe({
      next: (res: any) => {
        this.links = res['data']?.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.links = [];
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  ngOnInit(): void {
    this.injectJsonLd();

    if (isPlatformBrowser(this.platformId)) {
      const view = this.document.defaultView;
      // 点开友链去了新标签页再回来时，指针不会补发 mousemove / mouseleave，
      // 高亮会一直停在离开前那一条上，所以离开窗口或切回时都清一次。
      view?.addEventListener('blur', this.clearHover);
      view?.addEventListener('focus', this.clearHover);
      this.document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.document.addEventListener('mouseout', this.onPointerLeaveWindow);
    }
  }

  ngOnDestroy(): void {
    const view = this.document.defaultView;
    view?.removeEventListener('blur', this.clearHover);
    view?.removeEventListener('focus', this.clearHover);
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.document.removeEventListener('mouseout', this.onPointerLeaveWindow);
  }

  private readonly clearHover = (): void => {
    this.hoveredLink = null;
    this.hoveredCommunity = null;
    this.hoveredArticle = null;
  };

  private readonly onVisibilityChange = (): void => {
    if (this.document.hidden) {
      this.clearHover();
    }
  };

  private readonly onPointerLeaveWindow = (event: MouseEvent): void => {
    // relatedTarget 为空 = 指针直接移出了整个窗口
    if (!event.relatedTarget) {
      this.clearHover();
    }
  };

  /* ---------- 卡片聚焦：只在离开整个列表时清除，穿过间隙不会闪 ---------- */

  /**
   * 悬停按指针坐标解析，而不是靠每一格的 mouseenter：
   * 卡片是等分栅格，条目数为奇数时最后一行右侧的空白仍属于列表盒子，
   * 指针从末格滑进空白既没有新的 mouseenter，也不会触发列表的 mouseleave，
   * 高亮就会卡住。
   *
   * 但指针在两张卡之间穿过时，事件目标是列表本身，也不能当成「移出」——
   * 那会让选中先清空再落到下一张，闪一下。所以落在行列间隙里时保持当前选中，
   * 只有落到空白区（行尾的空位、行外）才清空。
   */
  onFriendGridMove(event: MouseEvent): void {
    if (!this.isHoverCapable()) return;
    const index = this.cardIndexOf(event);
    if (index === 'apply') {
      this.setHoveredLink(this.applyEntry);
      return;
    }
    if (index !== undefined) {
      this.setHoveredLink(this.links[Number(index)] ?? null);
      return;
    }
    if (!this.isInsideCardRows(event)) {
      this.setHoveredLink(null);
    }
  }

  onCommunityGridMove(event: MouseEvent): void {
    if (!this.isHoverCapable()) return;
    const index = Number(this.cardIndexOf(event));
    if (Number.isInteger(index)) {
      this.setHoveredCommunity(this.communities[index] ?? null);
      return;
    }
    if (!this.isInsideCardRows(event)) {
      this.setHoveredCommunity(null);
    }
  }

  private setHoveredLink(next: LinkItem | null): void {
    if (next !== this.hoveredLink) {
      this.hoveredLink = next;
    }
  }

  private setHoveredCommunity(next: CommunityItem | null): void {
    if (next !== this.hoveredCommunity) {
      this.hoveredCommunity = next;
    }
  }

  private cardIndexOf(event: MouseEvent): string | undefined {
    const el = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-card-index]',
    );
    return el?.dataset['cardIndex'];
  }

  /**
   * 指针是否还在「某一行的卡片带」上（包含行内、行间的空隙）。
   *
   * 行的横向范围取该行所有卡片的最小/最大边界，所以列与列之间的空隙算在内；
   * 奇数条时最后一行的右侧空白在横向范围之外，会被判成移出。
   * 纵向按半个行距放宽，跨行穿过空隙时不会瞬间清空。
   */
  private isInsideCardRows(event: MouseEvent): boolean {
    const grid = event.currentTarget as HTMLElement | null;
    if (!grid) return false;
    const rows: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    }[] = [];
    for (const card of Array.from(
      grid.querySelectorAll<HTMLElement>('flower-link-card'),
    )) {
      const rect = card.getBoundingClientRect();
      const row = rows.find((item) => Math.abs(item.top - rect.top) < 2);
      if (row) {
        row.bottom = Math.max(row.bottom, rect.bottom);
        row.left = Math.min(row.left, rect.left);
        row.right = Math.max(row.right, rect.right);
      } else {
        rows.push({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        });
      }
    }
    // 纵向放宽到「行距的一半 + 1px」：跨行的空隙既不属于上行也不属于下行，
    // 但指针经过它时不该中断选中。按实际行距算，换间距 token 也不会失效。
    rows.sort((a, b) => a.top - b.top);
    let rowAllowance = 4;
    for (let i = 1; i < rows.length; i++) {
      const gap = rows[i].top - rows[i - 1].bottom;
      if (gap > 0) {
        rowAllowance = Math.max(rowAllowance, gap / 2 + 1);
      }
    }
    return rows.some(
      (row) =>
        event.clientY >= row.top - rowAllowance &&
        event.clientY <= row.bottom + rowAllowance &&
        event.clientX >= row.left &&
        event.clientX <= row.right,
    );
  }

  onArticleEnter(article: ArticleItem): void {
    if (this.isHoverCapable()) {
      this.hoveredArticle = article;
    }
  }

  onCardFocus(link: LinkItem, event: FocusEvent): void {
    this.focusedLink = this.isKeyboardFocus(event) ? link : null;
  }

  onCommunityFocus(item: CommunityItem, event: FocusEvent): void {
    this.focusedCommunity = this.isKeyboardFocus(event) ? item : null;
  }

  onArticleFocus(article: ArticleItem, event: FocusEvent): void {
    this.focusedArticle = this.isKeyboardFocus(event) ? article : null;
  }

  /**
   * 鼠标点出来的焦点不算「选中的卡片」——否则点完再挪开鼠标，
   * 焦点还留在链接上，那一格的高亮会一直挂着。
   * 键盘 Tab 过来的焦点（:focus-visible）才保留高亮。
   */
  private isKeyboardFocus(event: FocusEvent): boolean {
    const target = event.target as HTMLElement | null;
    return target?.matches(':focus-visible') === true;
  }

  onListFocusOut(section: FocusSection, event: FocusEvent): void {
    const list = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (!next || !list.contains(next)) {
      this.clearFocus(section);
    }
  }

  private clearFocus(section: FocusSection): void {
    if (section === 'link') {
      this.focusedLink = null;
    } else if (section === 'community') {
      this.focusedCommunity = null;
    } else {
      this.focusedArticle = null;
    }
  }

  private isHoverCapable(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      window.matchMedia?.('(hover: hover) and (pointer: fine)').matches === true
    );
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '友情链接 | 花墨',
      description: '花墨的个人博客友情链接页面，收录了好朋友的个人网站和博客。',
      url: 'https://flowersink.com/link',
    };

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    script.id = 'link-jsonld';
    const existing = this.document.getElementById('link-jsonld');
    if (existing) existing.remove();
    this.document.head.appendChild(script);
  }

  getFriendArticles(): void {
    this.articleLoading = true;
    this.link
      .getFriendArticles()
      .subscribe({
        next: (res: any) => {
          this.friendArticles = res['data'].data ?? [];
          this.articleLoading = false;
        },
        error: () => {
          this.friendArticles = [];
          this.articleLoading = false;
        },
      });
  }

  /** 点自己的名片：每次都复制 JSON，首次点击顺便展开明细面板（之后不再收起） */
  onSelfCardClick(): void {
    this.copyAllInfo();
    this.selfExpanded = true;
  }

  copyAllInfo(): void {
    const info = {
      name: '花墨',
      logo: 'https://api.flowersink.com/img/logo.png',
      url: 'https://flowersink.com',
      content: '好耶！是再花猫猫头ฅ•ω•ฅ',
      email: this.email,
    };
    navigator.clipboard.writeText(JSON.stringify(info, null, 2)).then(() => {
      this.msg.success('已复制友链 JSON');
      this.allCopied = true;
      setTimeout(() => (this.allCopied = false), 2000);
    });
  }

  copyField(label: string, value: string, rowKey: string): void {
    navigator.clipboard.writeText(value).then(() => {
      this.msg.success(`已复制${label}`);
      this.copiedRow = rowKey;
      setTimeout(() => {
        if (this.copiedRow === rowKey) this.copiedRow = '';
      }, 1500);
    });
  }
}

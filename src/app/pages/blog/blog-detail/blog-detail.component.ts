import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BlogCardComponent } from '../../../components/blog/blog-card/blog-card.component';
import { MeCardComponent } from '../../../components/website/me-card/me-card.component';
import { BlogService } from '../blog.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { GeneralService } from '../../../services/general.service';
import { debounceTime, fromEvent } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzAnchorModule } from 'ng-zorro-antd/anchor';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { SlowUp, QuickUp, PopoverIn, BubbleIn } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { FlCommentBoardComponent } from '../../../common_ui/fl_ui/fl-comment-board/fl-comment-board.component';
import { CommentService } from '../../../services/comment.service';
import { articleCommentSource } from '../../../shared/comment/comment-source.factory';
import type { CommentSource } from '../../../shared/comment/comment.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { ensureMarkdownRuntimeLoaded } from '../../../shared/utils/markdown-runtime-loader.util';
import { deriveWebpVariants } from '../../../shared/utils/image-url.util';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';
import { AskQuestionComponent } from '../../../components/blog/ask-question/ask-question.component';
import { isPinnedBlog } from '../../../shared/utils/blog-pinned.util';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { VisitorTrackingService } from '../../../services/visitor-tracking.service';
import { IdeaService } from '../idea.service';
import { FlIdeaPopoverComponent } from '../../../common_ui/fl_ui/fl-idea-popover/fl-idea-popover.component';
import type {
  Idea,
  IdeaAnchor,
  IdeaAnchorPayload,
  IdeaAxis,
  IdeaPlacement,
} from '../../../shared/idea/idea.model';
import {
  IDEA_COUNT_CLASS,
  IDEA_KEY_ATTRIBUTE,
  IDEA_MARK_ACTIVE_CLASS,
  IDEA_MARK_CLASS,
  IDEA_SELECTION_MAX_LENGTH,
  applyIdeaMarks,
  blockToAnchorPayload,
  buildAxis,
  clearIdeaMarks,
  nearestBlock,
  selectionToAnchorPayload,
} from '../../../shared/idea/idea-anchor.util';

/**
 * 页内跳转后标题距视口顶部的距离（吸顶导航 48px + 余量）。
 * 需与 markdown-zaihua.css 的 scroll-margin-top、app.component.ts 的
 * ViewportScroller.setOffset 保持一致，否则目录/锚点/深链接三种入口落点会不一致。
 */
const ANCHOR_TOP_OFFSET = 96;

@Component({
  selector: 'flower-blog-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzFlexModule,
    NzIconModule,
    NzTagModule,
    NzTypographyModule,
    NzDividerModule,
    MarkdownModule,
    NzAvatarModule,
    NzAnchorModule,
    DatePipe,
    BlogTitleComponent,
    NzTooltipModule,
    NzPopoverModule,
    NzSpinModule,
    NzAffixModule,
    FlCardDirective,
    NzImageModule,
    RouterModule,
    FlButtonComponent,
    NzModalModule,
    FlCommentBoardComponent,
    FlIdeaPopoverComponent,
  ],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
  animations: [SlowUp, QuickUp, PopoverIn, BubbleIn],
})
export class BlogDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  Id: any;
  data: any = {};
  page = 1;
  count = 0;
  tag = '';
  tagList: any[] = [];
  loading = true;
  markdownContent: string = '';
  anchors: Array<{
    children: Array<{ href: string; title: string }>;
    href: string;
    title: string;
  }> = [];
  currentAnchor: string | undefined;
  /** 目录跳转后标题停在离视口顶部多远——贴顶而不是居中，同时避开吸顶导航 */
  targetOffset: number = ANCHOR_TOP_OFFSET;
  isMobile: boolean = false;
  private isSyncing = false;
  markdownReady = false;
  private readonly destroyRef: DestroyRef;

  // ── 段落想法 ──
  /** 「关闭想法」开关状态，存在本地，下次进来沿用 */
  ideasEnabled = true;
  private ideaAnchors: IdeaAnchor[] = [];
  private axis: IdeaAxis | null = null;
  private ideasLoaded = false;
  private markdownDomReady = false;
  private static readonly IDEAS_ENABLED_KEY = 'fi_ideas_enabled';
  /** 浮窗正对着的那段文字会作为一条临时锚点塞进渲染，用这个负 id 标记它 */
  private static readonly PENDING_HIGHLIGHT_KEY = -1;
  /** 已经回写过后端的漂移锚点，避免同一次阅读里反复请求 */
  private readonly reportedDrift = new Set<number>();
  /** 当前浮窗对应的区间，渲染成高亮，让用户看清自己框选了什么 */
  private pendingHighlight: IdeaAnchor | null = null;

  /** 框选后浮现的「写想法」按钮 */
  writeButton = { visible: false, tooLong: false, left: 0, top: 0 };
  private pendingSelection: IdeaAnchorPayload | null = null;
  /** 当前选区落在哪个块上，浮窗跟随滚动时用它定位 */
  private selectionAnchorEl: Element | null = null;
  /** 选区自身的矩形快照：决定浮窗开在左边还是右边要用它，不能用整块 */
  private selectionRectRef: DOMRect | null = null;

  /** 浮窗：查看某段的想法 + 写想法 */
  popover: {
    anchor: IdeaAnchorPayload;
    ideas: Idea[];
    hasPending: boolean;
    keyIds: number[];
    left: number;
    top: number;
    placement: IdeaPlacement;
    /** 是否默认展开写想法表单：框选入口展开，点虚线看想法不展开 */
    composing: boolean;
  } | null = null;
  /** 浮窗跟随滚动重定位时用的锚点元素 */
  private popoverAnchorEl: Element | null = null;
  /** 打开浮窗的那次点击会冒泡到 document，等它过去再允许「点外面关闭」 */
  private popoverReady = false;
  private popoverRafId: number | null = null;
  private popoverScrollListener: (() => void) | null = null;

  @ViewChild('ideaLayer', { static: false })
  ideaLayerRef?: ElementRef<HTMLElement>;

  /** 阅读进度 0–100 */
  readingProgress = 0;
  private scrollListener: (() => void) | null = null;

  /** 相关文章 */
  relatedBlogs: any[] = [];
  relatedLoading = false;

  /** 文章点赞（逻辑与点滴一致：每天 9 点重置，每天只点一次） */
  blogLiked = false;
  blogLikeCount = 0;
  blogLikeAnimating = false;
  private readonly blogLikeStorageKey = 'fi_blog_likes';

  @ViewChild('editor', { static: true })
  editorRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('viewer', { static: true }) viewerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tocContainer', { static: false }) tocContainerRef?: ElementRef<HTMLDivElement>;

  constructor(
    private blog: BlogService,
    private general: GeneralService,
    private activateInfo: ActivatedRoute,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: object,
    private window: WindowService,
    private msg: NzMessageService,
    private title: Title,
    private nzImageService: NzImageService,
    private modal: NzModalService,
    private visitorTrackingService: VisitorTrackingService,
    private commentService: CommentService,
    private ideaService: IdeaService,
    destroyRef: DestroyRef,
  ) {
    this.destroyRef = destroyRef;
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
      this.hideWriteButton();
    });
    this.restoreIdeasEnabled();
    this.bindIdeaInteractions();
  }

  ngOnInit() {
    this.initMarkdownRuntime();
    this.activateInfo.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params: any) => {
        this.Id = params.get('id');
        // id=0 是合法的置顶文章，只有缺省/空 id 才跳过加载
        if (
          this.Id !== null &&
          this.Id !== undefined &&
          this.Id !== '' &&
          isPlatformBrowser(this.platformId)
        ) {
          // 跳转到新文章时滚动到顶部
          window.scrollTo({ top: 0, behavior: 'instant' });
          this.getBlogDetail();
        }
      });
  }

  ngAfterViewInit(): void {
    this.bindReadingProgress();
  }

  ngOnDestroy(): void {
    this.scrollListener?.();
    this.popoverScrollListener?.();
    if (this.popoverRafId !== null) {
      cancelAnimationFrame(this.popoverRafId);
    }
  }

  private async initMarkdownRuntime(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      await ensureMarkdownRuntimeLoaded();
      this.markdownReady = true;
    } catch {
      this.markdownReady = false;
    }
  }

  private bindReadingProgress(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.readingProgress = docHeight > 0 ? Math.min(Math.round((scrollTop / docHeight) * 100), 100) : 0;

      // 目录自动跟随
      if (this.tocScrollTimer) clearTimeout(this.tocScrollTimer);
      this.tocScrollTimer = setTimeout(() => this.scrollTocToActive(), 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.scrollListener = () => window.removeEventListener('scroll', onScroll);
  }

  /** 目录容器滚动到当前激活项 */
  private tocScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollTocToActive(): void {
    const container = this.tocContainerRef?.nativeElement;
    if (!container) return;

    const activeLink = container.querySelector('.ant-anchor-link-active') as HTMLElement | null;
    if (!activeLink) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeLink.getBoundingClientRect();
    const offsetTop = activeRect.top - containerRect.top;

    // 激活项超出可视区上方 30% 或下方 30% 时滚动
    const upper = container.clientHeight * 0.3;
    const lower = container.clientHeight * 0.7;

    if (offsetTop < upper || offsetTop > lower) {
      const scrollTarget = container.scrollTop + offsetTop - container.clientHeight * 0.35;
      container.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
    }
  }

  getBlogDetail(): void {
    const fid = this.visitorTrackingService.getVisitorFid() || undefined;
    this.loading = true;
    this.blog.getBlogDetail(this.Id, fid).subscribe((res: any) => {
      this.data = res['data'];
      // 评论数据源依赖文章 id，等详情回来才能定；目标不变就只建一次
      this.commentSource = articleCommentSource(this.commentService, 'article', this.data.id);
      this.blogLikeCount = Number(this.data.likes ?? 0);
      this.restoreBlogLikeState();
      this.title.setTitle(`${this.data.title} | 花墨`);
      // 正文要换 DOM 了，先把想法标记与浮窗收干净，等 (ready) 再重画
      this.markdownDomReady = false;
      this.closePopover();
      this.hideWriteButton();
      this.markdownContent = this.data.content;
      this.loading = false;
      this.loadRelatedBlogs();
      this.loadIdeas();
    });
  }

  private loadRelatedBlogs(): void {
    this.relatedLoading = true;
    this.blog.getRelatedBlogs(this.Id).subscribe({
      next: (res: any) => {
        const raw = res?.data;
        // 兼容两种后端返回格式: { data: { data: [...] } } 或 { data: [...] }
        this.relatedBlogs = (Array.isArray(raw) ? raw : raw?.data ?? []).slice(0, 4);
        this.relatedLoading = false;
      },
      error: () => {
        this.relatedLoading = false;
      },
    });
  }

  generateAnchors(): void {
    const headings = this.el.nativeElement.querySelectorAll(
      '#currentAnchor :where(h1, h2):not(blockquote h1):not(blockquote h2)'
    );
    this.anchors = [];

    let currentH1: {
      children: Array<{ href: string; title: string }>;
      href: string;
      title: string;
    } | null = null;

    headings.forEach((heading: HTMLElement, index: number) => {
      const id = `heading-${index}`;
      heading.id = id;
      const tagName = heading.tagName.toLowerCase();

      if (tagName === 'h1') {
        currentH1 = { href: `#${id}`, title: heading.innerText, children: [] };
        this.anchors.push(currentH1);
      } else if (tagName === 'h2') {
        const h2Anchor = { href: `#${id}`, title: heading.innerText };
        if (currentH1) {
          currentH1.children.push(h2Anchor);
        } else {
          this.anchors.push({ ...h2Anchor, children: [] });
        }
      }
    });

    this.injectHeadingAnchors();
    this.bindExternalLinks();
    this.bindImagePreview();
    this.scrollToInitialHash();

    // markdown DOM 已就绪，可以和想法数据合流画出虚线了
    this.markdownDomReady = true;
    this.tryRenderIdeas();
  }

  /** 给 h1-h3 注入可复制/跳转的 # 锚点，并给代码块注入语言标签（供 markdown-zaihua.css 展示） */
  private injectHeadingAnchors(): void {
    const container = this.el.nativeElement.querySelector('#currentAnchor');
    if (!container) return;

    // h3 补 id（目录不含 h3，但可作为页内锚点）
    container.querySelectorAll('h3:not([id])').forEach((heading: HTMLElement, index: number) => {
      heading.id = `heading-h3-${index}`;
    });

    container.querySelectorAll('h1, h2, h3').forEach((heading: HTMLElement) => {
      if (!heading.id || heading.querySelector('.heading-anchor')) return;
      const id = heading.id;
      heading.insertAdjacentHTML(
        'afterbegin',
        `<a class="heading-anchor" href="#${id}" aria-hidden="true"></a>`
      );
      heading
        .querySelector('.heading-anchor')
        ?.addEventListener('click', (event: Event) => {
          event.preventDefault();
          this.scrollToHeading(id, true);
        });
    });

    // 代码块语言标签：取 <code>/<pre> 上的 language-* 类
    container.querySelectorAll('pre').forEach((pre: HTMLElement) => {
      if (pre.dataset['lang']) return;
      const code = pre.querySelector('code');
      const langClass =
        (code && Array.from(code.classList).find((c) => c.startsWith('language-'))) ||
        Array.from(pre.classList).find((c) => c.startsWith('language-'));
      if (langClass) {
        pre.dataset['lang'] = langClass.replace('language-', '');
      }
    });
  }

  /**
   * 页内标题锚点跳转。
   * 页面带 <base href="/">，裸 "#id" 会被解析到站点根（点一下会跳到首页），
   * 所以这里接管点击、自己滚动，并把带路径的地址写回地址栏便于复制分享。
   */
  private scrollToHeading(id: string, updateUrl: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({
      behavior: updateUrl ? 'smooth' : 'auto',
      block: 'start',
    });

    if (updateUrl) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#${id}`
      );
    }
  }

  /** 用带 #片段 的链接打开文章时，等 markdown 渲染出标题后再滚过去 */
  /** 用带 #片段 的链接打开文章时，等 markdown 渲染出标题后再滚过去 */
  private scrollToInitialHash(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw) return;
    try {
      this.scrollToHeading(decodeURIComponent(raw), false);
    } catch {
      // 片段不是合法编码时忽略
    }
  }

  /** 让 markdown 中的链接在新标签页打开（页内锚点除外） */
  private bindExternalLinks(): void {
    const container = this.el.nativeElement.querySelector('#currentAnchor');
    if (!container) return;

    container.querySelectorAll('a[href]').forEach((link: HTMLAnchorElement) => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) return;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  private bindImagePreview(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = this.el.nativeElement.querySelector('#currentAnchor');
    if (!container) return;

    const imgElements: HTMLImageElement[] = Array.from(
      container.querySelectorAll('img')
    );
    if (imgElements.length === 0) return;

    // 展示用 webp 变体（960px），缩放预览用 webp zoom 变体（1920px）。
    // webp 文件缺失时 onerror 回退到原压缩图，保证旧文章不破图。
    const nzImages = imgElements.map((img) => {
      const originalSrc = img.getAttribute('src') || '';
      const { display, zoom } = deriveWebpVariants(originalSrc);

      if (display && display !== originalSrc) {
        img.dataset['fiFallback'] = originalSrc;
        img.src = display;
        img.addEventListener(
          'error',
          () => {
            if (img.dataset['fiFallbacked']) return;
            img.dataset['fiFallbacked'] = '1';
            const fallback = img.dataset['fiFallback'];
            if (fallback && img.src !== fallback) {
              img.src = fallback;
            }
          },
          { once: true }
        );
      }
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      img.setAttribute('decoding', 'async');

      return {
        src: zoom || originalSrc,
        alt: img.getAttribute('alt') || '',
      };
    });

    imgElements.forEach((img, index) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        const vpScale = 1.2;
        const maxW = window.innerWidth * vpScale;
        const maxH = window.innerHeight * vpScale;
        const nw = img.naturalWidth || maxW;
        const nh = img.naturalHeight || maxH;
        const zoom = Math.min(maxW / nw, maxH / nh, 1);

        const ref = this.nzImageService.preview(nzImages, {
          nzZoom: Math.round(zoom * 100) / 100,
          nzRotate: 0,
        });
        ref.switchTo(index);
      });
    });
  }

  onBack(): void {
    history.go(-1);
  }

  // ==================== 段落想法 ====================

  /** 正文容器：markdown 渲染进 <markdown id="currentAnchor"> */
  private ideaContainer(): HTMLElement | null {
    return this.el.nativeElement.querySelector('#currentAnchor');
  }

  private restoreIdeasEnabled(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const stored = localStorage.getItem(
        BlogDetailComponent.IDEAS_ENABLED_KEY,
      );
      if (stored !== null) {
        this.ideasEnabled = stored !== '0';
      }
    } catch {
      // 存储不可用时按默认（开启）处理
    }
  }

  /** 「关闭想法」：关掉后不画任何虚线、不出「写想法」按钮，正文恢复纯净 */
  toggleIdeas(): void {
    this.ideasEnabled = !this.ideasEnabled;
    try {
      localStorage.setItem(
        BlogDetailComponent.IDEAS_ENABLED_KEY,
        this.ideasEnabled ? '1' : '0',
      );
    } catch {
      // ignore
    }

    this.hideWriteButton();
    this.closePopover();
    this.tryRenderIdeas();
  }

  /**
   * 点 meta 行的「N 想法」：滚到正文第一条想法。
   * 想法被关掉时先打开再定位；真的一条都没有就提示写下第一条。
   */
  onIdeaCountClick(): void {
    if (!this.ideasEnabled) {
      this.toggleIdeas();
    }
    const first = this.ideaContainer()?.querySelector(
      `mark.${IDEA_MARK_CLASS}`,
    );
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    this.msg.info('这篇文章还没有想法，选中一段文字，写下第一条吧');
  }

  private loadIdeas(): void {
    this.ideasLoaded = false;
    this.ideaAnchors = [];
    // 换了文章就重新计算哪些锚点需要回写
    this.reportedDrift.clear();

    this.ideaService.listIdeas(this.Id).subscribe({
      next: (res: any) => {
        const anchors = res?.data?.anchors;
        this.ideaAnchors = Array.isArray(anchors) ? anchors : [];
        this.ideasLoaded = true;
        this.tryRenderIdeas();
      },
      error: () => {
        // 想法拉不到不该影响正文阅读，静默降级成「没有想法」
        this.ideaAnchors = [];
        this.ideasLoaded = true;
        this.tryRenderIdeas();
      },
    });
  }

  /**
   * 幂等的渲染入口。想法数据与 markdown DOM 是两个异步源，谁后到都调这里。
   * applyIdeaMarks 内部先清干净再画，所以切文章、重渲染都不会留下重复标记。
   */
  private tryRenderIdeas(): void {
    const container = this.ideaContainer();
    if (!container) return;

    if (!this.ideasEnabled || !this.markdownDomReady || !this.ideasLoaded) {
      clearIdeaMarks(container);
      this.axis = null;
      return;
    }

    // 浮窗正对着的那段一并画进去，渲染成高亮底
    const anchors = this.pendingHighlight
      ? [...this.ideaAnchors, this.pendingHighlight]
      : this.ideaAnchors;

    const rendered = applyIdeaMarks(container, anchors);
    this.axis = rendered.axis;
    this.refreshPopoverAnchorEl();
    this.reportDriftedAnchors(rendered.drifted);
  }

  /**
   * 把「位置漂移过、已被自动救回」的锚点回写后端，让数据收敛；
   * 收敛之后下次打开就是精确命中，不必再每次重新推算。
   */
  private reportDriftedAnchors(drifted: IdeaAnchor[]): void {
    for (const anchor of drifted) {
      if (this.reportedDrift.has(anchor.id)) continue;
      this.reportedDrift.add(anchor.id);
      this.ideaService
        .realignAnchor(anchor.id, {
          startOffset: anchor.startOffset,
          endOffset: anchor.endOffset,
          anchorText: anchor.anchorText,
          prefix: anchor.prefix ?? '',
          suffix: anchor.suffix ?? '',
        })
        .subscribe({
          // 回写失败无所谓：下次打开会重新推算，不影响阅读
          error: () => this.reportedDrift.delete(anchor.id),
        });
    }
  }

  /** 把浮窗对应的区间标成「当前选中」，正文里会铺一层底色 */
  private setPendingHighlight(payload: IdeaAnchorPayload): void {
    this.pendingHighlight = {
      id: BlogDetailComponent.PENDING_HIGHLIGHT_KEY,
      startOffset: payload.startOffset,
      endOffset: payload.endOffset,
      anchorText: payload.anchorText,
      prefix: payload.prefix,
      suffix: payload.suffix,
      hasPending: false,
      ideas: [],
      active: true,
    };
  }

  /**
   * 画完虚线会重建 <mark> 节点，浮窗若挂在旧节点上要重新指到新节点。
   * 浮窗对应的那段永远是 active 那条，直接按类名找最省事。
   */
  private refreshPopoverAnchorEl(): void {
    if (!this.popover) return;

    const container = this.ideaContainer();
    if (!container) return;

    const next = container.querySelector(`mark.${IDEA_MARK_ACTIVE_CLASS}`);
    if (next) {
      this.popoverAnchorEl = next;
    }
  }

  // ---- 事件绑定 ----

  private bindIdeaInteractions(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // 虚线是渲染后动态插入的，用事件委托，重渲染后无需重新绑定
    fromEvent<MouseEvent>(this.el.nativeElement, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onContentClick(event));

    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onDocumentClick(event));

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.key === 'Escape') {
          this.closePopover();
          this.hideWriteButton();
        }
      });

    // 桌面端：mouseup 后等选区落定再看；selectionchange 兜住 Shift+方向键这类无鼠标操作
    fromEvent<MouseEvent>(document, 'mouseup')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isMobile) return;
        setTimeout(() => this.syncWriteButton(), 0);
      });

    fromEvent(document, 'selectionchange')
      .pipe(debounceTime(180), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isMobile) return;
        this.syncWriteButton();
      });

    this.bindPopoverReposition();
  }

  private bindPopoverReposition(): void {
    const onScroll = () => {
      if (!this.popover || this.popoverRafId !== null) return;
      this.popoverRafId = requestAnimationFrame(() => {
        this.popoverRafId = null;
        this.repositionPopover();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.popoverScrollListener = () =>
      window.removeEventListener('scroll', onScroll);
  }

  private onContentClick(event: MouseEvent): void {
    const container = this.ideaContainer();
    if (!container) return;

    const target = event.target as Element | null;
    if (!target || !container.contains(target)) return;

    // 角标不可点：鼠标移上去只显示「这段话一共有 X 个想法」，不打开浮窗
    if (target.closest(`.${IDEA_COUNT_CLASS}`)) return;

    const mark = target.closest(`mark[${IDEA_KEY_ATTRIBUTE}]`);
    if (mark) {
      event.preventDefault();
      this.openPopoverForMark(mark);
      return;
    }

    // 移动端没有拖拽框选，改成点段落 → 对整段写想法（整段有界，不受 200 字限制）
    if (!this.isMobile || !this.ideasEnabled || this.popover) return;

    const block = nearestBlock(target, container);
    if (!block) return;

    const axis = this.axis ?? buildAxis(container);
    const payload = blockToAnchorPayload(axis, block);
    if (!payload) return;

    const existing = this.findOverlappingAnchor(payload);
    if (existing) {
      this.msg.info('这段文字已经有人写过想法啦，看看别人写了什么');
      this.openPopoverForAnchor(existing, block, block.getBoundingClientRect());
      return;
    }

    this.openComposePopover(payload, block, block.getBoundingClientRect());
  }

  private onDocumentClick(event: MouseEvent): void {
    // 打开浮窗的那次点击本身会冒泡到这里，等它过去再允许「点外面关闭」
    if (!this.popover || !this.popoverReady) return;

    const target = event.target as Element | null;
    if (
      target &&
      (target.closest('fl-idea-popover') ||
        target.closest(`mark[${IDEA_KEY_ATTRIBUTE}]`) ||
        target.closest('.idea-write-button') ||
        // ng-zorro 的浮层（表情面板等）挂在 body 下的 cdk-overlay-container 里，
        // 不在浮窗 DOM 内；不排除掉的话点一个表情就会把浮窗关掉
        target.closest('.cdk-overlay-container'))
    ) {
      return;
    }

    this.closePopover();
  }

  // ---- 选区 →「写想法」按钮 ----

  private syncWriteButton(): void {
    if (!this.ideasEnabled) {
      this.hideWriteButton();
      return;
    }

    const container = this.ideaContainer();
    if (!container) {
      this.hideWriteButton();
      return;
    }

    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
    ) {
      this.hideWriteButton();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      this.hideWriteButton();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) {
      this.hideWriteButton();
      return;
    }

    const axis = this.axis ?? buildAxis(container);
    const payload = selectionToAnchorPayload(axis, range);
    const layer = this.ideaLayerRef?.nativeElement;
    const rect = this.selectionRect(range);
    if (!payload || !layer || !rect) {
      this.hideWriteButton();
      return;
    }

    const layerRect = layer.getBoundingClientRect();
    this.pendingSelection = payload;
    this.selectionAnchorEl = nearestBlock(range.startContainer, container);
    this.selectionRectRef = rect;
    this.writeButton = {
      visible: true,
      tooLong: payload.anchorText.length > IDEA_SELECTION_MAX_LENGTH,
      left: rect.left - layerRect.left + rect.width / 2,
      top: rect.top - layerRect.top,
    };
  }

  /** 跨节点的选区用 getBoundingClientRect 可能拿到空矩形，逐行 rect 更可靠 */
  private selectionRect(range: Range): DOMRect | null {
    const rects = range.getClientRects();
    if (rects.length > 0) {
      return rects[rects.length - 1];
    }
    const rect = range.getBoundingClientRect();
    return rect.width || rect.height ? rect : null;
  }

  private hideWriteButton(): void {
    if (!this.writeButton.visible) return;
    this.writeButton = { ...this.writeButton, visible: false };
    this.pendingSelection = null;
    this.selectionAnchorEl = null;
    this.selectionRectRef = null;
  }

  onWriteButtonClick(): void {
    const payload = this.pendingSelection;
    if (!payload) return;

    if (payload.anchorText.length > IDEA_SELECTION_MAX_LENGTH) {
      this.msg.info(
        `一次最多框选 ${IDEA_SELECTION_MAX_LENGTH} 字哦，挑短一点的一段吧`,
      );
      return;
    }

    // 先在本地拦一次：已经有人写过的区间，别让用户白写一段再被后端拒
    const existing = this.findOverlappingAnchor(payload);
    // 定位要用选区自己的矩形（hideWriteButton 会把它清掉，所以先取出来）
    const targetRect = this.selectionRectRef ?? undefined;
    const anchorEl = this.selectionAnchorEl;
    this.hideWriteButton();
    window.getSelection()?.removeAllRanges();

    if (existing) {
      this.msg.info('这段文字已经有人写过想法啦，看看别人写了什么');
      this.openPopoverForAnchor(existing, anchorEl, targetRect);
      return;
    }

    this.openComposePopover(payload, anchorEl, targetRect);
  }

  private findOverlappingAnchor(payload: IdeaAnchorPayload): IdeaAnchor | null {
    return (
      this.ideaAnchors.find(
        (anchor) =>
          payload.startOffset < anchor.endOffset &&
          payload.endOffset > anchor.startOffset,
      ) ?? null
    );
  }

  // ---- 浮窗 ----

  /**
   * 打开「写想法」浮窗。
   *
   * `targetRect` 必须是**选中文字自身**的矩形而不是所在段落的矩形：
   * 段落占满整栏宽，左右两侧都没空间，浮窗就只能压在文字上；
   * 用选区的矩形才能判断右边放不放得下。
   */
  private openComposePopover(
    payload: IdeaAnchorPayload,
    anchorEl: Element | null,
    targetRect?: DOMRect,
  ): void {
    this.showPopover({
      anchor: payload,
      ideas: [],
      hasPending: false,
      keyIds: [],
      // 框选后点「写想法」进来的，直接摊开表单
      composing: true,
      ...this.placePopover(undefined, targetRect),
      anchorEl,
    });
  }

  private openPopoverForAnchor(
    anchor: IdeaAnchor,
    anchorEl: Element | null,
    targetRect?: DOMRect,
  ): void {
    this.showPopover({
      anchor: this.toAnchorPayload(anchor),
      ideas: anchor.ideas,
      hasPending: anchor.hasPending,
      keyIds: [anchor.id],
      // 走到这里都是「本来就想写」的场景（选区撞上已有区间、移动端点段落）
      composing: true,
      ...this.placePopover(undefined, targetRect),
      anchorEl,
    });
  }

  private openPopoverForMark(mark: Element): void {
    const keys = (mark.getAttribute(IDEA_KEY_ATTRIBUTE) ?? '')
      .split(',')
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const matched = this.ideaAnchors.filter((anchor) =>
      keys.includes(anchor.id),
    );
    if (matched.length === 0) return;

    const first = matched[0];
    this.showPopover({
      // 从已有虚线写想法时沿用这条线索原本的区间，后端据此把想法并进同一处
      anchor: this.toAnchorPayload(first),
      ideas: matched.flatMap((anchor) => anchor.ideas),
      hasPending: matched.some((anchor) => anchor.hasPending),
      keyIds: keys,
      // 点虚线是「先看看别人写了什么」，表单收起来
      composing: false,
      ...this.placePopover(undefined, mark.getBoundingClientRect()),
      anchorEl: mark,
    });
  }

  private toAnchorPayload(anchor: IdeaAnchor): IdeaAnchorPayload {
    return {
      startOffset: anchor.startOffset,
      endOffset: anchor.endOffset,
      anchorText: anchor.anchorText,
      prefix: anchor.prefix ?? '',
      suffix: anchor.suffix ?? '',
    };
  }

  private showPopover(state: {
    anchor: IdeaAnchorPayload;
    ideas: Idea[];
    hasPending: boolean;
    keyIds: number[];
    left: number;
    top: number;
    placement: IdeaPlacement;
    composing: boolean;
    anchorEl: Element | null;
  }): void {
    this.popoverAnchorEl = state.anchorEl;
    this.popover = {
      anchor: state.anchor,
      ideas: state.ideas,
      hasPending: state.hasPending,
      keyIds: state.keyIds,
      left: state.left,
      top: state.top,
      placement: state.placement,
      composing: state.composing,
    };
    this.popoverReady = false;
    this.setPendingHighlight(state.anchor);
    this.tryRenderIdeas();
    setTimeout(() => {
      this.popoverReady = true;
    }, 0);
  }

  /**
   * 浮窗宽度：优先量实际渲染值；还没渲染时按 CSS 的 clamp 规则估算。
   * 两边必须一致 —— 早先按固定 320px 收拢，浮窗加宽后左侧就溢出到视口外了。
   */
  private popoverWidth(): number {
    const host = this.el.nativeElement.querySelector(
      'fl-idea-popover',
    ) as HTMLElement | null;
    const measured = host?.getBoundingClientRect().width ?? 0;
    if (measured > 0) {
      return measured;
    }
    const viewport = window.innerWidth;
    if (viewport <= 768) {
      return viewport - 24;
    }
    return Math.min(Math.max(340, viewport * 0.4), 620);
  }

  /** 浮窗高度未知时按 CSS 的 max-height 上限估一个，用于决定翻上还是翻下 */
  private popoverHeight(): number {
    const host = this.el.nativeElement.querySelector(
      'fl-idea-popover',
    ) as HTMLElement | null;
    const measured = host?.getBoundingClientRect().height ?? 0;
    if (measured > 0) {
      return measured;
    }
    return Math.min(520, window.innerHeight * 0.72);
  }

  /**
   * 位置换算 + 视口边界收拢。
   *
   * 优先级：右侧 → 左侧 → 上方 → 下方。开在右边是为了尽量不遮住被批注的文字，
   * 右边放不下就退到左边，两边都放不下才回到"上/下"压在文字上。
   *
   * left/top 给的是「贴边点」而不是左上角：具体往哪边铺开由 CSS 的
   * `translate`（按 data-placement）负责，所以这里要把 GAP 算进边界判断里。
   */
  private placePopover(
    position: { left: number; top: number } | undefined,
    targetRect: DOMRect | undefined,
  ): { left: number; top: number; placement: IdeaPlacement } {
    const layer = this.ideaLayerRef?.nativeElement;
    if (!layer) {
      // 兜底：跟 CSS 里的默认 translate 保持一致
      return { left: 0, top: 0, placement: 'above' };
    }

    // 与浮窗 CSS 里的 translate 偏移保持一致
    const GAP = 14;
    const margin = 8;
    const layerRect = layer.getBoundingClientRect();
    const width = this.popoverWidth();
    const height = this.popoverHeight();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = position?.left ?? 0;
    let top = position?.top ?? 0;
    let placement: IdeaPlacement = 'right';

    if (targetRect) {
      const centerX =
        targetRect.left - layerRect.left + targetRect.width / 2;
      const centerY =
        targetRect.top - layerRect.top + targetRect.height / 2;

      const roomRight = viewportWidth - margin - targetRect.right;
      const roomLeft = targetRect.left - margin;
      const roomAbove = targetRect.top - margin;
      const roomBelow = viewportHeight - margin - targetRect.bottom;

      if (roomRight >= width + GAP) {
        placement = 'right';
      } else if (roomLeft >= width + GAP) {
        placement = 'left';
      } else if (roomAbove >= height + GAP) {
        placement = 'above';
      } else if (roomBelow >= height + GAP) {
        placement = 'below';
      } else {
        // 四条边都放不下（窄屏）：挑空间最大的一侧，后面再靠收拢兜底
        const best = Math.max(roomRight, roomLeft, roomAbove, roomBelow);
        if (best === roomRight) placement = 'right';
        else if (best === roomLeft) placement = 'left';
        else if (best === roomAbove) placement = 'above';
        else placement = 'below';
      }

      if (placement === 'right') {
        left = targetRect.right - layerRect.left;
        top = centerY;
      } else if (placement === 'left') {
        left = targetRect.left - layerRect.left;
        top = centerY;
      } else if (placement === 'below') {
        left = centerX;
        top = targetRect.bottom - layerRect.top;
      } else {
        left = centerX;
        top = targetRect.top - layerRect.top;
      }
    }

    // 按方向算出浮窗落在视口里的实际矩形，再整体推回可见范围
    const anchorX = layerRect.left + left;
    const anchorY = layerRect.top + top;
    const projectedLeft =
      placement === 'right'
        ? anchorX + GAP
        : placement === 'left'
          ? anchorX - GAP - width
          : anchorX - width / 2;
    const projectedTop =
      placement === 'below'
        ? anchorY + GAP
        : placement === 'above'
          ? anchorY - GAP - height
          : anchorY - height / 2;

    let shiftX = 0;
    if (projectedLeft < margin) {
      shiftX = margin - projectedLeft;
    } else if (projectedLeft + width > viewportWidth - margin) {
      shiftX = Math.max(
        viewportWidth - margin - (projectedLeft + width),
        margin - projectedLeft,
      );
    }

    let shiftY = 0;
    if (projectedTop < margin) {
      shiftY = margin - projectedTop;
    } else if (projectedTop + height > viewportHeight - margin) {
      shiftY = Math.max(
        viewportHeight - margin - (projectedTop + height),
        margin - projectedTop,
      );
    }

    return { left: left + shiftX, top: top + shiftY, placement };
  }

  closePopover(): void {
    if (!this.popover) return;
    this.popover = null;
    this.popoverAnchorEl = null;
    this.popoverReady = false;
    // 关掉浮窗就撤掉高亮，正文回到常态
    this.pendingHighlight = null;
    this.tryRenderIdeas();
  }

  private repositionPopover(): void {
    const popover = this.popover;
    if (!popover) return;

    const target = this.popoverAnchorEl;
    if (!target || !target.isConnected) {
      this.closePopover();
      return;
    }

    // 滚动时只跟着锚点走，不关闭：用户要的是浮窗一直悬在内容上。
    // 锚点滚出视口后，placePopover 的边界收拢会把浮窗拉回视口内继续显示。
    this.popover = {
      ...popover,
      ...this.placePopover(undefined, target.getBoundingClientRect()),
    };
  }

  /** 新建成功：把想法并进本地锚点，立刻画出「待审核」虚线 */
  onIdeaCreated(idea: Idea): void {
    const current = this.popover;
    if (!current) return;

    const anchorId = idea.anchorId ?? current.keyIds[0] ?? -1;
    const matched = this.ideaAnchors.find((anchor) => anchor.id === anchorId);

    if (matched) {
      if (!matched.ideas.some((item) => item.id === idea.id)) {
        matched.ideas = [...matched.ideas, idea];
        // 后端下发的 ideaCount/pendingCount 是本次提交前的值，本地把刚加的这条补上
        matched.ideaCount = (matched.ideaCount ?? matched.ideas.length - 1) + 1;
        if (!idea.isApproved) {
          matched.pendingCount = (matched.pendingCount ?? 0) + 1;
        }
      }
      matched.hasPending = true;
      this.popover = {
        ...current,
        ideas: matched.ideas,
        hasPending: true,
        keyIds: [matched.id],
      };
    } else {
      // 后端新开了一条区间线索：本地补一条，偏移与提交的 payload 一致
      const localAnchor: IdeaAnchor = {
        id: anchorId,
        startOffset: current.anchor.startOffset,
        endOffset: current.anchor.endOffset,
        anchorText: current.anchor.anchorText,
        prefix: current.anchor.prefix,
        suffix: current.anchor.suffix,
        hasPending: true,
        ideaCount: 1,
        pendingCount: idea.isApproved ? 0 : 1,
        ideas: [idea],
      };
      this.ideaAnchors = [...this.ideaAnchors, localAnchor];
      this.popover = {
        ...current,
        ideas: [idea],
        hasPending: true,
        keyIds: [anchorId],
      };
    }

    this.ideasLoaded = true;
    // 提交成功后由真实锚点（待审核淡虚线）接管，撤掉临时的选中高亮
    this.pendingHighlight = null;
    this.tryRenderIdeas();
  }

  onScroll(source: 'editor' | 'viewer'): void {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const editor = this.editorRef.nativeElement;
    const viewer = this.viewerRef.nativeElement;
    const sourceElement = source === 'editor' ? editor : viewer;
    const targetElement = source === 'editor' ? viewer : editor;

    const scrollRatio =
      sourceElement.scrollTop /
      (sourceElement.scrollHeight - sourceElement.clientHeight);

    targetElement.scrollTop =
      scrollRatio * (targetElement.scrollHeight - targetElement.clientHeight);

    this.isSyncing = false;
  }

  /** 点赞 / 取消防连点：已赞则只播动画，不再请求接口 */
  toggleBlogLike(): void {
    if (this.blogLikeAnimating) return;

    this.triggerBlogLikeAnimation();

    if (this.blogLiked) {
      return;
    }

    const prevCount = this.blogLikeCount;
    this.blogLiked = true;
    this.blogLikeCount = prevCount + 1;
    this.saveBlogLikeState();

    this.blog.likeBlog(this.Id).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.blogLikeCount = Number(data?.likes ?? this.blogLikeCount);
      },
      error: () => {
        this.blogLiked = false;
        this.blogLikeCount = prevCount;
        this.saveBlogLikeState();
      },
    });
  }

  private triggerBlogLikeAnimation(): void {
    this.blogLikeAnimating = true;
    setTimeout(() => {
      this.blogLikeAnimating = false;
    }, 1000);
  }

  /** 从 localStorage 恢复今日已赞状态 */
  private restoreBlogLikeState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const stored = localStorage.getItem(this.blogLikeStorageKey);
      if (stored) {
        const data = JSON.parse(stored);
        const todayKey = this.getTodayKey();
        if (
          data.dateKey === todayKey &&
          Array.isArray(data.ids) &&
          data.ids.includes(Number(this.Id))
        ) {
          this.blogLiked = true;
        } else {
          localStorage.removeItem(this.blogLikeStorageKey);
        }
      }
    } catch {
      // ignore
    }
  }

  private saveBlogLikeState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const todayKey = this.getTodayKey();
      let ids: number[] = [];
      const stored = localStorage.getItem(this.blogLikeStorageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.dateKey === todayKey && Array.isArray(data.ids)) {
          ids = data.ids;
        }
      }
      const currentId = Number(this.Id);
      if (this.blogLiked && !ids.includes(currentId)) {
        ids.push(currentId);
      } else if (!this.blogLiked) {
        ids = ids.filter((id) => id !== currentId);
      }
      localStorage.setItem(
        this.blogLikeStorageKey,
        JSON.stringify({ dateKey: todayKey, ids }),
      );
    } catch {
      // ignore
    }
  }

  /** 北京时区每日 9 点分界：9 点前归为前一天 */
  private getTodayKey(): string {
    const now = new Date();
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

  /** 文章评论区的数据源（详情返回后按文章 id 建立） */
  commentSource?: CommentSource;

  /** 判断是否为置顶文章（模板调用） */
  isPinnedBlog(blog: any): boolean {
    return isPinnedBlog(blog);
  }

  /** 打开「匿名提问」弹窗（仅置顶文章有入口） */
  openAskModal(): void {
    this.modal.create({
      nzContent: AskQuestionComponent,
      nzTitle: '匿名提问',
      nzWidth: 'min(560px, 92vw)',
      nzFooter: null,
    });
  }
}

import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { FormsModule } from '@angular/forms';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

import { FlAlertDirective } from '../../common_ui/fl_ui/fl-alert/fl-alert.directive';
import { FlButtonComponent } from '../../common_ui/fl_ui/fl-button/fl-button.component';
import { FlCardDirective } from '../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlInputDirective } from '../../common_ui/fl_ui/fl-input/fl-input.directive';
import { FlTagDirective } from '../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import { FlTagFilterComponent } from '../../common_ui/fl_ui/fl-tag-filter/fl-tag-filter.component';
import { FlCommentCardComponent } from '../../common_ui/fl_ui/fl-comment-card/fl-comment-card.component';
import { FlCommentContentComponent } from '../../common_ui/fl_ui/fl-comment-content/fl-comment-content.component';
import { FlCommentEditorComponent } from '../../common_ui/fl_ui/fl-comment-editor/fl-comment-editor.component';
import { BlogCardComponent } from '../../components/blog/blog-card/blog-card.component';
import { BlogTitleComponent } from '../../components/blog/blog-title/blog-title.component';
import { LinkCardComponent } from '../../components/link/link-card/link-card.component';
import { NodataComponent } from '../../components/website/nodata/nodata.component';
import { MeCardComponent } from '../../components/website/me-card/me-card.component';
import { EquipmentCardComponent } from '../../components/world/equipment-card/equipment-card.component';
import { GameCardComponent } from '../../components/world/game-card/game-card.component';
import { CoffeeComponent } from '../../components/website/svg/coffee/coffee.component';
import { Forever } from '../../components/website/svg/forever/forever';
import { PlanetComponent } from '../../components/website/svg/planet/planet.component';
import { RssComponent } from '../../components/website/svg/rss/rss.component';
import { SitemapComponent } from '../../components/website/svg/sitemap/sitemap.component';
import type { CommentItem } from '../../shared/comment/comment.model';

import {
  BubbleIn,
  ExpandCollapse,
  FadeSlide,
  PopoverIn,
  QuickDown,
  QuickLeft,
  QuickRight,
  QuickUp,
  RefreshUp,
  SlideEnter,
  SlowDown,
  SlowLeft,
  SlowRight,
  SlowUp,
  StaggerList,
} from '../../common_ui/animations/animation';

import {
  BREAKPOINTS,
  COLOR_GROUPS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LAYOUT_TOKENS,
  LINE_HEIGHTS,
  MARKDOWN_SAMPLE,
  MOTION_DURATIONS,
  MOTION_EASES,
  MOTION_LIFTS,
  MOTION_TRIGGERS,
  MOTION_UNUSED,
  RADII,
  SHADOWS,
  SPACING,
  TEXT_CLASSES,
  type DesignToken,
} from './design-tokens.data';

interface NavSection {
  id: string;
  title: string;
}

/**
 * 设计系统展示页。
 *
 * 三条硬约束（改这一页时请一并遵守，见 FlowersInkV2/AGENTS.md 第 9~11 条）：
 *  1. 颜色的值一律在运行时从 `:root` 读，色块一律用 `var(--fi-*)` 上色
 *     —— 页面消费的是 token 本身，不是 token 的值，改 token 本页自动跟着变。
 *  2. 组件一律直接 import 复用，不写"长得像"的复刻。
 *  3. 页面私有 CSS 只允许写展示脚手架（色块网格、标尺条、重播按钮）。
 */
@Component({
  selector: 'flower-design',
  standalone: true,
  imports: [
    FormsModule,
    MarkdownModule,
    NzAffixModule,
    NzAlertModule,
    NzFlexModule,
    NzIconModule,
    NzInputModule,
    NzSkeletonModule,
    NzSpinModule,
    NzTagModule,
    NzTypographyModule,
    FlAlertDirective,
    FlButtonComponent,
    FlCardDirective,
    FlInputDirective,
    FlTagDirective,
    FlTagFilterComponent,
    FlCommentCardComponent,
    FlCommentContentComponent,
    FlCommentEditorComponent,
    BlogCardComponent,
    BlogTitleComponent,
    LinkCardComponent,
    NodataComponent,
    MeCardComponent,
    EquipmentCardComponent,
    GameCardComponent,
    CoffeeComponent,
    Forever,
    PlanetComponent,
    RssComponent,
    SitemapComponent,
  ],
  templateUrl: './design.component.html',
  styleUrl: './design.component.css',
  animations: [
    QuickUp,
    QuickDown,
    SlowUp,
    SlowDown,
    RefreshUp,
    StaggerList,
    FadeSlide,
    ExpandCollapse,
    PopoverIn,
    BubbleIn,
    QuickLeft,
    QuickRight,
    SlowLeft,
    SlowRight,
    SlideEnter,
  ],
})
export class DesignComponent implements AfterViewInit, OnDestroy {
  readonly colorGroups = COLOR_GROUPS;
  readonly spacing = SPACING;
  readonly radii = RADII;
  readonly shadows = SHADOWS;
  readonly layoutTokens = LAYOUT_TOKENS;
  readonly fontSizes = FONT_SIZES;
  readonly fontWeights = FONT_WEIGHTS;
  readonly lineHeights = LINE_HEIGHTS;
  readonly fontFamilies = FONT_FAMILIES;
  readonly motionDurations = MOTION_DURATIONS;
  readonly motionEases = MOTION_EASES;
  readonly motionLifts = MOTION_LIFTS;
  readonly breakpoints = BREAKPOINTS;
  readonly textClasses = TEXT_CLASSES;
  readonly markdownSample = MARKDOWN_SAMPLE;

  readonly sections: NavSection[] = [
    { id: 'color', title: '色彩' },
    { id: 'space', title: '间距' },
    { id: 'radius', title: '圆角' },
    { id: 'shadow', title: '阴影' },
    { id: 'type', title: '排版' },
    { id: 'motion', title: '动效' },
    { id: 'button', title: '按钮' },
    { id: 'input', title: '表单' },
    { id: 'card', title: '卡片' },
    { id: 'tag', title: '标签' },
    { id: 'alert', title: '提示' },
    { id: 'layout', title: '版式容器' },
    { id: 'markdown', title: '正文排版' },
    { id: 'comment', title: '评论区' },
    { id: 'state', title: '状态' },
    { id: 'cards', title: '卡片族' },
    { id: 'timeline', title: '时间轴与切换' },
    { id: 'icon', title: '图标' },
    { id: 'a11y', title: '无障碍' },
  ];

  /** token 名 → 运行时算出来的值，`ngAfterViewInit` 里填 */
  readonly tokenValues = signal<Record<string, string>>({});
  /** 当前高亮的分区（滚动高亮用） */
  readonly activeSection = signal<string>('color');

  /** 侧栏吸顶的顶部偏移，与 changelog 的侧栏取同一个值 */
  readonly affixOffsetTop = 84;

  /* ---- 各交互演示的本地状态 ---- */
  readonly tagFilterItems = [
    { tag: '教程', count: 18 },
    { tag: '见闻', count: 12 },
    { tag: '再花', count: 9 },
    { tag: '游戏', count: 6 },
  ];
  selectedTagFilter = '';
  inputValue = '';
  textareaValue = '支持多行输入。\n状态样式与单行输入一致。';
  commentDraft = '试试**加粗**、`行内代码`，还有列表：\n\n- 第一项\n- 第二项';
  commentsExpanded = false;
  disabledDemo = true;
  spinDemo = true;
  skeletonDemo = true;

  readonly tabs = ['写作', '归档', '点滴'];
  activeTab = '写作';
  readonly dotCount = [0, 1, 2];
  activeDot = 0;

  /** 动效对照表：按触发器名索引，供 15 张演示卡取用说明文案 */
  private readonly motionIndex: Record<string, { usage: string; duration: string }> =
    Object.fromEntries(
      [...MOTION_TRIGGERS, ...MOTION_UNUSED].map((m) => [m.name, { usage: m.usage, duration: m.duration }])
    );

  /** 每个动效演示当前是否在场。重播 = 先把它移走，隔一拍再放回来。 */
  private readonly visibleDemos = signal<Record<string, boolean>>({});
  private readonly replayTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * 重播的间隔：旧的先走完退场，隔这么久再把新的放回来播入场。
   *
   * 不留这个间隔的话，带退场动画的触发器（FadeSlide / PopoverIn / BubbleIn）
   * 会出现「旧的还在退场、新的已经入场」的重叠，观感是在原地抽搐。
   * 隔开之后是干净的两拍：旧的消失 → 新的播一次。
   */
  private readonly replayGapMs = 500;

  /** StaggerList 的示例条目。必须是 `@for` 出来的：写死的静态子元素匹配不到 `query(':enter')` */
  readonly staggerItems = [1, 2, 3, 4, 5];

  /** 评论示例用站内本地方形头像，避免示例页依赖外部图床 */
  readonly demoComment: CommentItem = {
    id: 1,
    parentId: null,
    name: '再花',
    email: '',
    website: 'https://flowersink.com',
    avatarUrl: 'assets/img/web/猫娘.jpg',
    content: '这是一条示例评论，用来展示**评论卡片**的排版：\n\n- 头像、昵称、时间\n- 正文按评论区的 Markdown 主题渲染',
    isApproved: true,
    isAdminReply: false,
    createDate: '2026-10-07 12:00:00',
  };

  readonly demoReply: CommentItem = {
    id: 2,
    parentId: 1,
    name: '访客',
    email: '',
    website: '',
    avatarUrl: 'assets/img/web/再花猫猫女仆.PNG',
    content: '子回复只负责一张脸，缩进由评论区自己负责。',
    isApproved: true,
    isAdminReply: false,
    createDate: '2026-10-07 12:05:00',
  };

  /* ---- 卡片族的示例数据 ---- */
  readonly demoLink = {
    id: 1,
    name: '示例友链',
    url: 'https://flowersink.com',
    description: '友链卡片的排版示意：左侧头像、右侧名称、简介与网址。',
  };

  readonly demoMeCard = {
    blogTotal: 74,
    lifeTotal: 210,
    gameTotal: 36,
    runDays: 690,
    blogCharTotal: 268000,
  };

  readonly demoBlog = {
    id: 1,
    title: '示例文章标题：一句能说清内容的话',
    description: '这里是一句话摘要，用来展示卡片在正文被截断后的排版表现。',
    tag: '前端',
    views: 1280,
    wordCount: 3200,
    articleCommentCount: 12,
    articleIdeaCount: 5,
    date: '2026-10-07',
  };

  readonly demoGame = {
    name: '示例游戏',
    tag: 'RPG',
    time: '42小时',
    imgFirst: [{ url: 'assets/img/web/洱海.png' }],
  };

  readonly demoEquipment = {
    name: '示例装备',
    description: '装备卡片的排版示意，包含名称、描述与服役时长。',
    image: 'assets/img/web/小雏菊.png',
    imagePadding: 24,
    isGift: true,
    retired: false,
    retireDate: '',
    hideServiceTime: false,
  };

  private observer?: IntersectionObserver;
  /**
   * 程序化滚动期间抑制滚动高亮。
   * 平滑滚动要经过中间那些分区，不抑制的话高亮会一路乱闪，
   * 最后才停在目标上（changelog 的侧栏也是这么处理的）。
   */
  private isProgrammaticScroll = false;
  private programmaticScrollTimer?: ReturnType<typeof setTimeout>;
  private readonly host = inject(ElementRef);

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.readTokenValues();
    this.observeSections();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    clearTimeout(this.programmaticScrollTimer);
    this.replayTimers.forEach((timer) => clearTimeout(timer));
    this.replayTimers.clear();
  }

  /**
   * 点目录跳转到某个分区。
   *
   * 这里不用 `<a href="#id">` —— 那会触发一次同路由的 fragment 导航，
   * 项目的 `scrollPositionRestoration: 'top'` 会先把页面拉回顶部再找锚点，
   * 观感就是「点了目录却跳回了顶部」。改成自己算位置平滑滚过去，
   * 顺便把高亮立刻切到目标分区。
   */
  jumpTo(id: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = (this.host.nativeElement as HTMLElement).querySelector(`#${id}`);
    if (!target) {
      return;
    }

    this.isProgrammaticScroll = true;
    this.activeSection.set(id);

    const top = target.getBoundingClientRect().top + window.scrollY - this.affixOffsetTop;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

    clearTimeout(this.programmaticScrollTimer);
    this.programmaticScrollTimer = setTimeout(() => {
      this.isProgrammaticScroll = false;
    }, 900);
  }

  /* ------------------------------------------------------------------
     token 值：运行时从 :root 读，绝不把色值写进代码
     ------------------------------------------------------------------ */

  private readTokenValues(): void {
    const rootStyle = getComputedStyle(document.documentElement);
    const names = new Set<string>();
    const collect = (tokens: DesignToken[]) => tokens.forEach((t) => names.add(t.name));

    this.colorGroups.forEach((group) => collect(group.tokens));
    collect(this.spacing);
    collect(this.radii);
    collect(this.shadows);
    collect(this.layoutTokens);
    collect(this.fontSizes);
    collect(this.fontWeights);
    collect(this.lineHeights);
    collect(this.fontFamilies);
    collect(this.motionDurations);
    collect(this.motionEases);
    collect(this.motionLifts);

    const values: Record<string, string> = {};
    names.forEach((name) => {
      values[name] = rootStyle.getPropertyValue(name).trim() || '未定义';
    });
    this.tokenValues.set(values);
  }

  valueOf(name: string): string {
    return this.tokenValues()[name] ?? '…';
  }

  /* ------------------------------------------------------------------
     滚动高亮
     ------------------------------------------------------------------ */

  private observeSections(): void {
    const host = this.host.nativeElement as HTMLElement;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.isProgrammaticScroll) {
          return;
        }
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          this.activeSection.set(visible.target.id);
        }
      },
      // 顶部留出固定头部的高度，避免刚滚出视口就切换
      { rootMargin: '-88px 0px -60% 0px', threshold: 0 }
    );

    this.sections.forEach((section) => {
      const el = host.querySelector(`#${section.id}`);
      if (el) {
        this.observer?.observe(el);
      }
    });
  }

  /* ------------------------------------------------------------------
     动效演示的播放
     ------------------------------------------------------------------ */

  isVisible(name: string): boolean {
    return this.visibleDemos()[name] !== false;
  }

  replay(name: string): void {
    clearTimeout(this.replayTimers.get(name));
    // 先移走：带退场的触发器等它自己走完，没有退场的立刻消失
    this.visibleDemos.update((current) => ({ ...current, [name]: false }));
    // 隔一拍再放回来，新的元素会重放一次入场
    this.replayTimers.set(
      name,
      setTimeout(() => {
        this.visibleDemos.update((current) => ({ ...current, [name]: true }));
      }, this.replayGapMs),
    );
  }

  /* ------------------------------------------------------------------
     展示用的小交互
     ------------------------------------------------------------------ */

  selectTagFilter(value: string): void {
    this.selectedTagFilter = value;
  }

  toggleCommentsDemo(): void {
    this.commentsExpanded = !this.commentsExpanded;
  }

  motionInfo(name: string): { usage: string; duration: string } {
    return this.motionIndex[name] ?? { usage: '', duration: '' };
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  selectDot(index: number): void {
    this.activeDot = index;
  }

  toggleSpinDemo(): void {
    this.spinDemo = !this.spinDemo;
  }

  toggleSkeletonDemo(): void {
    this.skeletonDemo = !this.skeletonDemo;
  }
}

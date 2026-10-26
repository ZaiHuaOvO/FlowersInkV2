import { ChangeDetectorRef, Component, DestroyRef, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { WelcomeService } from './welcome.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { DOCUMENT, DatePipe } from '@angular/common';
import { BlogCardComponent } from '../../components/blog/blog-card/blog-card.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { RouterModule } from '@angular/router';
import { BlogTitleComponent } from '../../components/blog/blog-title/blog-title.component';
import { QuickUp, SlowUp } from '../../common_ui/animations/animation';
import { WindowService } from '../../services/window.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { FlCardDirective } from '../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlButtonComponent } from '../../common_ui/fl_ui/fl-button/fl-button.component';
import { MeCardComponent, MeCardProfile } from '../../components/website/me-card/me-card.component';
import { isPinnedBlog } from '../../shared/utils/blog-pinned.util';
import { getSafeTopInset } from '../../shared/utils/safe-area.util';
import { AnnouncementCardComponent } from './announcement-card/announcement-card.component';
import { AnnouncementDetailComponent } from './announcement-detail/announcement-detail.component';
import { FlErrorStateComponent } from '../../common_ui/fl_ui/fl-error-state/fl-error-state.component';

/**
 * 首页 hero 的入场动画方案，每次加载随机挑一套。
 * 新增方案：这里加名字，welcome.component.css 里补一个 .hero--<名字> 块，
 * 两块之间互不干涉，同一时刻只有一个 .hero--* 生效。
 */
const HERO_PLANS = ['a', 'b'] as const;
type HeroPlan = (typeof HERO_PLANS)[number];

/** 方案 B 的 hero 动画收尾时刻（ms）：擦字到 0.86s 结束，这里留一点缓冲 */
const HERO_B_SETTLE_MS = 900;

/**
 * 各方案从页面出现到 hero 动画收尾要等多久（ms）：数据与按钮在这之后才进场，
 * 0 表示这套方案没有「等动画」这一段。新增方案时在这里补一条。
 */
const HERO_SETTLE_MS: Record<HeroPlan, number> = { a: 0, b: HERO_B_SETTLE_MS };

/**
 * 随机取一套方案；地址带上 ?hero=a / ?hero=b 时锁定那一种，
 * 方便本地反复对照同一套动画（不写就是随机）。
 */
function pickHeroPlan(): HeroPlan {
  const forced =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('hero');
  if (forced && (HERO_PLANS as readonly string[]).includes(forced)) {
    return forced as HeroPlan;
  }
  return HERO_PLANS[Math.floor(Math.random() * HERO_PLANS.length)];
}

interface WelcomeStats {
  blogTotal: number;
  lifeTotal: number;
  gameTotal: number;
  runDays: number;
  blogCharTotal: number;
  recentBlogs: { id: number; title: string }[];
  profile?: MeCardProfile;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  imports: [
    NzFlexModule,
    NzSpinModule,
    BlogCardComponent,
    MeCardComponent,
    NzTypographyModule,
    RouterModule,
    BlogTitleComponent,
    NzAffixModule,
    NzDividerModule,
    NzModalModule,
    NzTagModule,
    FlCardDirective,
    FlButtonComponent,
    AnnouncementCardComponent,
    FlErrorStateComponent,
  ],
  animations: [SlowUp, QuickUp],
})
export class WelcomeComponent implements OnInit {
  data: any[] = [];
  loading = true;
  loadError = false;
  numLoading = true;
  info: WelcomeStats = {
    blogTotal: 0,
    lifeTotal: 0,
    gameTotal: 0,
    runDays: 0,
    blogCharTotal: 0,
    recentBlogs: [],
  };
  isMobile: boolean = false;
  scrollAtTop = true;

  /** 本页生效的 hero 入场方案（每次加载随机） */
  readonly heroPlan = pickHeroPlan();
  /** hero 入场动画是否已收尾：收尾前数据与按钮先不出来（方案 A 没有这一段，一直算收尾） */
  heroSettled = HERO_SETTLE_MS[this.heroPlan] === 0;

  /** 当前生效的临时公告；null 表示不显示 hero 上方那张卡片 */
  announcement: any = null;
  @ViewChild('more', { static: true })
  more!: TemplateRef<any>;

  @ViewChild('heroBody') heroBody?: ElementRef<HTMLElement>;
  @ViewChild('heroText') heroText?: ElementRef<HTMLElement>;

  constructor(
    private welcome: WelcomeService,
    private cdr: ChangeDetectorRef,
    private windowService: WindowService,
    private readonly destroyRef: DestroyRef,
    @Inject(DOCUMENT) private document: Document,
    private modal: NzModalService,
    private msg: NzMessageService
  ) {
    this.windowService.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });

    const win = this.document.defaultView;
    if (win) {
      const onScroll = () => {
        const atTop = win.scrollY < 60;
        if (this.scrollAtTop !== atTop) {
          this.scrollAtTop = atTop;
          this.cdr.detectChanges();
        }
      };
      win.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => win.removeEventListener('scroll', onScroll));
    }
  }

  ngOnInit() {
    this.welcome.getWebInfo().subscribe((res: any) => {
      const data = res?.data ?? {};
      this.info.blogTotal = Number(data.blogTotal ?? 0);
      this.info.lifeTotal = Number(data.lifeTotal ?? 0);
      this.info.gameTotal = Number(data.gameTotal ?? 0);
      this.info.blogCharTotal = Number(data.blogCharTotal ?? 0);
      this.info.recentBlogs = data.recentBlogs ?? [];
      this.info.runDays = Number(data.runDays ?? 0);
      this.info.profile = data.profile ?? undefined;
      this.numLoading = false;
    });

    // 公告是可选内容，取不到就当没有，不要影响首页其余部分
    this.welcome.getAnnouncement().subscribe({
      next: (res: any) => {
        this.announcement = res?.data ?? null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.announcement = null;
      },
    });

    // 方案 B 里数据与按钮要等 hero 收尾才进场；用计时而不是 CSS 延迟，
    // 这样接口慢也只是晚一点淡入，不会在等待之上再叠一层。
    // 开了「减少动态效果」时不摆这 0.9s 的架子，直接全部就位。
    const settleMs = HERO_SETTLE_MS[this.heroPlan];
    if (settleMs) {
      const reduced = !!this.document.defaultView?.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      const settle = setTimeout(() => {
        this.heroSettled = true;
      }, reduced ? 0 : settleMs);
      this.destroyRef.onDestroy(() => clearTimeout(settle));
    }
  }

  ngAfterViewInit(): void {
    this.applyHeroShift();
    this.loadFeatured();
  }

  /** 精选文章；错误态里的「重新加载」也走这里 */
  loadFeatured(): void {
    this.data = [];
    this.loadError = false;
    this.loading = true;
    // 精选卡片只展示摘要，正文没必要整篇拉下来
    this.welcome
      .getBlogs({ star: true, contentLength: 200 })
      .subscribe({
        next: (res: any) => {
          this.data = this.orderPinnedFirst(this.processedData(res['data'].data));
          this.cdr.detectChanges();
          this.loading = false;
        },
        error: () => {
          this.loadError = true;
          this.loading = false;
        },
      });
  }

  /**
   * 方案 B 的头像从「页面中线」起跳，所以得先知道头像中线离页面中线有多远。
   * 版面是 [头像][间距][文案] 三段居中排的，于是
   *     偏移 =（间距 + 文案宽）/ 2
   * 量出来的值写进 --fi-hero-b-shift，头像的起跳位置与左移距离都读这一个值。
   * 窄屏是竖排（头像本来就在中间），不用挪，不给值就是原地跳一下。
   */
  private applyHeroShift(): void {
    if (this.heroPlan !== 'b' || this.isMobile) {
      return;
    }
    const body = this.heroBody?.nativeElement;
    const text = this.heroText?.nativeElement;
    const win = this.document.defaultView;
    if (!body || !text || !win) {
      return;
    }
    const gap = parseFloat(win.getComputedStyle(body).columnGap) || 0;
    const shift = (gap + text.getBoundingClientRect().width) / 2;
    body.style.setProperty('--fi-hero-b-shift', `${Math.round(shift)}px`);
  }

  /** 置顶文章（id=0）永远排在精选列表最前，其余保持原有顺序。 */
  private orderPinnedFirst(items: any[]): any[] {
    items.forEach((item) => {
      item.pinned = isPinnedBlog(item);
    });
    return items
      .filter((item) => item.pinned)
      .concat(items.filter((item) => !item.pinned));
  }

  processedData(data: any): any {
    const PREVIEW_LENGTH = 200;
    const processedData = data.map((item: any) => {
      // API 已按 PREVIEW_LENGTH 截断，长度达到上限即说明原文更长
      if (item.content.length >= PREVIEW_LENGTH) {
        return {
          ...item,
          content: item.content.substring(0, PREVIEW_LENGTH) + '...',
        };
      }
      return item; // 如果长度不超过上限，则保持原样
    });
    return processedData;
  }

  detail(): void {
    this.modal.create({ nzContent: this.more, nzFooter: [] },);
  }

  /** 公告卡片：标题放弹窗标题栏，正文与发布时间交给详情组件 */
  openAnnouncement(): void {
    if (!this.announcement) {
      return;
    }

    this.modal.create({
      nzTitle: this.announcement.title,
      nzContent: AnnouncementDetailComponent,
      nzData: this.announcement,
      nzFooter: null,
      nzWidth: 'min(560px, 92vw)',
    });
  }

  copy(value: string): void {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        this.msg.success('已复制联系方式，好耶(๑＞ڡ＜)☆');
      })
      .catch((error) => { });
  }

  /** 向下滚动到文章区，避开固定 header 的高度 */
  scrollToContent(): void {
    const el = document.getElementById('content-start');
    if (el) {
      const headerOffset = 60 + getSafeTopInset(); // 48px header + 12px 留白 + 安全区
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}



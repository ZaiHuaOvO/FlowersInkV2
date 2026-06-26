import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { TargetComponent } from '../../../components/about/target/target.component';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';

@Component({
  selector: 'flower-website',
  standalone: true,
  imports: [
    NzFlexModule,
    NzImageModule,
    NzDividerModule,
    NzTypographyModule,
    NzCollapseModule,
    NzIconModule,
    RouterModule,
    TargetComponent,
    FlCardDirective,
  ],
  templateUrl: './website.component.html',
  styleUrl: './website.component.css',
  animations: [QuickUp],
  host: { '[@QuickUp]': '' },
})
export class WebsiteComponent implements AfterViewInit, OnDestroy {
  @ViewChild('viewport', { read: ElementRef })
  viewportRef!: ElementRef<HTMLElement>;
  @ViewChild('wrap', { read: ElementRef })
  wrapRef!: ElementRef<HTMLElement>;

  activeSection = 0;
  _isMobile = false;
  get isMobile(): boolean { return this._isMobile; }
  set isMobile(v: boolean) {
    if (v === this._isMobile) return;
    this._isMobile = v;
    setTimeout(() => this.bindEventsForCurrentMode(), 0);
  }
  isTransitioning = false;
  slideDirection: 'left' | 'right' = 'right';
  viewportHeight = 0;

  tabs = [
    { index: 0, label: '建站历程' },
    { index: 1, label: '诞生原因' },
    { index: 2, label: '名称含义' },
    { index: 3, label: '技术框架' },
    { index: 4, label: '特别鸣谢' },
  ];

  websiteTimeline = [
    { date: '2024/10/10', title: '项目在云服务器上部署', text: '什么，我有博客了？' },
    { date: '2024/10/17', title: '域名通过工信部备案', text: '' },
    { date: '2024/10/31', title: '域名通过公安联网备案', text: '' },
    { date: '2024/11/06', title: '正式进入运营', text: '会有人看吗…' },
    { date: '2024/11/13', title: '花墨2.0重写计划立项', text: '老婆大人的可靠建议！' },
    { date: '2024/11/21', title: '花墨2.0完成开发并上线', text: '爆肝一周的成果！' },
    { date: '2024/12/22', title: '开启RSS订阅', text: '' },
    { date: '2025/01/03', title: '友链功能上线', text: '第一个友链会是谁呢？' },
    { date: '2025/02/20', title: '游戏板块上线', text: '游戏糕手再花上线！' },
    { date: '2025/02/25', title: '评论功能上线', text: '来自可爱Xia的建议' },
    { date: '2025/06/24', title: '好朋友增加至5位，好耶！', text: '能得到肯定真是太好了' },
    { date: '2025/10/10', title: '建站一周年，加入十年之约', text: '一周年快乐！' },
    { date: '2026/04/09', title: '大幅重写并优化花墨的底层逻辑，花墨变得更快了', text: 'Angular糕手再花(不是)' },
    { date: '2026/04/10', title: '统一并完善了花墨的主题样式和细节，花墨变得更好看了', text: '总算看得过去了' },
    { date: '2026/04/20', title: '点滴功能回归！开始碎碎念', text: '' },
    { date: '2026/04/28', title: '花墨真正接入了 CDN', text: '以前一直接错了！怪不得接了图片加载还是这么慢…' },
    { date: '2026/06/24', title: '重写了一个漂亮的"关于"', text: '得益于可爱米饭的个人主页灵感，我超爱' },
    { date: '未完待续', title: '', text: '' },
  ];

  private readonly THROTTLE_MS = 700;
  private wheelTimeout: ReturnType<typeof setTimeout> | null = null;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchMoved = false;
  private touchHandler: ((e: TouchEvent) => void) | null = null;
  private touchEndHandler: ((e: TouchEvent) => void) | null = null;
  private touchMoveHandler: ((e: TouchEvent) => void) | null = null;

  constructor(
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this._isMobile = isMobile;
      setTimeout(() => this.bindEventsForCurrentMode(), 0);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.measureSection();
      this.bindEventsForCurrentMode();
    }, 120);
    this.resizeObserver = new ResizeObserver(() => this.measureSection());
    const wrapEl = this.wrapRef?.nativeElement;
    const observedEl = wrapEl?.closest('.content') ?? wrapEl?.parentElement;
    if (observedEl) {
      this.resizeObserver.observe(observedEl);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.unbindAllEvents();
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }
  }

  // ---------- 事件绑定 / 解绑 ----------

  private bindEventsForCurrentMode(): void {
    this.unbindAllEvents();
    const wrapEl = this.wrapRef?.nativeElement;
    if (!wrapEl) return;

    if (this.isMobile) {
      this.bindTouchEvents(wrapEl);
    } else {
      this.bindWheelEvents(wrapEl);
    }
  }

  private unbindAllEvents(): void {
    const wrapEl = this.wrapRef?.nativeElement;
    if (!wrapEl) return;
    if (this.wheelHandler) {
      wrapEl.removeEventListener('wheel', this.wheelHandler);
      this.wheelHandler = null;
    }
    if (this.touchHandler) {
      wrapEl.removeEventListener('touchstart', this.touchHandler);
      this.touchHandler = null;
    }
    if (this.touchEndHandler) {
      wrapEl.removeEventListener('touchend', this.touchEndHandler);
      this.touchEndHandler = null;
    }
    if (this.touchMoveHandler) {
      wrapEl.removeEventListener('touchmove', this.touchMoveHandler);
      this.touchMoveHandler = null;
    }
  }

  private bindWheelEvents(el: HTMLElement): void {
    this.wheelHandler = (e: WheelEvent) => this.handleWheel(e);
    el.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  private bindTouchEvents(el: HTMLElement): void {
    this.touchHandler = (e: TouchEvent) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchMoved = false;
    };
    this.touchEndHandler = (e: TouchEvent) => {
      if (this.isTransitioning || this.touchMoved) return;
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 40) return;
      if (dx > 0 && this.activeSection > 0) {
        this.goToSection(this.activeSection - 1);
      } else if (dx < 0 && this.activeSection < 4) {
        this.goToSection(this.activeSection + 1);
      }
    };
    this.touchMoveHandler = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - this.touchStartX;
      const dy = e.touches[0].clientY - this.touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
        this.touchMoved = true;
      }
    };
    el.addEventListener('touchstart', this.touchHandler, { passive: true });
    el.addEventListener('touchend', this.touchEndHandler, { passive: true });
    el.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
  }

  // ---------- 尺寸测量 ----------

  private measureSection(): void {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;
    const section = viewport.querySelector('.section') as HTMLElement | null;
    if (section) {
      const h = section.getBoundingClientRect().height;
      if (h !== this.viewportHeight) {
        this.viewportHeight = h;
        this.cdr.detectChanges();
      }
    }
  }

  // ---------- 滚轮处理 ----------

  private handleWheel(event: WheelEvent): void {
    if (this.isTransitioning || this.wheelTimeout) return;
    const delta = event.deltaY;
    if (Math.abs(delta) < 10) return;
    const canGoNext = delta > 0 && this.activeSection < 4;
    const canGoPrev = delta < 0 && this.activeSection > 0;
    if (canGoNext) {
      event.preventDefault();
      this.goToSection(this.activeSection + 1);
    } else if (canGoPrev) {
      event.preventDefault();
      this.goToSection(this.activeSection - 1);
    }
  }

  // ---------- Section 切换 ----------

  goToSection(index: number): void {
    if (
      index === this.activeSection ||
      this.isTransitioning ||
      index < 0 ||
      index > 4
    ) {
      return;
    }
    const goingForward = index > this.activeSection;
    this.slideDirection = goingForward ? 'right' : 'left';
    this.isTransitioning = true;
    this.activeSection = index;
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.measureSection());
    this.wheelTimeout = setTimeout(() => {
      this.isTransitioning = false;
      this.wheelTimeout = null;
    }, this.THROTTLE_MS);
  }
}

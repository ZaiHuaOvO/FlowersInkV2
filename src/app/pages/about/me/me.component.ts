import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { RouterModule } from '@angular/router';
import { TargetComponent } from '../../../components/about/target/target.component';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import { QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'flower-me',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzImageModule,
    NzTypographyModule,
    NzIconModule,
    NzDividerModule,
    NzPopoverModule,
    RouterModule,
    TargetComponent,
    FlCardDirective,
    NzTagModule
  ],
  templateUrl: './me.component.html',
  styleUrl: './me.component.css',
  animations: [QuickUp],
  host: { '[@QuickUp]': '' },
})
export class MeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('viewport', { read: ElementRef })
  viewportRef!: ElementRef<HTMLElement>;
  @ViewChild('wrap', { read: ElementRef })
  wrapRef!: ElementRef<HTMLElement>;

  activeSection = 0;
  activeHobby = 0;
  _isMobile = false;
  get isMobile(): boolean { return this._isMobile; }
  set isMobile(v: boolean) {
    if (v === this._isMobile) return;
    this._isMobile = v;
    setTimeout(() => this.bindEventsForCurrentMode(), 0);
  }
  isTransitioning = false;
  slideDirection: 'left' | 'right' = 'right';
  email = 'ZyZy1724@gmail.com';
  qq = '446840401';
  wechat = 'zaihua_huahua';
  viewportHeight = 0;

  tabs = [
    { index: 0, label: '是再花！' },
    { index: 1, label: '我的爱好' },
    { index: 2, label: '社交渠道' },
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
    private msg: NzMessageService,
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
      } else if (dx < 0 && this.activeSection < 2) {
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
    const canGoNext = delta > 0 && this.activeSection < 2;
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
      index > 2
    ) {
      return;
    }
    const goingForward = index > this.activeSection;
    this.slideDirection = goingForward ? 'right' : 'left';
    this.isTransitioning = true;
    this.activeSection = index;
    requestAnimationFrame(() => this.measureSection());
    this.wheelTimeout = setTimeout(() => {
      this.isTransitioning = false;
      this.wheelTimeout = null;
    }, this.THROTTLE_MS);
  }

  setHobby(index: number): void {
    if (index === this.activeHobby) return;
    this.activeHobby = index;
  }

  // ---------- 复制 ----------

  copyEmail(): void {
    navigator.clipboard.writeText(this.email).then(() => {
      this.msg.success('已复制邮箱地址，欢迎邮件(^-^)');
    }).catch(() => { });
  }

  copyQQ(): void {
    navigator.clipboard.writeText(this.qq).then(() => {
      this.msg.success('已复制QQ号，加好友请备注来意(^-^)');
    }).catch(() => { });
  }

  copyWechat(): void {
    navigator.clipboard.writeText(this.wechat).then(() => {
      this.msg.success('已复制微信号，加好友请备注来意(^-^)');
    }).catch(() => { });
  }
}

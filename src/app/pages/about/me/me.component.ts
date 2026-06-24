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

interface SectionDim {
  top: number;
  height: number;
}

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
})
export class MeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('track', { read: ElementRef }) trackRef!: ElementRef<HTMLElement>;
  @ViewChild('viewport', { read: ElementRef })
  viewportRef!: ElementRef<HTMLElement>;
  @ViewChild('wrap', { read: ElementRef })
  wrapRef!: ElementRef<HTMLElement>;

  sections: SectionDim[] = [];
  activeSection = 0;
  activeHobby = 0;
  isMobile = false;
  isTransitioning = false;
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

  constructor(
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
    private msg: NzMessageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.measureSections(), 120);
    const wrapEl = this.wrapRef?.nativeElement;
    if (wrapEl) {
      this.wheelHandler = (e: WheelEvent) => this.handleWheel(e);
      wrapEl.addEventListener('wheel', this.wheelHandler, {
        passive: false,
      });
    }
    this.resizeObserver = new ResizeObserver(() => this.measureSections());
    const cardEl = wrapEl?.closest('.content');
    if (cardEl) {
      this.resizeObserver.observe(cardEl);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.wheelHandler && this.wrapRef?.nativeElement) {
      this.wrapRef.nativeElement.removeEventListener(
        'wheel',
        this.wheelHandler,
      );
    }
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }
  }

  private measureSections(): void {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    const children = track.children;
    const dims: SectionDim[] = [];
    let cumulativeTop = 0;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const h = el.getBoundingClientRect().height;
      dims.push({ top: cumulativeTop, height: h });
      cumulativeTop += h;
    }
    this.sections = dims;
    this.syncViewportHeight();
  }

  private syncViewportHeight(): void {
    const dim = this.sections[this.activeSection];
    if (dim) {
      this.viewportHeight = dim.height;
      this.cdr.detectChanges();
    }
  }

  get trackOffset(): number {
    return this.sections[this.activeSection]?.top ?? 0;
  }

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

  goToSection(index: number): void {
    if (
      index === this.activeSection ||
      this.isTransitioning ||
      index < 0 ||
      index > 2
    ) {
      return;
    }
    this.isTransitioning = true;
    this.activeSection = index;
    this.syncViewportHeight();
    this.wheelTimeout = setTimeout(() => {
      this.isTransitioning = false;
      this.wheelTimeout = null;
    }, this.THROTTLE_MS);
  }

  setHobby(index: number): void {
    if (index === this.activeHobby) return;
    this.activeHobby = index;
  }

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

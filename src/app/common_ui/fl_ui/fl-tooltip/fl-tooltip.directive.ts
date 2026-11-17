import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';

export type FlTooltipPlacement = 'top' | 'bottom';

/**
 * 全站即时 tooltip。
 *
 * 交互基准来自评论区表情包的名字提示：
 * - 移入/聚焦当帧出现，没有延迟、没有淡入淡出；
 * - pointer-events: none，永远不挡指针；
 * - 浮层挂在 body 上，不依附滚动容器，不会被 overflow 裁切；
 * - 上方空间不足时自动翻到下方，并夹在视口内。
 *
 * 只负责短文本。图片/富内容（例如表情预览）继续用各自的浮层，
 * 但应遵循同一套「即时、不挡指针、不被裁切」的规范。
 */
@Directive({
  selector: '[flTooltip]',
  standalone: true,
})
export class FlTooltipDirective implements OnDestroy {
  @Input() flTooltip: string | null | undefined = '';
  @Input() flTooltipPlacement: FlTooltipPlacement = 'top';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private tip: HTMLElement | null = null;
  private hovered = false;
  private focused = false;
  private viewportBound = false;

  private readonly onViewportChange = (): void => {
    this.hide();
  };

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.hovered = true;
    this.show();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hovered = false;
    if (!this.focused) {
      this.hide();
    }
  }

  @HostListener('focusin')
  onFocusIn(): void {
    this.focused = true;
    this.show();
  }

  @HostListener('focusout')
  onFocusOut(): void {
    this.focused = false;
    if (!this.hovered) {
      this.hide();
    }
  }

  @HostListener('click')
  onClick(): void {
    this.hide();
  }

  ngOnDestroy(): void {
    this.hide();
    this.tip?.remove();
    this.tip = null;
  }

  private show(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const text = String(this.flTooltip ?? '').trim();
    if (!text) {
      this.hide();
      return;
    }

    let tip = this.tip;
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'fl-tooltip';
      tip.setAttribute('role', 'tooltip');
      document.body.appendChild(tip);
      this.tip = tip;
    }

    tip.textContent = text;
    tip.style.visibility = 'hidden';
    tip.style.left = '0px';
    tip.style.top = '0px';

    const hostRect = this.element.nativeElement.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const gap = 8;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = hostRect.left + hostRect.width / 2 - tipRect.width / 2;
    left = Math.min(
      Math.max(left, margin),
      Math.max(margin, viewportWidth - tipRect.width - margin),
    );

    const spaceAbove = hostRect.top - gap - margin;
    const spaceBelow =
      viewportHeight - hostRect.bottom - gap - margin;
    let below = this.flTooltipPlacement === 'bottom';

    if (below && spaceBelow < tipRect.height && spaceAbove >= tipRect.height) {
      below = false;
    } else if (
      !below &&
      spaceAbove < tipRect.height &&
      spaceBelow >= tipRect.height
    ) {
      below = true;
    }

    let top = below
      ? hostRect.bottom + gap
      : hostRect.top - tipRect.height - gap;
    top = Math.min(
      Math.max(top, margin),
      Math.max(margin, viewportHeight - tipRect.height - margin),
    );

    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
    tip.style.visibility = 'visible';
    this.bindViewport();
  }

  private hide(): void {
    if (this.tip) {
      this.tip.style.visibility = 'hidden';
    }
    this.unbindViewport();
  }

  private bindViewport(): void {
    if (this.viewportBound || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.viewportBound = true;
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange);
  }

  private unbindViewport(): void {
    if (!this.viewportBound || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.viewportBound = false;
    window.removeEventListener('scroll', this.onViewportChange, true);
    window.removeEventListener('resize', this.onViewportChange);
  }
}

import { NgTemplateOutlet } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export type FlButtonVariant = 'outline' | 'solid' | 'ghost';
export type FlButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'fl-button',
  standalone: true,
  imports: [RouterModule, NgTemplateOutlet],
  templateUrl: './fl-button.component.html',
  styleUrl: './fl-button.component.css',
})
export class FlButtonComponent {
  @Input() variant: FlButtonVariant = 'outline';
  @Input() size: FlButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() block = false;
  @Input() routerLink: string | readonly string[] | any[] | null = null;
  /**
   * 传了 href 就把按钮渲染成真正的 <a>：用于跳转站点路由之外的地址
   * （静态文件、外部链接）。routerLink 只认 Angular 路由，做不到这件事。
   */
  @Input() href: string | null = null;
  @Input() target: '_blank' | '_self' | null = null;
  @Input() rel: string | null = null;
  /** 可读名称：图标按钮，或图文明暗分工不同（如小屏只留图标）时必填 */
  @Input() ariaLabel: string | null = null;

  /** 新窗口打开时默认补上 noopener noreferrer，调用方不用再记 */
  get resolvedRel(): string | null {
    if (this.rel) {
      return this.rel;
    }
    return this.target === '_blank' ? 'noopener noreferrer' : null;
  }

  @HostBinding('class.fl-button-host-block')
  get isHostBlock(): boolean {
    return this.block;
  }
}

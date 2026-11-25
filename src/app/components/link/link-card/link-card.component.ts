import { Component, inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { md5 } from '../../../shared/utils/md5.util';
import { getQqNumber, buildQqAvatarUrl } from '../../../shared/utils/qq-avatar.util';

type AvatarState = 'logo' | 'gravatar' | 'qq' | 'fallback';

interface EvalPart {
  text: string;
  href?: string;
}

interface LinkData {
  id?: number;
  name?: string;
  logo?: string;
  url?: string;
  description?: string;
  evaluation?: string;
  /** 评价里有需要加链接的片段时用这个（可混排纯文本与链接） */
  evaluationParts?: EvalPart[];
  email?: string;
  preferGravatar?: boolean;
  /** 聚合平台这类非方图 Logo 用 contain，避免被 44px 的方格裁掉 */
  logoFit?: 'cover' | 'contain';
  /** 图形本体偏小的 Logo（带大片白底）放大一点，超出部分由外层裁掉 */
  logoScale?: number;
  /** 站点内部路由（如 /link/apply）：拦截点击交给路由器，不新开标签页 */
  internal?: boolean;
  /** 申请入口这类还没有 Logo 的条目：画一个虚线占位框 */
  logoPlaceholder?: boolean;
}

@Component({
  selector: 'flower-link-card',
  standalone: true,
  templateUrl: './link-card.component.html',
  styleUrl: './link-card.component.css',
})
export class LinkCardComponent implements OnInit {
  @Input() link!: LinkData;

  private readonly router = inject(Router);

  avatarState: AvatarState = 'logo';
  logoFailed = false;
  gravatarFailed = false;
  qqFailed = false;
  avatarLoaded = false;

  ngOnInit(): void {
    this.resolveInitialState();
  }

  get avatarSrc(): string | null {
    if (this.avatarState === 'logo' && this.link.logo) {
      return this.link.logo;
    }
    if (this.avatarState === 'gravatar' && this.link.email) {
      const hash = md5(this.link.email.trim().toLowerCase());
      return `https://dn-qiniu-avatar.qbox.me/avatar/${hash}?d=404&s=80`;
    }
    if (this.avatarState === 'qq' && this.link.email) {
      const qq = getQqNumber(this.link.email);
      if (qq) {
        return buildQqAvatarUrl(qq);
      }
    }
    return null;
  }

  get showFallback(): boolean {
    return this.avatarState === 'fallback';
  }

  get initial(): string {
    return this.link.name?.charAt(0) || '?';
  }

  get logoContain(): boolean {
    return this.link.logoFit === 'contain';
  }

  get logoScaleStyle(): string | null {
    return this.link.logoScale ? `scale(${this.link.logoScale})` : null;
  }

  get isInternal(): boolean {
    return this.link.internal === true;
  }

  /**
   * 站内入口（申请友链）交给路由，其余交给浏览器。
   *
   * 这里不能用 routerLink 指令：它会在宿主上绑定 href，站外条目该绑定为 null，
   * 会把我们写的 href 一起抹掉，整张卡片就点不动了。
   */
  onMainClick(event: MouseEvent): void {
    this.goInternal(event);
  }

  /** 点卡片边缘（行内边距）也算点卡片，不然这张浅色卡看起来能点、实际点空 */
  onRowClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button')) return;
    this.goInternal(event);
  }

  private goInternal(event: MouseEvent): void {
    if (!this.isInternal || !this.link.url) return;
    // 中键 / 带修饰键的点击保留浏览器默认行为（新标签页打开）
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    void this.router.navigateByUrl(this.link.url);
  }

  onAvatarError(): void {
    if (this.avatarState === 'logo') {
      this.logoFailed = true;
      // Try gravatar if email exists and gravatar hasn't already failed
      if (!this.gravatarFailed && this.link.email) {
        this.avatarState = 'gravatar';
        return;
      }
      // Try qq if email is a qq number and qq hasn't already failed
      if (!this.qqFailed && this.link.email && getQqNumber(this.link.email)) {
        this.avatarState = 'qq';
        return;
      }
      this.avatarState = 'fallback';
      return;
    }

    if (this.avatarState === 'gravatar') {
      this.gravatarFailed = true;
      // Try logo if it exists and hasn't already failed
      if (!this.logoFailed && this.link.logo) {
        this.avatarState = 'logo';
        return;
      }
      // Try qq if email is a qq number and qq hasn't already failed
      if (!this.qqFailed && this.link.email && getQqNumber(this.link.email)) {
        this.avatarState = 'qq';
        return;
      }
      this.avatarState = 'fallback';
      return;
    }

    if (this.avatarState === 'qq') {
      this.qqFailed = true;
      // Try logo if it exists and hasn't already failed
      if (!this.logoFailed && this.link.logo) {
        this.avatarState = 'logo';
        return;
      }
      this.avatarState = 'fallback';
      return;
    }

    // Safety net
    this.avatarState = 'fallback';
  }

  private resolveInitialState(): void {
    const hasLogo = !!this.link.logo;
    const hasEmail = !!this.link.email;
    const preferGravatar = !!this.link.preferGravatar;

    if (preferGravatar && hasEmail) {
      this.avatarState = 'gravatar';
    } else if (hasLogo) {
      this.avatarState = 'logo';
    } else if (hasEmail) {
      // QQ 号邮箱（纯数字前缀）优先于普通 Gravatar
      if (getQqNumber(this.link.email)) {
        this.avatarState = 'qq';
      } else {
        this.avatarState = 'gravatar';
      }
    } else {
      this.avatarState = 'fallback';
    }
  }
}

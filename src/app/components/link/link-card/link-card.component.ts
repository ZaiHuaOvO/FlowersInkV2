import { Component, Input, OnInit } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { md5 } from '../../../shared/utils/md5.util';
import { getQqNumber, buildQqAvatarUrl } from '../../../shared/utils/qq-avatar.util';

type AvatarState = 'logo' | 'gravatar' | 'qq' | 'fallback';

interface LinkData {
  id?: number;
  name?: string;
  logo?: string;
  url?: string;
  description?: string;
  email?: string;
  preferGravatar?: boolean;
}

@Component({
  selector: 'flower-link-card',
  standalone: true,
  imports: [
    NzFlexModule,
    NzDividerModule,
    NzTypographyModule,
    NzImageModule,
    FlCardDirective,
  ],
  templateUrl: './link-card.component.html',
  styleUrl: './link-card.component.css',
})
export class LinkCardComponent implements OnInit {
  @Input() link!: LinkData;

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
      return `https://www.gravatar.com/avatar/${hash}?d=404&s=80`;
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

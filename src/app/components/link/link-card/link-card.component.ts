import { Component, Input, OnInit } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { md5 } from '../../../shared/utils/md5.util';

type AvatarState = 'logo' | 'gravatar' | 'fallback';

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
      this.avatarState = 'gravatar';
    } else {
      this.avatarState = 'fallback';
    }
  }
}

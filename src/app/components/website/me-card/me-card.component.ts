import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { RssComponent } from '../svg/rss/rss.component';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';

export interface MeCardProfile {
  subtitle: string | null;
  latestUpdate: string | null;
  latestUpdateId: number | null;
  latestPlaying: string | null;
  latestLife: string | null;
}

export interface MeCardInfo {
  blogTotal: number;
  lifeTotal: number;
  runDays: number;
  profile?: MeCardProfile;
}

@Component({
  selector: 'flower-me-card',
  templateUrl: './me-card.component.html',
  styleUrls: ['./me-card.component.css'],
  standalone: true,
  imports: [
    RouterModule,
    NzFlexModule,
    NzAvatarModule,
    NzTypographyModule,
    NzDividerModule,
    NzIconModule,
    NzTooltipModule,
    NzImageModule,
    NzTagModule,
    FlTagDirective,
    RssComponent,
    FlButtonComponent,
  ],
})
export class MeCardComponent {
  @Input() info: MeCardInfo = {
    blogTotal: 0,
    lifeTotal: 0,
    runDays: 0,
    profile: undefined,
  };
  @Input() numLoading = true;

  readonly qq = '446840401';
  readonly wechat = 'zaihua_huahua';
  readonly email = 'ZyZy1724@gmail.com';
  private readonly qqQrCode = 'assets/img/QRCode/qq.png';
  private readonly wechatQrCode = 'assets/img/QRCode/wx.png';

  constructor(
    private readonly imageService: NzImageService,
    private readonly msg: NzMessageService,
  ) {}

  previewContactQr(type: 'qq' | 'wechat'): void {
    const src = type === 'qq' ? this.qqQrCode : this.wechatQrCode;
    this.imageService.preview([{ src }], {
      nzZoom: 0.8,
      nzRotate: 0,
    });
  }

  copyEmail(event?: MouseEvent): void {
    event?.preventDefault();

    navigator.clipboard
      .writeText(this.email)
      .then(() => {
        this.msg.success('已复制邮箱地址，欢迎邮件联系。');
      })
      .catch(() => {
        this.msg.error('复制失败，请稍后重试。');
      });
  }
}

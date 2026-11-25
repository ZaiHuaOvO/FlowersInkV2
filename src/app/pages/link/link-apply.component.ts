import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { QuickUp } from '../../common_ui/animations/animation';
import { FlButtonComponent } from '../../common_ui/fl_ui/fl-button/fl-button.component';
import { FlCardDirective } from '../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlInputDirective } from '../../common_ui/fl_ui/fl-input/fl-input.directive';
import { SimpleCaptchaComponent } from '../../components/website/simple-captcha/simple-captcha.component';
import { extractHttpErrorMessage } from '../../shared/utils/http-error-message.util';
import { ApiLimiterService } from '../../services/api-limiter.service';
import { LinkService } from './link.service';

@Component({
  selector: 'flower-link-apply',
  standalone: true,
  imports: [
    FormsModule,
    NzFlexModule,
    NzTypographyModule,
    NzGridModule,
    NzInputModule,
    NzTooltipModule,
    NzPopconfirmModule,
    NzModalModule,
    FlButtonComponent,
    FlInputDirective,
    FlCardDirective,
    SimpleCaptchaComponent,
  ],
  templateUrl: './link-apply.component.html',
  styleUrls: ['./link-shared.css', './link-apply.component.css'],
  animations: [QuickUp],
})
export class LinkApplyComponent {
  private readonly modal = inject(NzModalService);

  submitting = false;
  logoPreviewUrl = '';

  form: {
    description: string;
    email: string;
    logo: string;
    name: string;
    rss: string;
    remark: string;
    url: string;
  } = {
    name: '',
    logo: '',
    url: '',
    description: '',
    email: '',
    rss: '',
    remark: '',
  };

  @ViewChild(SimpleCaptchaComponent)
  captchaComponent?: SimpleCaptchaComponent;

  constructor(
    private readonly link: LinkService,
    private readonly msg: NzMessageService,
    private readonly limiter: ApiLimiterService,
  ) {}

  onLogoChange(): void {
    const url = this.form.logo.trim();
    if (!url) {
      this.logoPreviewUrl = '';
      return;
    }
    try {
      new URL(url);
      this.logoPreviewUrl = url;
    } catch {
      this.logoPreviewUrl = '';
    }
  }

  submit(): void {
    if (this.isFormIncomplete()) {
      this.msg.info('还有必填项没写完哦，补齐再来申请吧 (｡ì _ í｡)');
      return;
    }

    if (!this.captchaComponent?.isReady) {
      this.msg.info('验证码还在赶来的路上，再等等呀 (´ . .̫ . `)');
      return;
    }

    const captchaPayload = this.captchaComponent.buildPayload();
    if (!captchaPayload) {
      this.msg.info('验证码结果还没填呢，先算一下吧 (｀・ω・´)');
      return;
    }

    const cooldownMessage = this.limiter.canCallApi('site-link');
    if (cooldownMessage) {
      this.msg.info(`刚提交过一次啦，${cooldownMessage} 秒后再试试吧 (＞＜)`);
      return;
    }

    this.submitting = true;
    const normalizedEmail = this.form.email.trim();
    this.link
      .addLink({
        ...this.form,
        email: normalizedEmail || undefined,
        ...captchaPayload,
      })
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.form = {
              name: '',
              logo: '',
              url: '',
              description: '',
              email: '',
              rss: '',
              remark: '',
            };
            this.logoPreviewUrl = '';
            this.limiter.markApiCall('site-link');
            this.captchaComponent?.refresh();
            this.showSuccessModal();
          }
          this.submitting = false;
        },
        error: (error) => {
          this.captchaComponent?.refresh();
          this.msg.error(
            extractHttpErrorMessage(
              error,
              '友链申请失败啦，稍后再试试吧 (╥﹏╥)',
            ),
          );
          this.submitting = false;
        },
      });
  }

  showSuccessModal(): void {
    this.modal.success({
      nzTitle: '申请已提交',
      nzContent: `
        <p>感谢你对「花墨」的认可</p>
        <p>好耶ฅ•ω•ฅ，已将你的申请发送至再花的邮箱</p>
        <p>再花会在 <strong>1-5 个工作日</strong> 内通过你的联系邮箱通知结果（若填写）</p>
        <p>有任何问题可通过底部的联系方式联系再花</p>
      `,
      nzCancelText: null,
      nzOkText: '我再看看',
      nzOkType: 'primary',
      nzCentered: true,
      nzClosable: true,
      nzMaskClosable: true,
    });
  }

  isFormIncomplete(): boolean {
    const optionalKeys = new Set(['logo', 'rss', 'remark']);
    return Object.keys(this.form).some(
      (key) =>
        !optionalKeys.has(key) &&
        !this.form[key as keyof typeof this.form]?.trim(),
    );
  }
}

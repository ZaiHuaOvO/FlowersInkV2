import { CommonModule } from '@angular/common';
import { Component, DestroyRef, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { SlowUp, QuickUp } from '../../common_ui/animations/animation';
import { FlAlertDirective } from '../../common_ui/fl_ui/fl-alert/fl-alert.directive';
import { FlButtonComponent } from '../../common_ui/fl_ui/fl-button/fl-button.component';
import { FlCardDirective } from '../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlInputDirective } from '../../common_ui/fl_ui/fl-input/fl-input.directive';
import { LinkCardComponent } from '../../components/link/link-card/link-card.component';
import { SimpleCaptchaComponent } from '../../components/website/simple-captcha/simple-captcha.component';
import { extractHttpErrorMessage } from '../../shared/utils/http-error-message.util';
import { ApiLimiterService } from '../../services/api-limiter.service';
import { WindowService } from '../../services/window.service';
import { LinkService } from './link.service';

@Component({
  selector: 'flower-link',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFlexModule,
    NzTypographyModule,
    NzIconModule,
    NzCommentModule,
    NzListModule,
    NzAvatarModule,
    NzDividerModule,
    NzSpinModule,
    NzInputModule,
    NzAlertModule,
    LinkCardComponent,
    NzGridModule,
    FlButtonComponent,
    FlInputDirective,
    FlCardDirective,
    FlAlertDirective,
    SimpleCaptchaComponent,
  ],
  templateUrl: './link.component.html',
  styleUrl: './link.component.css',
  animations: [SlowUp, QuickUp],
})
export class LinkComponent {
  loading = true;
  submitting = false;
  isMobile = false;
  showToolbar = false;
  email = 'ZyZy1724@gmail.com';
  links = [
    {
      name: 'FlowersInk',
      logo: 'https://api.flowersink.com/img/logo.png',
      url: 'https://flowersink.com',
      description: 'A personal blog by Zaihua',
    },
  ];

  form: {
    description: string;
    email: string;
    logo: string;
    name: string;
    url: string;
  } = {
    name: '',
    logo: '',
    url: '',
    description: '',
    email: '',
  };

  @ViewChild('linkMsg', { static: true })
  linkMsg!: TemplateRef<any>;

  @ViewChild(SimpleCaptchaComponent)
  captchaComponent?: SimpleCaptchaComponent;

  constructor(
    private readonly window: WindowService,
    private readonly destroyRef: DestroyRef,
    private readonly link: LinkService,
    private readonly msg: NzMessageService,
    private readonly limiter: ApiLimiterService,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });

    this.link
      .getLinks({
        isApproved: true,
      })
      .subscribe((res: any) => {
        this.links = res['data'].data;
        this.loading = false;
      });
  }

  submit(): void {
    if (this.isFormIncomplete()) {
      this.msg.info('Please complete the required fields');
      return;
    }

    if (!this.captchaComponent?.isReady) {
      this.msg.info('Captcha is still loading');
      return;
    }

    const captchaPayload = this.captchaComponent.buildPayload();
    if (!captchaPayload) {
      this.msg.info('Please answer the captcha');
      return;
    }

    const cooldownMessage = this.limiter.canCallApi('site-link');
    if (cooldownMessage) {
      this.msg.info(`Please wait ${cooldownMessage} seconds before trying again`);
      return;
    }

    this.submitting = true;
    this.link
      .addLink({
        ...this.form,
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
            };
            this.captchaComponent?.refresh();
            this.msg.success(this.linkMsg, { nzDuration: 10000 });
          }
          this.submitting = false;
        },
        error: (error) => {
          this.captchaComponent?.refresh();
          this.msg.error(extractHttpErrorMessage(error, 'Link request failed'));
          this.submitting = false;
        },
      });
  }

  isFormIncomplete(): boolean {
    return Object.keys(this.form).some(
      (key) =>
        key !== 'email' &&
        !this.form[key as keyof typeof this.form]?.trim(),
    );
  }
}

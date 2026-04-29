import { CommonModule } from '@angular/common';
import { Component, DestroyRef, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';
import { FlInputDirective } from '../../../common_ui/fl_ui/fl-input/fl-input.directive';
import { AboutService } from '../../../pages/about/about.service';
import { extractHttpErrorMessage } from '../../../shared/utils/http-error-message.util';
import { ApiLimiterService } from '../../../services/api-limiter.service';
import { GeneralService } from '../../../services/general.service';
import { WindowService } from '../../../services/window.service';
import { EmojiComponent } from '../../website/emoji/emoji.component';
import { SimpleCaptchaComponent } from '../../website/simple-captcha/simple-captcha.component';

@Component({
  selector: 'flower-edit-message',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFlexModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzTypographyModule,
    NzSpinModule,
    NzModalModule,
    NzIconModule,
    NzPopoverModule,
    NzPaginationModule,
    EmojiComponent,
    NzSelectModule,
    FlButtonComponent,
    FlInputDirective,
    SimpleCaptchaComponent,
  ],
  templateUrl: './edit-message.component.html',
  styleUrl: './edit-message.component.css',
})
export class EditMessageComponent {
  form = {
    name: null as string | null,
    avatar: '',
    url: '',
    content: '',
  };
  loading = false;
  email = 'ZyZy1724@gmail.com';
  showToolbar = false;
  commentText = '';
  isMobile = false;

  @ViewChild('contanctMsg', { static: true })
  contanctMsg!: TemplateRef<any>;

  @ViewChild('contanctContent', { static: true })
  contanctContent!: TemplateRef<any>;

  @ViewChild(SimpleCaptchaComponent)
  captchaComponent?: SimpleCaptchaComponent;

  constructor(
    private readonly about: AboutService,
    private readonly msg: NzMessageService,
    private readonly modal: NzModalService,
    private readonly general: GeneralService,
    private readonly limiter: ApiLimiterService,
    private readonly window: WindowService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  submit(): void {
    this.loading = true;

    if (!this.general.isNotEmpty(this.form.name)) {
      this.msg.info('先留下名字吧，不然我会认不出你哦 (｡･ω･｡)');
      this.loading = false;
      return;
    }

    if (!this.general.isNotEmpty(this.form.content)) {
      this.msg.info('留言内容还空着呢，写点什么吧 (๑•̀ㅂ•́)و✧');
      this.loading = false;
      return;
    }

    if (!this.captchaComponent?.isReady) {
      this.msg.info('验证码还在赶来的路上，再等等呀 (´ . .̫ . `)');
      this.loading = false;
      return;
    }

    const captchaPayload = this.captchaComponent.buildPayload();
    if (!captchaPayload) {
      this.msg.info('验证码结果还没填哦，悄悄算一下吧 (｀・ω・´)');
      this.loading = false;
      return;
    }

    const cooldownMessage = this.limiter.canCallApi('site-message');
    if (cooldownMessage) {
      this.msg.info(`刚发过一次啦，${cooldownMessage} 秒后再来试试吧 (＞＜)`);
      this.loading = false;
      return;
    }

    this.about
      .addMessage({
        ...this.form,
        ...captchaPayload,
      })
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.form = {
              name: null,
              avatar: '',
              url: '',
              content: '',
            };
            this.limiter.markApiCall('site-message');
            this.captchaComponent?.refresh();
            this.msg.success(this.contanctMsg, {
              nzDuration: 5000,
            });
          }
          this.loading = false;
        },
        error: (error) => {
          this.captchaComponent?.refresh();
          this.msg.error(
            extractHttpErrorMessage(
              error,
              '留言提交失败啦，稍后再试试吧 (╥﹏╥)',
            ),
          );
          this.loading = false;
        },
      });
  }

  msgModal(): void {
    this.modal.create({
      nzTitle: '再花的联系方式',
      nzContent: this.contanctContent,
      nzFooter: null,
      nzMaskClosable: true,
      nzClosable: false,
    });
  }

  triggerEmoji(emoji: string): void {
    this.commentText += emoji;
  }

  onEmojiSelected(emoji: string): void {
    this.form.content += emoji;
  }
}

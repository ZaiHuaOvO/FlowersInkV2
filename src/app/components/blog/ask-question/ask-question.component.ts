import {
  Component,
  Inject,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FlInputDirective } from '../../../common_ui/fl_ui/fl-input/fl-input.directive';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';
import { SimpleCaptchaComponent } from '../../website/simple-captcha/simple-captcha.component';
import { QuestionService } from '../../../services/question.service';

@Component({
  selector: 'flower-ask-question',
  standalone: true,
  imports: [
    FormsModule,
    NzInputModule,
    NzModalModule,
    FlInputDirective,
    FlButtonComponent,
    SimpleCaptchaComponent,
  ],
  templateUrl: './ask-question.component.html',
  styleUrl: './ask-question.component.css',
})
export class AskQuestionComponent {
  private readonly storageKey = 'fi_question_asked';
  askContent = '';
  todayLimit = false;
  submitting = false;

  @ViewChild('captcha') captchaRef?: SimpleCaptchaComponent;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly modal: NzModalRef,
    private readonly msg: NzMessageService,
    private readonly questionService: QuestionService,
  ) {
    this.todayLimit = this.hasAskedToday();
  }

  private hasAskedToday(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    try {
      return localStorage.getItem(this.storageKey) === this.todayKey();
    } catch {
      return false;
    }
  }

  private markAskedToday(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, this.todayKey());
    } catch {
      // ignore
    }
  }

  private todayKey(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  submit(): void {
    const content = (this.askContent ?? '').trim();
    if (!content) {
      this.msg.info('先写下你的问题再提问吧～');
      return;
    }

    const captcha = this.captchaRef;
    if (!captcha || !captcha.isReady) {
      this.msg.info('请先完成验证码呀 (｡•ᴗ•｡)');
      return;
    }
    const payload = captcha.buildPayload();
    if (!payload) {
      this.msg.info('请先完成验证码呀 (｡•ᴗ•｡)');
      return;
    }

    this.submitting = true;
    this.questionService
      .postQuestion({
        content,
        captchaId: payload.captchaId,
        captchaAnswer: payload.captchaAnswer,
      })
      .subscribe({
        next: (res: any) => {
          this.submitting = false;
          const data = res?.data;
          if (data && data.success === false) {
            this.todayLimit = true;
            captcha.refresh();
            this.msg.info(data.msg || '今天已经提过问啦，明天再来吧');
            return;
          }
          this.markAskedToday();
          captcha.refresh();
          this.msg.success(data?.msg || '收到你的匿名提问啦～合适的会被收录到 Q&A 中 (๑•̀ㅂ•́)و✧');
          this.modal.close();
        },
        error: () => {
          this.submitting = false;
          captcha.refresh();
          this.msg.error('提交失败，稍后再试试吧 (╥﹏╥)');
        },
      });
  }

  cancel(): void {
    this.modal.close();
  }
}

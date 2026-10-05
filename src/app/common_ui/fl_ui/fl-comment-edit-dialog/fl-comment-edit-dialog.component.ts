import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { SimpleCaptchaComponent } from '../../../components/website/simple-captcha/simple-captcha.component';
import { findForeignImageUrl } from '../../../shared/comment/content-image-policy.util';
import type { CommentItem, CommentSource } from '../../../shared/comment/comment.model';
import { extractHttpErrorMessage } from '../../../shared/utils/http-error-message.util';
import { FlButtonComponent } from '../fl-button/fl-button.component';
import { FlInputDirective } from '../fl-input/fl-input.directive';

export interface CommentEditDialogData {
  comment: CommentItem;
  source: CommentSource;
}

export interface CommentEditResult {
  content: string;
  name: string;
  email: string;
  website: string;
  avatarUrl: string;
}

/**
 * 评论编辑弹窗（由 fl-comment-board 通过 NzModalService 打开）。
 *
 * 独立组件的原因：modal 内容渲染在 CDK overlay 里，宿主组件用 @ViewChild 拿不到
 * 里面的验证码实例，所以验证码交给本组件自己管（同 ask-question 的做法）。
 */
@Component({
  selector: 'fl-comment-edit-dialog',
  standalone: true,
  imports: [
    FormsModule,
    NzFlexModule,
    NzInputModule,
    FlInputDirective,
    FlButtonComponent,
    SimpleCaptchaComponent,
  ],
  templateUrl: './fl-comment-edit-dialog.component.html',
})
export class FlCommentEditDialogComponent {
  private readonly data: CommentEditDialogData = inject(NZ_MODAL_DATA);

  content = '';
  name = '';
  email = '';
  website = '';
  avatarUrl = '';
  submitting = false;

  @ViewChild('captcha') captchaRef?: SimpleCaptchaComponent;

  constructor(
    private readonly modal: NzModalRef,
    private readonly msg: NzMessageService,
  ) {
    this.content = this.data.comment.content || '';
    this.name = this.data.comment.name || '';
    this.email = this.data.comment.email || '';
    this.website = this.data.comment.website || '';
    this.avatarUrl = this.data.comment.avatarUrl || '';
  }

  get captchaScene() {
    return this.data.source.captchaScene;
  }

  submit(): void {
    if (!(this.name ?? '').trim()) {
      this.msg.info('先留下名字吧 (｡･ω･｡)');
      return;
    }
    if (!(this.content ?? '').trim()) {
      this.msg.info('评论内容还空着呢 (๑•̀ㅂ•́)و✧');
      return;
    }
    if (findForeignImageUrl(this.content)) {
      this.msg.info('评论里的图片只能来自本站哦 (´-ω-`)');
      return;
    }
    const captcha = this.captchaRef;
    if (!captcha || !captcha.isReady) {
      this.msg.info('验证码还在赶来的路上，再等等呀 (´ . .̫ . `)');
      return;
    }
    const payload = captcha.buildPayload();
    if (!payload) {
      this.msg.info('验证码结果还没填哦，悄悄算一下吧 (｀・ω・´)');
      return;
    }

    this.submitting = true;
    this.data.source
      .edit(this.data.comment.id, {
        content: this.content,
        name: this.name || undefined,
        email: this.email || undefined,
        website: this.website || undefined,
        avatarUrl: this.avatarUrl || undefined,
        ...payload,
      })
      .subscribe({
        next: () => {
          this.msg.success('评论已更新 ✨');
          this.modal.close({
            content: this.content,
            name: this.name || '匿名',
            email: this.email || '',
            website: this.website || '',
            avatarUrl: this.avatarUrl || '',
          } satisfies CommentEditResult);
        },
        error: (error) => {
          this.submitting = false;
          captcha.refresh();
          this.msg.error(
            extractHttpErrorMessage(error, '编辑失败啦，稍后再试试吧 (╥﹏╥)'),
          );
        },
      });
  }

  cancel(): void {
    this.modal.close();
  }
}

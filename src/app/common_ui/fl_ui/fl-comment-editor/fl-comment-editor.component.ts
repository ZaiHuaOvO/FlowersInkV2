import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FlInputDirective } from '../fl-input/fl-input.directive';
import { FlCommentCardComponent } from '../fl-comment-card/fl-comment-card.component';
import { FlEmojiPickerComponent } from '../fl-emoji-picker/fl-emoji-picker.component';
import type { CommentIdentity, CommentItem } from '../../../shared/comment/comment.model';

/**
 * 评论输入框：评论 / 预览 双 tab。
 *
 * 只有「写」和「看」两件事；验证码与提交按钮由使用方通过
 * `<ng-content select="[fcEditorActions]">` 投影到右下角，
 * 因为不同场景（主评论 / 内联回复 / ERP 回复弹窗）的按钮组合并不一样。
 *
 * 预览复用 fl-comment-card，所以「预览长什么样」= 「列表里长什么样」。
 */
@Component({
  selector: 'fl-comment-editor',
  standalone: true,
  imports: [
    FormsModule,
    NzFlexModule,
    NzInputModule,
    FlInputDirective,
    FlCommentCardComponent,
    FlEmojiPickerComponent,
  ],
  templateUrl: './fl-comment-editor.component.html',
  styleUrl: './fl-comment-editor.component.css',
})
export class FlCommentEditorComponent {
  @Input() content = '';
  @Output() contentChange = new EventEmitter<string>();

  /** 预览时套用的身份信息（名字/邮箱/网址/头像） */
  @Input() identity: CommentIdentity | null = null;

  /**
   * 预览时以什么身份出现。
   * 'admin' 用于 ERP 回复（以「再花」身份发布，带猫猫头徽章），主站访客留默认值即可。
   */
  @Input() previewRole: 'visitor' | 'admin' = 'visitor';

  @Input() maxlength = 500;
  @Input() placeholder = '写下你的想法吧 (๑•̀ㅂ•́)و✧ - 支持 Markdown 格式哦！';
  @Input() rows = 4;
  @Input() disabled = false;
  @Input() showCounter = true;
  /** 表情面板弹出方向。用 *Left 变体让弹窗左边缘与表情按钮对齐、箭头靠左 */
  @Input() pickerPlacement: 'top' | 'bottom' | 'topLeft' | 'bottomLeft' = 'topLeft';

  tab: 'write' | 'preview' = 'write';

  @ViewChild('textarea') private textareaRef?: ElementRef<HTMLTextAreaElement>;

  /** 预览用的伪评论：把当前填的身份信息拼成一条「刚发布的评论」 */
  get previewComment(): CommentItem {
    const id = this.identity;
    const asAdmin = this.previewRole === 'admin';
    return {
      id: 0,
      parentId: null,
      name: asAdmin ? '再花' : id?.name ?? '',
      email: id?.email ?? '',
      website: id?.website ?? '',
      avatarUrl: id?.avatarUrl ?? '',
      content: this.content,
      isApproved: true,
      isAdminReply: asAdmin,
      createDate: new Date().toISOString(),
    };
  }

  update(value: string): void {
    this.content = value;
    this.contentChange.emit(value);
  }

  /**
   * 在光标处插入文本（表情 token / 颜文字）。
   *
   * 旧实现是无脑 `content += emoji`，光标在中间时表情会跑到末尾；
   * 这里按 selectionStart/End 插入并把光标移到插入内容之后。
   */
  insert(text: string): void {
    const el = this.textareaRef?.nativeElement;
    if (!el) {
      this.update(this.content + text);
      return;
    }

    const start = el.selectionStart ?? this.content.length;
    const end = el.selectionEnd ?? start;
    const next = this.content.slice(0, start) + text + this.content.slice(end);

    // 先切回「评论」tab，否则刚插入的表情在预览里才看得到，用户会以为没生效
    this.tab = 'write';
    this.update(next);

    // 必须等变更检测把新值写回 textarea 之后再摆光标：
    // 程序化改写 value 会让浏览器把光标甩到末尾，microtask 阶段恢复会被随后的
    // 绑定写入覆盖掉，所以用宏任务（此时微任务队列连同变更检测都已跑完）。
    setTimeout(() => {
      if (!el.isConnected) {
        return;
      }
      el.focus();
      const caret = start + text.length;
      el.setSelectionRange(caret, caret);
    }, 0);
  }
}

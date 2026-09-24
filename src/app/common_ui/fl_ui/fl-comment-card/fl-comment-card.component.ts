import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import {
  avatarInitial,
  avatarUrl,
  degradeAvatar,
  displayName,
  displayWebsite,
  isPending,
  isZaiHua,
  relativeTime,
} from '../../../shared/comment/comment-display.util';
import type { CommentItem } from '../../../shared/comment/comment.model';
import { FlCommentContentComponent } from '../fl-comment-content/fl-comment-content.component';

/**
 * 单条评论卡片。
 *
 * 刻意**不递归**：子回复由 fl-comment-board 自己循环渲染，卡片只负责一张脸。
 * 这样预览可以直接复用同一个卡片组件，不用为了「只显示这一条」再造一套样式。
 *
 * 内联回复框由父组件通过 `<ng-content select="[flCardExtras]">` 投影进来。
 */
@Component({
  selector: 'fl-comment-card',
  standalone: true,
  imports: [NzFlexModule, NzIconModule, NzTooltipModule, DatePipe, FlCommentContentComponent],
  templateUrl: './fl-comment-card.component.html',
  styleUrl: './fl-comment-card.component.css',
})
export class FlCommentCardComponent {
  @Input({ required: true }) comment!: CommentItem;

  /** 预览态：隐藏待审核徽章与回复入口（预览是「将来会长什么样」，不是真实状态） */
  @Input() preview = false;

  /** 是否给「回复」入口（只有站长的评论可被回复） */
  @Input() showReplyButton = false;

  /** 回复框是否已展开，决定按钮显示「回复」还是「取消回复」 */
  @Input() replyActive = false;

  @Input() avatarSize = 40;

  @Output() replyToggle = new EventEmitter<void>();

  // 模板里直接调用的纯函数，转成字段避免每次变更检测重新解析
  protected readonly displayName = displayName;
  protected readonly displayWebsite = displayWebsite;
  protected readonly relativeTime = relativeTime;
  protected readonly avatarInitial = avatarInitial;
  protected readonly degradeAvatar = degradeAvatar;

  get zaihua(): boolean {
    return isZaiHua(this.comment);
  }

  get pending(): boolean {
    return !this.preview && isPending(this.comment);
  }

  /**
   * 站长在后台按邮箱配的身份标签，没命中就是空串。
   * 站长自己的回复已经有「猫猫头」，不再叠一个，避免两个徽章挤在一起。
   */
  get identityLabel(): string {
    return this.zaihua ? '' : (this.comment.identityLabel ?? '');
  }

  /** 标签底色由接口下发；这里是兜底，防止历史数据缺字段时变成透明底白字 */
  get identityColor(): string {
    return this.comment.identityColor || '#c06078';
  }

  /** 待审核评论不走 Gravatar，避免看起来像已通过 */
  get resolvedAvatarUrl(): string | null {
    return avatarUrl(this.comment, { pending: this.pending });
  }
}

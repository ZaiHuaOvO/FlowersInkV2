import { Component, inject } from '@angular/core';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { FlCommentContentComponent } from '../../../common_ui/fl_ui/fl-comment-content/fl-comment-content.component';

/**
 * 只显示到「年月日」：起止时间里的时分是排期用的，
 * 访客看到的「发布时间」说到底就是哪天发的，带上时分反而啰嗦。
 * 用本地时区格式化，避免引入额外的日期库。
 */
function formatPublishDate(value: string | Date | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * 公告详情弹窗：标题走弹窗标题栏，正文交给 fl-comment-content 渲染。
 *
 * 复用评论内容渲染器而不是直接写 `<markdown>`，是为了让公告里的表情 token
 * 与评论区显示完全一致，同时沿用同一套净化链路。
 */
@Component({
  selector: 'flower-announcement-detail',
  standalone: true,
  imports: [FlCommentContentComponent],
  templateUrl: './announcement-detail.component.html',
  styleUrl: './announcement-detail.component.css',
})
export class AnnouncementDetailComponent {
  private readonly announcement: any = inject(NZ_MODAL_DATA);

  get content(): string {
    return String(this.announcement?.content ?? '');
  }

  get publishDate(): string {
    return formatPublishDate(this.announcement?.startTime);
  }
}

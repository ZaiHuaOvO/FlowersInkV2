import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { toCommentMarkdown } from '../../../shared/utils/comment-markdown.util';

/**
 * 评论内容渲染器：Markdown + 表情 token。
 *
 * 列表、预览、ERP 回复弹窗都用它，保证「预览里长什么样 = 列表里长什么样」。
 *
 * 安全：走 ngx-markdown 的默认净化链路 —— MarkdownService 在没有自定义 SANITIZE
 * provider 时回落到 Angular DomSanitizer(SecurityContext.HTML)，会按白名单剥掉
 * script / 事件属性等。**不要**在这个组件上设 disableSanitizer。
 *
 * 样式不在这里：Markdown 元素是 innerHTML 注入的，拿不到组件作用域属性，
 * 所以主题样式走全局的 common_ui/css/markdown-comment.css（作用域 .fl-comment-content）。
 */
@Component({
  selector: 'fl-comment-content',
  standalone: true,
  imports: [MarkdownModule],
  templateUrl: './fl-comment-content.component.html',
  styleUrl: './fl-comment-content.component.css',
})
export class FlCommentContentComponent implements OnChanges {
  /** 原始评论内容，可能含 `[包名:名字]` 表情 token */
  @Input() content: string | null | undefined = '';

  /** 转换后交给 <markdown> 的源文本 */
  rendered = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content']) {
      this.rendered = toCommentMarkdown(this.content);
    }
  }
}

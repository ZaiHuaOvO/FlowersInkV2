import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { toCommentMarkdown } from '../../../shared/utils/comment-markdown.util';

/**
 * 评论内容渲染器：Markdown + 表情 token。
 *
 * 列表、预览、ERP 回复弹窗都用它，保证「预览里长什么样 = 列表里长什么样」。
 *
 * 表情的悬停提示是这里自己画的（和表情弹窗同一套样式与 0 延迟行为），
 * 所以渲染 token 时**不写 title** —— title 会触发浏览器那个又慢又丑的原生提示，
 * 两个提示会同时冒出来。表情名放在 alt 里，这里从 alt 取。
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

  /** 当前悬停的表情名；空串表示不显示提示 */
  tipName = '';
  /** 提示相对本组件容器的位置（表情上边中点） */
  tipLeft = 0;
  tipTop = 0;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content']) {
      this.rendered = toCommentMarkdown(this.content);
      // 内容换了，上一条提示的坐标已经失效
      this.tipName = '';
    }
  }

  /**
   * 悬停到表情上时显示名字。
   *
   * 用**事件委托**而不是给每张图挂监听：图片是 innerHTML 注入的，模板里绑不上，
   * 逐个 addEventListener 又得在每次内容变化后重挂。委托只在容器上听一次。
   */
  onHover(event: MouseEvent): void {
    const img = this.asEmojiImg(event.target);
    if (!img) {
      return;
    }
    const imgRect = img.getBoundingClientRect();
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    this.tipName = img.alt;
    this.tipLeft = imgRect.left - hostRect.left + imgRect.width / 2;
    this.tipTop = imgRect.top - hostRect.top;
  }

  /** 离开图片就收起。在两张图之间移动时 out 后紧接 over，同一帧内不会闪 */
  onLeave(event: MouseEvent): void {
    if (this.asEmojiImg(event.target)) {
      this.tipName = '';
    }
  }

  /** 事件目标是不是表情图（靠地址片段判定，不会误伤用户自己贴的图） */
  private asEmojiImg(target: EventTarget | null): HTMLImageElement | null {
    const el = target as HTMLElement | null;
    if (!el || el.tagName !== 'IMG') {
      return null;
    }
    const img = el as HTMLImageElement;
    return (img.getAttribute('src') ?? '').includes('#fl-emoji') ? img : null;
  }
}

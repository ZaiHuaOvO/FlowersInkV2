import { Component, Input } from '@angular/core';

/**
 * RSS 图标。两种形态：
 * - badge（默认）：圆角方块徽标，给社交入口那排「图标按钮」用，识别度高；
 * - bare：纯弧线 + 圆点，和文字同排（按钮、正文）时用，视觉重量才跟得上。
 * 两种形态都是品牌色 currentColor，颜色由使用处决定。
 */
@Component({
  selector: 'flower-rss',
  standalone: true,
  imports: [],
  templateUrl: './rss.component.html',
  styleUrl: './rss.component.css'
})
export class RssComponent {
  @Input() variant: 'badge' | 'bare' = 'badge';
}

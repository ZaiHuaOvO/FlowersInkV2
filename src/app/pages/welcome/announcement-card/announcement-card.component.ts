import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';

/**
 * 首页 hero 上方的临时公告入口。
 *
 * 只露出一行标题，详情走弹窗 —— 这里是首页，公告不能抢主体的注意力，
 * 所以比归档页的置顶卡片更小、更淡，也不做 hover 抬升。
 */
@Component({
  selector: 'flower-announcement-card',
  standalone: true,
  imports: [FlCardDirective],
  templateUrl: './announcement-card.component.html',
  styleUrl: './announcement-card.component.css',
})
export class AnnouncementCardComponent {
  @Input() title = '';
  @Output() open = new EventEmitter<void>();
}

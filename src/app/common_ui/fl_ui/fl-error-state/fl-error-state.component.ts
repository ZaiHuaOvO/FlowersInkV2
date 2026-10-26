import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * 加载失败提示。
 *
 * 站内所有页面在数据拉取失败时都用它，避免「失败」和「没有数据」长得一样。
 * 视觉沿用点滴页原本的 .state-card 写法（描边卡片 + 危险色标题 + 主色按钮）。
 */
@Component({
  selector: 'flower-error-state',
  standalone: true,
  templateUrl: './fl-error-state.component.html',
  styleUrl: './fl-error-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlErrorStateComponent {
  @Input() message = '内容没有加载出来';
  @Input() detail = '可能是网络不稳定，稍后再试一次。';
  @Output() readonly retry = new EventEmitter<void>();
}

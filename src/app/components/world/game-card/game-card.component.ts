import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlImgFadeDirective } from '../../../common_ui/fl_ui/fl-img-fade/fl-img-fade.directive';
import { FlTooltipDirective } from '../../../common_ui/fl_ui/fl-tooltip/fl-tooltip.directive';
import { resolveGameCover } from '../../../pages/world/game/game-display.util';
import type { GameRecord } from '../../../pages/world/game/game-view.model';
import { GameRecommendBadgeComponent } from '../game-recommend-badge/game-recommend-badge.component';

@Component({
  selector: 'flower-game-card',
  standalone: true,
  imports: [
    FlTooltipDirective,
    FlCardDirective,
    FlImgFadeDirective,
    GameRecommendBadgeComponent,
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css',
})
export class GameCardComponent {
  @Input() game!: GameRecord;
  @Input() ariaLabel = '';
  /** 由时间轴队列传入；undefined 时沿用游戏自带封面（设计页等场景） */
  @Input() coverSrc?: string;
  @Input() coverLoading = false;
  @Input() revealed = true;
  @Output() cardClick = new EventEmitter<MouseEvent>();

  get coverUrl(): string {
    if (this.coverSrc !== undefined) {
      return this.coverSrc;
    }
    return resolveGameCover(this.game);
  }

  get initial(): string {
    return String(this.game?.name ?? '').trim().slice(0, 1) || '游';
  }

  onCardClick(event: MouseEvent): void {
    event.preventDefault();
    if (!this.revealed) {
      return;
    }
    this.cardClick.emit(event);
  }
}

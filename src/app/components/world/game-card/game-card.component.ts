import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlImgFadeDirective } from '../../../common_ui/fl_ui/fl-img-fade/fl-img-fade.directive';
import type { GameImage, GameRecord } from '../../../pages/world/game/game-view.model';
import { GameRecommendBadgeComponent } from '../game-recommend-badge/game-recommend-badge.component';

@Component({
  selector: 'flower-game-card',
  standalone: true,
  imports: [FlCardDirective, FlImgFadeDirective, GameRecommendBadgeComponent],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css',
})
export class GameCardComponent {
  @Input() game!: GameRecord;
  @Input() ariaLabel = '';
  @Output() cardClick = new EventEmitter<MouseEvent>();

  get coverUrl(): string {
    const cover = this.game?.imgFirst?.[0];
    if (typeof cover === 'string') {
      return cover;
    }
    if (cover?.url) {
      return cover.url;
    }

    const fallback = this.game?.img?.[0];
    return this.imageUrl(fallback);
  }

  get initial(): string {
    return String(this.game?.name ?? '').trim().slice(0, 1) || '游';
  }

  onCardClick(event: MouseEvent): void {
    event.preventDefault();
    this.cardClick.emit(event);
  }

  private imageUrl(image: GameImage | string | undefined): string {
    if (typeof image === 'string') {
      return image;
    }
    return image?.url ?? '';
  }
}

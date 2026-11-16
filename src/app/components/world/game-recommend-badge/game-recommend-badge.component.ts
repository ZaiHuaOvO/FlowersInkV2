import { Component, Input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
  normalizeRecommend,
  type GameRecommend,
} from '../../../pages/world/game/game-display.util';

@Component({
  selector: 'flower-game-recommend-badge',
  standalone: true,
  imports: [NzIconModule],
  templateUrl: './game-recommend-badge.component.html',
  styleUrl: './game-recommend-badge.component.css',
})
export class GameRecommendBadgeComponent {
  @Input() recommend: GameRecommend | string | null | undefined = '';

  get state(): GameRecommend {
    return normalizeRecommend(this.recommend);
  }

  get label(): string {
    switch (this.state) {
      case 'recommended':
        return '推荐';
      case 'average':
        return '一般';
      case 'not_recommended':
        return '不推荐';
      default:
        return '';
    }
  }
}

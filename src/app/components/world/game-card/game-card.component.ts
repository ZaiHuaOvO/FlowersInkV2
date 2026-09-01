import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';

@Component({
  selector: 'flower-game-card',
  standalone: true,
  imports: [
    NzCardModule,
    NzTagModule,
    NzFlexModule,
    NzTypographyModule,
    DatePipe,
    FlTagDirective,
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  @Input() game: any;
  @Output() cardClick = new EventEmitter<MouseEvent>();

  onCardClick(event: MouseEvent): void {
    this.cardClick.emit(event);
  }

  /** webp 封面缺失时回退到原图（img_url），避免破图 */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fiFallbacked']) {
      return;
    }
    img.dataset['fiFallbacked'] = '1';
    const fallback = this.game?.imgFirst?.[0]?.img_url;
    if (fallback && img.src !== fallback) {
      img.src = fallback;
    }
  }

  get isRecommended(): boolean {
    return this.game?.recommend === 'recommended';
  }

  get isNotRecommended(): boolean {
    return this.game?.recommend === 'not_recommended';
  }

  get isAverage(): boolean {
    return this.game?.recommend === 'average';
  }

  get showTime(): boolean {
    return this.currentPlayStatus !== 'playing' && this.game?.time !== null && this.game?.time !== undefined;
  }

  get statusLabel(): string {
    if (this.currentPlayStatus === 'till_now') {
      return '至今';
    }
    if (this.currentPlayStatus === 'abandoned') {
      return '弃坑时间';
    }
    if (this.currentPlayStatus === 'completed') {
      return '通关时间';
    }
    return '正在努力游玩中';
  }

  get showStatusDate(): boolean {
    return this.currentPlayStatus === 'abandoned' || this.currentPlayStatus === 'completed';
  }

  get displayStatusDate(): string | null | undefined {
    return this.game?.statusDate ?? this.game?.finishDate;
  }

  get currentPlayStatus(): 'till_now' | 'abandoned' | 'completed' | 'playing' {
    return this.game?.playStatus ?? 'completed';
  }
}

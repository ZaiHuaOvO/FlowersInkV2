import { CommonModule } from '@angular/common';
import { Component, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { WindowService } from '../../../services/window.service';
import { WorldService } from '../world.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { GameCardComponent } from '../../../components/world/game-card/game-card.component';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { QuickUp } from '../../../common_ui/animations/animation';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';

type GameViewMode = 'detailed' | 'overview';
type PlayStatus = 'till_now' | 'abandoned' | 'completed' | 'playing';

@Component({
  selector: 'flower-game',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFlexModule,
    NzIconModule,
    NzTypographyModule,
    BlogTitleComponent,
    NzSpinModule,
    NzModalModule,
    NzAffixModule,
    NzImageModule,
    NzMenuModule,
    NzTagModule,
    NzDividerModule,
    RouterModule,
    GameCardComponent,
    NzGridModule,
    FlButtonComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  animations: [QuickUp],
})
export class GameComponent {
  data: any[] = [];
  loading = true;
  isMobile: boolean = false;
  totalGames = 0;
  totalPlayingTime = 0;
  viewMode: GameViewMode = 'overview';
  constructor(
    private world: WorldService,
    private modal: NzModalService,
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
    private image: NzImageService
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit(): void {
    this.getGame();
  }

  getGame(): void {
    this.world.getGameList().subscribe((res: any) => {
      this.data = this.sortGamesByFinishDate(res['data'].games ?? []);
      this.totalGames = res['data'].totalGames;
      this.totalPlayingTime = res['data'].totalPlayingTime;
      this.loading = false;
    });
  }

  setViewMode(mode: GameViewMode): void {
    this.viewMode = mode;
  }

  private sortGamesByFinishDate(games: any[]): any[] {
    return [...games].sort((a, b) => {
      const statusPriorityDiff = this.getStatusPriority(a?.playStatus) - this.getStatusPriority(b?.playStatus);
      if (statusPriorityDiff !== 0) {
        return statusPriorityDiff;
      }

      const dateDiff = this.getDateValue(b?.statusDate ?? b?.finishDate) - this.getDateValue(a?.statusDate ?? a?.finishDate);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return (b?.id ?? 0) - (a?.id ?? 0);
    });
  }

  private getDateValue(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private getStatusPriority(status: PlayStatus | undefined): number {
    if (status === 'playing') {
      return 0;
    }
    if (status === 'till_now') {
      return 1;
    }
    if (status === 'abandoned' || status === 'completed') {
      return 2;
    }
    return 3;
  }

}

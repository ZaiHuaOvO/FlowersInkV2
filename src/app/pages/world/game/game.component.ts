import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
    NzGridModule
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  data: any[] = [];
  loading = true;
  isMobile: boolean = false;
  totalGames = 0;
  totalPlayingTime = 0;
  constructor(
    private world: WorldService,
    private modal: NzModalService,
    private window: WindowService,
    private image: NzImageService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit(): void {
    this.getGame();
  }

  getGame(): void {
    this.world.getGameList().subscribe((res: any) => {
      this.data = res['data'].games;
      this.totalGames = res['data'].totalGames;
      this.totalPlayingTime = res['data'].totalPlayingTime;
      setTimeout(() => {
        this.loading = false;
      }, 500);
    });
  }

}

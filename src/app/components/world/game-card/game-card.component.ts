import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { GamePicComponent } from './game-pic/game-pic.component';

@Component({
  selector: 'flower-game-card',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzTagModule,
    NzFlexModule,
    NzTypographyModule,
    NzImageModule,
    DatePipe,
    GamePicComponent,
    NzDrawerModule
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  @Input() game: any;

  colorList: any = {
    'PS5': '#092F94',
    'Steam': '#171A21',
  }
  private nzImageService = inject(NzImageService);
  constructor(
    private msg: NzMessageService,
    private drawerService: NzDrawerService
  ) {
  }
  imgPreview(): void {
    if (this.game.img?.length === 0) {
      this.msg.info('再花还没有上传哦(〒︿〒)');
    } else {
      const data = this.game.img.map((img: any) => { return img.url });

      // this.nzImageService.preview(data, { nzZoom: 1, nzRotate: 0 });
      this.drawerService.create({
        nzTitle: this.game.name + '游戏截图',
        // nzFooter: 'Footer',
        // nzExtra: 'Extra',
        nzContent: GamePicComponent,
        nzPlacement: 'bottom',
        nzHeight: '50vh',
        nzData: {
          value: data
        }
      });
    }
  }

  imgFirstPreview(img: any): void {
    this.nzImageService.preview([{ src: img }], { nzZoom: 0.8, nzRotate: 0 });

  }
}

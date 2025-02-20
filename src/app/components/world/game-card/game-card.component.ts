import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

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
    DatePipe
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
    private msg: NzMessageService
  ) {
  }
  imgPreview(): void {
    if (this.game.img?.length === 0) {
      this.msg.info('再花还没有上传哦(〒︿〒)');
    } else {
      const data = this.game.img.map((img: any) => {
        return {
          src: img.url
        }
      });

      this.nzImageService.preview(data, { nzZoom: 1, nzRotate: 0 });
    }
  }

}

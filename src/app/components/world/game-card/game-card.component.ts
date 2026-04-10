import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { GamePicComponent } from './game-pic/game-pic.component';
import { WindowService } from '../../../services/window.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';

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
    NzDrawerModule,
    NzDividerModule
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  @Input() game: any;
  isMobile: boolean = false;
  colorList: any = {
    'PS5': '#092F94',
    'Steam': '#171A21',
  }
  private nzImageService = inject(NzImageService);
  @ViewChild('time') time!: TemplateRef<any>;
  @ViewChild('finishDate') finishDate!: TemplateRef<any>;
  @ViewChild('imgPrivew') imgPrivew!: TemplateRef<any>;
  @ViewChild('content') content!: TemplateRef<any>;
  @ViewChild('extra') extra!: TemplateRef<any>;
  @ViewChild('imgText') imgText!: TemplateRef<any>;
  constructor(
    private msg: NzMessageService,
    private drawerService: NzDrawerService,
    private window: WindowService,
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }
  imgPreview(): void {

    const data = this.game.img.map((img: any) => { return img.url });

    // this.nzImageService.preview(data, { nzZoom: 1, nzRotate: 0 });
    this.drawerService.create({
      nzTitle: this.game.name + '游戏截图',
      // nzFooter: 'Footer',
      nzExtra: this.extra,
      nzContent: GamePicComponent,
      nzPlacement: 'bottom',
      nzHeight: this.isMobile ? '75vh' : '50vh',
      nzData: {
        value: data
      }
    });
  }

  imgFirstPreview(img: any): void {
    this.nzImageService.preview([{ src: img }], { nzZoom: 0.8, nzRotate: 0 });
  }

  goToContent(url: string): void {
    window.open(url, '_blank')
  }

  imgDescription(): void {
    this.msg.info(this.imgText, {
      nzDuration: 8000
    });
  }

}

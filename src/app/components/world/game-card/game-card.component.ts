import { NgClass, DatePipe } from '@angular/common';
import { Component, DestroyRef, Input, TemplateRef, ViewChild } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { GamePicComponent } from './game-pic/game-pic.component';
import { WindowService } from '../../../services/window.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';

type GameViewMode = 'detailed' | 'overview';

@Component({
  selector: 'flower-game-card',
  standalone: true,
  imports: [
    NgClass,
    NzCardModule,
    NzTagModule,
    NzFlexModule,
    NzTypographyModule,
    NzImageModule,
    DatePipe,
    NzDrawerModule,
    NzDividerModule,
    FlTagDirective,
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  @Input() game: any;
  @Input() viewMode: GameViewMode = 'detailed';
  isMobile: boolean = false;
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
    private readonly destroyRef: DestroyRef,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
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

  goToContent(url: string): void {
    window.open(url, '_blank')
  }

  imgDescription(): void {
    this.msg.info(this.imgText, {
      nzDuration: 8000
    });
  }

  get isOverview(): boolean {
    return this.viewMode === 'overview';
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

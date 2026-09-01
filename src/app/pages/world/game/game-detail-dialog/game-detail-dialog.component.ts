import { Component, DestroyRef, inject, TemplateRef, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FlTagDirective } from '../../../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import { GamePicComponent } from '../../../../components/world/game-card/game-pic/game-pic.component';
import { WindowService } from '../../../../services/window.service';

@Component({
  selector: 'flower-game-detail-dialog',
  standalone: true,
  imports: [
    DatePipe,
    NzFlexModule,
    NzTagModule,
    NzTypographyModule,
    NzDrawerModule,
    FlTagDirective,
  ],
  templateUrl: './game-detail-dialog.component.html',
  styleUrl: './game-detail-dialog.component.css',
})
export class GameDetailDialogComponent {
  nzModalData: any = inject(NZ_MODAL_DATA);
  isMobile = false;

  @ViewChild('extra') extra!: TemplateRef<any>;
  @ViewChild('imgText') imgText!: TemplateRef<any>;

  private readonly drawerService = inject(NzDrawerService);
  private readonly msg = inject(NzMessageService);
  private readonly window = inject(WindowService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  get game(): any {
    return this.nzModalData?.data ?? this.nzModalData;
  }

  get name(): string {
    return String(this.game?.name ?? '');
  }

  get platform(): string {
    return String(this.game?.platform ?? '');
  }

  get tag(): string {
    return String(this.game?.tag ?? '');
  }

  get description(): string {
    return String(this.game?.description ?? '');
  }

  get hasContent(): boolean {
    return !!this.game?.content;
  }

  get isRecommended(): boolean {
    return this.game?.recommend === 'recommended';
  }

  get isNotRecommended(): boolean {
    return this.game?.recommend === 'not_recommended';
  }

  get coverUrl(): string {
    const first = this.game?.imgFirst?.[0];
    if (first?.url) {
      return first.url;
    }
    const img0 = this.game?.img?.[0];
    return typeof img0 === 'string' ? img0 : (img0?.url ?? '');
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

  get screenshots(): any[] {
    const list = Array.isArray(this.game?.img) ? this.game.img : [];
    return list
      .map((img: any) => (typeof img === 'string' ? img : img?.url))
      .filter(Boolean);
  }

  imgPreview(): void {
    if (!this.screenshots.length) {
      return;
    }
    this.drawerService.create({
      nzTitle: this.name + '游戏截图',
      nzExtra: this.extra,
      nzContent: GamePicComponent,
      nzPlacement: 'bottom',
      nzHeight: this.isMobile ? '75vh' : '50vh',
      nzData: {
        value: this.screenshots,
      },
    });
  }

  imgDescription(): void {
    this.msg.info(this.imgText, {
      nzDuration: 8000,
    });
  }

  goToContent(): void {
    if (this.game?.content) {
      window.open(this.game.content, '_blank');
    }
  }
}

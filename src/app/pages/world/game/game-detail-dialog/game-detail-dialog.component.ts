import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FlTagDirective } from '../../../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import {
  appendViewOriginalButton,
  deriveWebpVariants,
  inferOriginalImageUrl,
} from '../../../../shared/utils/image-url.util';

interface GameShotAsset {
  displayUrl: string;
  zoomUrl: string;
  originalUrl: string;
}

@Component({
  selector: 'flower-game-detail-dialog',
  standalone: true,
  imports: [
    DatePipe,
    NzFlexModule,
    NzTagModule,
    NzTypographyModule,
    NzImageModule,
    NzSpinModule,
    FlTagDirective,
  ],
  templateUrl: './game-detail-dialog.component.html',
  styleUrl: './game-detail-dialog.component.css',
})
export class GameDetailDialogComponent {
  nzModalData: any = inject(NZ_MODAL_DATA);

  /** 截图按顺序加载：当前可加载到的下标（含），初始为 1（第一张开始加载） */
  readyShotCount = 1;

  private readonly imageService = inject(NzImageService);

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

  get isAverage(): boolean {
    return this.game?.recommend === 'average';
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

  /** 截图像素信息：展示用 webp 地址，缩放层与"查看原图"用原图（与点滴一致） */
  get screenshots(): GameShotAsset[] {
    const list = Array.isArray(this.game?.img) ? this.game.img : [];
    return list
      .map((img: any) => {
        const url = typeof img === 'string' ? img : img?.url;
        if (!url) {
          return null;
        }
        const { zoom } = deriveWebpVariants(url);
        const originalRaw =
          img && typeof img === 'object' ? String(img?.img_url ?? '').trim() : '';
        return {
          displayUrl: url,
          zoomUrl: zoom || url,
          originalUrl: originalRaw || inferOriginalImageUrl(url),
        };
      })
      .filter(
        (shot: GameShotAsset | null): shot is GameShotAsset => !!shot,
      );
  }

  /** 点击截图：弹出图片预览（缩放层），并追加"查看原图"按钮 */
  previewShot(event: MouseEvent, shot: GameShotAsset): void {
    event.stopPropagation();
    this.imageService.preview([{ src: shot.zoomUrl }], {
      nzZoom: 0.8,
      nzRotate: 0,
    });
    appendViewOriginalButton(shot.originalUrl);
  }

  /** 截图逐张加载：前一张加载完成后开始加载下一张 */
  onShotLoad(index: number): void {
    if (
      index + 1 === this.readyShotCount &&
      this.readyShotCount < this.screenshots.length
    ) {
      this.readyShotCount += 1;
    }
  }

  /** 加载失败也继续下一张，避免阻塞加载序列 */
  onShotError(index: number): void {
    this.onShotLoad(index);
  }

  goToContent(): void {
    if (this.game?.content) {
      window.open(this.game.content, '_blank');
    }
  }
}

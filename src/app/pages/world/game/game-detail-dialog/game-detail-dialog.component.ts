import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { FlImgFadeDirective } from '../../../../common_ui/fl_ui/fl-img-fade/fl-img-fade.directive';
import { GameRecommendBadgeComponent } from '../../../../components/world/game-recommend-badge/game-recommend-badge.component';
import { ExternalLinkService } from '../../../../services/external-link.service';
import { deriveWebpVariants } from '../../../../shared/utils/image-url.util';
import {
  formatGameDate,
  formatHours,
  hasStatusDate,
  playStatusText,
  statusDateLabel,
  type GamePlayStatus,
} from '../game-display.util';

interface GameShotAsset {
  displayUrl: string;
  zoomUrl: string;
}

interface GameMetaItem {
  label: string;
  value: string;
}

@Component({
  selector: 'flower-game-detail-dialog',
  standalone: true,
  imports: [
    NzIconModule,
    NzImageModule,
    FlImgFadeDirective,
    GameRecommendBadgeComponent,
  ],
  templateUrl: './game-detail-dialog.component.html',
  styleUrl: './game-detail-dialog.component.css',
})
export class GameDetailDialogComponent implements AfterViewInit {
  readonly nzModalData: any = inject(NZ_MODAL_DATA);

  private readonly modalRef = inject(NzModalRef);
  private readonly imageService = inject(NzImageService);
  private readonly externalLink = inject(ExternalLinkService);
  private readonly closeButton =
    viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  ngAfterViewInit(): void {
    this.closeButton()?.nativeElement.focus({ preventScroll: true });
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

  get hasDescription(): boolean {
    return this.description.trim().length > 0;
  }

  get hasContent(): boolean {
    return String(this.game?.content ?? '').trim().length > 0;
  }

  get coverUrl(): string {
    const cover = this.game?.imgFirst?.[0];
    if (typeof cover === 'string') {
      return cover;
    }
    if (cover?.url) {
      return cover.url;
    }

    const fallback = this.game?.img?.[0];
    if (typeof fallback === 'string') {
      return fallback;
    }
    return fallback?.url ?? '';
  }

  get currentPlayStatus(): GamePlayStatus {
    return (this.game?.playStatus ?? 'completed') as GamePlayStatus;
  }

  get statusText(): string {
    return playStatusText(this.currentPlayStatus);
  }

  get showStatusDate(): boolean {
    return (
      hasStatusDate(this.currentPlayStatus) && !!this.game?.statusDate
    );
  }

  get statusDateText(): string {
    return formatGameDate(this.game?.statusDate);
  }

  get statusDateLabelText(): string {
    return statusDateLabel(this.currentPlayStatus);
  }

  get hasTime(): boolean {
    return this.game?.time !== null && this.game?.time !== undefined;
  }

  get timeText(): string {
    return formatHours(this.game?.time);
  }

  get metaItems(): GameMetaItem[] {
    const items: GameMetaItem[] = [];

    if (this.platform) {
      items.push({ label: '平台', value: this.platform });
    }

    const type =
      this.game?.gameType === 'online'
        ? '网游'
        : this.game?.gameType === 'single'
          ? '单机'
          : '';
    if (type) {
      items.push({ label: '类型', value: type });
    }

    if (this.hasTime) {
      items.push({ label: '游玩时长', value: `${this.timeText} 小时` });
    }

    items.push({ label: '状态', value: this.statusText });

    if (this.showStatusDate) {
      items.push({
        label: this.statusDateLabelText,
        value: this.statusDateText,
      });
    }

    return items;
  }

  /** 截图展示用 webp 地址，缩放层用 -zoom 变体 */
  get screenshots(): GameShotAsset[] {
    const list = Array.isArray(this.game?.img) ? this.game.img : [];
    return list
      .map((image: any) => {
        const url = typeof image === 'string' ? image : image?.url;
        if (!url) {
          return null;
        }

        const { zoom } = deriveWebpVariants(url);
        return {
          displayUrl: url,
          zoomUrl: zoom || url,
        };
      })
      .filter(
        (shot: GameShotAsset | null): shot is GameShotAsset => !!shot,
      );
  }

  get hasScreenshots(): boolean {
    return this.screenshots.length > 0;
  }

  /** 点击截图：把全部截图交给预览层，并定位到当前这张 */
  previewShot(event: Event, index: number): void {
    event.stopPropagation();
    const images = this.screenshots.map((shot, shotIndex) => ({
      src: shot.zoomUrl,
      alt: `${this.name} 截图 ${shotIndex + 1}`,
    }));
    if (images.length === 0) {
      return;
    }

    const ref = this.imageService.preview(images, {
      nzZoom: 0.8,
      nzRotate: 0,
      nzKeyboard: true,
      nzMaskClosable: true,
    });
    ref.switchTo(Math.max(0, Math.min(index, images.length - 1)));
  }

  goToContent(): void {
    if (this.game?.content) {
      this.externalLink.open(String(this.game.content));
    }
  }

  close(): void {
    this.modalRef.close();
  }
}

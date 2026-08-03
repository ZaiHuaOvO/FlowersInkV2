import {
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { LifeCommentsComponent } from '../../../../components/life/life-comments/life-comments.component';
import { FlTagDirective } from '../../../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import { LifeService } from '../../life.service';
import { LifeUiStateService } from '../../life-ui-state.service';
import { inferOriginalImageUrl } from '../../../../shared/utils/image-url.util';

type LifeCategory = '美食' | '日常' | '游戏' | '摘抄' | '';

interface LifeImageAsset {
  previewUrl: string;
  originalUrl: string;
}

/** 与 heart.component 的 LifeTimelineItem 结构一致 */
interface LifeDetailItem {
  id: number;
  title: string;
  content: string;
  source: string;
  date: Date;
  dateText: string;
  tags: string[];
  primaryTag: string;
  images: LifeImageAsset[];
  likes: number;
  commentCount: number;
}

@Component({
  selector: 'flower-life-dialog',
  standalone: true,
  imports: [
    NgClass,
    NzFlexModule,
    NzIconModule,
    NzImageModule,
    NzTagModule,
    NzTypographyModule,
    LifeCommentsComponent,
    FlTagDirective,
  ],
  templateUrl: './life-dialog.component.html',
  styleUrls: ['./life-dialog.component.css'],
})
export class LifeDialogComponent implements OnInit {
  nzModalData?: any = inject(NZ_MODAL_DATA);

  /** 弹窗内是否展开评论区（含表单） */
  commentsOpen = true;

  animatingIds = new Set<number>();

  private readonly imageService = inject(NzImageService);
  private readonly lifeService = inject(LifeService);
  private readonly uiState = inject(LifeUiStateService);

  /** 详情数据（nzModalData 可能是原始 API 对象或已 normalize 的对象） */
  item: LifeDetailItem | null = null;

  constructor() {
    this.item = this.normalize(this.nzModalData);
  }

  ngOnInit(): void {
    this.uiState.initLikeCount(this.item!.id, this.item!.likes);
  }

  /** 兼容原始 API 对象与已 normalize 的对象 */
  private normalize(data: any): LifeDetailItem | null {
    if (!data) {
      return null;
    }
    const raw = data?.data ?? data;
    const date = this.parseDate(raw?.date ?? raw?.createDate);
    // 兼容已 normalize 的 tags 数组与原始 tag 字段
    const tags = Array.isArray(raw?.tags)
      ? raw.tags as string[]
      : this.normalizeTags(raw?.tag);
    // 兼容已 normalize 的 images 字段与原始 image/image_first 字段
    const images = Array.isArray(raw?.images)
      ? (raw.images as LifeImageAsset[])
      : this.normalizeImages(raw?.image, raw?.image_first);

    return {
      id: Number(raw?.id ?? 0),
      title: String(raw?.title ?? '').trim() || '',
      content: String(raw?.content ?? '').trim(),
      source: String(raw?.source ?? '').trim(),
      date,
      dateText: this.formatDateTime(date),
      tags,
      primaryTag: tags[0] ?? '',
      images,
      likes: Number(raw?.likes ?? 0),
      commentCount: Number(raw?.commentCount ?? 0),
    };
  }

  get isLiked(): boolean {
    return this.uiState.isLiked(this.item!.id);
  }

  get likeCount(): number {
    return this.uiState.getLikeCount(this.item!.id);
  }

  toggleLike(): void {
    const id = this.item!.id;
    if (this.animatingIds.has(id)) return;
    this.animatingIds.add(id);
    setTimeout(() => this.animatingIds.delete(id), 1000);

    if (this.uiState.isLiked(id)) {
      return;
    }

    const currentCount = this.likeCount;
    this.uiState.markLiked(id, currentCount + 1);
    this.lifeService.likeLife(id).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.uiState.markLiked(id, Number(data?.likes ?? currentCount + 1));
      },
      error: () => {
        this.uiState.revertLike(id, currentCount);
      },
    });
  }

  toggleComments(): void {
    this.commentsOpen = !this.commentsOpen;
  }

  isExcerpt(): boolean {
    return this.item!.primaryTag === '摘抄';
  }

  shouldShowSource(): boolean {
    return !!this.item!.source;
  }

  getTagClass(tag: string): string {
    switch (tag) {
      case '美食':
        return 'tag-food';
      case '日常':
        return 'tag-daily';
      case '游戏':
        return 'tag-game';
      case '摘抄':
        return 'tag-excerpt';
      default:
        return 'tag-default';
    }
  }

  getImageGridClass(): string {
    const tag = this.item!.primaryTag;
    const len = this.item!.images.length;
    if (tag === '游戏') {
      if (len === 1) return 'grid-game-one';
      if (len === 2) return 'grid-game-two';
      return 'grid-game-three';
    }
    if (len === 1) return 'grid-default-one';
    if (len === 2) return 'grid-default-two';
    return 'grid-default-three';
  }

  getImageItemClass(): string {
    return this.item!.primaryTag === '游戏' && this.item!.images.length === 1
      ? 'image-item-wrapper image-item-rect'
      : 'image-item-wrapper image-item-square';
  }

  previewOriginal(event: MouseEvent, image: LifeImageAsset): void {
    event.stopPropagation();
    this.imageService.preview([{ src: image.originalUrl }], {
      nzZoom: 0.8,
      nzRotate: 0,
    });
  }

  private normalizeTags(rawTag: unknown): string[] {
    const source = Array.isArray(rawTag) ? rawTag : rawTag ? [rawTag] : [];
    return source
      .map((tag) => this.normalizeTagLabel(tag))
      .filter((tag) => !!tag);
  }

  private normalizeTagLabel(rawTag: unknown): string {
    const tag = String(rawTag ?? '').trim();
    if (!tag) return '';
    if (tag.includes('事件') || tag.includes('日常')) return '日常';
    if (tag.includes('美食')) return '美食';
    if (tag.includes('游戏')) return '游戏';
    if (tag.includes('摘抄')) return '摘抄';
    return tag;
  }

  private normalizeImages(rawImage: unknown, rawCover: unknown): LifeImageAsset[] {
    const imageList = Array.isArray(rawImage) ? rawImage : [];
    const coverList = Array.isArray(rawCover) ? rawCover : [];
    const source = imageList.length > 0 ? imageList : coverList;
    return source
      .map((img) => this.normalizeImageAsset(img))
      .filter((img): img is LifeImageAsset => !!img);
  }

  private normalizeImageAsset(rawImage: unknown): LifeImageAsset | null {
    if (!rawImage) return null;
    if (typeof rawImage === 'string') {
      const previewUrl = rawImage.trim();
      if (!previewUrl) return null;
      return { previewUrl, originalUrl: inferOriginalImageUrl(previewUrl) };
    }
    const record = rawImage as Record<string, unknown>;
    const previewUrl = String(record['url'] ?? '').trim();
    if (!previewUrl) return null;
    const originalRaw = String(record['img_url'] ?? '').trim();
    return { previewUrl, originalUrl: originalRaw || inferOriginalImageUrl(previewUrl) };
  }

  private parseDate(value: unknown): Date {
    const parsed = new Date(String(value ?? ''));
    if (Number.isNaN(parsed.getTime())) return new Date();
    return parsed;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }
}

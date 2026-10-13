import type { NzImageService } from 'ng-zorro-antd/image';

/** 可预览图片的最小形状，点滴的 LifeImageAsset 天然满足 */
export interface PreviewableLifeImage {
  zoomUrl: string;
}

/**
 * 预览一条点滴的全部图片，并定位到被点击的那张。
 *
 * 一次把整组图交给 nz-image-preview，它才会渲染左右翻页箭头与 `n / m` 计数；
 * 只传一张时箭头不出现。点击非首张时用 switchTo 跳到对应位置
 * （ng-zorro 的 nz-image-group 内部也是这么做的）。
 *
 * 统一用 zoomUrl（1920px）而非展示层，保证预览清晰度。
 */
export function previewLifeImages<T extends PreviewableLifeImage>(
  imageService: NzImageService,
  images: readonly T[],
  index: number,
): void {
  if (!images.length) {
    return;
  }
  const previewRef = imageService.preview(
    images.map((image) => ({ src: image.zoomUrl })),
    { nzZoom: 0.8, nzRotate: 0 },
  );
  if (index > 0) {
    previewRef.switchTo(index);
  }
}

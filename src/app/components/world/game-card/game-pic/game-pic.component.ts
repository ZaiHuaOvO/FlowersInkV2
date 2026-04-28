import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { FlCardDirective } from '../../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlTagDirective } from '../../../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import { WindowService } from '../../../../services/window.service';
import { inferOriginalImageUrl } from '../../../../shared/utils/image-url.util';

@Component({
  selector: 'flower-game-pic',
  standalone: true,
  imports: [
    NzFlexModule,
    NzImageModule,
    NzGridModule,
    NzSpinModule,
    NzTagModule,
    FlCardDirective,
    FlTagDirective,
  ],
  templateUrl: './game-pic.component.html',
  styleUrl: './game-pic.component.css',
})
export class GamePicComponent implements OnInit {
  nzData: { value: any } = inject(NZ_DRAWER_DATA);
  isMobile = false;

  images: Array<{ url: string; loaded: boolean }> = [];
  currentIndex = 0;

  constructor(
    private drawerRef: NzDrawerRef<string>,
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
    private image: NzImageService,
    private msg: NzMessageService,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() {
    this.images = this.nzData['value'].map((url: string) => ({
      url,
      loaded: false,
    }));
  }

  onImageLoad(index: number) {
    if (index === this.currentIndex) {
      this.currentIndex++;
    }
  }

  close(): void {
    this.drawerRef.close(this.nzData);
  }

  imgPreview(url: string): void {
    this.msg.info('原图加载中，会比压缩图慢一些。');
    this.image.preview([{ src: url }]);
  }

  previewOriginal(url: string): void {
    this.imgPreview(inferOriginalImageUrl(url));
  }
}

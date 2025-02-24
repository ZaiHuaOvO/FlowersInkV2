import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { WindowService } from '../../../../services/window.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'flower-game-pic',
  standalone: true,
  imports: [
    NzFlexModule,
    NzImageModule,
    CommonModule,
    NzGridModule,
    NzSpinModule,
    NzTagModule
  ],
  templateUrl: './game-pic.component.html',
  styleUrl: './game-pic.component.css'
})
export class GamePicComponent implements OnInit {
  nzData: { value: any } = inject(NZ_DRAWER_DATA);
  isMobile: boolean = false;

  images: Array<{ url: string, loaded: boolean }> = [];
  currentIndex: number = 0;

  constructor(
    private drawerRef: NzDrawerRef<string>,
    private window: WindowService,
    private image: NzImageService,
    private msg: NzMessageService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() {
    // 初始化图片数据，添加 loaded 状态
    this.images = this.nzData['value'].map((url: string) => ({ url, loaded: false }));
  }

  onImageLoad(index: number) {
    // 当前图片加载完成后，递增索引以加载下一张
    if (index === this.currentIndex) {
      this.currentIndex++;
    }
  }

  close(): void {
    this.drawerRef.close(this.nzData);
  }

  imgPreview(url: string): void {
    this.msg.info('原图加载中，会比较慢哦(๑•́ ₃ •̀๑)');
    this.image.preview([{ src: url }])
  }
}

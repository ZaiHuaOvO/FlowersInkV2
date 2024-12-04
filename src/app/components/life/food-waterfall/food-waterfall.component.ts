import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  Input,
  PLATFORM_ID,
} from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { LifeDialogComponent } from '../../../pages/life/heart/life-dialog/life-dialog.component';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { WindowService } from '../../../services/window.service';

@Component({
  selector: 'flower-food-waterfall',
  standalone: true,
  imports: [CommonModule, NzTypographyModule, NzModalModule],
  templateUrl: './food-waterfall.component.html',
  styleUrl: './food-waterfall.component.css',
})
export class FoodWaterfallComponent {
  @Input() data: any[] = [];
  columnCount = 4; // 初始列数
  isMobile: boolean = false;
  windowWidth = 0;
  constructor(
    private modal: NzModalService,
    private window: WindowService,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
    this.window.windowWidth$.subscribe((windowWidth) => {
      this.windowWidth = windowWidth;
    });
  }

  ngOnInit(): void {
    this.updateColumnCount();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateColumnCount();
  }

  updateColumnCount(): void {
    if (isPlatformBrowser(this.platformId)) {
      let columns = 4; // 默认列数
      if (this.windowWidth > 1200) {
        columns = 5;
      } else if (this.windowWidth > 900) {
        columns = 4;
      } else if (this.windowWidth > 600) {
        columns = 3;
      } else {
        columns = 2;
      }
      document.documentElement.style.setProperty(
        '--columns',
        columns.toString()
      );
    }
  }

  getLifeDetail(i: any): void {
    this.modal.create({
      // nzTitle: '点滴',
      nzContent: LifeDialogComponent,
      nzStyle: { width: '40vw' },
      nzData: i,
      nzCentered: true,
      nzKeyboard: true,
      nzMaskClosable: true,
      nzClosable: false,
      nzFooter: null,
    });
  }

  getLifeDetailMobile(i: any): void {
    this.modal.create({
      // nzTitle: '点滴',
      nzContent: LifeDialogComponent,
      nzStyle: { width: '90vw' },
      nzData: i,
      nzCentered: true,
      nzKeyboard: true,
      nzMaskClosable: true,
      nzClosable: false,
      nzFooter: null,
    });
  }
}

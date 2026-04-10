import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import {
  groupByYearDesc,
  sortByDateDesc,
} from '../../../shared/utils/date-grouping.util';
import { WindowService } from '../../../services/window.service';
import { LifeService } from '../life.service';
import { LifeDialogComponent } from './life-dialog/life-dialog.component';

@Component({
  selector: 'flower-heart',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFlexModule,
    NzSpinModule,
    NzTimelineModule,
    NzTypographyModule,
    NzInputModule,
    NzIconModule,
    RouterModule,
    NzCollapseModule,
    NzAvatarModule,
    NzCardModule,
    NzModalModule,
    BlogTitleComponent,
  ],
  templateUrl: './heart.component.html',
  styleUrl: './heart.component.css',
})
export class HeartComponent {
  data: any[] = [];
  loading = true;
  isMobile = false;

  constructor(
    private life: LifeService,
    private modal: NzModalService,
    private window: WindowService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
    this.getLife();
  }

  getLife(): void {
    this.loading = true;
    this.life
      .getLifeList({
        title: '',
        tag: ['事件', '美食', '日常'],
      })
      .subscribe((res: any) => {
        const data = res['data'].data ?? [];
        this.data = this.processAndGroupData(data);
        if (this.data.length > 0) {
          this.data[0].active = true;
        }
        this.loading = false;
      });
  }

  processAndGroupData(dataArray: any[]) {
    const normalized = dataArray.map((item) => {
      const date = new Date(item.date);
      const time = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;

      return {
        ...item,
        time,
      };
    });

    const sorted = sortByDateDesc(normalized, (item) => new Date(item.date));
    return groupByYearDesc(sorted, (item) => new Date(item.date));
  }

  getAccentColor(tag: string): string {
    switch (tag) {
      case '日常':
        return '#7A5536';
      case '美食':
        return '#C18249';
      case '事件':
        return '#5A3E2B';
      default:
        return '#4D3423';
    }
  }

  getLifeDetail(i: any): void {
    this.modal.create({
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
      nzContent: LifeDialogComponent,
      nzStyle: { width: '90vw' },
      nzData: i,
      nzKeyboard: true,
      nzMaskClosable: true,
      nzClosable: false,
      nzFooter: null,
    });
  }
}

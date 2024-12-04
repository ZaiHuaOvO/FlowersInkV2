import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { LifeService } from '../life.service';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { LifeDialogComponent } from './life-dialog/life-dialog.component';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { WindowService } from '../../../services/window.service';

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
  isMobile: boolean = false;
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
    this.life.getLifeList().subscribe((res: any) => {
      const data = res['data'].data;
      this.data = this.processAndGroupData(data);
      // 设置面板默认第一个展开
      this.data[0].active = true;

      setTimeout(() => {
        this.loading = false;
      }, 1000);
    });
  }
  processAndGroupData(dataArray: any[]) {
    // 按 date 排序，从新到旧
    dataArray.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 将所有博客按年份分组
    const groupedData = dataArray.reduce((acc, item) => {
      const date = new Date(item.date);
      const year = date.getFullYear().toString();
      const time = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;

      // 为每个数据项新增 time 字段
      item.time = time;

      // 如果当前年份在分组对象中不存在，则创建一个新数组
      if (!acc[year]) {
        acc[year] = { year, data: [] };
      }

      // 将当前数据项加入到对应年份的 data 数组中
      acc[year].data.push(item);

      return acc;
    }, {} as Record<string, { year: string; data: any[] }>);

    // 将分组结果转换为数组格式并按年份从新到旧排序
    return Object.values(groupedData).sort(
      (a: any, b: any) => parseInt(b.year) - parseInt(a.year)
    );
  }

  getAccentColor(tag: string): string {
    switch (tag) {
      case '日常':
        return '#000B58'; // 淡蓝色
      case '美食':
        return '#FFB26F'; // 橘色
      case '事件':
        return '#A64D79'; // 淡红色
      default:
        return '#1A1A1D'; // 默认颜色
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
      nzStyle: { width: '100vw' },
      nzData: i,
      nzCentered: true,
      nzKeyboard: true,
      nzMaskClosable: true,
      nzClosable: false,
      nzFooter: null,
    });
  }
}

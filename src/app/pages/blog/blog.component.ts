import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BlogCardComponent } from '../../components/blog/blog-card/blog-card.component';
import { MeCardComponent } from '../../components/website/me-card/me-card.component';
import { WelcomeService } from '../welcome/welcome.service';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { RouterModule } from '@angular/router';
import { BlogTitleComponent } from '../../components/blog/blog-title/blog-title.component';
import { SlowUp, QuickUp } from '../../common_ui/animations/animation';
import { WindowService } from '../../services/window.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
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
    BlogTitleComponent,
    DatePipe,
  ],
  animations: [SlowUp, QuickUp],
})
export class BlogComponent implements OnInit {
  data: any[] = [];
  count = 0;
  loading = true;
  searchControl = new FormControl('');
  isMobile: boolean = false;
  constructor(private welcome: WelcomeService, private window: WindowService) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
    // 添加防抖，设置时间为500ms
    this.searchControl.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.getBlog();
    });
  }

  ngOnInit() {
    this.loading = true;
    this.getBlog();
  }

  getBlog(): void {
    this.loading = true;
    this.welcome
      .getBlogs({
        title: this.searchControl.value,
        limit: 999,
      })
      .subscribe((res: any) => {
        const data = res['data'].data;
        this.data = this.processAndGroupData(data);
        this.count = res['data'].count;
        setTimeout(() => {
          this.loading = false;
        }, 500);
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
      // const time = `${String(date.getMonth() + 1).padStart(2, '0')}月
      // ${String(date.getDate()).padStart(2, '0')}日`;

      // // 为每个数据项新增 time 字段
      // item.time = time;

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
}

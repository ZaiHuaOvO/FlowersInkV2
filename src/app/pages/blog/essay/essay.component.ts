import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { GeneralService } from '../../../services/general.service';
import { WindowService } from '../../../services/window.service';
import { BlogService } from '../blog.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { BlogCardComponent } from '../../../components/blog/blog-card/blog-card.component';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';

@Component({
  selector: 'flower-essay',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFlexModule,
    NzInputModule,
    BlogCardComponent,
    NzIconModule,
    NzTagModule,
    NzTypographyModule,
    NzSelectModule,
    NzDividerModule,
    NzPaginationModule,
    RouterModule,
    BlogTitleComponent,
    NzSpinModule,
    NzAffixModule,
  ],
  templateUrl: './essay.component.html',
  styleUrl: './essay.component.css',
  animations: [SlowUp, QuickUp],
})
export class EssayComponent implements OnInit {
  data: any[] = [];
  page = 1;
  count = 0;
  tag = '';
  tagList: any[] = [];
  loading = true;
  searchControl = new FormControl('');
  colors = [
    'pink',
    'red',
    'yellow',
    'orange',
    'cyan',
    'green',
    'blue',
    'purple',
    'geekblue',
    'magenta',
    'volcano',
    'gold',
    'lime',
  ];
  isMobile: boolean = false;
  constructor(
    private blog: BlogService,
    private general: GeneralService,
    private window: WindowService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
    // 添加防抖，设置时间为500ms
    this.searchControl.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.getBlog();
    });
  }

  ngOnInit() {
    this.blog
      .getBlogs({
        type: '随笔',
        page: this.page,
        tag: this.tag,
        limit: 10,
        title: this.searchControl.value,
      })
      .subscribe((res: any) => {
        this.data = res['data'].data;
        this.count = res['data'].count;
        setTimeout(() => {
          this.loading = false;
        }, 500);
      });

    this.blog
      .getBlogs({
        type: '随笔',
        page: '',
        tag: '',
        title: '',
      })
      .subscribe((res: any) => {
        this.tagList = this.general.getTagList(res['data'].data);
      });
  }

  getBlog(): void {
    this.loading = true;
    this.blog
      .getBlogs({
        type: '随笔',
        page: this.page,
        tag: this.tag,
        title: this.searchControl.value,
      })
      .subscribe((res: any) => {
        this.data = res['data'].data;
        this.count = res['data'].count;
        setTimeout(() => {
          this.loading = false;
        }, 500);
      });
  }

  pageChange(page: number) {
    this.page = page;
    this.getBlog();
  }

  tagSelect(tag: string): void {
    this.tag = tag == '全部' ? '' : tag;
    this.getBlog();
  }
}

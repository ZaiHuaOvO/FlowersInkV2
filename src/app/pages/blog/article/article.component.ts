import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BlogCardComponent } from '../../../components/blog/blog-card/blog-card.component';
import { MeCardComponent } from '../../../components/website/me-card/me-card.component';
import { BlogService } from '../blog.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { GeneralService } from '../../../services/general.service';
import { debounceTime } from 'rxjs';
import { RouterModule } from '@angular/router';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';

@Component({
  selector: 'flower-article',
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
  templateUrl: './article.component.html',
  styleUrl: './article.component.css',
  animations: [SlowUp, QuickUp],
})
export class ArticleComponent implements OnInit {
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
        type: '文章',
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
        type: '文章',
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
        type: '文章',
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

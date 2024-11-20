import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BlogCardComponent } from '../../../components/blog-card/blog-card.component';
import { MeCardComponent } from '../../../components/me-card/me-card.component';
import { BlogService } from '../blog.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { debounceTime } from 'rxjs';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { GeneralService } from '../../../services/general.service';
import { BlogTitleComponent } from '../../../components/blog-title/blog-title.component';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'flower-question',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFlexModule,
    NzInputModule,
    NzIconModule,
    NzTagModule,
    NzTypographyModule,
    NzDividerModule,
    NzPaginationModule,
    NzCollapseModule,
    NzSkeletonModule,
    NzSpinModule,
    BlogTitleComponent,
    MarkdownModule,
  ],
  templateUrl: './question.component.html',
  styleUrl: './question.component.css',
})
export class QuestionComponent implements OnInit {
  data: any[] = [
    {
      title: '未加载',
    },
  ];
  page = 1;
  count = 0;
  tag = '';
  tagList: any[] = [];
  loading = true;
  selectedValue: string | null = null;
  searchControl = new FormControl('');
  readonly cardStyle = {
    background: '#fff',
  };
  constructor(private blog: BlogService, private general: GeneralService) {
    // 添加防抖，设置时间为500ms
    this.searchControl.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.getBlog();
    });
  }

  ngOnInit() {
    this.blog
      .getBlogs({
        type: '问题',
        page: this.page,
        title: this.searchControl.value,
        tag: this.tag,
      })
      .subscribe((res: any) => {
        this.data = res['data'].data;
        this.count = res['data'].count;
        this.tagList = this.general.getTagList(this.data);
        setTimeout(() => {
          this.loading = false;
        }, 500);
      });
  }

  getBlog(): void {
    this.loading = true;
    this.blog
      .getBlogs({
        type: '问题',
        page: this.page,
        title: this.searchControl.value,
        tag: this.tag,
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

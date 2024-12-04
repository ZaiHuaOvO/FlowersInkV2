import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { MarkdownModule } from 'ngx-markdown';
import { debounceTime } from 'rxjs';
import { SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { GeneralService } from '../../../services/general.service';
import { WindowService } from '../../../services/window.service';
import { BlogService } from '../blog.service';

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
    NzAffixModule,
  ],
  templateUrl: './question.component.html',
  styleUrl: './question.component.css',
  animations: [SlowUp, QuickUp],
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

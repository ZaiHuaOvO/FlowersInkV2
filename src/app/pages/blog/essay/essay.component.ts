import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BlogCardComponent } from '../../../components/blog/blog-card/blog-card.component';
import { BlogService } from '../blog.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { RouterModule } from '@angular/router';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { RefreshUp, SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FlInputDirective } from '../../../common_ui/fl_ui/fl-input/fl-input.directive';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import {
  FlTagFilterComponent,
  TagFilterItem,
} from '../../../common_ui/fl_ui/fl-tag-filter/fl-tag-filter.component';

@Component({
  selector: 'flower-essay',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzFlexModule,
    NzInputModule,
    BlogCardComponent,
    NzIconModule,
    NzTypographyModule,
    NzPaginationModule,
    RouterModule,
    BlogTitleComponent,
    NzSpinModule,
    NzAffixModule,
    FlInputDirective,
    FlCardDirective,
    FlTagFilterComponent,
  ],
  templateUrl: './essay.component.html',
  styleUrl: './essay.component.css',
  animations: [SlowUp, QuickUp, RefreshUp],
})
export class EssayComponent implements OnInit {
  data: any[] = [];
  private allData: any[] = [];
  page = 1;
  pageSize = 10;
  count = 0;
  selectedTag = '';
  tagList: TagFilterItem[] = [];
  loading = true;
  listMotionTick = 0;
  searchControl = new FormControl('');
  isMobile = false;

  constructor(
    private blog: BlogService,
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
    this.searchControl.valueChanges
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.applyFilter();
      });
  }

  ngOnInit(): void {
    this.loadBlogs();
  }

  private loadBlogs(): void {
    this.loading = true;
    this.blog.getBlogs({ type: '随笔', limit: 999 }).subscribe((res: any) => {
      this.allData = res['data'].data ?? [];
      this.tagList = this.buildTagList(this.allData);
      this.page = 1;
      this.applyFilter();
      this.loading = false;
      this.listMotionTick += 1;
    });
  }

  private buildTagList(blogs: any[]): TagFilterItem[] {
    const map: Record<string, number> = {};
    blogs.forEach((blog) => {
      const tag = String(blog.tag ?? '').trim() || '杂项';
      map[tag] = (map[tag] ?? 0) + 1;
    });
    return Object.keys(map)
      .map((tag) => ({ tag, count: map[tag] }))
      .sort((a, b) => b.count - a.count);
  }

  private applyFilter(): void {
    const keyword = (this.searchControl.value ?? '').trim().toLowerCase();
    const filtered = this.allData.filter((blog) => {
      if (this.selectedTag && blog.tag !== this.selectedTag) {
        return false;
      }
      if (keyword && !String(blog.title ?? '').toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });

    this.count = filtered.length;
    const totalPages = Math.max(1, Math.ceil(this.count / this.pageSize));
    if (this.page > totalPages) {
      this.page = totalPages;
    }
    const start = (this.page - 1) * this.pageSize;
    this.data = filtered.slice(start, start + this.pageSize);
    this.listMotionTick += 1;
  }

  selectTag(tag: string): void {
    this.selectedTag = tag;
    this.page = 1;
    this.applyFilter();
  }

  pageChange(page: number): void {
    this.page = page;
    this.applyFilter();
  }
}

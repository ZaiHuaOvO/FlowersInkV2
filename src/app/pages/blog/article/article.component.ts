import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
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
  selector: 'flower-article',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzFlexModule,
    NzInputModule,
    BlogCardComponent,
    NzIconModule,
    NzTypographyModule,
    RouterModule,
    BlogTitleComponent,
    NzSpinModule,
    NzAffixModule,
    FlInputDirective,
    FlCardDirective,
    FlTagFilterComponent,
  ],
  templateUrl: './article.component.html',
  styleUrl: './article.component.css',
  animations: [SlowUp, QuickUp, RefreshUp],
})
export class ArticleComponent implements OnInit, AfterViewInit {
  data: any[] = [];
  private allData: any[] = [];
  /** 已按标签/关键词过滤后的全量结果，滚动时从它递增切片 */
  private filtered: any[] = [];
  /** 每次「加载更多」追加的条数 */
  private readonly pageSize = 10;
  /** 当前已渲染条数（相对 filtered） */
  private visibleCount = 0;
  selectedTag = '';
  tagList: TagFilterItem[] = [];
  loading = true;
  hasMore = false;
  listMotionTick = 0;
  searchControl = new FormControl('');
  isMobile = false;

  @ViewChild('loadMoreSentinel')
  private loadMoreSentinel?: ElementRef<HTMLElement>;
  private sentinelObserver?: IntersectionObserver;

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
        this.applyFilter();
      });
    this.destroyRef.onDestroy(() => this.sentinelObserver?.disconnect());
  }

  ngOnInit(): void {
    this.loadBlogs();
  }

  ngAfterViewInit(): void {
    this.sentinelObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.loadMore();
        }
      },
      // 提前一屏多点触发，滚到底之前下一页就已经铺好，看不出等待
      { rootMargin: '0px 0px 400px 0px' },
    );
    this.observeSentinel();
  }

  private loadBlogs(): void {
    this.loading = true;
    this.blog
      .getBlogs({
        limit: 999,
        // 列表只用标题/标签/日期，正文由详情页单独取，别把全部正文拉下来
        includeContent: false,
      })
      .subscribe((res: any) => {
      this.allData = res['data'].data ?? [];
      this.tagList = this.buildTagList(this.allData);
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

  /** 标签或关键词变化：重算结果集并回到第一屏 */
  private applyFilter(): void {
    const keyword = (this.searchControl.value ?? '').trim().toLowerCase();
    this.filtered = this.allData.filter((blog) => {
      if (this.selectedTag && blog.tag !== this.selectedTag) {
        return false;
      }
      if (keyword && !String(blog.title ?? '').toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });

    this.visibleCount = this.pageSize;
    this.renderVisible();
    this.listMotionTick += 1;
  }

  private renderVisible(): void {
    this.data = this.filtered.slice(0, this.visibleCount);
    this.hasMore = this.visibleCount < this.filtered.length;
  }

  /** 哨兵进入视口时追加下一页 */
  private loadMore(): void {
    if (!this.hasMore || this.loading) {
      return;
    }
    this.visibleCount += this.pageSize;
    this.renderVisible();
    // 追加后哨兵可能仍在视口内，重新 observe 才能再触发一次回调
    this.observeSentinel();
  }

  private observeSentinel(): void {
    const el = this.loadMoreSentinel?.nativeElement;
    if (!el || !this.sentinelObserver) {
      return;
    }
    this.sentinelObserver.unobserve(el);
    this.sentinelObserver.observe(el);
  }

  selectTag(tag: string): void {
    this.selectedTag = tag;
    this.applyFilter();
  }
}


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
import { RefreshUp, SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { BlogCardComponent } from '../../../components/blog/blog-card/blog-card.component';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { FlInputDirective } from '../../../common_ui/fl_ui/fl-input/fl-input.directive';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';

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
    FlInputDirective,
    FlCardDirective,
    FlTagDirective,
  ],
  templateUrl: './essay.component.html',
  styleUrl: './essay.component.css',
  animations: [SlowUp, QuickUp, RefreshUp],
})
export class EssayComponent implements OnInit {
  data: any[] = [];
  page = 1;
  count = 0;
  tag = '';
  tagList: any[] = [];
  loading = true;
  listMotionTick = 0;
  searchControl = new FormControl('');
  isMobile: boolean = false;
  constructor(
    private blog: BlogService,
    private general: GeneralService,
    private window: WindowService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
    // Debounce search input by 500ms to reduce request frequency.
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
        this.loading = false;
        this.listMotionTick += 1;
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
        this.loading = false;
        this.listMotionTick += 1;
      });
  }

  pageChange(page: number) {
    this.page = page;
    this.getBlog();
  }

  private isAllTag(tagName: string): boolean {
    return tagName === (this.tagList[0]?.tag ?? '');
  }

  tagSelect(tag: string): void {
    this.tag = this.isAllTag(tag) ? '' : tag;
    this.page = 1;
    this.getBlog();
  }

  tagVariant(tagName: string): 'soft' | 'solid' {
    if (this.isAllTag(tagName)) {
      return this.tag === '' ? 'solid' : 'soft';
    }
    return this.tag === tagName ? 'solid' : 'soft';
  }
}


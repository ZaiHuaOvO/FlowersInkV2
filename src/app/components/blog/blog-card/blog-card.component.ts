import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.css'],
  standalone: true,
  imports: [
    NzFlexModule,
    NzDividerModule,
    NzTypographyModule,
    NzSkeletonModule,
    DatePipe,
  ],
})
export class BlogCardComponent implements OnInit {
  @Input() blog: any;
  @Input() loading: boolean = true;
  @Input() href: string | null = null;
  @Input() pinned: boolean = false;
  /** 标题级别：列表页用 h3；页面标题本身就是列表标题时（首页精选）传 h2，避免跳级 */
  @Input() titleTag: 'h2' | 'h3' = 'h3';

  constructor() {}

  ngOnInit() {}

  /** 卡片预览：有摘要显示摘要，否则回退显示正文，单行截断 */
  get excerpt(): string {
    const blog = this.blog;
    const description =
      typeof blog?.description === 'string' ? blog.description.trim() : '';
    if (description) {
      return description;
    }
    return typeof blog?.content === 'string' ? blog.content.trim() : '';
  }
}

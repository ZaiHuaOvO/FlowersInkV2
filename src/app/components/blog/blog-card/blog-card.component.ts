import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
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
    NzIconModule,
    DatePipe,
  ],
})
export class BlogCardComponent implements OnInit {
  @Input() blog: any;
  @Input() loading: boolean = true;
  @Input() href: string | null = null;

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

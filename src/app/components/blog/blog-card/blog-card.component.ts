import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { commentArray } from '../../../ts/comment-emoji';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'flower-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzDividerModule,
    NzTypographyModule,
    NzSkeletonModule,
    NzIconModule,
    DatePipe,
    NzTagModule,
    NzToolTipModule
  ],
})
export class BlogCardComponent implements OnInit {
  @Input() blog: any;
  @Input() loading: boolean = true;
  commentArray: any[] = commentArray
  emojiTags: { [blogId: string]: any[] } = {};

  constructor() {

  }

  ngOnInit() {
    if (this.blog?.id && this.blog?.comment) {
      this.emojiTags[this.blog.id] = this.buildCommentTags(this.blog.comment);
    }
  }

  buildCommentTags(commentData: any[]): any[] {
    const tagList = this.commentArray.map(item => ({
      ...item,
      count: 0
    }));

    if (commentData?.length > 0) {
      const countMap = commentData.reduce((map, item) => {
        map[item.emojiType] = item.count;
        return map;
      }, {} as Record<string, number>);

      tagList.forEach(item => {
        if (countMap[item.key] !== undefined) {
          item.count = countMap[item.key];
        }
      });
    }

    return tagList;
  }
}

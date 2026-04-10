import { CommonModule, DatePipe } from '@angular/common';
import { FlTagComponent } from '../../../fl-ui/fl-tag/fl-tag.component';
import { FlSkeletonComponent } from '../../../fl-ui/fl-skeleton/fl-skeleton.component';
import { Component, Input, OnInit } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { commentArray } from '../../../ts/comment-emoji';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { WindowService } from '../../../services/window.service';
import { getCommentEmojiSymbol } from '../../../shared/utils/comment-emoji-symbol.util';

@Component({
  selector: 'flower-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    NzTypographyModule,
    FlSkeletonComponent,
    NzIconModule,
    DatePipe,
    FlTagComponent,
    NzToolTipModule],
})
export class BlogCardComponent implements OnInit {
  @Input() blog: any;
  @Input() loading: boolean = true;
  commentArray: any[] = commentArray;
  emojiTags: { [blogId: string]: any[] } = {};
  isMobile: boolean = false;

  constructor(private window: WindowService) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() {
    if (this.blog?.id && this.blog?.comment) {
      this.emojiTags[this.blog.id] = this.buildCommentTags(this.blog.comment);
    }
  }

  buildCommentTags(commentData: any[]): any[] {
    const tagList = this.commentArray.map((item) => ({
      ...item,
      count: 0,
    }));

    if (commentData?.length > 0) {
      const countMap = commentData.reduce((map, item) => {
        map[item.emojiType] = item.count;
        return map;
      }, {} as Record<string, number>);

      tagList.forEach((item) => {
        if (countMap[item.key] !== undefined) {
          item.count = countMap[item.key];
        }
      });
    }

    return tagList;
  }

  emojiSymbol(key: string): string {
    return getCommentEmojiSymbol(key);
  }
}

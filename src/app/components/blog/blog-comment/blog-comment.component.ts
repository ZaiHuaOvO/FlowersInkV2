import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { commentArray } from '../../../ts/comment-emoji';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { WindowService } from '../../../services/window.service';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'flower-blog-comment',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzPopoverModule,
    NzPaginationModule,
    NzIconModule,
    NzGridModule,
    NzToolTipModule,
    NzTagModule,
  ],
  templateUrl: './blog-comment.component.html',
  styleUrl: './blog-comment.component.css',
})
export class BlogCommentComponent {
  @Output() emojiSelected = new EventEmitter<any>();
  @Input() data: any[] = [];
  visible: boolean = false;
  commentArray: any[] = commentArray;
  isMobile: boolean = false;

  constructor(private window: WindowService) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  onEmojiClick(emoji: any): void {
    this.emojiSelected.emit(emoji);
  }
}

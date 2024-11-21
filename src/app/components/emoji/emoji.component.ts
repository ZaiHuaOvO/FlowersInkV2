import { Component, EventEmitter, Output, output } from '@angular/core';
import { emojiArray } from '../../ts/emoji';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'flower-emoji',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzPopoverModule,
    NzPaginationModule,
    NzIconModule,
  ],
  templateUrl: './emoji.component.html',
  styleUrl: './emoji.component.css',
})
export class EmojiComponent {
  @Output() emojiSelected = new EventEmitter<string>();
  visible: boolean = false;
  emojiArray = emojiArray;
  pageSize = 30; // 每页显示12个
  pageIndex = 1; // 当前页索引
  currentPageData: string[] = []; // 当前页数据
  constructor() {
    this.updateCurrentPageData();
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.updateCurrentPageData();
  }

  updateCurrentPageData(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    this.currentPageData = this.emojiArray.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  onEmojiClick(emoji: string): void {
    this.emojiSelected.emit(emoji); // 触发事件并传递选中的 Emoji
  }
}

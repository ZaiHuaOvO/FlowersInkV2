import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-book-card',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzDividerModule,
    NzTypographyModule,
    NzSkeletonModule,
    NzIconModule,
    NzImageModule,
    NzBadgeModule,
    DatePipe,
  ],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css',
})
export class BookCardComponent {
  @Input() book: any;

  getColor(status: string): string {
    if (!status) {
      return 'default';
    }
    if (status.includes('笔记')) {
      return 'green';
    }
    if (status.includes('在读')) {
      return 'gold';
    }
    if (status.includes('已读')) {
      return 'blue';
    }
    return 'default';
  }

  hasNote(target = this.book): boolean {
    if (!target) {
      return false;
    }
    if (typeof target.content === 'string') {
      return target.content.trim().length > 0;
    }
    return Boolean(target.content);
  }

  handleClick(event: MouseEvent, hasNote: boolean): void {
    if (!hasNote) {
      event.preventDefault();
    }
  }
}

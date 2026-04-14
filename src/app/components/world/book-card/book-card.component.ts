import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';

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
    FlCardDirective,
  ],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css',
})
export class BookCardComponent {
  @Input() book: any;

  getColor(status: string): string {
    if (!status) {
      return '#b98552';
    }
    if (status.includes('笔记')) {
      return '#7a4d23';
    }
    if (status.includes('在读')) {
      return '#a97441';
    }
    if (status.includes('已读')) {
      return '#c79664';
    }
    return '#b98552';
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


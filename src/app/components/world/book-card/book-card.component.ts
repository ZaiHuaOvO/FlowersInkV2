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
    let color = '';
    switch (status) {
      case '在读':
        color = 'yello';
        break;
      case '已读':
        color = 'blue';
        break;
      case '有笔记':
        color = 'green';
        break;
      default:
        break;
    }
    return color;
  }
}

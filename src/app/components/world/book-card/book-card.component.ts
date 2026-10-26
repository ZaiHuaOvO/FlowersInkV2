import { NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlImgFadeDirective } from '../../../common_ui/fl_ui/fl-img-fade/fl-img-fade.directive';

@Component({
  selector: 'flower-book-card',
  standalone: true,
  imports: [
    NgClass,
    NzFlexModule,
    NzDividerModule,
    NzTypographyModule,
    NzSkeletonModule,
    NzIconModule,
    NzImageModule,
    NzBadgeModule,
    DatePipe,
    DecimalPipe,
    FlCardDirective,
    FlImgFadeDirective,
  ],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css',
})
export class BookCardComponent {
  @Input() book: any;

  getColor(status: string): string {
    // 角标底色用 token：原来的 #c79664 / #b98552 配白字只有 2.6~3.5:1
    if (!status) {
      return 'var(--fi-tag-text)';
    }
    if (status.includes('笔记')) {
      return 'var(--fi-primary-hover)';
    }
    if (status.includes('在读')) {
      return 'var(--fi-badge-gold-strong)';
    }
    if (status.includes('已读')) {
      return 'var(--fi-badge-gold)';
    }
    return 'var(--fi-tag-text)';
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


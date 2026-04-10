import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'fl-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fl-skeleton" [class.fl-skeleton-active]="active">
      <span class="fl-line fl-line-title"></span>
      <span class="fl-line"></span>
      <span class="fl-line"></span>
      <span class="fl-line fl-line-short"></span>
    </div>
  `,
  styleUrl: './fl-skeleton.component.css',
})
export class FlSkeletonComponent {
  @Input() active = false;

  @Input({ alias: 'nzActive' })
  set nzActive(value: boolean) {
    this.active = Boolean(value);
  }
}


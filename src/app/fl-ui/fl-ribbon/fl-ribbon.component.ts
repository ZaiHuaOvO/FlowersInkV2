import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'fl-ribbon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fl-ribbon-wrapper">
      <div class="fl-ribbon" [style.backgroundColor]="resolvedColor">
        <ng-container *ngIf="isTemplateRef(text); else plainText" [ngTemplateOutlet]="text"></ng-container>
        <ng-template #plainText>{{ text }}</ng-template>
      </div>
      <div class="fl-ribbon-corner" [style.borderTopColor]="resolvedColor"></div>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './fl-ribbon.component.css',
})
export class FlRibbonComponent {
  @Input() text: string | TemplateRef<unknown> | null = null;
  @Input() color: string = '#8b5a2b';

  @Input({ alias: 'nzText' })
  set nzText(value: string | TemplateRef<unknown> | null) {
    this.text = value;
  }

  @Input({ alias: 'nzColor' })
  set nzColor(value: string) {
    this.color = this.mapColor(value);
  }

  get resolvedColor(): string {
    return this.mapColor(this.color);
  }

  isTemplateRef(value: unknown): value is TemplateRef<unknown> {
    return value instanceof TemplateRef;
  }

  private mapColor(color: string | null | undefined): string {
    if (!color) {
      return '#8b5a2b';
    }
    const lowered = color.toLowerCase();
    switch (lowered) {
      case 'green':
        return '#3f9f4d';
      case 'gold':
        return '#c98a3a';
      case 'blue':
        return '#3f78b3';
      case 'default':
        return '#8b5a2b';
      default:
        return color;
    }
  }
}


import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'fl-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="fl-avatar"
      [class.fl-avatar-square]="shape === 'square'"
      [style.width]="sizeCss"
      [style.height]="sizeCss"
    >
      <img
        *ngIf="showImage; else fallback"
        [src]="src"
        [alt]="alt"
        loading="lazy"
        decoding="async"
        (error)="onImageError()"
      />
      <ng-template #fallback>
        <span class="fl-avatar-fallback"><ng-content></ng-content></span>
      </ng-template>
    </span>
  `,
  styleUrl: './fl-avatar.component.css',
})
export class FlAvatarComponent {
  @Input() size: number | string = 32;
  @Input() src = '';
  @Input() shape: 'circle' | 'square' = 'circle';
  @Input() alt = '';

  @Input({ alias: 'nzSize' })
  set nzSize(value: number | string) {
    this.size = value;
  }

  @Input({ alias: 'nzSrc' })
  set nzSrc(value: string) {
    this.src = value ?? '';
    this.imageError = false;
  }

  @Input({ alias: 'nzShape' })
  set nzShape(value: string) {
    this.shape = value === 'square' ? 'square' : 'circle';
  }

  private imageError = false;

  get showImage(): boolean {
    return Boolean(this.src) && !this.imageError;
  }

  get sizeCss(): string {
    if (typeof this.size === 'number') {
      return `${this.size}px`;
    }
    const trimmed = String(this.size ?? '').trim();
    if (!trimmed) {
      return '32px';
    }
    return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
  }

  onImageError(): void {
    this.imageError = true;
  }
}


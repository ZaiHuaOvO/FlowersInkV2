import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'fl-divider',
  standalone: true,
  template: '',
  styleUrl: './fl-divider.component.css',
})
export class FlDividerComponent {
  private dividerType: 'horizontal' | 'vertical' = 'horizontal';

  @Input()
  set type(value: 'horizontal' | 'vertical' | null | undefined) {
    this.dividerType = value === 'vertical' ? 'vertical' : 'horizontal';
  }

  @Input('nzType')
  set nzType(value: 'horizontal' | 'vertical' | null | undefined) {
    this.type = value;
  }

  @HostBinding('class.fl-divider-horizontal')
  get isHorizontal(): boolean {
    return this.dividerType === 'horizontal';
  }

  @HostBinding('class.fl-divider-vertical')
  get isVertical(): boolean {
    return this.dividerType === 'vertical';
  }
}


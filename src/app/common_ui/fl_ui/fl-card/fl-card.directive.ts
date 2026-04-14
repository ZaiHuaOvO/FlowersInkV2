import { Directive, HostBinding, Input, booleanAttribute } from '@angular/core';

@Directive({
  selector: '[flCard]',
  standalone: true,
})
export class FlCardDirective {
  @Input({ transform: booleanAttribute }) flCardHover = false;

  @HostBinding('class.fl-card-surface')
  readonly flCardSurfaceClass = true;

  @HostBinding('class.fl-card-hover')
  get hoverClass(): boolean {
    return this.flCardHover;
  }
}

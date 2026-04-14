import { Directive, HostBinding, Input, booleanAttribute } from '@angular/core';

export type FlTagVariant = 'soft' | 'outline' | 'solid';

@Directive({
  selector: 'nz-tag[flTag]',
  standalone: true,
})
export class FlTagDirective {
  @Input() flTagVariant: FlTagVariant = 'soft';
  @Input({ transform: booleanAttribute }) flTagInteractive = false;

  @HostBinding('class.fl-tag')
  readonly flTagClass = true;

  @HostBinding('class.fl-tag-soft')
  get softClass(): boolean {
    return this.flTagVariant === 'soft';
  }

  @HostBinding('class.fl-tag-outline')
  get outlineClass(): boolean {
    return this.flTagVariant === 'outline';
  }

  @HostBinding('class.fl-tag-solid')
  get solidClass(): boolean {
    return this.flTagVariant === 'solid';
  }

  @HostBinding('class.fl-tag-interactive')
  get interactiveClass(): boolean {
    return this.flTagInteractive;
  }
}

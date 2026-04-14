import { Directive, HostBinding, Input } from '@angular/core';

export type FlAlertVariant = 'soft' | 'outline' | 'solid';

@Directive({
  selector: 'nz-alert[flAlert]',
  standalone: true,
})
export class FlAlertDirective {
  @Input() flAlertVariant: FlAlertVariant = 'soft';

  @HostBinding('class.fl-alert-host')
  readonly hostClass = true;

  @HostBinding('class.fl-alert-soft')
  get softClass(): boolean {
    return this.flAlertVariant === 'soft';
  }

  @HostBinding('class.fl-alert-outline')
  get outlineClass(): boolean {
    return this.flAlertVariant === 'outline';
  }

  @HostBinding('class.fl-alert-solid')
  get solidClass(): boolean {
    return this.flAlertVariant === 'solid';
  }
}

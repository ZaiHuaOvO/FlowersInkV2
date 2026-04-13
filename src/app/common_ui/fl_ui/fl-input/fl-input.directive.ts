import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: 'input[flInput], textarea[flInput]',
  standalone: true,
})
export class FlInputDirective {
  @Input() flInput: '' | boolean = '';

  @HostBinding('class.fl-input-control')
  readonly flInputControlClass = true;
}

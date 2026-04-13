import { Component, HostBinding, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export type FlButtonVariant = 'outline' | 'solid' | 'ghost';
export type FlButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'fl-button',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './fl-button.component.html',
  styleUrl: './fl-button.component.css',
})
export class FlButtonComponent {
  @Input() variant: FlButtonVariant = 'outline';
  @Input() size: FlButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() block = false;
  @Input() routerLink: string | readonly string[] | any[] | null = null;

  @HostBinding('class.fl-button-host-block')
  get isHostBlock(): boolean {
    return this.block;
  }
}

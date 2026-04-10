import { Component, Input } from '@angular/core';

@Component({
  selector: 'fl-tag',
  standalone: true,
  template: '<ng-content />',
  styleUrl: './fl-tag.component.css',
})
export class FlTagComponent {
  // Keep compatibility with old API, but color is now unified to theme color.
  @Input() color: string | null | undefined;
  @Input('nzColor') nzColor: string | null | undefined;
}

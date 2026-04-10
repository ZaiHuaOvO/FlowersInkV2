
import { Component, Input } from '@angular/core';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-link-card',
  standalone: true,
  imports: [
    NzTypographyModule,
    NzImageModule
],
  templateUrl: './link-card.component.html',
  styleUrl: './link-card.component.css',
})
export class LinkCardComponent {
  @Input() link: any;
}

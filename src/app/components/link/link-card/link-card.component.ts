import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-link-card',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzDividerModule,
    NzTypographyModule,
    NzImageModule,
  ],
  templateUrl: './link-card.component.html',
  styleUrl: './link-card.component.css',
})
export class LinkCardComponent {
  @Input() link: any;
}

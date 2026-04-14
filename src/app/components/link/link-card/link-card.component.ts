
import { Component, Input } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';

@Component({
  selector: 'flower-link-card',
  standalone: true,
  imports: [
    NzFlexModule,
    NzDividerModule,
    NzTypographyModule,
    NzImageModule,
    FlCardDirective,
],
  templateUrl: './link-card.component.html',
  styleUrl: './link-card.component.css',
})
export class LinkCardComponent {
  @Input() link: any;
}

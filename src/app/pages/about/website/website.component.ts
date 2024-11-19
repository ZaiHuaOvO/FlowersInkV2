import { Component } from '@angular/core';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-website',
  standalone: true,
  imports: [
    NzFlexModule,
    NzImageModule,
    NzDividerModule,
    NzTypographyModule,
    NzCollapseModule,
  ],
  templateUrl: './website.component.html',
  styleUrl: './website.component.css',
})
export class WebsiteComponent {}

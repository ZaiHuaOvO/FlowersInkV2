import { Component } from '@angular/core';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { TargetComponent } from '../../../components/target/target.component';
import { QuickUp } from '../../../common_ui/animations/animation';

@Component({
  selector: 'flower-website',
  standalone: true,
  imports: [
    NzFlexModule,
    NzImageModule,
    NzDividerModule,
    NzTypographyModule,
    NzCollapseModule,
    NzIconModule,
    TargetComponent,
  ],
  templateUrl: './website.component.html',
  styleUrl: './website.component.css',
  animations: [QuickUp],
})
export class WebsiteComponent {}

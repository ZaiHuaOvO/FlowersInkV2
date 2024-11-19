import { Component } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog-title/blog-title.component';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { TargetComponent } from '../../../components/target/target.component';
import { MeCardComponent } from '../../../components/me-card/me-card.component';

@Component({
  selector: 'flower-me',
  standalone: true,
  imports: [
    NzFlexModule,
    NzImageModule,
    NzDividerModule,
    NzTypographyModule,
    NzCollapseModule,
    NzPopoverModule,
    TargetComponent,
    MeCardComponent,
  ],
  templateUrl: './me.component.html',
  styleUrl: './me.component.css',
})
export class MeComponent {
  isAcive: boolean = true;
  isAcive1: boolean = true;
  isAcive2: boolean = true;
}

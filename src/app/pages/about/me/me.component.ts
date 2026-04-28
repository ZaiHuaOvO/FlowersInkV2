import { Component, DestroyRef } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { TargetComponent } from '../../../components/about/target/target.component';
import { QuickUp } from '../../../common_ui/animations/animation';
import { CommonModule } from '@angular/common';
import { WindowService } from '../../../services/window.service';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';

@Component({
  selector: 'flower-me',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzImageModule,
    NzDividerModule,
    NzTypographyModule,
    NzCollapseModule,
    NzPopoverModule,
    RouterModule,
    TargetComponent,
    NzIconModule,
    FlCardDirective,
  ],
  templateUrl: './me.component.html',
  styleUrl: './me.component.css',
  animations: [QuickUp],
})
export class MeComponent {
  isAcive: boolean = true;
  isAcive1: boolean = true;
  isAcive2: boolean = true;
  isAcive3: boolean = true;
  isAcive4: boolean = true;
  isAcive5: boolean = true;
  isAcive6: boolean = true;
  isAcive7: boolean = true;
  isAcive8: boolean = true;
  isAcive9: boolean = true;
  isMobile: boolean = false;
  email = 'ZyZy1724@gmail.com';
  constructor(
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
    private msg: NzMessageService,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  copyEmail(): void {
    navigator.clipboard
      .writeText(this.email)
      .then(() => {
        this.msg.success('已复制邮箱地址，欢迎邮件(๑＞ڡ＜)☆');
      })
      .catch((error) => {});
  }
}

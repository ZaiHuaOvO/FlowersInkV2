import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { EditMessageComponent } from '../../components/about/edit-message/edit-message.component';
import { TargetComponent } from '../../components/about/target/target.component';
import { WindowService } from '../../services/window.service';
import { FormsModule } from '@angular/forms';
import { SlowUp, QuickUp } from '../../common_ui/animations/animation';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { LinkCardComponent } from '../../components/link/link-card/link-card.component';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'flower-link',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFlexModule,
    NzTypographyModule,
    NzIconModule,
    NzCommentModule,
    NzListModule,
    NzAvatarModule,
    NzDividerModule,
    NzSpinModule,
    NzInputModule,
    NzAlertModule,
    LinkCardComponent,
    NzGridModule,
  ],
  templateUrl: './link.component.html',
  styleUrl: './link.component.css',
  animations: [SlowUp, QuickUp],
})
export class LinkComponent {
  loading = false;
  isMobile: boolean = false;
  showToolbar = false;
  content: any;
  email = 'ZyZy1724@gmail.com';
  links = [
    {
      name: '花墨',
      logo: 'https://api.flowersink.com/img/logo.png',
      url: 'https://flowersink.com',
      description: '一个喜欢写作,分享生活的已婚前端的个人网站',
    },
  ];
  constructor(private window: WindowService) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  submit(): void {}
}

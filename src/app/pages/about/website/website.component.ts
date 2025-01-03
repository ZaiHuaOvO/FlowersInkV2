import { Component } from '@angular/core';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { TargetComponent } from '../../../components/about/target/target.component';
import { QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

@Component({
  selector: 'flower-website',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzImageModule,
    NzDividerModule,
    NzTypographyModule,
    NzCollapseModule,
    NzIconModule,
    RouterModule,
    TargetComponent,
    NzTimelineModule,
  ],
  templateUrl: './website.component.html',
  styleUrl: './website.component.css',
  animations: [QuickUp],
})
export class WebsiteComponent {
  isMobile: boolean = false;

  websiteTimeline = [
    {
      date: '2024年10月10日',
      title: '项目在云服务器上部署',
    },
    {
      date: '2024年10月17日',
      title: '域名通过工商局备案',
    },
    {
      date: '2024年10月21日',
      title: '域名通过公安联网备案',
    },
    {
      date: '2024年11月06日',
      title: '正式进入运营',
    },
    {
      date: '2024年11月13日',
      title: '花墨2.0（重写计划）立项',
    },
    {
      date: '2024年11月21日',
      title: '花墨2.0完成开发并上线',
    },
    {
      date: '2024年12月02日',
      title: '开启RSS订阅',
    },
    {
      date: '2025年01月03日',
      title: '加入友链社区,新增友链功能',
    },
  ];
  constructor(private window: WindowService) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }
}

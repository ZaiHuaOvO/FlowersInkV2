import { CommonModule } from '@angular/common';
import { Component, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { TargetComponent } from '../../../components/about/target/target.component';
import { QuickUp } from '../../../common_ui/animations/animation';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { WindowService } from '../../../services/window.service';

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
    FlCardDirective,
  ],
  templateUrl: './website.component.html',
  styleUrl: './website.component.css',
  animations: [QuickUp],
})
export class WebsiteComponent {
  isMobile = false;

  websiteTimeline = [
    { date: '2024年10月10日', title: '项目在云服务器上部署' },
    { date: '2024年10月17日', title: '域名通过工信部备案' },
    { date: '2024年10月31日', title: '域名通过公安联网备案' },
    { date: '2024年11月06日', title: '正式进入运营' },
    { date: '2024年11月13日', title: '花墨2.0重写计划立项' },
    { date: '2024年11月21日', title: '花墨2.0完成开发并上线' },
    { date: '2024年12月22日', title: '开启RSS订阅' },
    { date: '2025年01月03日', title: '友链功能上线' },
    { date: '2025年02月20日', title: '游戏板块上线' },
    { date: '2025年02月25日', title: '评论功能上线' },
    { date: '2025年06月24日', title: '好朋友增加至5位，好耶！' },
    { date: '2025年10月10日', title: '建站一周年，加入十年之约' },
    { date: '2026年04月29日', title: '大幅重写并优化花墨的底层逻辑，花墨变得更快了' },
    { date: '2026年04月30日', title: '统一并完善了花墨的主题样式和细节，花墨变得更好看了' },
    { date: '2026年04月30日', title: '点滴功能回归！开始碎碎念' },
    { date: '2026年04月28日', title: '花墨真正接入 CDN，以前我以为接入了' },
    { date: '未完待续', title: '' },
  ];

  constructor(
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }
}

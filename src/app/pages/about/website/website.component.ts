import {
  Component,
  DestroyRef,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { TargetComponent } from '../../../components/about/target/target.component';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';

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
    RouterModule,
    TargetComponent,
    FlCardDirective,
  ],
  templateUrl: './website.component.html',
  styleUrl: './website.component.css',
  animations: [QuickUp],
  host: { '[@QuickUp]': '' },
})
export class WebsiteComponent {
  activeSection = 0;
  isMobile = false;
  isTransitioning = false;
  slideDirection: 'left' | 'right' = 'right';

  tabs = [
    { index: 0, label: '建站历程' },
    { index: 1, label: '诞生原因' },
    { index: 2, label: '名称含义' },
    { index: 3, label: '技术框架' },
    { index: 4, label: '特别鸣谢' },
  ];

  websiteTimeline = [
    { date: '2024/10/10', title: '项目在云服务器上部署', text: '什么，我有博客了？' },
    { date: '2024/10/17', title: '域名通过工信部备案', text: '' },
    { date: '2024/10/31', title: '域名通过公安联网备案', text: '' },
    { date: '2024/11/06', title: '正式进入运营', text: '会有人看吗…' },
    { date: '2024/11/13', title: '花墨2.0重写计划立项', text: '老婆大人的可靠建议！' },
    { date: '2024/11/21', title: '花墨2.0完成开发并上线', text: '爆肝一周的成果！' },
    { date: '2024/12/22', title: '开启RSS订阅', text: '' },
    { date: '2025/01/03', title: '友链功能上线', text: '第一个友链会是谁呢？' },
    { date: '2025/02/20', title: '游戏板块上线', text: '游戏糕手再花上线！' },
    { date: '2025/02/25', title: 'emoji评论功能上线', text: '来自可爱Xia的建议' },
    { date: '2025/06/24', title: '好朋友增加至5位，好耶！', text: '能得到肯定真是太好了' },
    { date: '2025/10/10', title: '建站一周年，加入十年之约', text: '一周年快乐！' },
    { date: '2026/04/09', title: '大幅重写并优化花墨的底层逻辑，花墨变得更快了', text: 'Angular糕手再花(不是)' },
    { date: '2026/04/10', title: '统一并完善了花墨的主题样式和细节，花墨变得更好看了', text: '总算看得过去了' },
    { date: '2026/04/20', title: '点滴功能回归！开始碎碎念', text: '' },
    { date: '2026/04/28', title: '花墨真正接入了 CDN', text: '以前一直接错了！怪不得接了图片加载还是这么慢…' },
    { date: '2026/06/24', title: '重写了一个漂亮的"关于"', text: '得益于可爱米饭的个人主页灵感，我超爱' },
    { date: '2026/07/15', title: '新增文章评论、点滴点赞功能', text: '为网站加上一些交互感' },
    { date: '未完待续', title: '', text: '' },
  ];

  private readonly THROTTLE_MS = 350;
  private transitionTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  goToSection(index: number): void {
    if (
      index === this.activeSection ||
      this.isTransitioning ||
      index < 0 ||
      index > 4
    ) {
      return;
    }
    const goingForward = index > this.activeSection;
    this.slideDirection = goingForward ? 'right' : 'left';
    this.isTransitioning = true;
    this.activeSection = index;
    this.cdr.detectChanges();
    this.transitionTimeout = setTimeout(() => {
      this.isTransitioning = false;
      this.transitionTimeout = null;
    }, this.THROTTLE_MS);
  }
}

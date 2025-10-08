import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RssComponent } from '../svg/rss/rss.component';
import { WindowService } from '../../../services/window.service';
import { SitemapComponent } from '../sitemap/sitemap.component';
import { PlanetComponent } from '../svg/planet/planet.component';
import { Forever } from '../svg/forever/forever';

@Component({
  selector: 'flower-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzDividerModule,
    NzIconModule,
    NzAvatarModule,
    NzTypographyModule,
    NzPopoverModule,
    NzPopconfirmModule,
    RssComponent,
    SitemapComponent,
    PlanetComponent,
    Forever,
  ],
})
export class FooterComponent implements OnInit {
  email = 'ZyZy1724@gmail.com';
  isMobile: boolean = false;
  constructor(
    private msg: NzMessageService,
    @Inject(PLATFORM_ID) private platformId: object, // 注入 PLATFORM_ID 以检测运行平台
    private window: WindowService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() { }

  copyEmail(): void {
    navigator.clipboard
      .writeText(this.email)
      .then(() => {
        this.msg.success('已复制邮箱地址，欢迎邮件(๑＞ڡ＜)☆');
      })
      .catch((error) => { });
  }
}

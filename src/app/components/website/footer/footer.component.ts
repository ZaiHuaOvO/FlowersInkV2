import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { WindowService } from '../../../services/window.service';
import { Forever } from '../svg/forever/forever';
import { PlanetComponent } from '../svg/planet/planet.component';
import { RssComponent } from '../svg/rss/rss.component';
import { SitemapComponent } from '../svg/sitemap/sitemap.component';

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
  isMobile = false;

  constructor(
    private msg: NzMessageService,
    @Inject(PLATFORM_ID) private platformId: object,
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() {}

  copyEmail(): void {
    navigator.clipboard
      .writeText(this.email)
      .then(() => {
        this.msg.success('已复制邮箱地址，欢迎邮件联系。');
      })
      .catch(() => {});
  }
}

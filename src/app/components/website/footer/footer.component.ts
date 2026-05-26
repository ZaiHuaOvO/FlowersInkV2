import { Component, DestroyRef } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
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
    NzFlexModule,
    NzDividerModule,
    NzIconModule,
    NzAvatarModule,
    NzTypographyModule,
    NzPopoverModule,
    RssComponent,
    SitemapComponent,
    PlanetComponent,
    Forever,
  ],
})
export class FooterComponent {
  email = 'ZyZy1724@gmail.com';
  isMobile = false;

  constructor(
    private readonly window: WindowService,
    private readonly destroyRef: DestroyRef,
    private readonly msg: NzMessageService,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  copyEmail(): void {
    navigator.clipboard
      .writeText(this.email)
      .then(() => {
        this.msg.success('已复制邮箱地址，欢迎邮件联系。');
      })
      .catch(() => {});
  }
}

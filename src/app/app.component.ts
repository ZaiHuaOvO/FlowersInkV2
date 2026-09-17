import { AfterViewInit, Component, TemplateRef, ViewChild } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { HeaderComponent } from './components/website/header/header.component';
import { FooterComponent } from './components/website/footer/footer.component';
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { BackTopComponent } from './components/website/back-top/back-top.component';
import { RoutePrefetchService } from './services/route-prefetch.service';
import { VisitorTrackingService } from './services/visitor-tracking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NzLayoutModule,
    NzFlexModule,
    HeaderComponent,
    FooterComponent,
    BackTopComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('loadingTemplate', { static: true })
  loadingTemplate!: TemplateRef<any>;

  constructor(
    private nzConfigService: NzConfigService,
    private routePrefetchService: RoutePrefetchService,
    private visitorTrackingService: VisitorTrackingService,
    private viewportScroller: ViewportScroller,
  ) {
    // 路由自带的锚点滚动不认 CSS 的 scroll-margin-top，这里给它同样的偏移，
    // 避免 #标题 定位后被 48px 固定头部挡住（数值与 markdown-zaihua.css 一致）
    this.viewportScroller.setOffset([0, 96]);
  }

  ngAfterViewInit(): void {
    this.visitorTrackingService.startRouteTracking();
    this.nzConfigService.set('spin', { nzIndicator: this.loadingTemplate });
    this.routePrefetchService.startIdlePreload();
  }
}

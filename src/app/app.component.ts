import { Component, TemplateRef, ViewChild } from '@angular/core';

import { RouterModule, RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { MenuService, NzMenuModule } from 'ng-zorro-antd/menu';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { HeaderComponent } from './components/website/header/header.component';
import { FooterComponent } from './components/website/footer/footer.component';
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { WindowService } from './services/window.service';
import { BackTopComponent } from './components/website/back-top/back-top.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzFlexModule,
    HeaderComponent,
    FooterComponent,
    NzTypographyModule,
    NzBackTopModule,
    BackTopComponent
],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  @ViewChild('loadingTemplate', { static: true })
  loadingTemplate!: TemplateRef<any>;

  isCollapsed = false;

  isMobile: boolean = false;
  isHovered = false;
  constructor(
    private nzConfigService: NzConfigService,
    private window: WindowService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngAfterViewInit(): void {
    this.nzConfigService.set('spin', { nzIndicator: this.loadingTemplate });
  }

  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }
}

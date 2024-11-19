import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { MenuService, NzMenuModule } from 'ng-zorro-antd/menu';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';

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
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  @ViewChild('loadingTemplate', { static: true })
  loadingTemplate!: TemplateRef<any>;

  isCollapsed = false;

  constructor(private nzConfigService: NzConfigService) {}

  ngAfterViewInit(): void {
    this.nzConfigService.set('spin', { nzIndicator: this.loadingTemplate });
  }
}

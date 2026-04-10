import { AfterViewInit, Component, TemplateRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { HeaderComponent } from './components/website/header/header.component';
import { FooterComponent } from './components/website/footer/footer.component';
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { BackTopComponent } from './components/website/back-top/back-top.component';

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

  constructor(private nzConfigService: NzConfigService) {}

  ngAfterViewInit(): void {
    this.nzConfigService.set('spin', { nzIndicator: this.loadingTemplate });
  }
}

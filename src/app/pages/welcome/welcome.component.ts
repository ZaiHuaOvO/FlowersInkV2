import { Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { WelcomeService } from './welcome.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { CommonModule, DatePipe } from '@angular/common';
import { BlogCardComponent } from '../../components/blog-card/blog-card.component';
import { MeCardComponent } from '../../components/me-card/me-card.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  imports: [
    CommonModule,
    NzFlexModule,
    NzSpinModule,
    BlogCardComponent,
    MeCardComponent,
    NzTypographyModule,
  ],
})
export class WelcomeComponent implements OnInit {
  data: any[] = [];
  loading = true;
  constructor(private welcome: WelcomeService) {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    this.data = [];
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.welcome.getBlogs().subscribe((res: any) => {
      this.data = res['data'].data;
      setTimeout(() => {
        this.loading = false;
      }, 1000);
    });
  }
}

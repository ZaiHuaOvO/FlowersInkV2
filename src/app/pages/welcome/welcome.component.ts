import { Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { WelcomeService } from './welcome.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { CommonModule, DatePipe } from '@angular/common';
import { BlogCardComponent } from '../../components/blog-card/blog-card.component';
import { MeCardComponent } from '../../components/me-card/me-card.component';

@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  imports: [CommonModule, NzFlexModule, BlogCardComponent, MeCardComponent],
})
export class WelcomeComponent implements OnInit {
  data: any[] = [];
  constructor(private welcome: WelcomeService) {
    this.welcome.getBlogs({}).subscribe((res: any) => {
      this.data = res['data'].data;
    });
  }

  ngOnInit() {}
}

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { WelcomeService } from './welcome.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { CommonModule, DatePipe } from '@angular/common';
import { BlogCardComponent } from '../../components/blog-card/blog-card.component';
import { MeCardComponent } from '../../components/me-card/me-card.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { RouterModule } from '@angular/router';
import { BlogTitleComponent } from '../../components/blog-title/blog-title.component';

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
    RouterModule,
    BlogTitleComponent,
  ],
})
export class WelcomeComponent implements OnInit {
  data: any[] = [];
  loading = true;
  info = {
    article: 0,
    question: 0,
    day: 0,
    lastUpdateTime: '',
  };
  constructor(private welcome: WelcomeService, private cdr: ChangeDetectorRef) {
    this.welcome.visitWeb();
  }

  ngOnInit() {
    this.welcome.getWebInfo().subscribe((res: any) => {
      this.info.day = res['data'].runDays;
      this.info.lastUpdateTime = res['data'].lastUpdateTime;
    });
  }

  ngAfterViewInit(): void {
    this.data = [];
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.welcome
      .getBlogs({ star: true, type: '文章' })
      .subscribe((res: any) => {
        this.data = this.processedData(res['data'].data);
        this.cdr.detectChanges();
        setTimeout(() => {
          this.loading = false;
        }, 500);
      });
    this.welcome.getBlogs().subscribe((res: any) => {
      const data = this.processedData(res['data'].data);
      this.info.article = data.filter(
        (item: any) => item.type === '文章'
      ).length;
      this.info.question = data.filter(
        (item: any) => item.type === '问题'
      ).length;
      this.cdr.detectChanges();
    });
  }

  processedData(data: any): any {
    const processedData = data.map((item: any) => {
      if (item.content.length > 200) {
        return {
          ...item,
          content: item.content.substring(0, 200) + '...', // 裁剪为200字并添加省略号
        };
      }
      return item; // 如果长度不超过200字，则保持原样
    });
    return processedData;
  }
}

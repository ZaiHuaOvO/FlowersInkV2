import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { WelcomeService } from './welcome.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { CommonModule, DatePipe } from '@angular/common';
import { BlogCardComponent } from '../../components/blog/blog-card/blog-card.component';
import { MeCardComponent } from '../../components/website/me-card/me-card.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { RouterModule } from '@angular/router';
import { BlogTitleComponent } from '../../components/blog/blog-title/blog-title.component';
import { QuickUp, SlowUp } from '../../common_ui/animations/animation';
import { WindowService } from '../../services/window.service';
import { NzAffixModule } from 'ng-zorro-antd/affix';

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
    NzAffixModule,
  ],
  animations: [SlowUp, QuickUp],
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
  isMobile: boolean = false;
  constructor(
    private welcome: WelcomeService,
    private cdr: ChangeDetectorRef,
    private window: WindowService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
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
    this.welcome.getBlogs({ type: '文章' }).subscribe((res: any) => {
      const data = this.processedData(res['data'].data);
      this.info.article = data.length;
      this.cdr.detectChanges();
    });
    this.welcome.getBlogs({ type: '问题' }).subscribe((res: any) => {
      const data = this.processedData(res['data'].data);
      this.info.question = data.length;
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

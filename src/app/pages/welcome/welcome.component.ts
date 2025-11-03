import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

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
    NzDividerModule,
    NzModalModule,
    NzTagModule
  ],
  animations: [SlowUp, QuickUp],
})
export class WelcomeComponent implements OnInit {
  data: any[] = [];
  loading = true;
  numLoading = true;
  info = {
    article: 0,
    essay: 0,
    question: 0,
    day: 0,
    lastUpdateTime: '',
  };
  isMobile: boolean = false;
  @ViewChild('more', { static: true })
  more!: TemplateRef<any>;

  constructor(
    private welcome: WelcomeService,
    private cdr: ChangeDetectorRef,
    private window: WindowService,
    private modal: NzModalService,
    private msg: NzMessageService
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
    this.welcome.getBlogs({ star: true }).subscribe((res: any) => {
      this.data = this.processedData(res['data'].data);
      this.cdr.detectChanges();
      setTimeout(() => {
        this.loading = false;
      }, 1000);
    });
    this.welcome
      .getBlogs({
        limit: 999,
      })
      .subscribe((val: any) => {
        if (val) {
          const data = this.processedData(val['data'].data);
          // this.info.article = data.length;
          this.info.article = data.filter(
            (item: any) => item.type === '文章'
          ).length;
          this.info.essay = data.filter(
            (item: any) => item.type === '随笔'
          ).length;
          this.numLoading = false;
          this.cdr.detectChanges();
        }
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

  detail(): void {
    this.modal.create({ nzContent: this.more, nzFooter: [] },);
  }

  copy(value: string): void {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        this.msg.success('已复制联系方式，好耶(๑＞ڡ＜)☆');
      })
      .catch((error) => { });
  }
}



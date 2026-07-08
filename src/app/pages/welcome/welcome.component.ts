import { ChangeDetectorRef, Component, DestroyRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { WelcomeService } from './welcome.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { DatePipe } from '@angular/common';
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
import { FlCardDirective } from '../../common_ui/fl_ui/fl-card/fl-card.directive';
import { MeCardProfile } from '../../components/website/me-card/me-card.component';

interface WelcomeStats {
  blogTotal: number;
  lifeTotal: number;
  runDays: number;
  profile?: MeCardProfile;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  imports: [
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
    NzTagModule,
    FlCardDirective,
  ],
  animations: [SlowUp, QuickUp],
})
export class WelcomeComponent implements OnInit {
  data: any[] = [];
  loading = true;
  numLoading = true;
  info: WelcomeStats = {
    blogTotal: 0,
    lifeTotal: 0,
    runDays: 0,
  };
  isMobile: boolean = false;
  @ViewChild('more', { static: true })
  more!: TemplateRef<any>;

  constructor(
    private welcome: WelcomeService,
    private cdr: ChangeDetectorRef,
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
    private modal: NzModalService,
    private msg: NzMessageService
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() {
    this.welcome.getWebInfo().subscribe((res: any) => {
      const data = res?.data ?? {};
      this.info.blogTotal = Number(data.blogTotal ?? 0);
      this.info.lifeTotal = Number(data.lifeTotal ?? 0);
      this.info.runDays = Number(data.runDays ?? 0);
      this.info.profile = data.profile ?? undefined;
      this.numLoading = false;
    });
  }

  ngAfterViewInit(): void {
    this.data = [];
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.welcome.getBlogs({ star: true }).subscribe((res: any) => {
      this.data = this.processedData(res['data'].data);
      this.cdr.detectChanges();
      this.loading = false;
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



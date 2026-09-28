import { ChangeDetectorRef, Component, DestroyRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { WelcomeService } from './welcome.service';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { DOCUMENT, DatePipe } from '@angular/common';
import { BlogCardComponent } from '../../components/blog/blog-card/blog-card.component';
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
import { FlButtonComponent } from '../../common_ui/fl_ui/fl-button/fl-button.component';
import { MeCardComponent, MeCardProfile } from '../../components/website/me-card/me-card.component';
import { isPinnedBlog } from '../../shared/utils/blog-pinned.util';
import { AnnouncementCardComponent } from './announcement-card/announcement-card.component';
import { AnnouncementDetailComponent } from './announcement-detail/announcement-detail.component';

interface WelcomeStats {
  blogTotal: number;
  lifeTotal: number;
  gameTotal: number;
  runDays: number;
  blogCharTotal: number;
  recentBlogs: { id: number; title: string }[];
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
    FlButtonComponent,
    AnnouncementCardComponent,
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
    gameTotal: 0,
    runDays: 0,
    blogCharTotal: 0,
    recentBlogs: [],
  };
  isMobile: boolean = false;
  scrollAtTop = true;

  /** 当前生效的临时公告；null 表示不显示 hero 上方那张卡片 */
  announcement: any = null;
  @ViewChild('more', { static: true })
  more!: TemplateRef<any>;

  constructor(
    private welcome: WelcomeService,
    private cdr: ChangeDetectorRef,
    private windowService: WindowService,
    private readonly destroyRef: DestroyRef,
    @Inject(DOCUMENT) private document: Document,
    private modal: NzModalService,
    private msg: NzMessageService
  ) {
    this.windowService.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });

    const win = this.document.defaultView;
    if (win) {
      const onScroll = () => {
        const atTop = win.scrollY < 60;
        if (this.scrollAtTop !== atTop) {
          this.scrollAtTop = atTop;
          this.cdr.detectChanges();
        }
      };
      win.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => win.removeEventListener('scroll', onScroll));
    }
  }

  ngOnInit() {
    this.welcome.getWebInfo().subscribe((res: any) => {
      const data = res?.data ?? {};
      this.info.blogTotal = Number(data.blogTotal ?? 0);
      this.info.lifeTotal = Number(data.lifeTotal ?? 0);
      this.info.gameTotal = Number(data.gameTotal ?? 0);
      this.info.blogCharTotal = Number(data.blogCharTotal ?? 0);
      this.info.recentBlogs = data.recentBlogs ?? [];
      this.info.runDays = Number(data.runDays ?? 0);
      this.info.profile = data.profile ?? undefined;
      this.numLoading = false;
    });

    // 公告是可选内容，取不到就当没有，不要影响首页其余部分
    this.welcome.getAnnouncement().subscribe({
      next: (res: any) => {
        this.announcement = res?.data ?? null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.announcement = null;
      },
    });
  }

  ngAfterViewInit(): void {
    this.data = [];
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    // 精选卡片只展示摘要，正文没必要整篇拉下来
    this.welcome
      .getBlogs({ star: true, contentLength: 200 })
      .subscribe((res: any) => {
      this.data = this.orderPinnedFirst(this.processedData(res['data'].data));
      this.cdr.detectChanges();
      this.loading = false;
    });
  }

  /** 置顶文章（id=0）永远排在精选列表最前，其余保持原有顺序。 */
  private orderPinnedFirst(items: any[]): any[] {
    items.forEach((item) => {
      item.pinned = isPinnedBlog(item);
    });
    return items
      .filter((item) => item.pinned)
      .concat(items.filter((item) => !item.pinned));
  }

  processedData(data: any): any {
    const PREVIEW_LENGTH = 200;
    const processedData = data.map((item: any) => {
      // API 已按 PREVIEW_LENGTH 截断，长度达到上限即说明原文更长
      if (item.content.length >= PREVIEW_LENGTH) {
        return {
          ...item,
          content: item.content.substring(0, PREVIEW_LENGTH) + '...',
        };
      }
      return item; // 如果长度不超过上限，则保持原样
    });
    return processedData;
  }

  detail(): void {
    this.modal.create({ nzContent: this.more, nzFooter: [] },);
  }

  /** 公告卡片：标题放弹窗标题栏，正文与发布时间交给详情组件 */
  openAnnouncement(): void {
    if (!this.announcement) {
      return;
    }

    this.modal.create({
      nzTitle: this.announcement.title,
      nzContent: AnnouncementDetailComponent,
      nzData: this.announcement,
      nzFooter: null,
      nzWidth: 'min(560px, 92vw)',
    });
  }

  copy(value: string): void {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        this.msg.success('已复制联系方式，好耶(๑＞ڡ＜)☆');
      })
      .catch((error) => { });
  }

  /** 向下滚动到文章区，避开固定 header 的高度 */
  scrollToContent(): void {
    const el = document.getElementById('content-start');
    if (el) {
      const headerOffset = 60; // 48px header + 12px 留白
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}



import {
  Component,
  DestroyRef,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
  NgZone,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EditMessageComponent } from '../../components/about/edit-message/edit-message.component';
import { AboutService } from './about.service';
import { WindowService } from '../../services/window.service';
import { QuickUp } from '../../common_ui/animations/animation';

interface NavItem {
  id: string;
  label: string;
}

interface TimelineItem {
  date: string;
  title: string;
  text: string;
}

interface GameEntry {
  name: string;
  note: string;
}

interface GameGroup {
  label: string;
  entries: GameEntry[];
}

interface WritingStat {
  platform: string;
  value: string;
}

const SectionFade = trigger('SectionFade', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px)' }),
    animate(
      '320ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

const expandCollapse = trigger('expandCollapse', [
  state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
  state('expanded', style({ height: '*', overflow: 'hidden', opacity: 1 })),
  transition('collapsed <=> expanded', animate('280ms cubic-bezier(0.22, 1, 0.36, 1)')),
]);

@Component({
  selector: 'flower-about',
  standalone: true,
  imports: [
    NzFlexModule,
    NzIconModule,
    NzTypographyModule,
    NzDividerModule,
    NzImageModule,
    NzSpinModule,
    NzPaginationModule,
    NzPopoverModule,
    DatePipe,
    RouterModule,
    EditMessageComponent,
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
  animations: [QuickUp, SectionFade, expandCollapse],
})
export class AboutComponent implements AfterViewInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private observer: IntersectionObserver | null = null;
  private sectionElements: Map<string, HTMLElement> = new Map();

  activeSection = signal<string>('hero');
  private suppressObserver = false;
  isMobile = signal<boolean>(false);
  expandedHobby = signal<Record<string, boolean>>({ game: false, writing: false });
  copiedCard = signal<string | null>(null);

  // ---- Message board state ----
  messages: any[] = [];
  loadingMessages = true;
  messagePage = 1;
  messageCount = 0;

  navItems: NavItem[] = [
    { id: 'hero', label: '再花' },
    { id: 'hobbies', label: '爱好' },
    { id: 'connect', label: '连接' },
    { id: 'site', label: '本站' },
    { id: 'messages', label: '留言' },
  ];

  // ---- 游戏数据（桌面端 & 移动端统一使用） ----
  gameGroups: GameGroup[] = [
    {
      label: '正在玩',
      entries: [
        { name: '三角洲行动', note: '我是区（蠕动ing）' },
      ],
    },
    {
      label: '在玩的手游',
      entries: [
        { name: '阴阳师', note: '我为什么要玩这个' },
        { name: '想不想修真', note: '怀旧文字数值修仙游戏' },
        { name: '崩铁/绝区零', note: '老米懂我喜欢什么' },
      ],
    },
    {
      label: '最喜欢的五款游戏',
      entries: [
        { name: '死亡搁浅', note: '小岛秀夫就是神' },
        { name: '群星 (Stellaris)', note: '不知道玩什么就开一把' },
        { name: '只狼：影逝二度', note: '心态蜕变的开始' },
        { name: '艾尔登法环', note: '最爱的RPG没有之一' },
        { name: '最终幻想14', note: '边骂边玩' },
      ],
    },
  ];

  // ---- 写作数据 ----
  writingParagraphs: string[] = [
    '初中由于字太丑被班主任要求每天练字，后逐渐爱上了练字和写作，自认为练的还算不错。笔尖沉甸甸的，充满知识的厚重感，我很喜欢这种感觉。',
    '互联网的便利，让分享欲很强的我，热衷于在各个平台创作和写作。',
  ];

  writingStats: WritingStat[] = [
    { platform: '知乎', value: '阅读 1,004,883' },
    { platform: '掘金', value: '阅读 46,699' },
    { platform: '花墨', value: '阅读 7,364' },
  ];

  writingClosing: string = '在作为技术初学者时，我热衷于用抽象复杂的语言来展示自己的高深和熟练。然而随着知识的摄取，我逐渐感觉自己的无知。现在我更想用简洁易懂、通俗的文字去讲清我所掌握的技术和经验。';

  // ---- 联系方式 & 社区平台 ----
  contacts: { icon: string; label: string; value: string; key: string; qrKey: string; extra: string }[] = [
    // { icon: 'qq', label: 'QQ', value: '446840401', key: 'qq', qrKey: 'qq', extra: '' },
    // { icon: 'wechat', label: '微信', value: 'zaihua_huahua', key: 'wechat', qrKey: 'wx', extra: '工作应酬用' },
    { icon: 'mail', label: '邮箱', value: 'ZyZy1724@gmail.com', key: 'email', qrKey: '', extra: '' },
  ];

  socialPlatforms: { icon: string; label: string; url: string; extra: string }[] = [
    { icon: 'github', label: 'GitHub', url: 'https://github.com/ZaiHuaOvO', extra: '开发' },
    { icon: 'bilibili', label: '哔哩哔哩', url: 'https://space.bilibili.com/37339368', extra: '剪辑' },
    { icon: 'xiaohongshu', label: '小红书', url: 'https://www.xiaohongshu.com/user/profile/611e060e00000000200289fc', extra: '拼豆' },
    { icon: 'zhihu', label: '知乎', url: 'https://www.zhihu.com/people/zai-hua-14-76', extra: '停更' },
    { icon: 'juejin', label: '掘金', url: 'https://juejin.cn/user/4002664676073741', extra: '停更' },
  ];

  websiteTimeline: TimelineItem[] = [
    { date: '2024/10/10', title: '项目在云服务器上部署', text: '什么，我有博客了？' },
    { date: '2024/10/31', title: '域名通过工信部、公安联网双备案', text: '' },
    { date: '2024/11/06', title: '正式进入运营', text: '' },
    { date: '2025/01/03', title: '友链功能上线', text: '第一个友链会是谁呢？' },
    { date: '2025/02/20', title: '游戏板块上线', text: '游戏糕手再花上线！' },
    { date: '2025/10/10', title: '建站一周年，加入十年之约', text: '一周年快乐！' },
    { date: '2026/04/09', title: '大幅重写并优化花墨的底层逻辑，花墨变得更快了', text: 'Angular糕手再花(不是)' },
    { date: '2026/04/10', title: '统一并完善了花墨的主题样式和细节，花墨变得更好看了', text: '' },
    { date: '2026/04/20', title: '点滴功能回归！开始碎碎念', text: '' },
    { date: '2026/04/28', title: '花墨真正接入了 CDN', text: '以前一直接错了！' },
    { date: '2026/07/15', title: '新增博客和点滴评论功能', text: '为网站加上一些交互感' },
    { date: '2026/07/24', title: '重写了一个可爱的欢迎页', text: '' },
    { date: '2026/08/04', title: '新增装备图鉴模块', text: '记录一下我的老朋友们' },
    { date: '未完待续', title: '', text: '' },
  ];

  constructor(
    private window: WindowService,
    private about: AboutService,
    private msg: NzMessageService,
    private zone: NgZone,
  ) {
    this.window.bindIsMobile(this.destroyRef, (mobile) => {
      this.isMobile.set(mobile);
    });
    this.loadMessages();
  }

  ngAfterViewInit(): void {
    this.setupScrollSpy();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /* ---------- scrollspy ---------- */

  private setupScrollSpy(): void {
    for (const item of this.navItems) {
      const el = document.getElementById(`about-section-${item.id}`);
      if (el) this.sectionElements.set(item.id, el);
    }

    if (this.sectionElements.size === 0) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.suppressObserver) return;
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset['sectionId'];
          if (entry.isIntersecting && id) {
            this.activeSection.set(id);
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -40% 0px' },
    );

    this.sectionElements.forEach((el) => this.observer!.observe(el));
  }

  scrollTo(id: string): void {
    // Immediately highlight the clicked nav item and suppress observer
    this.activeSection.set(id);
    this.suppressObserver = true;
    setTimeout(() => { this.suppressObserver = false; }, 600);

    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const sectionEl = this.sectionElements.get(id);
    if (sectionEl) {
      const titleEl = sectionEl.querySelector<HTMLElement>('h2.section-title');
      if (titleEl) {
        titleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /* ---------- hobbies ---------- */

  toggleHobby(hobby: 'game' | 'writing'): void {
    this.expandedHobby.update(v => ({ ...v, [hobby]: !v[hobby] }));
  }

  /* ---------- copy ---------- */

  @ViewChild('qqQRCode', { static: true }) qqQRCode!: TemplateRef<any>;
  @ViewChild('wxQRCode', { static: true }) wxQRCode!: TemplateRef<any>;

  qrContentFor(qrKey: string): TemplateRef<any> {
    return qrKey === 'qq' ? this.qqQRCode : this.wxQRCode;
  }

  copyContact(key: string, value: string, label: string): void {
    navigator.clipboard.writeText(value).then(() => {
      this.msg.success(`已复制${label}，欢迎邮件`);
      this.flashCopied(key);
    }).catch(() => { });
  }

  private flashCopied(card: string): void {
    this.copiedCard.set(card);
    setTimeout(() => this.copiedCard.set(null), 1500);
  }

  /* ---------- messages ---------- */

  loadMessages(): void {
    this.loadingMessages = true;
    this.about
      .getMessageList({ isApproved: true, pageSize: 30, page: this.messagePage })
      .subscribe((res: any) => {
        this.messages = res['data'].data;
        this.messageCount = res['data'].count;
        this.loadingMessages = false;
      });
  }

  navigateToUrl(url: string): void {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    window.open(url, '_blank');
  }
}

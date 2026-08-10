import { DatePipe, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { SlowUp, QuickUp, StaggerList } from '../../common_ui/animations/animation';
import { FlButtonComponent } from '../../common_ui/fl_ui/fl-button/fl-button.component';
import { FlCardDirective } from '../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlInputDirective } from '../../common_ui/fl_ui/fl-input/fl-input.directive';
import { LinkCardComponent } from '../../components/link/link-card/link-card.component';
import { SimpleCaptchaComponent } from '../../components/website/simple-captcha/simple-captcha.component';
import { extractHttpErrorMessage } from '../../shared/utils/http-error-message.util';
import { ApiLimiterService } from '../../services/api-limiter.service';
import { WindowService } from '../../services/window.service';
import { LinkService } from './link.service';

interface ArticleItem {
  title: string;
  link: string;
  source: string;
  sourceUrl: string;
  publishDate: string;
  summary?: string;
  sourceAvatar?: string;
  sourceFavicon?: string;
}

@Component({
  selector: 'flower-link',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NzFlexModule,
    NzTypographyModule,
    NzGridModule,
    NzSkeletonModule,
    NzInputModule,
    NzTooltipModule,
    NzModalModule,
    LinkCardComponent,
    FlButtonComponent,
    FlInputDirective,
    FlCardDirective,
    SimpleCaptchaComponent,
  ],
  templateUrl: './link.component.html',
  styleUrl: './link.component.css',
  animations: [SlowUp, QuickUp, StaggerList],
})
export class LinkComponent implements OnInit {
  private readonly modal = inject(NzModalService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  loading = true;
  articleLoading = true;
  submitting = false;
  isMobile = false;
  email = 'ZyZy1724@gmail.com';
  articleUpdatedAt = '';
  links: Array<{
    name: string;
    logo: string;
    url: string;
    description: string;
    email?: string;
  }> = [];
  friendArticles: ArticleItem[] = [];
  skeletonCards = [1, 2, 3, 4, 5, 6];
  skeletonArticles = [1, 2, 3, 4, 5];

  // Form validation
  logoPreviewUrl = '';

  // Profile card
  allCopied = false;
  copiedRow = '';

  form: {
    description: string;
    email: string;
    logo: string;
    name: string;
    rss: string;
    remark: string;
    url: string;
  } = {
    name: '',
    logo: '',
    url: '',
    description: '',
    email: '',
    rss: '',
    remark: '',
  };

  @ViewChild(SimpleCaptchaComponent)
  captchaComponent?: SimpleCaptchaComponent;

  constructor(
    private readonly window: WindowService,
    private readonly destroyRef: DestroyRef,
    private readonly link: LinkService,
    private readonly msg: NzMessageService,
    private readonly limiter: ApiLimiterService,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });

    this.link
      .getLinks({ isApproved: true })
      .subscribe((res: any) => {
        this.links = res['data'].data;
        this.loading = false;
      });

    this.getFriendArticles();
  }

  ngOnInit(): void {
    this.injectJsonLd();
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '友情链接 | 花墨',
      description: '花墨的个人博客友情链接页面，收录了好朋友的个人网站和博客。',
      url: 'https://flowersink.com/link',
    };

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    script.id = 'link-jsonld';
    const existing = this.document.getElementById('link-jsonld');
    if (existing) existing.remove();
    this.document.head.appendChild(script);
  }

  getFriendArticles(): void {
    this.articleLoading = true;
    this.link
      .getFriendArticles()
      .subscribe({
        next: (res: any) => {
          this.friendArticles = res['data'].data ?? [];
          this.articleUpdatedAt = res['data'].updatedAt ?? '';
          this.articleLoading = false;
        },
        error: () => {
          this.friendArticles = [];
          this.articleUpdatedAt = '';
          this.articleLoading = false;
        },
      });
  }

  onLogoChange(): void {
    const url = this.form.logo.trim();
    if (!url) {
      this.logoPreviewUrl = '';
      return;
    }
    try {
      new URL(url);
      this.logoPreviewUrl = url;
    } catch {
      this.logoPreviewUrl = '';
    }
  }

  copyAllInfo(): void {
    const text =
`网站名称：花墨
LOGO地址：https://api.flowersink.com/img/logo.png
网站地址：https://flowersink.com
网站描述：好耶！是再花猫猫头ฅ•ω•ฅ
联系邮箱：${this.email}`;
    navigator.clipboard.writeText(text).then(() => {
      this.msg.success('已复制友链信息');
      this.allCopied = true;
      setTimeout(() => this.allCopied = false, 2000);
    });
  }

  copyField(label: string, value: string, rowKey: string): void {
    navigator.clipboard.writeText(value).then(() => {
      this.msg.success(`已复制${label}`);
      this.copiedRow = rowKey;
      setTimeout(() => {
        if (this.copiedRow === rowKey) this.copiedRow = '';
      }, 1500);
    });
  }

  submit(): void {
    if (this.isFormIncomplete()) {
      this.msg.info('还有必填项没写完哦，补齐再来申请吧 (｡ì _ í｡)');
      return;
    }

    if (!this.captchaComponent?.isReady) {
      this.msg.info('验证码还在赶来的路上，再等等呀 (´ . .̫ . `)');
      return;
    }

    const captchaPayload = this.captchaComponent.buildPayload();
    if (!captchaPayload) {
      this.msg.info('验证码结果还没填呢，先算一下吧 (｀・ω・´)');
      return;
    }

    const cooldownMessage = this.limiter.canCallApi('site-link');
    if (cooldownMessage) {
      this.msg.info(`刚提交过一次啦，${cooldownMessage} 秒后再试试吧 (＞＜)`);
      return;
    }

    this.submitting = true;
    const normalizedEmail = this.form.email.trim();
    this.link
      .addLink({
        ...this.form,
        email: normalizedEmail || undefined,
        ...captchaPayload,
      })
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.form = {
              name: '',
              logo: '',
              url: '',
              description: '',
              email: '',
              rss: '',
              remark: '',
            };
            this.logoPreviewUrl = '';
            this.limiter.markApiCall('site-link');
            this.captchaComponent?.refresh();
            this.showSuccessModal();
          }
          this.submitting = false;
        },
        error: (error) => {
          this.captchaComponent?.refresh();
          this.msg.error(
            extractHttpErrorMessage(
              error,
              '友链申请失败啦，稍后再试试吧 (╥﹏╥)',
            ),
          );
          this.submitting = false;
        },
      });
  }

  showSuccessModal(): void {
    this.modal.success({
      nzTitle: '申请已提交',
      nzContent: `
        <p>感谢你对「花墨」的认可</p>
        <p>好耶ฅ•ω•ฅ，已将你的申请发送至再花的邮箱</p>
        <p>再花会在 <strong>1-5 个工作日</strong> 内通过你的联系邮箱通知结果（若填写）</p>
        <p>有任何问题可通过底部的联系方式联系再花</p>
      `,
      nzCancelText: null,
      nzOkText: '我再看看',
      nzOkType: 'primary',
      nzCentered: true,
      nzClosable: true,
      nzMaskClosable: true,
    });
  }

  isFormIncomplete(): boolean {
    const optionalKeys = new Set(['email', 'rss', 'remark']);
    return Object.keys(this.form).some(
      (key) =>
        !optionalKeys.has(key) &&
        !this.form[key as keyof typeof this.form]?.trim(),
    );
  }
}

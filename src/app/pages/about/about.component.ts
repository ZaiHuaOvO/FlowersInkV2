import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
  NgZone,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { EditMessageComponent } from '../../components/about/edit-message/edit-message.component';
import { GithubContributionsComponent } from '../../components/about/github-contributions/github-contributions.component';
import { AboutService } from './about.service';
import { WindowService } from '../../services/window.service';
import { ensureMarkdownRuntimeLoaded } from '../../shared/utils/markdown-runtime-loader.util';

interface NavItem {
  id: string;
  label: string;
}

interface MessageItem {
  id: number;
  content: string;
  url: string;
  name: string;
  createDate: string;
}

/** 便签的外观全部由留言 id 派生，保证同一条留言在任何时候都是同一个样子 */
interface NoteLook {
  bg: string;
  tilt: string;
  offset: string;
  pinX: string;
  delay: string;
}

interface WallNote {
  item: MessageItem;
  look: NoteLook;
}

/** 低饱和暖色纸，与站点主题同调 */
const NOTE_COLORS = ['#f7e7c8', '#f2d3c3', '#d8e2ce', '#d6e2e8', '#e3dce8', '#e9dbc9'];

/** 滚动高亮的判定线：标题顶边进到这条线以上就算「当前区块」 */
const ACTIVE_LINE = 120;

@Component({
  selector: 'flower-about',
  standalone: true,
  imports: [
    MarkdownModule,
    NzFlexModule,
    NzSpinModule,
    NzPaginationModule,
    DatePipe,
    EditMessageComponent,
    GithubContributionsComponent,
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent implements AfterViewInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  isMobile = signal<boolean>(false);

  /** 关于页正文（Markdown），整页内容都由后台编辑 */
  markdownContent = '';
  loadingMarkdown = true;
  markdownReady = false;

  /** Prism / ClipboardJS 的加载 Promise，正文落地前要先 await 它 */
  private markdownRuntime?: Promise<void>;

  /** 左侧导航：完全由 markdown 渲染出的 h1/h2 派生，后台加一节就多一项 */
  navItems = signal<NavItem[]>([]);
  activeSection = signal<string>('');

  // ---- Message board state ----
  messages = signal<MessageItem[]>([]);
  loadingMessages = true;
  messagePage = 1;
  messageCount = 0;

  /** 便签墙的实际可用宽度，决定列数 */
  private wallWidth = signal(0);
  messageColumns = computed<WallNote[][]>(() =>
    this.buildWall(this.messages(), this.wallWidth()),
  );

  constructor(
    private window: WindowService,
    private about: AboutService,
    private zone: NgZone,
  ) {
    this.window.bindIsMobile(this.destroyRef, (mobile) => {
      this.isMobile.set(mobile);
    });
    this.markdownRuntime = this.initMarkdownRuntime();
    this.loadAboutPage();
    this.loadMessages();
  }

  ngAfterViewInit(): void {
    this.observeWallWidth();
  }

  ngOnDestroy(): void {
    this.wallObserver?.disconnect();
    this.detachScrollSpy();
  }

  /* ---------- about content ---------- */

  private loadAboutPage(): void {
    this.loadingMarkdown = true;
    this.about.getAboutPage().subscribe({
      next: async (res: any) => {
        // 必须等运行时就绪再塞正文。clipboard 从 false 翻成 true 会让 ngx-markdown
        // 重渲染一遍，而重渲染会清掉已经搬进正文里的贡献图组件。
        await this.markdownRuntime;
        this.markdownContent = res?.data?.content ?? '';
        this.loadingMarkdown = false;
      },
      error: () => {
        this.loadingMarkdown = false;
      },
    });
  }

  /**
   * Prism / ClipboardJS 只在这里补：关于页正文可能被写成带代码块的样式。
   * 与正文并发加载，只在内部消化失败，永不 reject。
   */
  private async initMarkdownRuntime(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      await ensureMarkdownRuntimeLoaded();
      this.markdownReady = true;
    } catch {
      this.markdownReady = false;
    }
  }

  /** markdown DOM 就绪：派生导航、接管站内链接、把占位符换成组件、同步一次高亮 */
  onMarkdownReady(): void {
    this.buildNav();
    this.bindLinks();
    this.mountContributions();
    this.updateActiveSection();
  }

  /**
   * 正文里单独一行 `@github-contributions` 会被换成贡献图组件。
   * 不写这一行时组件就留在正文之后（模板里的默认位置）。
   * 重渲染后占位符会重新出现，所以这个方法本身要幂等。
   */
  private mountContributions(): void {
    const container = this.markdownContainer();
    const widget = this.host.nativeElement.querySelector('.about-contributions');
    if (!container || !widget) {
      return;
    }

    const marker = Array.from(container.querySelectorAll('p')).find(
      (paragraph) => paragraph.textContent?.trim() === '@github-contributions'
    );

    marker?.replaceWith(widget);
  }

  /**
   * 导航项 = 正文里的 h1/h2，一项都不写死。
   * 「留言」就在正文末尾，所以留言墙的入口也来自同一处，后台加一节导航就多一项。
   */
  private buildNav(): void {
    const container = this.markdownContainer();
    if (!container) {
      this.navItems.set([]);
      return;
    }

    const items: NavItem[] = [];
    container
      .querySelectorAll('h1:not(blockquote h1), h2:not(blockquote h2)')
      .forEach((node, index) => {
        const heading = node as HTMLElement;
        const id = `about-heading-${index}`;
        heading.id = id;
        items.push({ id, label: heading.textContent?.trim() ?? '' });
      });

    this.navItems.set(items);
  }

  /**
   * 正文里的链接：
   * - 站内路径（/game、/blog/all…）走 Router，保持单页跳转
   * - 站外链接新窗口打开
   * - mailto:/tel: 之类保持浏览器默认行为
   */
  private bindLinks(): void {
    const container = this.markdownContainer();
    if (!container) {
      return;
    }

    container.querySelectorAll('a[href]').forEach((node) => {
      const link = node as HTMLAnchorElement;
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('#')) {
        return;
      }

      if (href.startsWith('/')) {
        link.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          void this.router.navigateByUrl(href);
        });
        return;
      }

      if (/^https?:/i.test(href)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
  }

  private markdownContainer(): HTMLElement | null {
    return this.host.nativeElement.querySelector('#currentAnchor');
  }

  /* ---------- scrollspy ---------- */

  private scrollHandler: (() => void) | null = null;

  private attachScrollSpy(): void {
    if (!isPlatformBrowser(this.platformId) || this.scrollHandler) {
      return;
    }
    const onScroll = () => this.updateActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    this.scrollHandler = () => window.removeEventListener('scroll', onScroll);
  }

  private detachScrollSpy(): void {
    this.scrollHandler?.();
    this.scrollHandler = null;
  }

  private updateActiveSection(): void {
    const items = this.navItems();
    if (!items.length) {
      return;
    }

    this.attachScrollSpy();

    // 每次现算位置：留言墙载入 / 窗口缩放都会改变正文高度，缓存 offsetTop 会失准
    let active = items[0].id;
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el && el.getBoundingClientRect().top <= ACTIVE_LINE) {
        active = item.id;
      }
    }
    this.activeSection.set(active);
  }

  scrollTo(id: string): void {
    // 第一项是 hero 标题，回到顶部才能连头像一起看到
    if (id === this.navItems()[0]?.id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- sticky note wall ---------- */

  @ViewChild('wall') private wallRef?: ElementRef<HTMLElement>;
  private wallObserver: ResizeObserver | null = null;

  private observeWallWidth(): void {
    const el = this.wallRef?.nativeElement;
    if (!el) return;

    // 同步量一次，否则首帧会先按单列铺开、下一帧才跳成多列
    this.wallWidth.set(el.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') return;
    this.wallObserver = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      this.zone.run(() => this.wallWidth.set(width));
    });
    this.wallObserver.observe(el);
  }

  private wallColumnCount(width: number): number {
    if (width >= 880) return 4;
    if (width >= 740) return 3;
    if (width >= 470) return 2;
    return 1;
  }

  /** 轮转分配：第 i 条留言落到第 i 列，读起来就是「从新到旧、从左到右」 */
  private buildWall(items: MessageItem[], width: number): WallNote[][] {
    if (!items.length) return [];

    const count = this.wallColumnCount(width);
    // 单列（窄屏）时收敛倾斜与错位，避免一列里东倒西歪太晃眼
    const scale = count === 1 ? 0.35 : 1;
    const columns: WallNote[][] = Array.from({ length: count }, () => []);

    items.forEach((item, index) => {
      columns[index % count].push({ item, look: this.buildLook(item, index, scale) });
    });

    return columns;
  }

  private buildLook(item: MessageItem, index: number, scale: number): NoteLook {
    const random = this.noteRandom(item.id);
    const color = NOTE_COLORS[Math.floor(random() * NOTE_COLORS.length)];
    const tilt = (random() * 3.4 - 1.7) * scale;
    const offset = (random() * 7 - 3.5) * scale;
    const pinX = random() * 16 - 8;

    return {
      bg: color,
      tilt: tilt.toFixed(2),
      offset: `${offset.toFixed(1)}px`,
      pinX: `${pinX.toFixed(1)}px`,
      delay: `${Math.min(index * 26, 520)}ms`,
    };
  }

  /** mulberry32：同一个 id 永远得到同一串「随机」数 */
  private noteRandom(seed: number): () => number {
    let state = (Math.imul(seed, 0x9e3779b1) + 0x6d2b79f5) >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- messages ---------- */

  loadMessages(): void {
    this.loadingMessages = true;
    this.about
      .getMessageList({ isApproved: true, pageSize: 30, page: this.messagePage })
      .subscribe((res: any) => {
        this.messages.set(res['data'].data ?? []);
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

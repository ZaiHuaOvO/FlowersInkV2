import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BlogCardComponent } from '../../../components/blog/blog-card/blog-card.component';
import { MeCardComponent } from '../../../components/website/me-card/me-card.component';
import { BlogService } from '../blog.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { GeneralService } from '../../../services/general.service';
import { debounceTime } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzAnchorModule } from 'ng-zorro-antd/anchor';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { BlogCommentComponent } from '../../../components/blog/blog-comment/blog-comment.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { commentArray } from '../../../ts/comment-emoji';
import { getCommentEmojiSymbol } from '../../../shared/utils/comment-emoji-symbol.util';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { ensureMarkdownRuntimeLoaded } from '../../../shared/utils/markdown-runtime-loader.util';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';
import { extractHttpErrorMessage } from '../../../shared/utils/http-error-message.util';

@Component({
  selector: 'flower-blog-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzFlexModule,
    NzIconModule,
    NzTagModule,
    NzTypographyModule,
    NzDividerModule,
    MarkdownModule,
    NzPageHeaderModule,
    NzAvatarModule,
    NzAnchorModule,
    DatePipe,
    BlogTitleComponent,
    BlogCommentComponent,
    NzTooltipModule,
    NzSpinModule,
    NzAffixModule,
    FlCardDirective,
    FlTagDirective,
    NzImageModule,
    RouterModule,
    FlButtonComponent,
  ],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
  animations: [SlowUp, QuickUp],
})
export class BlogDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly copyrightEmail = 'ZyZy1724@gmail.com';
  Id: any;
  data: any = {};
  page = 1;
  count = 0;
  tag = '';
  tagList: any[] = [];
  loading = true;
  markdownContent: string = '';
  anchors: Array<{
    children: Array<{ href: string; title: string }>;
    href: string;
    title: string;
  }> = [];
  currentAnchor: string | undefined;
  targetOffset: number = 0;
  isMobile: boolean = false;
  private isSyncing = false;
  commentArray: any[] = commentArray;
  displayCommentArray: any[] = [];
  markdownReady = false;
  commentSubmitting = false;
  private readonly destroyRef: DestroyRef;

  /** 阅读进度 0–100 */
  readingProgress = 0;
  private scrollListener: (() => void) | null = null;

  /** 相关文章 */
  relatedBlogs: any[] = [];
  relatedLoading = false;

  @ViewChild('editor', { static: true })
  editorRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('viewer', { static: true }) viewerRef!: ElementRef<HTMLDivElement>;

  constructor(
    private blog: BlogService,
    private general: GeneralService,
    private activateInfo: ActivatedRoute,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: object,
    private window: WindowService,
    private msg: NzMessageService,
    private title: Title,
    private nzImageService: NzImageService,
    destroyRef: DestroyRef,
  ) {
    this.destroyRef = destroyRef;
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() {
    this.initMarkdownRuntime();
    this.activateInfo.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params: any) => {
        this.Id = params.get('id');
        if (Number(this.Id) != 0 && isPlatformBrowser(this.platformId)) {
          this.getBlogDetail();
        }
      });
  }

  ngAfterViewInit(): void {
    this.bindReadingProgress();
  }

  ngOnDestroy(): void {
    this.scrollListener?.();
  }

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

  private bindReadingProgress(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.readingProgress = docHeight > 0 ? Math.min(Math.round((scrollTop / docHeight) * 100), 100) : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.scrollListener = () => window.removeEventListener('scroll', onScroll);
  }

  getBlogDetail(): void {
    this.loading = true;
    this.blog.getBlogDetail(this.Id).subscribe((res: any) => {
      this.data = res['data'];
      this.title.setTitle(`${this.data.title} | 花墨`);
      this.getComment();
      this.markdownContent = this.data.content;
      this.loading = false;
      this.commentSubmitting = false;
      this.loadRelatedBlogs();
    });
    if (isPlatformBrowser(this.platformId)) {
      this.targetOffset = window.innerHeight / 2;
    }
  }

  private loadRelatedBlogs(): void {
    this.relatedLoading = true;
    this.blog.getRelatedBlogs(this.Id).subscribe({
      next: (res: any) => {
        const raw = res?.data;
        // 兼容两种后端返回格式: { data: { data: [...] } } 或 { data: [...] }
        this.relatedBlogs = (Array.isArray(raw) ? raw : raw?.data ?? []).slice(0, 4);
        this.relatedLoading = false;
      },
      error: () => {
        this.relatedLoading = false;
      },
    });
  }

  generateAnchors(): void {
    const headings = this.el.nativeElement.querySelectorAll(
      '#currentAnchor :where(h1, h2):not(blockquote h1):not(blockquote h2)'
    );
    this.anchors = [];

    let currentH1: {
      children: Array<{ href: string; title: string }>;
      href: string;
      title: string;
    } | null = null;

    headings.forEach((heading: HTMLElement, index: number) => {
      const id = `heading-${index}`;
      heading.id = id;
      const tagName = heading.tagName.toLowerCase();

      if (tagName === 'h1') {
        currentH1 = { href: `#${id}`, title: heading.innerText, children: [] };
        this.anchors.push(currentH1);
      } else if (tagName === 'h2') {
        const h2Anchor = { href: `#${id}`, title: heading.innerText };
        if (currentH1) {
          currentH1.children.push(h2Anchor);
        } else {
          this.anchors.push({ ...h2Anchor, children: [] });
        }
      }
    });

    this.bindImagePreview();
  }

  private bindImagePreview(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = this.el.nativeElement.querySelector('#currentAnchor');
    if (!container) return;

    const imgElements: HTMLImageElement[] = Array.from(
      container.querySelectorAll('img')
    );
    if (imgElements.length === 0) return;

    const nzImages = imgElements.map((img) => ({
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '',
    }));

    imgElements.forEach((img, index) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        const vpScale = 0.8;
        const maxW = window.innerWidth * vpScale;
        const maxH = window.innerHeight * vpScale;
        const nw = img.naturalWidth || maxW;
        const nh = img.naturalHeight || maxH;
        const zoom = Math.min(maxW / nw, maxH / nh, 1);

        const ref = this.nzImageService.preview(nzImages, {
          nzZoom: Math.round(zoom * 100) / 100,
          nzRotate: 0,
        });
        ref.switchTo(index);
      });
    });
  }

  onBack(): void {
    history.go(-1);
  }

  onScroll(source: 'editor' | 'viewer'): void {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const editor = this.editorRef.nativeElement;
    const viewer = this.viewerRef.nativeElement;
    const sourceElement = source === 'editor' ? editor : viewer;
    const targetElement = source === 'editor' ? viewer : editor;

    const scrollRatio =
      sourceElement.scrollTop /
      (sourceElement.scrollHeight - sourceElement.clientHeight);

    targetElement.scrollTop =
      scrollRatio * (targetElement.scrollHeight - targetElement.clientHeight);

    this.isSyncing = false;
  }

  comment(emoji: any): void {
    if (this.commentSubmitting) return;

    this.commentSubmitting = true;
    this.blog
      .comment(this.activateInfo.snapshot.params['id'], {
        emojiType: emoji['key'],
      })
      .subscribe({
        next: (res: any) => {
          if (res['data'].success) {
            this.msg.info(res['data']['msg']);
            this.getBlogDetail();
          } else {
            this.msg.error(res['data']['msg']);
            this.commentSubmitting = false;
          }
        },
        error: (error) => {
          this.msg.error(
            extractHttpErrorMessage(error, '评论提交失败啦，稍后再试试吧 (╥﹏╥)'),
          );
          this.commentSubmitting = false;
        },
      });
  }

  getComment(): void {
    const data: any[] = this.data['comment'];
    const countMap = (data ?? []).reduce(
      (map, item) => {
        map[item.emojiType] = item.count;
        return map;
      },
      {} as Record<string, number>,
    );

    this.displayCommentArray = this.commentArray.map((item) => ({
      ...item,
      count: countMap[item.key] ?? 0,
    }));
  }

  emojiSymbol(key: string): string {
    return getCommentEmojiSymbol(key);
  }

  copyLink(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.msg.success('链接已复制到剪贴板 ✿');
    });
  }
}

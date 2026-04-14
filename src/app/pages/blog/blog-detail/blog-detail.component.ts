import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzAnchorModule } from 'ng-zorro-antd/anchor';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { BlogCommentComponent } from '../../../components/blog/blog-comment/blog-comment.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { commentArray } from '../../../ts/comment-emoji';
import { getCommentEmojiSymbol } from '../../../shared/utils/comment-emoji-symbol.util';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ensureMarkdownRuntimeLoaded } from '../../../shared/utils/markdown-runtime-loader.util';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';

@Component({
  selector: 'flower-blog-detail',
  standalone: true,
  imports: [
    CommonModule,
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
    NzToolTipModule,
    NzSpinModule,
    FlCardDirective,
    FlTagDirective,
  ],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
  animations: [SlowUp, QuickUp],
})
export class BlogDetailComponent implements OnInit, AfterViewInit {
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
  commentArray: any[] = commentArray
  displayCommentArray: any[] = [];
  markdownReady = false;

  @ViewChild('editor', { static: true })
  editorRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('viewer', { static: true }) viewerRef!: ElementRef<HTMLDivElement>;
  constructor(
    private blog: BlogService,
    private general: GeneralService,
    private activateInfo: ActivatedRoute,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: object, // Detect runtime platform.
    private window: WindowService,
    private msg: NzMessageService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() {
    this.initMarkdownRuntime();
    this.activateInfo.paramMap.subscribe(params => {
      this.Id = params.get('id');
      if (this.Id && isPlatformBrowser(this.platformId)) {
        this.getBlogDetail();
      }
    });
  }
  ngAfterViewInit(): void {
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

  getBlogDetail(): void {
    this.loading = true;
    this.blog
      .getBlogDetail(this.Id)
      .subscribe((res: any) => {
        this.data = res['data'];
        this.getComment();
        this.markdownContent = this.data.content;
        this.loading = false;
      });
    if (isPlatformBrowser(this.platformId)) {
      this.targetOffset = window.innerHeight / 2;
    }
  }

  generateAnchors(): void {
    const headings = this.el.nativeElement.querySelectorAll(
      '#currentAnchor h1, #currentAnchor h2'
    );
    this.anchors = [];

    let currentH1:
      | { children: Array<{ href: string; title: string }>; href: string; title: string }
      | null = null;

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
  }

  onBack(): void {
    history.go(-1);
  }

  onScroll(source: 'editor' | 'viewer'): void {
    if (this.isSyncing) return; // Guard against recursive sync.

    this.isSyncing = true;

    const editor = this.editorRef.nativeElement;
    const viewer = this.viewerRef.nativeElement;

    const sourceElement = source === 'editor' ? editor : viewer;
    const targetElement = source === 'editor' ? viewer : editor;

    // Compute scroll ratio.
    const scrollRatio =
      sourceElement.scrollTop /
      (sourceElement.scrollHeight - sourceElement.clientHeight);

    // Apply ratio to target element.
    targetElement.scrollTop =
      scrollRatio * (targetElement.scrollHeight - targetElement.clientHeight);

    this.isSyncing = false;
  }

  comment(emoji: any): void {
    this.loading = true;
    this.blog.comment(this.activateInfo.snapshot.params['id'], {
      emojiType: emoji['key'],
    }).subscribe((res: any) => {
      if (res['data'].success) {
        this.msg.info(res['data']['msg']);
        this.commentArray.forEach(item => {
          if (item.key === emoji['key']) {
            item.count++;
          }
          this.getBlogDetail();
        })
      } else {
        this.msg.error(res['data']['msg']);
        this.loading = false;
      }
    })
  }

  getComment(): void {
    const data: any[] = this.data['comment'];

    const countMap = (data ?? []).reduce((map, item) => {
      map[item.emojiType] = item.count;
      return map;
    }, {} as Record<string, number>);

    this.displayCommentArray = this.commentArray.map(item => ({
      ...item,
      count: countMap[item.key] ?? 0,
    }));
  }

  emojiSymbol(key: string): string {
    return getCommentEmojiSymbol(key);
  }

}


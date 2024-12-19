import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzAnchorModule } from 'ng-zorro-antd/anchor';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { MarkdownModule } from 'ngx-markdown';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { ActivatedRoute } from '@angular/router';
import { GeneralService } from '../../../services/general.service';
import { WindowService } from '../../../services/window.service';
import { WorldService } from '../world.service';
import { BookCardComponent } from '../../../components/world/book-card/book-card.component';
import { NzImageModule } from 'ng-zorro-antd/image';

@Component({
  selector: 'flower-book-detail',
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
    NzImageModule,
  ],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.css',
  animations: [SlowUp, QuickUp],
})
export class BookDetailComponent implements OnInit {
  data: any = {};
  loading = true;
  markdownContent: string = '';
  anchors: Array<{
    children: any;
    href: string;
    title: string;
  }> = [];
  currentAnchor: string | undefined;
  targetOffset: number = 0;
  isMobile: boolean = false;
  constructor(
    private world: WorldService,
    private general: GeneralService,
    private activateInfo: ActivatedRoute,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: object, // 注入 PLATFORM_ID 以检测运行平台
    private window: WindowService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit() {
    this.getBookDetail();
  }

  getBookDetail(): void {
    this.loading = true;
    this.world
      .getBookDetail(this.activateInfo.snapshot.params['id'])
      .subscribe((res: any) => {
        this.data = res['data'];
        this.markdownContent = this.data.content;
        this.loading = false;
      });
    if (isPlatformBrowser(this.platformId)) {
      this.targetOffset = window.innerHeight / 2;
    }
  }

  generateAnchors(): void {
    const headings = this.el.nativeElement.querySelectorAll('h1, h2, h3, h4');
    this.anchors = [];

    let currentH1: { children: any; href: string; title: string } | null = null;
    let currentH2: { children: any; href: string; title: string } | null = null;
    let currentH3: { children: any; href: string; title: string } | null = null;

    headings.forEach((heading: HTMLElement, index: number) => {
      const id = `heading-${index}`;
      heading.id = id;
      const tagName = heading.tagName.toLowerCase();

      if (tagName === 'h1') {
        currentH1 = { href: `#${id}`, title: heading.innerText, children: [] };
        this.anchors.push(currentH1);
        currentH2 = null; // Reset currentH2 when a new H1 is found
        currentH3 = null; // Reset currentH3 when a new H1 is found
      } else if (tagName === 'h2' && currentH1) {
        currentH2 = { href: `#${id}`, title: heading.innerText, children: [] };
        currentH1.children.push(currentH2);
        currentH3 = null; // Reset currentH3 when a new H2 is found
      } else if (tagName === 'h3' && currentH2) {
        currentH3 = { href: `#${id}`, title: heading.innerText, children: [] };
        currentH2.children.push(currentH3);
      } else if (tagName === 'h4' && currentH3) {
        currentH3.children.push({ href: `#${id}`, title: heading.innerText });
      }
    });
  }

  onBack(): void {
    history.go(-1);
  }
}

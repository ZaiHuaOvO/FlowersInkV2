import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { NodataComponent } from '../../../components/website/nodata/nodata.component';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';
import { QuickUp, RefreshUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { LifeService } from '../life.service';
import { inferOriginalImageUrl } from '../../../shared/utils/image-url.util';

type LifeCategory = '美食' | '日常' | '游戏' | '摘抄' | '';

interface LifeImageAsset {
  previewUrl: string;
  originalUrl: string;
}

interface LifeTimelineItem {
  id: number;
  title: string;
  content: string;
  source: string;
  date: Date;
  dateText: string;
  tags: string[];
  primaryTag: string;
  images: LifeImageAsset[];
}

interface TimelineSection {
  key: string;
  year: number;
  month: number;
  label: string;
  items: LifeTimelineItem[];
}

interface YearNavigator {
  year: number;
  months: Array<{ key: string; month: number; label: string }>;
}

@Component({
  selector: 'flower-heart',
  standalone: true,
  imports: [
    CommonModule,
    NzAffixModule,
    NzFlexModule,
    NzSpinModule,
    NzTypographyModule,
    NzTagModule,
    NzImageModule,
    BlogTitleComponent,
    NodataComponent,
    FlCardDirective,
    FlTagDirective,
  ],
  templateUrl: './heart.component.html',
  styleUrl: './heart.component.css',
  providers: [DatePipe],
  animations: [QuickUp, RefreshUp],
})
export class HeartComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly tagFilters: Array<{ label: string; value: LifeCategory }> = [
    { label: '全部', value: '' },
    { label: '美食', value: '美食' },
    { label: '日常', value: '日常' },
    { label: '游戏', value: '游戏' },
    { label: '摘抄', value: '摘抄' },
  ];

  loading = true;
  isMobile = false;
  errorMessage = '';
  affixOffsetTop = 84;
  isAffixDisabled = true;

  private readonly imageService = inject(NzImageService);
  private readonly platformId = inject(PLATFORM_ID);
  private allSections: TimelineSection[] = [];

  selectedTag: LifeCategory = '';
  sectionList: TimelineSection[] = [];
  yearNavigator: YearNavigator[] = [];
  activeSectionKey = '';
  filterMotionTick = 0;
  tagCounter: Record<string, number> = {};
  totalItemCount = 0;
  private scrollAnimationFrame: number | null = null;
  private isProgrammaticScroll = false;
  private programmaticTargetSectionKey = '';

  @ViewChildren('monthSection') monthSectionRefs!: QueryList<ElementRef<HTMLElement>>;

  constructor(
    private readonly lifeService: LifeService,
    private readonly windowService: WindowService,
  ) {
    this.windowService.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit(): void {
    this.fetchTimeline();
  }

  ngAfterViewInit(): void {
    this.monthSectionRefs.changes.subscribe(() => {
      this.syncActiveSection();
    });
  }

  ngOnDestroy(): void {
    this.cancelActiveScroll();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.syncActiveSection();
  }

  get activeSection(): TimelineSection | undefined {
    if (!this.sectionList.length) {
      return undefined;
    }

    return (
      this.sectionList.find((section) => section.key === this.activeSectionKey) ??
      this.sectionList[0]
    );
  }

  get activeYear(): number | null {
    return this.activeSection?.year ?? null;
  }

  trackSection(_: number, section: TimelineSection): string {
    return section.key;
  }

  trackItem(_: number, item: LifeTimelineItem): number {
    return item.id;
  }

  selectTag(tag: LifeCategory): void {
    if (this.selectedTag === tag) {
      return;
    }

    this.selectedTag = tag;
    this.applyFilterAndNavigator();
  }

  jumpToYear(year: number): void {
    const target = this.yearNavigator.find((item) => item.year === year);
    const firstMonth = target?.months?.[0];
    if (!firstMonth) {
      return;
    }
    this.scrollToSection(firstMonth.key);
  }

  jumpToMonth(sectionKey: string): void {
    this.scrollToSection(sectionKey);
  }

  retry(): void {
    this.fetchTimeline();
  }

  getTagCount(tag: LifeCategory): number {
    if (!tag) {
      return this.totalItemCount;
    }
    return this.tagCounter[tag] ?? 0;
  }

  shouldShowSource(item: LifeTimelineItem): boolean {
    return !!item.source;
  }

  getTagClass(tag: string): string {
    switch (tag) {
      case '美食':
        return 'tag-food';
      case '日常':
        return 'tag-daily';
      case '游戏':
        return 'tag-game';
      case '摘抄':
        return 'tag-excerpt';
      default:
        return 'tag-default';
    }
  }

  getImageGridClass(item: LifeTimelineItem): string {
    if (item.primaryTag === '游戏') {
      if (item.images.length === 1) {
        return 'grid-game-one';
      }
      if (item.images.length === 2) {
        return 'grid-game-two';
      }
      return 'grid-game-three';
    }

    if (item.images.length === 1) {
      return 'grid-default-one';
    }
    if (item.images.length === 2) {
      return 'grid-default-two';
    }
    return 'grid-default-three';
  }

  isExcerpt(item: LifeTimelineItem): boolean {
    return item.primaryTag === '摘抄';
  }

  getImageItemClass(item: LifeTimelineItem): string {
    return item.primaryTag === '游戏' && item.images.length === 1
      ? 'image-item image-item-rect'
      : 'image-item image-item-square';
  }

  previewCompressed(image: LifeImageAsset): void {
    this.imageService.preview([{ src: image.previewUrl }], {
      nzZoom: 0.8,
      nzRotate: 0,
    });
  }

  previewOriginal(event: MouseEvent, image: LifeImageAsset): void {
    event.stopPropagation();
    this.imageService.preview([{ src: image.originalUrl }], {
      nzZoom: 0.8,
      nzRotate: 0,
    });
  }

  private fetchTimeline(): void {
    this.loading = true;
    this.errorMessage = '';

    this.lifeService.getLifeList().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const normalized = list
          .map((item: any) => this.normalizeLifeItem(item))
          .sort(
            (a: LifeTimelineItem, b: LifeTimelineItem) =>
              b.date.getTime() - a.date.getTime(),
          );

        this.totalItemCount = normalized.length;
        this.tagCounter = this.buildTagCounter(normalized);
        this.allSections = this.buildSections(normalized);
        this.applyFilterAndNavigator();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = '点滴加载失败，请稍后重试。';
        this.totalItemCount = 0;
        this.allSections = [];
        this.sectionList = [];
        this.yearNavigator = [];
      },
    });
  }

  private applyFilterAndNavigator(): void {
    const selectedTag = this.selectedTag;

    if (!selectedTag) {
      this.sectionList = this.allSections;
    } else {
      this.sectionList = this.allSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.tags.includes(selectedTag)),
        }))
        .filter((section) => section.items.length > 0);
    }

    this.yearNavigator = this.buildYearNavigator(this.sectionList);
    this.activeSectionKey = this.sectionList[0]?.key ?? '';
    this.filterMotionTick += 1;

    setTimeout(() => {
      this.syncActiveSection();
    });
  }

  private buildTagCounter(items: LifeTimelineItem[]): Record<string, number> {
    const counter: Record<string, number> = {
      美食: 0,
      日常: 0,
      游戏: 0,
      摘抄: 0,
    };

    items.forEach((item) => {
      item.tags.forEach((tag) => {
        if (counter[tag] === undefined) {
          return;
        }
        counter[tag] += 1;
      });
    });

    return counter;
  }

  private buildSections(items: LifeTimelineItem[]): TimelineSection[] {
    const map = new Map<string, TimelineSection>();

    items.forEach((item) => {
      const year = item.date.getFullYear();
      const month = item.date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          year,
          month,
          label: `${year}年${month}月`,
          items: [],
        });
      }

      map.get(key)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
  }

  private buildYearNavigator(sections: TimelineSection[]): YearNavigator[] {
    const map = new Map<number, YearNavigator>();

    sections.forEach((section) => {
      if (!map.has(section.year)) {
        map.set(section.year, {
          year: section.year,
          months: [],
        });
      }

      map.get(section.year)!.months.push({
        key: section.key,
        month: section.month,
        label: `${section.month}月`,
      });
    });

    return Array.from(map.values()).sort((a, b) => b.year - a.year);
  }

  private normalizeLifeItem(item: any): LifeTimelineItem {
    const date = this.parseDate(item?.date ?? item?.createDate);
    const tags = this.normalizeTags(item?.tag);
    const images = this.normalizeImages(item?.image, item?.image_first);
    const source = String(item?.source ?? '').trim();

    return {
      id: Number(item?.id ?? 0),
      title: String(item?.title ?? '').trim() || '',
      content: String(item?.content ?? '').trim(),
      source,
      date,
      dateText: this.formatDateTime(date),
      tags,
      primaryTag: tags[0] ?? '',
      images,
    };
  }

  private normalizeTags(rawTag: unknown): string[] {
    const source = Array.isArray(rawTag) ? rawTag : rawTag ? [rawTag] : [];
    return source
      .map((tag) => this.normalizeTagLabel(tag))
      .filter((tag) => !!tag);
  }

  private normalizeTagLabel(rawTag: unknown): string {
    const tag = String(rawTag ?? '').trim();
    if (!tag) {
      return '';
    }

    if (tag.includes('事件')) {
      return '日常';
    }
    if (tag.includes('美食')) {
      return '美食';
    }
    if (tag.includes('日常')) {
      return '日常';
    }
    if (tag.includes('游戏')) {
      return '游戏';
    }
    if (tag.includes('摘抄')) {
      return '摘抄';
    }

    return tag;
  }

  private normalizeImages(rawImage: unknown, rawCover: unknown): LifeImageAsset[] {
    const imageList = Array.isArray(rawImage) ? rawImage : [];
    const coverList = Array.isArray(rawCover) ? rawCover : [];
    const source = imageList.length > 0 ? imageList : coverList;

    return source
      .map((img) => this.normalizeImageAsset(img))
      .filter((img): img is LifeImageAsset => !!img);
  }

  private normalizeImageAsset(rawImage: unknown): LifeImageAsset | null {
    if (!rawImage) {
      return null;
    }

    if (typeof rawImage === 'string') {
      const previewUrl = rawImage.trim();
      if (!previewUrl) {
        return null;
      }
      return {
        previewUrl,
        originalUrl: inferOriginalImageUrl(previewUrl),
      };
    }

    const record = rawImage as Record<string, unknown>;
    const previewUrl = String(record['url'] ?? '').trim();
    if (!previewUrl) {
      return null;
    }

    const originalRaw = String(record['img_url'] ?? '').trim();
    return {
      previewUrl,
      originalUrl: originalRaw || inferOriginalImageUrl(previewUrl),
    };
  }

  private parseDate(value: unknown): Date {
    const parsed = new Date(String(value ?? ''));
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }

  private scrollToSection(sectionKey: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = this.monthSectionRefs.find(
      (ref) => ref.nativeElement.dataset['sectionKey'] === sectionKey,
    );

    if (
      !target ||
      typeof (target.nativeElement as HTMLElement).scrollIntoView !== 'function'
    ) {
      return;
    }

    this.cancelActiveScroll();
    this.isProgrammaticScroll = true;
    this.programmaticTargetSectionKey = sectionKey;
    this.activeSectionKey = sectionKey;
    const targetElement = target.nativeElement as HTMLElement;
    const targetTop = targetElement.getBoundingClientRect().top + window.scrollY - 86;
    this.smoothScrollTo(targetTop, 1000);
  }

  private smoothScrollTo(targetTop: number, durationMs: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const startTop = window.scrollY || window.pageYOffset || 0;
    const delta = targetTop - startTop;
    if (Math.abs(delta) < 1) {
      this.isProgrammaticScroll = false;
      this.programmaticTargetSectionKey = '';
      this.syncActiveSection();
      return;
    }
    const startTime = performance.now();

    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const easedProgress = this.easeInOutCubic(progress);
      window.scrollTo(0, startTop + delta * easedProgress);

      if (progress < 1) {
        this.scrollAnimationFrame = window.requestAnimationFrame(step);
      } else {
        this.scrollAnimationFrame = null;
        this.isProgrammaticScroll = false;
        this.programmaticTargetSectionKey = '';
        this.syncActiveSection();
      }
    };

    this.scrollAnimationFrame = window.requestAnimationFrame(step);
  }

  private cancelActiveScroll(): void {
    if (this.scrollAnimationFrame !== null && isPlatformBrowser(this.platformId)) {
      window.cancelAnimationFrame(this.scrollAnimationFrame);
    }
    this.scrollAnimationFrame = null;
    this.isProgrammaticScroll = false;
    this.programmaticTargetSectionKey = '';
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  private syncActiveSection(): void {
    if (!isPlatformBrowser(this.platformId) || !this.monthSectionRefs?.length) {
      return;
    }

    if (this.isProgrammaticScroll) {
      if (this.programmaticTargetSectionKey) {
        this.activeSectionKey = this.programmaticTargetSectionKey;
      }
      return;
    }

    const threshold = 120;
    let activeKey = this.sectionList[0]?.key ?? '';

    this.monthSectionRefs.forEach((ref) => {
      const element = ref.nativeElement as HTMLElement;
      if (typeof element?.getBoundingClientRect !== 'function') {
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.top - threshold <= 0) {
        const key = element.dataset['sectionKey'];
        if (key) {
          activeKey = key;
        }
      }
    });

    this.activeSectionKey = activeKey;
  }
}

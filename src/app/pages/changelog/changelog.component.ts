import {
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { BlogTitleComponent } from '../../components/blog/blog-title/blog-title.component';
import { QuickUp } from '../../common_ui/animations/animation';
import changelogData from './changelog-data.json';

type ChangelogType = 'feat' | 'fix' | 'style' | 'chore';
type TypeFilter = ChangelogType | '';

interface ChangelogRecord {
  uid: string;
  sha: string;
  repo: 'site' | 'api';
  type: ChangelogType;
  date: string;
  desc: string;
  important: boolean;
}

interface ChangelogDay {
  key: string;
  label: string;
  items: ChangelogRecord[];
}

interface ChangelogSection {
  key: string;
  year: number;
  month: number;
  label: string;
  days: ChangelogDay[];
}

interface YearNavigator {
  year: number;
  months: Array<{ key: string; month: number; label: string }>;
}

interface HeatCell {
  date: string;
  count: number;
  level: number;
}

interface HeatColumn {
  cells: HeatCell[];
  label: string;
}

const TYPE_META: Record<ChangelogType, { label: string; en: string }> = {
  feat: { label: '开发', en: 'feat' },
  fix: { label: '修复', en: 'fix' },
  style: { label: '样式', en: 'style' },
  chore: { label: '优化', en: 'chore' },
};

const TYPE_ORDER: ChangelogType[] = ['feat', 'fix', 'style', 'chore'];

const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

@Component({
  selector: 'flower-changelog',
  standalone: true,
  imports: [
    NzAffixModule,
    NzFlexModule,
    BlogTitleComponent,
  ],
  templateUrl: './changelog.component.html',
  styleUrl: './changelog.component.css',
  animations: [QuickUp],
})
export class ChangelogComponent {
  private readonly records: ChangelogRecord[] = (
    changelogData.records as unknown as ChangelogRecord[]
  ).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  readonly affixOffsetTop = 84;

  selectedType: TypeFilter = '';
  sectionList: ChangelogSection[] = [];
  yearNavigator: YearNavigator[] = [];
  activeSectionKey = '';
  mobileNavVisible = false;
  typeCounts: Record<string, number> = {};
  totalCount = 0;
  firstDate = '';
  heatColumns: HeatColumn[] = [];

  private allSections: ChangelogSection[] = [];
  private isProgrammaticScroll = false;
  private scrollRAF = 0;
  private programmaticScrollTimer = 0;

  @ViewChildren('monthSection') monthSectionRefs!: QueryList<
    ElementRef<HTMLElement>
  >;

  constructor() {
    this.totalCount = this.records.length;
    this.firstDate = this.records[this.records.length - 1]?.date ?? '';
    this.typeCounts = this.buildTypeCounts(this.records);
    this.allSections = this.buildSections(this.records);
    this.heatColumns = this.buildHeatmap(this.records);
    this.applyFilter();
  }

  get activeYear(): number | null {
    return this.sectionList.find(
      (section) => section.key === this.activeSectionKey,
    )?.year ?? null;
  }

  get typeFilters(): TypeFilter[] {
    return ['', ...TYPE_ORDER];
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isProgrammaticScroll || typeof window === 'undefined') {
      return;
    }
    if (this.scrollRAF) {
      return;
    }
    this.scrollRAF = window.requestAnimationFrame(() => {
      this.scrollRAF = 0;
      this.syncActiveSection();
    });
  }

  getTypeLabel(type: ChangelogType): string {
    return TYPE_META[type].label;
  }

  getTypeClass(type: ChangelogType): string {
    return `type-${type}`;
  }

  getTagFilterLabel(type: TypeFilter): string {
    if (!type) {
      return '全部';
    }
    const meta = TYPE_META[type];
    return `${meta.label}(${meta.en})`;
  }

  getCommitUrl(record: ChangelogRecord): string {
    const repo = record.repo === 'api' ? 'flower-ink-api' : 'FlowersInkV2';
    return `https://github.com/ZaiHuaOvO/${repo}/commit/${record.sha}`;
  }

  selectType(type: TypeFilter): void {
    if (this.selectedType === type) {
      return;
    }
    this.selectedType = type;
    this.applyFilter();
  }

  jumpToYear(year: number): void {
    this.closeMobileNav();
    const firstMonth = this.yearNavigator.find((item) => item.year === year)?.months?.[0];
    if (firstMonth) {
      this.scrollToSection(firstMonth.key);
    }
  }

  jumpToMonth(sectionKey: string): void {
    this.closeMobileNav();
    this.scrollToSection(sectionKey);
  }

  openMobileNav(): void {
    this.mobileNavVisible = true;
  }

  closeMobileNav(): void {
    this.mobileNavVisible = false;
  }

  trackSection(_: number, section: ChangelogSection): string {
    return section.key;
  }

  trackDay(_: number, day: ChangelogDay): string {
    return day.key;
  }

  trackRecord(_: number, record: ChangelogRecord): string {
    return record.uid;
  }

  trackColumn(_: number, column: HeatColumn): string {
    return column.cells[0]?.date ?? '';
  }

  trackCell(_: number, cell: HeatCell): string {
    return cell.date;
  }

  private applyFilter(): void {
    const type = this.selectedType;
    this.sectionList = type
      ? this.allSections
          .map((section) => ({
            ...section,
            days: section.days
              .map((day) => ({
                ...day,
                items: day.items.filter((item) => item.type === type),
              }))
              .filter((day) => day.items.length > 0),
          }))
          .filter((section) => section.days.length > 0)
      : this.allSections;

    this.yearNavigator = this.buildYearNavigator(this.sectionList);
    this.activeSectionKey = this.sectionList[0]?.key ?? '';

    if (typeof window !== 'undefined' && this.monthSectionRefs?.length) {
      setTimeout(() => this.syncActiveSection());
    }
  }

  private buildTypeCounts(records: ChangelogRecord[]): Record<string, number> {
    const counts: Record<string, number> = { '': records.length };
    TYPE_ORDER.forEach((type) => {
      counts[type] = records.filter((record) => record.type === type).length;
    });
    return counts;
  }

  private buildSections(records: ChangelogRecord[]): ChangelogSection[] {
    const map = new Map<string, ChangelogSection>();

    records.forEach((record) => {
      const [year, month, day] = record.date.split('-');
      const yearNum = Number(year);
      const monthNum = Number(month);
      const key = `${year}-${month}`;
      const dayKey = `${month}-${day}`;

      let section = map.get(key);
      if (!section) {
        section = {
          key,
          year: yearNum,
          month: monthNum,
          label: `${year}年${monthNum}月`,
          days: [],
        };
        map.set(key, section);
      }

      let dayBlock = section.days.find((d) => d.key === dayKey);
      if (!dayBlock) {
        dayBlock = { key: dayKey, label: `${month}-${day}`, items: [] };
        section.days.push(dayBlock);
      }
      dayBlock.items.push(record);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.year - a.year || b.month - a.month,
    );
  }

  private buildYearNavigator(sections: ChangelogSection[]): YearNavigator[] {
    const map = new Map<number, YearNavigator>();

    sections.forEach((section) => {
      let entry = map.get(section.year);
      if (!entry) {
        entry = { year: section.year, months: [] };
        map.set(section.year, entry);
      }
      entry.months.push({
        key: section.key,
        month: section.month,
        label: `${section.month}月`,
      });
    });

    return Array.from(map.values()).sort((a, b) => b.year - a.year);
  }

  /** 近一年提交热力图（GitHub 风格，7 行 × 53 列，每格按提交次数分 5 级） */
  private buildHeatmap(records: ChangelogRecord[]): HeatColumn[] {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setDate(end.getDate() - 364);

    const countByDate = new Map<string, number>();
    records.forEach((record) => {
      countByDate.set(record.date, (countByDate.get(record.date) ?? 0) + 1);
    });

    const firstSunday = new Date(start);
    firstSunday.setDate(start.getDate() - start.getDay());

    const columns: HeatColumn[] = [];
    let prevMonthKey = '';

    const cursor = new Date(firstSunday);
    while (cursor <= end) {
      const cells: HeatCell[] = [];
      for (let w = 0; w < 7; w++) {
        const day = new Date(cursor);
        day.setDate(cursor.getDate() + w);
        const inRange = day >= start && day <= end;
        const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        const count = inRange ? (countByDate.get(dateKey) ?? 0) : 0;
        cells.push({ date: dateKey, count, level: Math.min(5, count) });
      }

      const monthKey = cells[0].date.slice(0, 7);
      const label = monthKey !== prevMonthKey ? MONTH_LABELS[Number(monthKey.slice(5, 7)) - 1] : '';
      prevMonthKey = monthKey;
      columns.push({ cells, label });

      cursor.setDate(cursor.getDate() + 7);
    }

    return columns;
  }

  private scrollToSection(sectionKey: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    const target = this.monthSectionRefs.find(
      (ref) => ref.nativeElement.dataset['sectionKey'] === sectionKey,
    );
    if (!target) {
      return;
    }

    this.isProgrammaticScroll = true;
    this.activeSectionKey = sectionKey;

    const element = target.nativeElement as HTMLElement;
    const top = element.getBoundingClientRect().top + window.scrollY - 86;
    window.scrollTo({ top, behavior: 'smooth' });

    window.clearTimeout(this.programmaticScrollTimer);
    this.programmaticScrollTimer = window.setTimeout(() => {
      this.isProgrammaticScroll = false;
      this.syncActiveSection();
    }, 900);
  }

  private syncActiveSection(): void {
    if (typeof window === 'undefined' || !this.monthSectionRefs?.length) {
      return;
    }

    const threshold = 120;
    let activeKey = this.sectionList[0]?.key ?? '';

    this.monthSectionRefs.forEach((ref) => {
      const element = ref.nativeElement as HTMLElement;
      if (typeof element?.getBoundingClientRect !== 'function') {
        return;
      }
      if (element.getBoundingClientRect().top - threshold <= 0) {
        const key = element.dataset['sectionKey'];
        if (key) {
          activeKey = key;
        }
      }
    });

    this.activeSectionKey = activeKey;
  }
}

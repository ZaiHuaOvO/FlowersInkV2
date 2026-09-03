import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import {
  GithubContribService,
  GithubContributionsData,
} from '../../../services/github-contrib.service';

interface GhDayCell {
  date: string;
  count: number;
  level: number;
}

interface GhColumn {
  label: string;
  cells: GhDayCell[];
}

const MIN_YEAR = 2024;

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'flower-github-contributions',
  standalone: true,
  templateUrl: './github-contributions.component.html',
  styleUrl: './github-contributions.component.css',
})
export class GithubContributionsComponent implements OnInit {
  private readonly service = inject(GithubContribService);

  @ViewChild('ghChart') ghChart?: ElementRef<HTMLDivElement>;

  loading = true;
  error = false;

  columns: GhColumn[] = [];
  totalText = '';
  years: number[] = [];
  selectedKey = 'last';

  private hasData = false;
  private requestSeq = 0;

  readonly skeletonColumns = Array.from({ length: 52 }, (_, i) => i);
  readonly skeletonRows = [0, 1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.load();
  }

  selectKey(key: string): void {
    if (key === this.selectedKey) {
      return;
    }
    this.selectedKey = key;
    this.load();
  }

  load(): void {
    this.error = false;
    const silent = this.hasData;
    const seq = ++this.requestSeq;

    if (!silent) {
      this.loading = true;
    }

    const year = this.selectedKey === 'last' ? undefined : Number(this.selectedKey);
    this.service.getContributions(year).subscribe({
      next: (res: object) => {
        if (seq !== this.requestSeq) {
          return;
        }
        const payload = (res as { data: GithubContributionsData })['data'];
        this.applyPayload(payload);
        this.hasData = true;
        this.loading = false;
      },
      error: () => {
        if (seq !== this.requestSeq) {
          return;
        }
        if (!silent) {
          this.loading = false;
          this.error = true;
        }
      },
    });
  }

  cellTitle(cell: GhDayCell): string {
    const [year, monthRaw, dayRaw] = cell.date.split('-');
    const dateText = `${year}年${monthRaw}月${dayRaw}日`;
    return `${cell.count} 次提交，${dateText}`;
  }

  private applyPayload(payload: GithubContributionsData): void {
    this.years = this.computeYearTabs();
    const total = payload.total ?? 0;
    const period =
      payload.mode === 'year' && payload.year !== undefined
        ? `${payload.year}年`
        : '近一年';
    this.totalText = `${total.toLocaleString('en-US')} 次提交，${period}`;
    this.columns = this.buildColumns(payload);
    this.animateChartIn();
  }

  /** 切换年份/刷新数据后用 Web Animations 对整图做一次淡入，避免闪烁 */
  private animateChartIn(): void {
    const el = this.ghChart?.nativeElement;
    if (!el || typeof el.animate !== 'function') {
      return;
    }
    try {
      el.style.opacity = '0';
      el.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      ).onfinish = () => {
        el.style.opacity = '';
      };
      // 兜底：页面处于后台/动画被暂停时也能恢复不透明，避免卡在隐藏态
      window.setTimeout(() => {
        el.style.opacity = '';
      }, 500);
    } catch {
      el.style.opacity = '';
    }
  }

  private computeYearTabs(): number[] {
    const currentYear = new Date().getFullYear();
    const tabs: number[] = [];
    for (let i = 0; i < 3; i++) {
      const year = currentYear - i;
      if (year >= MIN_YEAR) {
        tabs.push(year);
      }
    }
    return tabs;
  }

  /**
   * 生成以周日为一周首日、每周完整 7 天的贡献日历。
   * 年份视图铺满 1-1 ~ 12-31（当年 12 月之后的未来日期也以灰块显示）；
   * 首末列的周缺口（跨年前后）用无提交灰块补齐。
   */
  private buildColumns(payload: GithubContributionsData): GhColumn[] {
    const dayMap = new Map<string, number>();
    let firstDate = '';
    let lastDate = '';
    for (const week of payload.weeks ?? []) {
      for (const day of week.days ?? []) {
        dayMap.set(day.date, day.count);
        if (!firstDate || day.date < firstDate) {
          firstDate = day.date;
        }
        if (day.date > lastDate) {
          lastDate = day.date;
        }
      }
    }

    const isYearView = payload.mode === 'year' && payload.year !== undefined;
    let windowStart = firstDate;
    let windowEnd = lastDate;
    if (isYearView && payload.year !== undefined) {
      windowStart = `${payload.year}-01-01`;
      windowEnd = `${payload.year}-12-31`;
    }

    const levelOf = this.buildLevelMapper(dayMap);

    const firstColumnStart = this.startOfWeekSunday(parseDate(windowStart));
    const lastColumnStart = this.startOfWeekSunday(parseDate(windowEnd));

    const columns: GhColumn[] = [];
    const cursor = new Date(firstColumnStart);

    while (cursor.getTime() <= lastColumnStart.getTime()) {
      const cells: GhDayCell[] = [];
      for (let i = 0; i < 7; i++) {
        const key = dateKey(cursor);
        cells.push({
          date: key,
          count: 0,
          level: 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      for (const cell of cells) {
        const inWindow = cell.date >= windowStart && cell.date <= windowEnd;
        const count = inWindow ? (dayMap.get(cell.date) ?? 0) : 0;
        cell.count = count;
        cell.level = levelOf(count);
      }

      // 月份标签放在该月 1 号所在的列：边缘只露几天的月份（1 号不在窗口内）不显示，
      // 相邻标签自然相隔约一个月的列数，避免重叠
      let label = '';
      for (const cell of cells) {
        if (cell.date >= windowStart && cell.date <= windowEnd && cell.date.endsWith('-01')) {
          label = `${Number(cell.date.slice(5, 7))}月`;
          break;
        }
      }

      columns.push({ label, cells });
    }

    return columns;
  }

  private startOfWeekSunday(date: Date): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay());
    return result;
  }

  private buildLevelMapper(
    dayMap: Map<string, number>,
  ): (count: number) => number {
    const activeCounts: number[] = [];
    for (const count of dayMap.values()) {
      if (count > 0) {
        activeCounts.push(count);
      }
    }

    const distinct = Array.from(new Set(activeCounts)).sort((a, b) => a - b);
    const span = distinct.length - 1;

    return (count: number): number => {
      if (count <= 0) {
        return 0;
      }
      if (span <= 0) {
        return 1;
      }
      const index = distinct.indexOf(count);
      return 1 + Math.round((index / span) * 3);
    };
  }
}

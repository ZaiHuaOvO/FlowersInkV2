import { Component, OnInit, inject } from '@angular/core';
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

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
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

  loading = true;
  error = false;

  columns: GhColumn[] = [];
  totalText = '';
  years: number[] = [];
  selectedKey = 'last';

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
    this.loading = true;
    this.error = false;

    const year = this.selectedKey === 'last' ? undefined : Number(this.selectedKey);
    this.service.getContributions(year).subscribe({
      next: (res: object) => {
        const payload = (res as { data: GithubContributionsData })['data'];
        this.applyPayload(payload);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  cellTitle(cell: GhDayCell): string {
    const [, monthRaw, dayRaw] = cell.date.split('-');
    const month = MONTH_LABELS[Number(monthRaw) - 1];
    const day = Number(dayRaw);
    const year = cell.date.slice(0, 4);
    const on = `${month} ${day}, ${year}`;
    if (cell.count <= 0) {
      return `No contributions on ${on}`;
    }
    const unit = cell.count === 1 ? 'contribution' : 'contributions';
    return `${cell.count} ${unit} on ${on}`;
  }

  private applyPayload(payload: GithubContributionsData): void {
    this.years = this.computeYearTabs();
    const total = payload.total ?? 0;
    this.totalText = `${total.toLocaleString('en-US')} contributions ${payload.label ?? ''}`;
    this.columns = this.buildColumns(payload);
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
    let prevMonthKey = '';
    const cursor = new Date(firstColumnStart);

    while (cursor.getTime() <= lastColumnStart.getTime()) {
      const cells: GhDayCell[] = [];
      let firstInWindow = '';
      for (let i = 0; i < 7; i++) {
        const key = dateKey(cursor);
        cells.push({
          date: key,
          count: 0,
          level: 0,
        });
        if (key >= windowStart && key <= windowEnd && !firstInWindow) {
          firstInWindow = key;
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      for (const cell of cells) {
        const inWindow = cell.date >= windowStart && cell.date <= windowEnd;
        const count = inWindow ? (dayMap.get(cell.date) ?? 0) : 0;
        cell.count = count;
        cell.level = levelOf(count);
      }

      const monthKey = firstInWindow ? firstInWindow.slice(0, 7) : '';
      const label =
        monthKey && monthKey !== prevMonthKey
          ? MONTH_LABELS[Number(monthKey.slice(5, 7)) - 1]
          : '';
      if (monthKey) {
        prevMonthKey = monthKey;
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

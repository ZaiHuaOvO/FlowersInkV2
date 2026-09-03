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
  cells: (GhDayCell | null)[];
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

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

  onYearChange(event: Event): void {
    const key = (event.target as HTMLSelectElement).value;
    if (key === this.selectedKey) {
      return;
    }
    this.selectedKey = key;
    this.load();
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
    this.years = (payload.years ?? []).slice().sort((a, b) => b - a);
    const total = payload.total ?? 0;
    this.totalText = `${total.toLocaleString('en-US')} contributions ${payload.label ?? ''}`;
    this.columns = this.buildColumns(payload);
  }

  /** 每列 = 一周，7 格按 Mon..Sun 对齐；颜色分级参考 GitHub 用计数分位数 */
  private buildColumns(payload: GithubContributionsData): GhColumn[] {
    const levelOf = this.buildLevelMapper(payload);

    const columns: GhColumn[] = [];
    let prevMonthKey = '';
    for (const week of payload.weeks ?? []) {
      const days = week.days ?? [];
      const cells: (GhDayCell | null)[] = new Array(7).fill(null);

      for (const day of days) {
        const row = (day.weekday + 6) % 7; // weekday: 0 = 周日；换算为顶部周一的行号
        if (row >= 0 && row < 7) {
          cells[row] = {
            date: day.date,
            count: day.count,
            level: levelOf(day.count),
          };
        }
      }

      const firstPresent = days.length ? days[0].date : '';
      const monthKey = firstPresent ? firstPresent.slice(0, 7) : '';
      const label =
        monthKey && monthKey !== prevMonthKey
          ? MONTH_LABELS[Number(monthKey.slice(5, 7)) - 1]
          : '';
      prevMonthKey = monthKey || prevMonthKey;

      columns.push({ label, cells });
    }

    return columns;
  }

  private buildLevelMapper(
    payload: GithubContributionsData,
  ): (count: number) => number {
    const activeCounts: number[] = [];
    for (const week of payload.weeks ?? []) {
      for (const day of week.days ?? []) {
        if (day.count > 0) {
          activeCounts.push(day.count);
        }
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

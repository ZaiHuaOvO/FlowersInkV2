import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from './api';
import { HttpService } from './http.service';

export interface GithubContributionDay {
  date: string;
  weekday: number;
  count: number;
}

export interface GithubContributionWeek {
  days: GithubContributionDay[];
}

export interface GithubContributionsData {
  username: string;
  mode: 'last-year' | 'year';
  year?: number;
  label: string;
  total: number;
  years: number[];
  weeks: GithubContributionWeek[];
}

@Injectable({
  providedIn: 'root',
})
export class GithubContribService {
  /** 客户端内存缓存时长：配合 API 侧 6h 缓存，让回访页面不再打接口 */
  private readonly cacheTtlMs = 15 * 60 * 1000;

  constructor(private http: HttpService) {}

  getContributions(year?: number): Observable<object> {
    const params = year === undefined ? undefined : { year: String(year) };
    return this.http.getCached(API.GITHUB_CONTRIBUTIONS, params, this.cacheTtlMs);
  }
}

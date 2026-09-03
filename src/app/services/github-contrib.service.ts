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
  constructor(private http: HttpService) {}

  getContributions(year?: number): Observable<object> {
    const params = year === undefined ? undefined : { year: String(year) };
    return this.http.get(API.GITHUB_CONTRIBUTIONS, params);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';
import { HTTP_CACHE_TTL } from '../../shared/constants/http-cache.constants';

export interface SubscriptionArticleItem {
  id: number;
  title: string;
  link: string;
  summary?: string;
  sourceId: number;
  sourceName: string;
  sourceAvatar?: string;
  sourceSiteUrl?: string;
  publishDate: string;
  publishTimestamp: number;
}

export interface SubscriptionSourceItem {
  id: number;
  name: string;
  avatar?: string;
  siteUrl?: string;
  /** 点击频道时跳转的博客地址（API 取 RSS 地址的 origin） */
  blogUrl: string;
  description?: string;
  count: number;
  latestAt: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class SubscribeService {
  constructor(private http: HttpService) {}

  getArticles(params: {
    page: number;
    pageSize: number;
    sourceId?: number;
  }): Observable<object> {
    return this.http.getCached(
      API.SUBSCRIPTION_ARTICLES,
      params,
      HTTP_CACHE_TTL.SHORT,
    );
  }

  getSources(): Observable<object> {
    return this.http.getCached(
      API.SUBSCRIPTION_SOURCES,
      undefined,
      HTTP_CACHE_TTL.LIST,
    );
  }
}

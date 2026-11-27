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
    // 频道顺序跟着各源的最新文章时间走，不做 GET 缓存：
    // 后台新增/删除后，刷新页面应立即看到新顺序。
    return this.http.get(API.SUBSCRIPTION_SOURCES);
  }
}

import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';
import { HTTP_CACHE_TTL } from '../../shared/constants/http-cache.constants';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  constructor(private http: HttpService) { }

  getBlogs(data?: any): Observable<object> {
    return this.http.getCached(API.BLOG, data, HTTP_CACHE_TTL.LIST);
  }

  getBlogDetail(Id: string, fid?: string): Observable<object> {
    return this.http.getCached(
      API.BLOG + `/detail/${Id}`,
      fid ? { fid } : undefined,
      HTTP_CACHE_TTL.DETAIL
    );
  }

  getRelatedBlogs(Id: string): Observable<object> {
    return this.http.get(API.BLOG_RELATED + `/${Id}`);
  }

  comment(Id: string, data: any): Observable<object> {
    return this.http.post<object>(API.BLOG + `/${Id}/comment`, data).pipe(
      tap(() => {
        this.http.invalidateGetCache([API.BLOG, API.TAG]);
      })
    );
  }

  likeBlog(Id: string): Observable<object> {
    return this.http.post<object>(API.BLOG + `/${Id}/like`, {}).pipe(
      tap(() => {
        this.http.invalidateGetCache([API.BLOG]);
      })
    );
  }

  getTags(): Observable<object> {
    return this.http.getCached(API.TAG, undefined, HTTP_CACHE_TTL.LONG);
  }

  /**
   * 标签筛选条可选图标的目录。
   * 静态数据、由 API 统一维护（后台的图标选择器读同一份），所以缓存给到 LONG。
   */
  getTagIcons(): Observable<object> {
    return this.http.getCached(API.TAG_ICONS, undefined, HTTP_CACHE_TTL.LONG);
  }
}

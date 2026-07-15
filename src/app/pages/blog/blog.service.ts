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

  getBlogDetail(Id: string): Observable<object> {
    return this.http.getCached(
      API.BLOG + `/detail/${Id}`,
      undefined,
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

  getArticleComments(blogId: string): Observable<object> {
    return this.http.get(
      API.BLOG + `/${blogId}/comments`,
    );
  }

  createArticleComment(blogId: string, data: any): Observable<object> {
    return this.http
      .post<object>(API.BLOG + `/${blogId}/comments`, data)
      .pipe(
        tap(() => {
          this.http.invalidateGetCache([
            API.BLOG + `/${blogId}/comments`,
          ]);
        }),
      );
  }

  getTags(): Observable<object> {
    return this.http.getCached(API.TAG, undefined, HTTP_CACHE_TTL.LONG);
  }
}

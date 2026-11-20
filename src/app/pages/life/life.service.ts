import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';
import { HTTP_CACHE_TTL } from '../../shared/constants/http-cache.constants';

@Injectable({
  providedIn: 'root',
})
export class LifeService {
  constructor(private http: HttpService) {}

  getLifeList(data?: any): Observable<object> {
    return this.http.getCached(API.LIFE, data, HTTP_CACHE_TTL.LIST);
  }

  addMessage(data?: any): Observable<object> {
    return this.http.post<object>(API.MESSAGE, data).pipe(
      tap(() => {
        this.http.invalidateGetCache([API.MESSAGE, API.LIFE, API.LIFE_TAG]);
      })
    );
  }

  getLifeTag(data?: any): Observable<object> {
    return this.http.getCached(API.LIFE_TAG, data, HTTP_CACHE_TTL.LONG);
  }

  /** 点滴详情：接口返回扁平对象 {...life, commentCount}，无 data 包装 */
  getLifeDetail(id: number): Observable<object> {
    return this.http.get(API.LIFE + `/${id}`);
  }

  likeLife(id: number): Observable<object> {
    return this.http.post<object>(`${API.LIFE}/${id}/like`, {});
  }

  getLifeComments(lifeId: number): Observable<object> {
    // 点滴列表里每条都有评论板，页面重建/切标签时会重复请求同一接口；
    // 缓存顺带把并发的重复请求合并成一次。评论本身改动频率低，30 秒足够新。
    return this.http.getCached(
      API.LIFE + `/${lifeId}/comments`,
      undefined,
      HTTP_CACHE_TTL.LIST,
    );
  }

  createLifeComment(lifeId: number, data: any): Observable<object> {
    return this.http
      .post<object>(API.LIFE + `/${lifeId}/comments`, data)
      .pipe(
        tap(() => {
          this.http.invalidateGetCache([
            API.LIFE,
            API.LIFE + `/${lifeId}/comments`,
          ]);
        }),
      );
  }

  editLifeComment(
    lifeId: number,
    commentId: number,
    data: any,
  ): Observable<object> {
    return this.http
      .patch<object>(API.LIFE + `/${lifeId}/comments/${commentId}/edit`, data)
      .pipe(
        tap(() => {
          this.http.invalidateGetCache([
            API.LIFE,
            API.LIFE + `/${lifeId}/comments`,
          ]);
        }),
      );
  }
}

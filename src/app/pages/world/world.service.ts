import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';
import { HTTP_CACHE_TTL } from '../../shared/constants/http-cache.constants';

@Injectable({
  providedIn: 'root',
})
export class WorldService {
  constructor(private http: HttpService) { }

  getBookList(data?: any): Observable<object> {
    return this.http.getCached(API.BOOK_LIST, data, HTTP_CACHE_TTL.LIST);
  }

  getBookDetail(Id: string): Observable<object> {
    return this.http.getCached(
      API.BOOK + `/${Id}`,
      undefined,
      HTTP_CACHE_TTL.DETAIL
    );
  }

  getLifeTag(data?: any): Observable<object> {
    return this.http.getCached(API.LIFE_TAG, data, HTTP_CACHE_TTL.LONG);
  }

  getGameList(data?: any): Observable<object> {
    return this.http.getCached(API.GAME_LIST, data, HTTP_CACHE_TTL.LIST);
  }
}

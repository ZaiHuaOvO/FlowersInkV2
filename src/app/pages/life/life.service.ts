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
}

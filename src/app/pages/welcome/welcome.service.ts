import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';
import { HTTP_CACHE_TTL } from '../../shared/constants/http-cache.constants';

@Injectable({
  providedIn: 'root',
})
export class WelcomeService {
  constructor(private http: HttpService) {}

  getBlogs(data?: any): Observable<object> {
    return this.http.getCached(API.BLOG, data, HTTP_CACHE_TTL.LIST);
  }

  getTags(): Observable<object> {
    return this.http.getCached(API.TAG, undefined, HTTP_CACHE_TTL.LONG);
  }

  visitWeb(): Observable<object> {
    return this.http.post(API.INFO, {});
  }

  getWebInfo(): Observable<object> {
    return this.http.getCached(API.DAY_INFO, undefined, HTTP_CACHE_TTL.SHORT);
  }
}

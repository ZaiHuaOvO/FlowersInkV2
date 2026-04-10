import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';
import { HTTP_CACHE_TTL } from '../../shared/constants/http-cache.constants';

@Injectable({
  providedIn: 'root',
})
export class LinkService {
  constructor(private http: HttpService) {}

  getLinks(data?: any): Observable<object> {
    return this.http.getCached(API.LINK, data, HTTP_CACHE_TTL.LONG);
  }

  addLink(data?: any): Observable<object> {
    return this.http.post<object>(API.LINK, data).pipe(
      tap(() => {
        this.http.invalidateGetCache([API.LINK]);
      })
    );
  }
}

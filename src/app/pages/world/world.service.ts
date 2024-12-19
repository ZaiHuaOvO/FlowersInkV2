import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';

@Injectable({
  providedIn: 'root',
})
export class WorldService {
  constructor(private http: HttpService) {}

  getBookList(data?: any): Observable<object> {
    return this.http.get(API.BOOK_LIST, data);
  }

  getBookDetail(Id: string): Observable<object> {
    return this.http.get(API.BOOK + `/${Id}`);
  }

  getLifeTag(data?: any): Observable<object> {
    return this.http.get(API.LIFE_TAG, data);
  }
}

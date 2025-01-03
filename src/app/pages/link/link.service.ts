import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';

@Injectable({
  providedIn: 'root',
})
export class LinkService {
  constructor(private http: HttpService) {}

  getLinks(data?: any): Observable<object> {
    return this.http.get(API.LINK, data);
  }

  addLink(data?: any): Observable<object> {
    return this.http.post(API.LINK, data);
  }
}

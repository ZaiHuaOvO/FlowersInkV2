import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';

@Injectable({
  providedIn: 'root',
})
export class WelcomeService {
  constructor(private http: HttpService) {}

  getBlogs(data?: any): Observable<object> {
    return this.http.get(API.BLOG, data);
  }

  getBlogDetail(Id: string): Observable<object> {
    return this.http.get(API.BLOG + `/${Id}`);
  }

  getTags(): Observable<object> {
    return this.http.get(API.TAG);
  }

  visitWeb(): Observable<object> {
    return this.http.post(API.INFO, {});
  }

  getWebInfo(): Observable<object> {
    return this.http.get(API.DAY_INFO);
  }
}

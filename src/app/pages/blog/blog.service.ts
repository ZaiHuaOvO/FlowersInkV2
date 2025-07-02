import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  constructor(private http: HttpService) { }

  getBlogs(data?: any): Observable<object> {
    return this.http.get(API.BLOG, data);
  }

  getBlogDetail(Id: string): Observable<object> {
    return this.http.get(API.BLOG + `/detail/${Id}`);
  }

  comment(Id: string, data: any): Observable<object> {
    return this.http.post(API.BLOG + `/${Id}/comment`, data);
  }

  getTags(): Observable<object> {
    return this.http.get(API.TAG);
  }
}

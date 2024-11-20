import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';

@Injectable({
  providedIn: 'root',
})
export class AboutService {
  constructor(private http: HttpService) {}

  getMessageList(data?: any): Observable<object> {
    return this.http.get(API.MESSAGE, data);
  }

  addMessage(data?: any): Observable<object> {
    return this.http.post(API.MESSAGE, data);
  }
}

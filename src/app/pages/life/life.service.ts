import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';

@Injectable({
  providedIn: 'root',
})
export class LifeService {
  constructor(private http: HttpService) {}

  getLifeList(data?: any): Observable<object> {
    return this.http.get(API.LIFE, data);
  }

  addMessage(data?: any): Observable<object> {
    return this.http.post(API.MESSAGE, data);
  }
}

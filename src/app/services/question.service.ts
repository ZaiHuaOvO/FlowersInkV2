import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from './api';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  constructor(private readonly http: HttpService) {}

  postQuestion(body: {
    content: string;
    captchaId: string;
    captchaAnswer: string;
  }): Observable<object> {
    return this.http.post(API.QUESTION, body);
  }
}

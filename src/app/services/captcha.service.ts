import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from './api';
import { HttpService } from './http.service';

export type CaptchaScene = 'message' | 'link';

export interface CaptchaPayload {
  captchaId: string;
  expiresIn: number;
  question: string;
  strategy: 'math';
}

@Injectable({
  providedIn: 'root',
})
export class CaptchaService {
  constructor(private readonly http: HttpService) {}

  getCaptcha(scene: CaptchaScene): Observable<object> {
    return this.http.get<object>(API.CAPTCHA, { scene });
  }
}

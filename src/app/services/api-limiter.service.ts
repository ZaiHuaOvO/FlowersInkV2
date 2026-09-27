import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiLimiterService {
  private readonly storageKeyPrefix = 'lastApiCall';
  /** 评论与留言的默认窗口，想法是 30 秒，调用时显式传 */
  private readonly defaultWindowMs = 60000;

  canCallApi(
    scope: string = 'default',
    windowMs: number = this.defaultWindowMs,
  ): string | null {
    const storageKey = `${this.storageKeyPrefix}:${scope}`;
    const lastCallTime = Number(localStorage.getItem(storageKey));

    if (lastCallTime) {
      const diff = Date.now() - lastCallTime;
      const remainingTime = windowMs - diff;

      if (remainingTime > 0) {
        return String(Math.ceil(remainingTime / 1000));
      }
    }

    return null;
  }

  markApiCall(scope: string = 'default'): void {
    const storageKey = `${this.storageKeyPrefix}:${scope}`;
    localStorage.setItem(storageKey, Date.now().toString());
  }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiLimiterService {
  private readonly storageKeyPrefix = 'lastApiCall';

  canCallApi(scope: string = 'default'): string | null {
    const storageKey = `${this.storageKeyPrefix}:${scope}`;
    const lastCallTime = Number(localStorage.getItem(storageKey));

    if (lastCallTime) {
      const diff = Date.now() - lastCallTime;
      const remainingTime = 60000 - diff;

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

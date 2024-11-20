import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiLimiterService {
  private storageKey = 'lastApiCall';

  /**
   * 检查是否可以调用接口
   * @returns {string | null} 如果可以调用返回 null，否则返回剩余时间的提示
   */
  canCallApi(): string | null {
    const lastCallTime = Number(localStorage.getItem(this.storageKey));
    const currentTime = Date.now();

    if (lastCallTime) {
      const diff = currentTime - lastCallTime;
      const remainingTime = 60000 - diff;

      if (remainingTime > 0) {
        const seconds = Math.ceil(remainingTime / 1000);
        return `${seconds} `;
      }
    }

    // 更新调用时间
    localStorage.setItem(this.storageKey, currentTime.toString());
    return null;
  }
}

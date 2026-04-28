import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WindowService {
  private isMobileSubject = new BehaviorSubject<boolean>(false);
  public isMobile$ = this.isMobileSubject.asObservable();

  private windowWidthSubject = new BehaviorSubject<number>(0);
  public windowWidth$ = this.windowWidthSubject.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkViewportWidth();

      fromEvent(window, 'resize')
        .pipe(
          debounceTime(200),
          map(() => this.checkViewportWidth()),
        )
        .subscribe();
    } else {
      this.checkViewportWidth();
    }
  }

  private checkViewportWidth(): void {
    if (isPlatformBrowser(this.platformId)) {
      const width = window.innerWidth;
      const isMobile = width <= 768;

      this.isMobileSubject.next(isMobile);
      this.windowWidthSubject.next(width);
    }
  }

  public getWindowWidth(): number {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth;
    }
    return 0;
  }

  bindIsMobile(
    destroyRef: DestroyRef,
    onChange: (isMobile: boolean) => void,
  ): void {
    this.isMobile$
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(onChange);
  }

  bindWindowWidth(
    destroyRef: DestroyRef,
    onChange: (windowWidth: number) => void,
  ): void {
    this.windowWidth$
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(onChange);
  }
}

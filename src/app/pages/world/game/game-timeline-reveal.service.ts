import { isPlatformBrowser } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Subject } from 'rxjs';

export interface GameRevealResult {
  id: number;
  src: string | null;
}

interface GameRevealItem {
  element: HTMLElement;
  id: number;
  order: number;
  src: string;
}

/**
 * 时间轴卡片的顺序加载队列。
 *
 * 只观察视口附近的卡片，按时间轴顺序逐张预加载封面；
 * 每张完成后通知页面显示该卡片，再等一小段时间处理下一张。
 */
@Injectable()
export class GameTimelineRevealService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly reducedMotion =
    this.isBrowser &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private readonly revealedSubject = new Subject<GameRevealResult>();
  readonly revealed$ = this.revealedSubject.asObservable();

  private observer: IntersectionObserver | null = null;
  private readonly elements = new Map<Element, GameRevealItem>();
  private queue: GameRevealItem[] = [];
  private readonly queuedIds = new Set<number>();
  private readonly revealedIds = new Set<number>();
  private processing = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private destroyed = false;

  constructor() {
    this.createObserver();
  }

  observe(element: HTMLElement, id: number, order: number, src: string): void {
    if (!this.isBrowser || this.destroyed) {
      return;
    }
    if (this.revealedIds.has(id) || this.queuedIds.has(id)) {
      return;
    }

    if (!this.observer) {
      // 不支持 IntersectionObserver 时直接显示，避免卡片永远停在 skeleton
      this.revealedIds.add(id);
      this.revealedSubject.next({ id, src: src || null });
      return;
    }

    this.elements.set(element, { element, id, order, src });
    this.observer.observe(element);
  }

  unobserve(element: HTMLElement): void {
    this.observer?.unobserve(element);
    this.elements.delete(element);
  }

  reset(): void {
    this.generation += 1;
    this.observer?.disconnect();
    this.elements.clear();
    this.queue = [];
    this.queuedIds.clear();
    this.revealedIds.clear();
    this.processing = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.destroyed) {
      this.createObserver();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.generation += 1;
    this.observer?.disconnect();
    this.observer = null;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.revealedSubject.complete();
  }

  private createObserver(): void {
    if (!this.isBrowser || typeof IntersectionObserver === 'undefined') {
      this.observer = null;
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        let added = false;
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const item = this.elements.get(entry.target);
          if (!item) {
            continue;
          }

          this.observer?.unobserve(entry.target);
          this.elements.delete(entry.target);

          if (
            this.revealedIds.has(item.id) ||
            this.queuedIds.has(item.id)
          ) {
            continue;
          }

          this.queuedIds.add(item.id);
          this.queue.push(item);
          added = true;
        }

        if (!added) {
          return;
        }
        this.queue.sort((a, b) => a.order - b.order);
        this.processNext();
      },
      { rootMargin: '0px 0px 200px 0px', threshold: 0 },
    );
  }

  private processNext(): void {
    if (this.processing || this.destroyed) {
      return;
    }

    const item = this.queue.shift();
    if (!item) {
      return;
    }

    this.processing = true;
    const generation = this.generation;
    const started =
      typeof performance !== 'undefined' ? performance.now() : Date.now();

    this.loadCover(item.src).then((src) => {
      if (this.destroyed || generation !== this.generation) {
        return;
      }

      this.processing = false;
      this.queuedIds.delete(item.id);
      this.revealedIds.add(item.id);
      this.revealedSubject.next({ id: item.id, src });

      if (this.queue.length === 0) {
        return;
      }

      const elapsed =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
        started;
      const delay = this.reducedMotion ? 0 : elapsed < 40 ? 30 : 70;
      this.timer = setTimeout(() => {
        this.timer = null;
        this.processNext();
      }, delay);
    });
  }

  private loadCover(src: string): Promise<string | null> {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }

      const image = new Image();
      image.decoding = 'async';
      let settled = false;

      const finish = (value: string | null): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve(value);
      };

      const timeout = setTimeout(() => finish(null), 1200);

      image.onload = () => {
        if (typeof image.decode === 'function') {
          image.decode().then(
            () => finish(src),
            () => finish(src),
          );
          return;
        }
        finish(src);
      };
      image.onerror = () => finish(null);
      image.src = src;
    });
  }
}

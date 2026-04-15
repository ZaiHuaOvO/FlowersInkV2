import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type PrefetchKey =
  | 'welcome.routes'
  | 'welcome.component'
  | 'blog.routes'
  | 'blog.all'
  | 'blog.article'
  | 'blog.essay'
  | 'blog.question'
  | 'blog.detail'
  | 'world.routes'
  | 'world.book'
  | 'world.game'
  | 'about.routes'
  | 'about.me'
  | 'about.website'
  | 'about.message'
  | 'link.routes'
  | 'link.component'
  | 'life.routes'
  | 'life.heart';

type IdleHandle = number;

@Injectable({
  providedIn: 'root',
})
export class RoutePrefetchService {
  private readonly isBrowser: boolean;
  private started = false;
  private running = false;
  private queue: PrefetchKey[] = [];
  private readonly loadingKeys = new Set<PrefetchKey>();
  private readonly loadedKeys = new Set<PrefetchKey>();

  private readonly preloaders: Record<PrefetchKey, () => Promise<unknown>> = {
    'welcome.routes': () => import('../pages/welcome/welcome.routes'),
    'welcome.component': () => import('../pages/welcome/welcome.component'),

    'blog.routes': () => import('../pages/blog/blog.routes'),
    'blog.all': () => import('../pages/blog/blog.component'),
    'blog.article': () => import('../pages/blog/article/article.component'),
    'blog.essay': () => import('../pages/blog/essay/essay.component'),
    'blog.question': () => import('../pages/blog/question/question.component'),
    'blog.detail': () => import('../pages/blog/blog-detail/blog-detail.component'),

    'world.routes': () => import('../pages/world/world.routes'),
    'world.book': () => import('../pages/world/book/book.component'),
    'world.game': () => import('../pages/world/game/game.component'),

    'about.routes': () => import('../pages/about/about.routes'),
    'about.me': () => import('../pages/about/me/me.component'),
    'about.website': () => import('../pages/about/website/website.component'),
    'about.message': () => import('../pages/about/message/message.component'),

    'link.routes': () => import('../pages/link/link.routes'),
    'link.component': () => import('../pages/link/link.component'),

    'life.routes': () => import('../pages/life/life.routes'),
    'life.heart': () => import('../pages/life/heart/heart.component'),
  };

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  startIdlePreload(): void {
    if (!this.isBrowser || this.started) {
      return;
    }

    this.started = true;

    // First wave: prioritize home + writing related pages.
    window.setTimeout(() => {
      this.enqueue(
        [
          'welcome.routes',
          'welcome.component',
          'blog.routes',
          'blog.all',
          'blog.article',
          'blog.essay',
        ],
        false
      );
    }, 600);

    // Second wave: preload remaining pages in background.
    window.setTimeout(() => {
      this.enqueue(
        [
          'blog.question',
          'blog.detail',
          'world.routes',
          'world.book',
          'world.game',
          'about.routes',
          'about.me',
          'about.website',
          'about.message',
          'link.routes',
          'link.component',
          'life.routes',
          'life.heart',
        ],
        false
      );
    }, 3200);
  }

  prefetchByUrl(url: string | undefined | null): void {
    if (!this.isBrowser || !url) {
      return;
    }

    const normalized = this.normalizeUrl(url);
    if (!normalized) {
      return;
    }

    const keys = this.resolveKeysByUrl(normalized);
    if (keys.length > 0) {
      this.enqueue(keys, true);
    }
  }

  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }

    const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const withoutHash = withLeadingSlash.split('#')[0];
    return withoutHash.split('?')[0];
  }

  private resolveKeysByUrl(url: string): PrefetchKey[] {
    if (url.startsWith('/welcome')) {
      return ['welcome.routes', 'welcome.component'];
    }

    if (url.startsWith('/blog/article')) {
      return ['blog.routes', 'blog.article'];
    }
    if (url.startsWith('/blog/essay')) {
      return ['blog.routes', 'blog.essay'];
    }
    if (url.startsWith('/blog/all')) {
      return ['blog.routes', 'blog.all'];
    }
    if (url.startsWith('/blog/question')) {
      return ['blog.routes', 'blog.question'];
    }
    if (url.startsWith('/blog/blog-detail')) {
      return ['blog.routes', 'blog.detail'];
    }
    if (url.startsWith('/blog')) {
      return ['blog.routes', 'blog.all', 'blog.article', 'blog.essay'];
    }

    if (url.startsWith('/world/book')) {
      return ['world.routes', 'world.book'];
    }
    if (url.startsWith('/world/game')) {
      return ['world.routes', 'world.game'];
    }
    if (url.startsWith('/world')) {
      return ['world.routes', 'world.book', 'world.game'];
    }

    if (url.startsWith('/about/me')) {
      return ['about.routes', 'about.me'];
    }
    if (url.startsWith('/about/website')) {
      return ['about.routes', 'about.website'];
    }
    if (url.startsWith('/about/message')) {
      return ['about.routes', 'about.message'];
    }
    if (url.startsWith('/about')) {
      return ['about.routes', 'about.me', 'about.website', 'about.message'];
    }

    if (url.startsWith('/link')) {
      return ['link.routes', 'link.component'];
    }

    if (url.startsWith('/life/heart')) {
      return ['life.routes', 'life.heart'];
    }

    return [];
  }

  private enqueue(keys: PrefetchKey[], toHead: boolean): void {
    for (const key of keys) {
      if (this.loadedKeys.has(key) || this.loadingKeys.has(key)) {
        continue;
      }
      if (this.queue.includes(key)) {
        continue;
      }
      if (toHead) {
        this.queue.unshift(key);
      } else {
        this.queue.push(key);
      }
    }

    this.processQueue();
  }

  private processQueue(): void {
    if (!this.isBrowser || this.running || this.queue.length === 0) {
      return;
    }

    this.running = true;
    const next = this.queue.shift() as PrefetchKey;
    this.scheduleIdle(() => {
      this.runOne(next).finally(() => {
        this.running = false;
        this.processQueue();
      });
    });
  }

  private async runOne(key: PrefetchKey): Promise<void> {
    if (this.loadedKeys.has(key) || this.loadingKeys.has(key)) {
      return;
    }

    const loader = this.preloaders[key];
    if (!loader) {
      return;
    }

    this.loadingKeys.add(key);
    try {
      await loader();
      this.loadedKeys.add(key);
    } catch {
      // Keep silent in production; prefetch failures should not affect navigation.
    } finally {
      this.loadingKeys.delete(key);
    }
  }

  private scheduleIdle(task: () => void): void {
    const idleApi = (
      window as Window & {
        requestIdleCallback?: (
          callback: () => void,
          options?: { timeout: number }
        ) => IdleHandle;
      }
    ).requestIdleCallback;

    if (typeof idleApi === 'function') {
      idleApi(task, { timeout: 1800 });
      return;
    }

    window.setTimeout(task, 180);
  }
}

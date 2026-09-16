import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { API } from './api';
import { HttpService } from './http.service';

const VISITOR_FID_KEY = 'fi_visitor_fid';

/** 页面隐藏时的补报最小增量：少于该秒数不发请求，避免频繁切标签刷爆埋点 */
const DWELL_MIN_SEND_DELTA_SECONDS = 5;

type VisitPayload = {
  fid: string;
  path: string;
  pageType: string;
  resourceType: string;
  resourceId?: number;
  entryUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
};

@Injectable({
  providedIn: 'root',
})
export class VisitorTrackingService {
  private routeTrackingStarted = false;
  private readonly recentTrackTs = new Map<string, number>();

  /** 当前页面在站点埋点里登记的 path，用于离页时回填停留时长 */
  private currentPagePath: string | null = null;
  /** 本页累计的「可见停留」毫秒数（页面隐藏时暂停计时） */
  private dwellMs = 0;
  private activeSince: number | null = null;
  /** 本页已上报过的秒数，用于抑制重复上报 */
  private dwellSentSeconds = 0;
  private lifecycleBound = false;

  constructor(
    private readonly http: HttpService,
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  trackHome(): void {
    const payload = this.buildPayload({
      pageType: 'home',
      resourceType: 'site',
    });
    if (!payload) {
      return;
    }
    this.http.post(API.INFO, payload).subscribe({
      error: () => {},
    });
  }

  trackBlogDetail(blogId: number): void {
    const payload = this.buildPayload({
      pageType: 'blog_detail',
      resourceType: 'blog',
      resourceId: blogId,
    });
    if (!payload) {
      return;
    }
    this.http.post(API.INFO, payload).subscribe({
      error: () => {},
    });
  }

  getVisitorFid(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }
    return this.getOrCreateFid();
  }

  startRouteTracking(): void {
    if (!isPlatformBrowser(this.platformId) || this.routeTrackingStarted) {
      return;
    }
    this.routeTrackingStarted = true;

    this.bindPageLifecycle();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        // 离开上一页：先把上一页的停留时长补报掉，再切到新页面重新计时
        this.commitDwell();
        this.trackByUrl(nav.urlAfterRedirects || nav.url);
      });
  }

  /** 监听页面隐藏/关闭，把停留时长用 sendBeacon 补报（异步、不阻塞卸载） */
  private bindPageLifecycle(): void {
    if (this.lifecycleBound) {
      return;
    }
    const win = this.document.defaultView;
    if (!win) {
      return;
    }
    this.lifecycleBound = true;

    this.document.addEventListener('visibilitychange', () => {
      if (this.document.hidden) {
        this.pauseDwellTimer();
        this.flushDwell();
      } else {
        this.resumeDwellTimer();
      }
    });

    win.addEventListener('pagehide', () => {
      this.pauseDwellTimer();
      this.flushDwell(true);
    });
  }

  private trackByUrl(rawUrl: string): void {
    const parsed = this.parseRoutePayload(rawUrl);
    if (!parsed) {
      this.resetDwellTimer(null);
      return;
    }

    const payload = this.buildPayload(parsed);
    // 与上报事件使用同一个 path，保证服务端能精确匹配回这次访问
    this.resetDwellTimer(payload?.path ?? null);
    if (!payload) {
      return;
    }

    const now = Date.now();
    const dedupeKey = `${parsed.pageType}|${parsed.resourceType}|${parsed.resourceId || 0}|${parsed.path}`;
    const lastTs = this.recentTrackTs.get(dedupeKey) || 0;
    if (now - lastTs < 1500) {
      return;
    }
    this.recentTrackTs.set(dedupeKey, now);

    this.http.post(API.INFO, payload).subscribe({ error: () => {} });
  }

  /** 切页时结算上一页：上报累计停留时长后归零，等新页面重新计时 */
  private commitDwell(): void {
    this.pauseDwellTimer();
    this.flushDwell(true);
    this.resetDwellTimer(null);
  }

  private resetDwellTimer(path: string | null): void {
    this.currentPagePath = path;
    this.dwellMs = 0;
    this.dwellSentSeconds = 0;
    this.activeSince = path ? Date.now() : null;
  }

  private pauseDwellTimer(): void {
    if (this.activeSince === null) {
      return;
    }
    this.dwellMs += Date.now() - this.activeSince;
    this.activeSince = null;
  }

  private resumeDwellTimer(): void {
    if (this.activeSince === null && this.currentPagePath) {
      this.activeSince = Date.now();
    }
  }

  /**
   * 上报的是「本页累计停留秒数」，服务端对同一行取较大值，
   * 因此 visibilitychange 与 pagehide 重复触发也不会把时长叠高。
   * force=false 时只在比上次上报多出足够秒数时才发，避免切标签刷请求。
   */
  private flushDwell(force = false): void {
    const path = this.currentPagePath;
    if (!path) {
      return;
    }

    const dwellSeconds = Math.round(this.dwellMs / 1000);
    if (dwellSeconds < 1) {
      return;
    }
    if (
      !force &&
      dwellSeconds < this.dwellSentSeconds + DWELL_MIN_SEND_DELTA_SECONDS
    ) {
      return;
    }
    this.dwellSentSeconds = dwellSeconds;

    const win = this.document.defaultView;
    const sendBeacon = win?.navigator?.sendBeacon?.bind(win.navigator);
    if (!sendBeacon) {
      return;
    }

    // urlencoded 属于 CORS 简单请求，sendBeacon 不会触发预检
    const params = new URLSearchParams({
      fid: this.getOrCreateFid(),
      path,
      dwellSeconds: String(dwellSeconds),
    });

    try {
      sendBeacon(`${API.BASE_URL}${API.VISIT_DWELL}`, params);
    } catch {
      // 停留时长只是统计补充，上报失败不应影响页面
    }
  }

  private parseRoutePayload(rawUrl: string): {
    path: string;
    pageType: string;
    resourceType: string;
    resourceId?: number;
  } | null {
    const pathOnly = String(rawUrl || '').split('?')[0] || '/';
    const normalized = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;

    const blogMatch = normalized.match(/^\/blog\/blog-detail\/(\d+)$/);
    if (blogMatch) {
      return {
        path: normalized,
        pageType: 'blog_detail',
        resourceType: 'blog',
        resourceId: Number(blogMatch[1]),
      };
    }

    if (normalized === '/' || normalized === '/welcome') {
      return {
        path: normalized,
        pageType: 'home',
        resourceType: 'site',
      };
    }

    const lifeDetailMatch = normalized.match(/^\/life\/(\d+)$/);
    if (lifeDetailMatch) {
      return {
        path: normalized,
        pageType: 'life_detail',
        resourceType: 'life',
        resourceId: Number(lifeDetailMatch[1]),
      };
    }

    if (normalized === '/life') {
      return {
        path: normalized,
        pageType: 'life_list',
        resourceType: 'life',
      };
    }

    if (normalized === '/about') {
      return {
        path: normalized,
        pageType: 'about',
        resourceType: 'site',
      };
    }

    if (normalized === '/link') {
      return {
        path: normalized,
        pageType: 'link',
        resourceType: 'site',
      };
    }

    if (normalized === '/donate') {
      return {
        path: normalized,
        pageType: 'donate',
        resourceType: 'site',
      };
    }

    const gameDetailMatch = normalized.match(/^\/game\/(\d+)$/);
    if (gameDetailMatch) {
      return {
        path: normalized,
        pageType: 'world_game',
        resourceType: 'world',
        resourceId: Number(gameDetailMatch[1]),
      };
    }

    if (normalized === '/game') {
      return {
        path: normalized,
        pageType: 'world_game',
        resourceType: 'world',
      };
    }

    if (normalized === '/book') {
      return {
        path: normalized,
        pageType: 'world_book',
        resourceType: 'world',
      };
    }

    if (normalized === '/equipment') {
      return {
        path: normalized,
        pageType: 'world_equipment',
        resourceType: 'world',
      };
    }

    return null;
  }

  private buildPayload(input: {
    pageType: string;
    resourceType: string;
    resourceId?: number;
  }): VisitPayload | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const win = this.document.defaultView;
    if (!win) {
      return null;
    }

    const url = new URL(win.location.href);
    const payload: VisitPayload = {
      fid: this.getOrCreateFid(),
      path: `${url.pathname}${url.search}`,
      pageType: input.pageType,
      resourceType: input.resourceType,
      entryUrl: url.toString(),
      referrer: this.document.referrer || undefined,
      utmSource: url.searchParams.get('utm_source') || undefined,
      utmMedium: url.searchParams.get('utm_medium') || undefined,
      utmCampaign: url.searchParams.get('utm_campaign') || undefined,
      utmTerm: url.searchParams.get('utm_term') || undefined,
      utmContent: url.searchParams.get('utm_content') || undefined,
    };

    if (Number.isFinite(input.resourceId)) {
      payload.resourceId = Number(input.resourceId);
    }

    return payload;
  }

  private getOrCreateFid(): string {
    try {
      const win = this.document.defaultView;
      if (!win) {
        return this.createFid();
      }

      const storage = win.localStorage;
      const existing = (storage.getItem(VISITOR_FID_KEY) || '').trim();
      if (existing) {
        return existing;
      }

      const created = this.createFid();
      storage.setItem(VISITOR_FID_KEY, created);
      return created;
    } catch {
      return this.createFid();
    }
  }

  private createFid(): string {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `fi_${Date.now().toString(36)}_${randomPart}`;
  }
}

import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { API } from './api';
import { HttpService } from './http.service';

const VISITOR_FID_KEY = 'fi_visitor_fid';

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

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.trackByUrl(nav.urlAfterRedirects || nav.url);
      });
  }

  private trackByUrl(rawUrl: string): void {
    const parsed = this.parseRoutePayload(rawUrl);
    if (!parsed) {
      return;
    }

    const now = Date.now();
    const dedupeKey = `${parsed.pageType}|${parsed.resourceType}|${parsed.resourceId || 0}|${parsed.path}`;
    const lastTs = this.recentTrackTs.get(dedupeKey) || 0;
    if (now - lastTs < 1500) {
      return;
    }
    this.recentTrackTs.set(dedupeKey, now);

    const payload = this.buildPayload(parsed);
    if (!payload) {
      return;
    }
    this.http.post(API.INFO, payload).subscribe({ error: () => {} });
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

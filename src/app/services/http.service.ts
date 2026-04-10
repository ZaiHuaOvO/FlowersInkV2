import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { API } from './api';

interface CachedGetEntry {
  expiresAt: number;
  stream$: Observable<unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private api = API.BASE_URL;
  private readonly getCache = new Map<string, CachedGetEntry>();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
    withCredentials: true,
  };

  constructor(private http: HttpClient) {}

  get<T>(url: string, paramsObj?: Record<string, unknown>): Observable<T> {
    const params = this.buildHttpParams(paramsObj);
    return this.http
      .get<T>(this.api + url, { params, ...this.httpOptions })
      .pipe(catchError(this.handleError));
  }

  getCached<T>(
    url: string,
    paramsObj?: Record<string, unknown>,
    ttlMs: number = 30000
  ): Observable<T> {
    const cacheKey = this.getCacheKey(url, paramsObj);
    const now = Date.now();
    const cached = this.getCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.stream$ as Observable<T>;
    }

    const request$ = this.get<T>(url, paramsObj).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((error) => {
        this.getCache.delete(cacheKey);
        return throwError(() => error);
      })
    );

    this.getCache.set(cacheKey, {
      expiresAt: now + ttlMs,
      stream$: request$,
    });

    return request$;
  }

  invalidateGetCache(urlPrefixes: string[]): void {
    if (!urlPrefixes.length) {
      return;
    }

    for (const key of this.getCache.keys()) {
      if (urlPrefixes.some((prefix) => key.startsWith(prefix))) {
        this.getCache.delete(key);
      }
    }
  }

  clearGetCache(): void {
    this.getCache.clear();
  }

  post<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(this.api + url, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(this.api + url, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  patch<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .patch<T>(this.api + url, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  delete<T>(url: string): Observable<T> {
    return this.http
      .delete<T>(this.api + url, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  private buildHttpParams(paramsObj?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();

    if (!paramsObj) {
      return params;
    }

    Object.keys(paramsObj).forEach((key) => {
      const value = paramsObj[key];
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            params = params.append(key, String(item));
          }
        });
        return;
      }

      params = params.set(key, String(value));
    });

    return params;
  }

  private getCacheKey(url: string, paramsObj?: Record<string, unknown>): string {
    const query = this.serializeParams(paramsObj);
    return query ? `${url}?${query}` : url;
  }

  private serializeParams(paramsObj?: Record<string, unknown>): string {
    if (!paramsObj) {
      return '';
    }

    const entries: string[] = [];
    Object.keys(paramsObj)
      .sort()
      .forEach((key) => {
        const value = paramsObj[key];

        if (value === undefined || value === null) {
          return;
        }

        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null) {
              entries.push(
                `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`
              );
            }
          });
          return;
        }

        entries.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        );
      });

    return entries.join('&');
  }

  private handleError(error: unknown) {
    return throwError(() => error);
  }
}

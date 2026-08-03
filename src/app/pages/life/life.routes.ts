import { UrlSegment } from '@angular/router';
import { Routes } from '@angular/router';

/**
 * 匹配 /life 与 /life/:id：
 * 两条 URL 命中同一条路由配置（同一 routeConfig 引用），
 * Angular 默认 RouteReuseStrategy 依据 routeConfig 相同而复用 HeartComponent，
 * 打开/关闭详情弹窗不再销毁重建组件、不重复加载列表。
 */
export function lifeUrlMatcher(segments: UrlSegment[]) {
  if (segments.length === 0) {
    return { consumed: segments };
  }
  if (segments.length === 1 && /^\d+$/.test(segments[0].path)) {
    return { consumed: segments, posParams: { id: segments[0] } };
  }
  return null;
}

export const LIFE_ROUTES: Routes = [
  {
    matcher: lifeUrlMatcher,
    title: '花墨 | 点滴',
    loadComponent: () =>
      import('./heart/heart.component').then((m) => m.HeartComponent),
  },
];

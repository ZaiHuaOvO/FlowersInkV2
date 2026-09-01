import { UrlSegment } from '@angular/router';
import { Routes } from '@angular/router';

/**
 * 匹配 /game 与 /game/:id（game 为顶层路由，matcher 接收完整 segments）：
 * 两条 URL 命中同一条路由配置（同一 routeConfig 引用），
 * Angular 默认 RouteReuseStrategy 依据 routeConfig 相同而复用 GameComponent，
 * 打开/关闭详情弹窗不再销毁重建组件、不重复加载列表。
 */
export function gameUrlMatcher(segments: UrlSegment[]) {
  if (segments.length === 1 && segments[0].path === 'game') {
    return { consumed: segments };
  }
  if (
    segments.length === 2 &&
    segments[0].path === 'game' &&
    /^\d+$/.test(segments[1].path)
  ) {
    return { consumed: segments, posParams: { id: segments[1] } };
  }
  return null;
}

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/welcome/welcome.routes').then((m) => m.WELCOME_ROUTES),
  },
  {
    path: 'blog',
    loadChildren: () =>
      import('./pages/blog/blog.routes').then((m) => m.BLOG_ROUTES),
  },
  {
    path: 'life',
    loadChildren: () =>
      import('./pages/life/life.routes').then((m) => m.LIFE_ROUTES),
  },
  {
    path: 'about',
    loadChildren: () =>
      import('./pages/about/about.routes').then((m) => m.ABOUT_ROUTES),
  },
  {
    path: 'book',
    title: '花墨 | 书籍',
    loadComponent: () =>
      import('./pages/world/book/book.component').then((m) => m.BookComponent),
  },
  {
    matcher: gameUrlMatcher,
    title: '花墨 | 游戏',
    loadComponent: () =>
      import('./pages/world/game/game.component').then((m) => m.GameComponent),
  },
  {
    path: 'equipment',
    title: '花墨 | 装备',
    loadComponent: () =>
      import('./pages/world/equipment/equipment.component').then((m) => m.EquipmentComponent),
  },
  {
    path: 'world/book',
    redirectTo: '/book',
    pathMatch: 'full',
  },
  {
    path: 'world/game',
    redirectTo: '/game',
    pathMatch: 'full',
  },
  {
    path: 'world/game/:id',
    redirectTo: '/game/:id',
  },
  {
    path: 'world/equipment',
    redirectTo: '/equipment',
    pathMatch: 'full',
  },
  {
    path: 'changelog',
    title: '花墨 | 更新记录',
    loadComponent: () =>
      import('./pages/changelog/changelog.component').then((m) => m.ChangelogComponent),
  },
  {
    path: 'link',
    loadChildren: () =>
      import('./pages/link/link.routes').then((m) => m.LINK_ROUTES),
  },
  {
    path: '**',
    loadChildren: () =>
      import('./pages/error/error.routes').then((m) => m.ERROR_ROUTES),
  },
];

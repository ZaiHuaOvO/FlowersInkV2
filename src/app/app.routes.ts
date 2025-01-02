import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  {
    path: 'welcome',
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
    path: 'world',
    loadChildren: () =>
      import('./pages/world/world.routes').then((m) => m.WORLD_ROUTES),
  },
  {
    path: 'link',
    loadChildren: () =>
      import('./pages/link/link.routes').then((m) => m.LINK_ROUTES),
  },
  // 通配符路由，用于匹配所有未定义路由
  {
    path: '**',
    loadChildren: () =>
      import('./pages/error/error.routes').then((m) => m.ERROR_ROUTES),
  },
];

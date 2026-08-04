import { Routes } from '@angular/router';

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
    path: 'game',
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
    path: 'world/equipment',
    redirectTo: '/equipment',
    pathMatch: 'full',
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

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
];

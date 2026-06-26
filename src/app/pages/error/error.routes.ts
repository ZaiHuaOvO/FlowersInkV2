import { Routes } from '@angular/router';

export const ERROR_ROUTES: Routes = [
  {
    path: '',
    title: '花墨 | 页面未找到',
    loadComponent: () =>
      import('./error.component').then((m) => m.ErrorComponent),
  },
];

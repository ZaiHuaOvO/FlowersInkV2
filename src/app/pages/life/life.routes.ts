import { Routes } from '@angular/router';

export const LIFE_ROUTES: Routes = [
  {
    path: '',
    title: '花墨 | 点滴',
    loadComponent: () =>
      import('./heart/heart.component').then((m) => m.HeartComponent),
  },
];

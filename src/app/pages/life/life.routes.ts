import { Routes } from '@angular/router';

export const LIFE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./heart/heart.component').then((m) => m.HeartComponent),
  },
];

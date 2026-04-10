import { Routes } from '@angular/router';

export const LIFE_ROUTES: Routes = [
  {
    path: 'heart',
    loadComponent: () =>
      import('./heart/heart.component').then((m) => m.HeartComponent),
  }];

import { Routes } from '@angular/router';

export const WELCOME_ROUTES: Routes = [
  {
    path: '',
    title: '花墨 | 再花的博客',
    loadComponent: () =>
      import('./welcome.component').then((m) => m.WelcomeComponent),
  },
];

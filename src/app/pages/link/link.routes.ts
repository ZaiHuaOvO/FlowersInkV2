import { Routes } from '@angular/router';

export const LINK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./link.component').then((m) => m.LinkComponent),
  },
];

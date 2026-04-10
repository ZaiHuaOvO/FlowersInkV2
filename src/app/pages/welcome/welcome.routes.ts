import { Routes } from '@angular/router';

export const WELCOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./welcome.component').then((m) => m.WelcomeComponent),
  }];

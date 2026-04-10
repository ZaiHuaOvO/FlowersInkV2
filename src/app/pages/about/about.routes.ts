import { Routes } from '@angular/router';

export const ABOUT_ROUTES: Routes = [
  {
    path: 'me',
    loadComponent: () => import('./me/me.component').then((m) => m.MeComponent),
  },
  {
    path: 'website',
    loadComponent: () =>
      import('./website/website.component').then((m) => m.WebsiteComponent),
  },
  {
    path: 'message',
    loadComponent: () =>
      import('./message/message.component').then((m) => m.MessageComponent),
  }];

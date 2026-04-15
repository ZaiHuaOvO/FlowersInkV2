import { Routes } from '@angular/router';

export const WORLD_ROUTES: Routes = [
  {
    path: 'book',
    loadComponent: () =>
      import('./book/book.component').then((m) => m.BookComponent),
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./game/game.component').then((m) => m.GameComponent),
  },
];

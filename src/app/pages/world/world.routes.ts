import { Routes } from '@angular/router';
import { BookComponent } from './book/book.component';
import { FoodComponent } from './food/food.component';
import { GameComponent } from './game/game.component';

export const WORLD_ROUTES: Routes = [
  { path: 'book', component: BookComponent },
  { path: 'game', component: GameComponent },
  // { path: 'food', component: FoodComponent },
];

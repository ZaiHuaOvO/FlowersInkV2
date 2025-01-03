import { Routes } from '@angular/router';
import { BookDetailComponent } from './book-detail/book-detail.component';
import { BookComponent } from './book/book.component';
import { FoodComponent } from './food/food.component';

export const WORLD_ROUTES: Routes = [
  { path: 'book', component: BookComponent },
  { path: 'book/:id', component: BookDetailComponent },
  { path: 'food', component: FoodComponent },
];

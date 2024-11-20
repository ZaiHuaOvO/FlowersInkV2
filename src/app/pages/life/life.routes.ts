import { Routes } from '@angular/router';
import { HeartComponent } from './heart/heart.component';
import { FoodComponent } from './food/food.component';

export const LIFE_ROUTES: Routes = [
  { path: 'heart', component: HeartComponent },
  { path: 'food', component: FoodComponent },
];

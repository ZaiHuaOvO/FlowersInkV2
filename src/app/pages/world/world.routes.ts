import { Routes } from "@angular/router";

export const WORLD_ROUTES: Routes = [
  { path: "book", title: "花墨 | 书籍", loadComponent: () => import("./book/book.component").then((m) => m.BookComponent) },
  { path: "game", title: "花墨 | 游戏", loadComponent: () => import("./game/game.component").then((m) => m.GameComponent) },
];

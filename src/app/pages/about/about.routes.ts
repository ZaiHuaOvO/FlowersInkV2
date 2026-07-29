import { Routes } from "@angular/router";

export const ABOUT_ROUTES: Routes = [
  { path: "", title: "花墨 | 关于", loadComponent: () => import("./about.component").then((m) => m.AboutComponent) },
  { path: "me", redirectTo: "/about" },
  { path: "website", redirectTo: "/about" },
  { path: "message", redirectTo: "/about" },
];

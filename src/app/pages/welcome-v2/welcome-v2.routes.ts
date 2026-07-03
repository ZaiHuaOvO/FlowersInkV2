import { Routes } from "@angular/router";

export const WELCOME_V2_ROUTES: Routes = [
  {
    path: "",
    title: "花墨 | 再花的博客",
    loadComponent: () =>
      import("./welcome-v2.component").then((m) => m.WelcomeV2Component),
  },
];

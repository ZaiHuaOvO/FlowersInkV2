import { Routes } from "@angular/router";

export const WELCOME_ROUTES: Routes = [
  {
    path: "",
    title: "花墨",
    loadComponent: () =>
      import("./welcome.component").then((m) => m.WelcomeComponent),
  },
];

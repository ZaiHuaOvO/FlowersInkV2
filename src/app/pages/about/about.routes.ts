import { Routes } from "@angular/router";

export const ABOUT_ROUTES: Routes = [
  { path: "me", title: "花墨 | 关于我", loadComponent: () => import("./me/me.component").then((m) => m.MeComponent) },
  { path: "website", title: "花墨 | 关于网站", loadComponent: () => import("./website/website.component").then((m) => m.WebsiteComponent) },
  { path: "message", title: "花墨 | 留言板", loadComponent: () => import("./message/message.component").then((m) => m.MessageComponent) },
];

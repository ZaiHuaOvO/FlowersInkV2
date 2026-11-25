import { Routes } from "@angular/router";

export const LINK_ROUTES: Routes = [
  {
    path: "",
    title: "花墨 | 友情链接",
    loadComponent: () => import("./link.component").then((m) => m.LinkComponent),
  },
  {
    path: "apply",
    title: "花墨 | 申请友链",
    loadComponent: () =>
      import("./link-apply.component").then((m) => m.LinkApplyComponent),
  },
];

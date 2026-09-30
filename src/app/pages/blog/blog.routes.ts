import { Routes } from "@angular/router";

export const BLOG_ROUTES: Routes = [
  {
    path: "",
    children: [
      { path: "all", title: "花墨 | 博客归档", loadComponent: () => import("./blog.component").then((m) => m.BlogComponent) },
      { path: "article", title: "花墨 | 写作", loadComponent: () => import("./article/article.component").then((m) => m.ArticleComponent) },
      { path: "essay", redirectTo: "article", pathMatch: "full" },
      { path: "blog-detail/:id", loadComponent: () => import("./blog-detail/blog-detail.component").then((m) => m.BlogDetailComponent) },
    ],
  },
];

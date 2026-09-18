import { Routes } from "@angular/router";

export const BLOG_ROUTES: Routes = [
  {
    path: "",
    children: [
      { path: "all", title: "花墨 | 博客归档", loadComponent: () => import("./blog.component").then((m) => m.BlogComponent) },
      { path: "article", title: "花墨 | 技术文章", loadComponent: () => import("./article/article.component").then((m) => m.ArticleComponent) },
      { path: "essay", title: "花墨 | 随笔", loadComponent: () => import("./essay/essay.component").then((m) => m.EssayComponent) },
      { path: "question", title: "花墨 | 问答", loadComponent: () => import("./question/question.component").then((m) => m.QuestionComponent) },
      { path: "blog-detail/:id", loadComponent: () => import("./blog-detail/blog-detail.component").then((m) => m.BlogDetailComponent) },
    ],
  },
];

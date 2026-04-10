import { importProvidersFrom } from '@angular/core';
import { Routes } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    providers: [importProvidersFrom(MarkdownModule.forRoot())],
    children: [
      {
        path: 'all',
        loadComponent: () =>
          import('./blog.component').then((m) => m.BlogComponent),
      },
      {
        path: 'article',
        loadComponent: () =>
          import('./article/article.component').then((m) => m.ArticleComponent),
      },
      {
        path: 'essay',
        loadComponent: () =>
          import('./essay/essay.component').then((m) => m.EssayComponent),
      },
      {
        path: 'question',
        loadComponent: () =>
          import('./question/question.component').then((m) => m.QuestionComponent),
      },
      {
        path: 'blog-detail/:id',
        loadComponent: () =>
          import('./blog-detail/blog-detail.component').then(
            (m) => m.BlogDetailComponent
          ),
      },
    ],
  },
];

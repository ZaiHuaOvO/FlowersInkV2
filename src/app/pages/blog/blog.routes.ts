import { Routes } from '@angular/router';
import { BlogComponent } from './blog.component';
import { ArticleComponent } from './article/article.component';
import { QuestionComponent } from './question/question.component';
import { BlogDetailComponent } from './blog-detail/blog-detail.component';
import { EssayComponent } from './essay/essay.component';

export const BLOG_ROUTES: Routes = [
  { path: 'all', component: BlogComponent },
  { path: 'article', component: ArticleComponent },
  { path: 'essay', component: EssayComponent },
  { path: 'blog-detail/:id', component: BlogDetailComponent },
];

import { Routes } from '@angular/router';
import { MeComponent } from './me/me.component';
import { WebsiteComponent } from './website/website.component';
import { MessageComponent } from './message/message.component';

export const ABOUT_ROUTES: Routes = [
  { path: 'me', component: MeComponent },
  { path: 'website', component: WebsiteComponent },
  { path: 'message', component: MessageComponent },
];

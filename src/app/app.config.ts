import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  TemplateRef,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  BrowserModule,
  DomSanitizer,
  provideClientHydration,
  SafeHtml,
} from '@angular/platform-browser';
import { provideNzIcons } from './icons-provider';
import { zh_CN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MenuService } from 'ng-zorro-antd/menu';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { MarkdownModule } from 'ngx-markdown';

const icons: any[] = Object.values(AllIcons);
registerLocaleData(zh);

// ng-zorro全局配置项
const ngZorroConfig: NzConfig = {
  pagination: { nzSimple: true },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideNzIcons(icons),
    provideNzI18n(zh_CN),
    importProvidersFrom(FormsModule, MarkdownModule.forRoot()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideNzConfig(ngZorroConfig),
  ],
};

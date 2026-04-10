import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideClientHydration,
} from '@angular/platform-browser';
import { provideNzIcons } from './icons-provider';
import { zh_CN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';

registerLocaleData(zh);

// ng-zorro全局配置项
const ngZorroConfig: NzConfig = {
  pagination: { nzSimple: true },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideNzIcons(),
    provideNzI18n(zh_CN),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideNzConfig(ngZorroConfig),
  ],
};

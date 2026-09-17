import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
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
    // anchorScrolling 必须开：否则带 #片段 的导航会被 scrollPositionRestoration:'top'
    // 一律拉回顶部，把页内锚点定位冲掉（博客详情正文异步渲染，路由那一刻还找不到锚点）
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideNzIcons(),
    provideNzI18n(zh_CN),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideNzConfig(ngZorroConfig),
  ],
};

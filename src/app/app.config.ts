import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideNzIcons } from './icons-provider';
import { zh_CN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MenuService } from 'ng-zorro-antd/menu';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { NzConfig } from 'ng-zorro-antd/core/config';

const icons: any[] = Object.values(AllIcons);
registerLocaleData(zh);

// ng-zorro全局配置项
const ngZorroConfig: NzConfig = {
  // 注意组件名称没有 nz 前缀
  pagination: { nzSimple: true },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideNzIcons(icons),
    provideNzI18n(zh_CN),
    importProvidersFrom(FormsModule),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
  ],
};

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { mobileRoutes } from './mobile-app.routes';
import { httpErrorInterceptor } from '../../app/core/interceptors/http-error.interceptor';

export const mobileAppConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(mobileRoutes),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    MessageService,
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false,
          zIndex: {
            modal: 1100,
            overlay: 1000,
            menu: 1000,
            tooltip: 1100,
          },
        },
      },
    }),
  ],
};

import { bootstrapApplication } from '@angular/platform-browser';
import { MobileApp } from './app/mobile-app';
import { mobileAppConfig } from './app/mobile-app.config';

bootstrapApplication(MobileApp, mobileAppConfig).catch(console.error);

import { Routes } from '@angular/router';
import { DailyWorkMangement } from '../../app/landing-page/daily-work-mangement/daily-work-mangement';

export const mobileRoutes: Routes = [
  { path: '', redirectTo: 'daily-work', pathMatch: 'full' },
  { path: 'daily-work', component: DailyWorkMangement },
  { path: '**', redirectTo: 'daily-work' },
];

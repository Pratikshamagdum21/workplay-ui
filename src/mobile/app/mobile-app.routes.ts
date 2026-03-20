import { Routes } from '@angular/router';
import { DailyWorkMangement } from '../../app/landing-page/daily-work-mangement/daily-work-mangement';
import { InvoiceList } from '../../app/landing-page/invoice/invoice-list/invoice-list';

export const mobileRoutes: Routes = [
  { path: '', redirectTo: 'daily-work', pathMatch: 'full' },
  { path: 'daily-work', component: DailyWorkMangement },
  { path: 'invoices', component: InvoiceList },
  { path: '**', redirectTo: 'daily-work' },
];

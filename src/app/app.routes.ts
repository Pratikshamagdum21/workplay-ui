import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { EmployeeDetails } from './landing-page/employee-details/employee-details';
import { SalaryDetails } from './landing-page/salary-details/salary-details';
import { CustomRate } from './landing-page/custom-rate/custom-rate';
import { DailyWorkMangement } from './landing-page/daily-work-mangement/daily-work-mangement';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: LandingPage },
    { path: 'dashboard', component: LandingPage },
    { path: 'employee', component: EmployeeDetails },
    { path: 'salary', component: SalaryDetails },
    { path: 'custom-rate', component: CustomRate },
    { path: 'daily-work-management', component: DailyWorkMangement },


];

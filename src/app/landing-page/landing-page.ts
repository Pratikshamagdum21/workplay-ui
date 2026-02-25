import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SHARED_IMPORTS } from '../shared-imports';
import { EmployeeService } from '../../services/employee.service';
import { WorkManagementService } from '../../services/work-management.service';
import { Employee } from './employee-details/model/employee.model';
import { WorkEntry } from './daily-work-mangement/model/work-entry.model';

@Component({
  selector: 'app-landing-page',
  imports: [...SHARED_IMPORTS],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit, OnDestroy {
  private employeeService = inject(EmployeeService);
  private workService = inject(WorkManagementService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // KPI values
  totalEmployees = 0;
  weeklyCount = 0;
  monthlyCount = 0;
  totalAdvanceOutstanding = 0;
  bonusEligibleCount = 0;
  fabricThisMonth = 0;

  // Tables
  recentEntries: WorkEntry[] = [];
  advanceAlerts: Employee[] = [];

  today = new Date();

  ngOnInit(): void {
    this.employeeService.employees$
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.totalEmployees = employees.length;
        this.weeklyCount = employees.filter(e => e.salaryType === 'WEEKLY').length;
        this.monthlyCount = employees.filter(e => e.salaryType === 'MONTHLY').length;
        this.totalAdvanceOutstanding = employees.reduce((s, e) => s + (e.advanceRemaining || 0), 0);
        this.bonusEligibleCount = employees.filter(e => e.bonusEligible).length;
        this.advanceAlerts = [...employees]
          .filter(e => e.advanceRemaining > 0)
          .sort((a, b) => b.advanceRemaining - a.advanceRemaining);
      });

    this.workService.getEntries()
      .pipe(takeUntil(this.destroy$))
      .subscribe(entries => {
        const now = new Date();
        this.fabricThisMonth = entries
          .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((s, e) => s + e.fabricMeters, 0);

        this.recentEntries = [...entries]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}

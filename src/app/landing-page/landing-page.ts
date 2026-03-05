import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SHARED_IMPORTS } from '../shared-imports';
import { EmployeeService } from '../../services/employee.service';
import { WorkManagementService } from '../../services/work-management.service';
import { BranchService } from '../../services/branch.service';
import { Employee } from './employee-details/model/employee.model';
import { WorkEntry } from './daily-work-mangement/model/work-entry.model';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-landing-page',
  imports: [...SHARED_IMPORTS],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
  providers: [ConfirmationService, MessageService],
})
export class LandingPage implements OnInit, OnDestroy {
  private employeeService = inject(EmployeeService);
  private workService = inject(WorkManagementService);
  private branchService = inject(BranchService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
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

  confirmClearData(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to clear all data? This action cannot be undone.',
      header: 'Clear All Data',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.branchService.clearAllData().subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'All data has been cleared successfully.',
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to clear data. Please try again.',
            });
          },
        });
      },
    });
  }
}

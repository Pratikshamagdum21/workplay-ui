import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { Employee } from '../model/employee.model';
import { SalaryService } from '../../../../services/salary.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-view-employee-details',
  imports: [[...SHARED_IMPORTS]],
  templateUrl: './view-employee-details.html',
  styleUrl: './view-employee-details.scss',
})
export class ViewEmployeeDetails implements OnChanges, OnInit, OnDestroy {
  @Input() employee: Employee | null = null;
  @Output() closed = new EventEmitter<void>();

  yearEndBonusAmount: number = 0;
  totalBonusPaid: number = 0;
  currentYear = new Date().getFullYear();

  private destroy$ = new Subject<void>();

  constructor(private salaryService: SalaryService) {}

  ngOnInit(): void {
    this.loadBonusData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee']) {
      this.loadBonusData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBonusData(): void {
    if (!this.employee) {
      this.yearEndBonusAmount = 0;
      this.totalBonusPaid = 0;
      return;
    }

    const empId = this.employee.id;

    if (!this.employee.isBonused) {
      // For non-bonused employees: calculate estimated year-end bonus from YTD salary
      const yearSalary = this.salaryService.getEmployeeYearSalary(empId, this.currentYear);
      this.yearEndBonusAmount = this.salaryService.calculateYearEndBonus(yearSalary);
      this.totalBonusPaid = 0;
    } else {
      // For bonused employees: sum all bonus payments from salary history
      this.yearEndBonusAmount = 0;
      this.salaryService.getSalaryHistory()
        .pipe(takeUntil(this.destroy$))
        .subscribe(history => {
          this.totalBonusPaid = history
            .filter(p => p.employeeId === empId)
            .reduce((sum, p) => sum + (p.bonus || 0), 0);
        });
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  getBonusLabel(): string {
    return this.employee?.isBonused ? 'With Bonus' : 'Without Bonus';
  }

  getBonusSeverity(): 'success' | 'warn' {
    return this.employee?.isBonused ? 'success' : 'warn';
  }

  getSalaryTypeLabel(): string {
    return this.employee?.salaryType === 'WEEKLY' ? 'Weekly (Per Meter)' : 'Monthly (Fixed)';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}

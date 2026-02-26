import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
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
export class ViewEmployeeDetails implements OnInit, OnChanges, OnDestroy {
  @Input() employee: Employee | null = null;
  @Output() closed = new EventEmitter<void>();

  totalBonusPaid: number = 0;
  private destroy$ = new Subject<void>();

  constructor(private salaryService: SalaryService) {}

  ngOnInit(): void {
    this.salaryService.salaryHistory$
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.calculateTotalBonusPaid(history);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee']) {
      this.salaryService.salaryHistory$
        .pipe(takeUntil(this.destroy$))
        .subscribe(history => {
          this.calculateTotalBonusPaid(history);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateTotalBonusPaid(history: any[]): void {
    if (!this.employee) {
      this.totalBonusPaid = 0;
      return;
    }
    this.totalBonusPaid = history
      .filter(payload => payload.employeeId === this.employee!.id)
      .reduce((sum, payload) => sum + (payload.bonus || 0), 0);
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

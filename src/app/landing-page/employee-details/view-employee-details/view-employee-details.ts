import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { Employee } from '../model/employee.model';

@Component({
  selector: 'app-view-employee-details',
  imports: [[...SHARED_IMPORTS]],
  templateUrl: './view-employee-details.html',
  styleUrl: './view-employee-details.scss',
})
export class ViewEmployeeDetails {
  @Input() employee: Employee | null = null;
  @Output() closed = new EventEmitter<void>();

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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkEntry } from './model/work-entry.model';
import { Subject, takeUntil } from 'rxjs';
import { WorkManagementService } from '../../../services/work-management.service';
import { BranchService } from '../../../services/branch.service';
import { ExpenditureService, Expenditure } from '../../../services/expenditure.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../shared-imports';
import { AddWorkForm } from './add-work-form/add-work-form';
import { AddExpense } from '../salary-details/add-expense/add-expense';

@Component({
  selector: 'app-daily-work-mangement',
  imports: [SHARED_IMPORTS, AddWorkForm, AddExpense],
  providers: [MessageService, ConfirmationService],
  templateUrl: './daily-work-mangement.html',
  styleUrl: './daily-work-mangement.scss',
})
export class DailyWorkMangement implements OnInit, OnDestroy {
  workEntries: WorkEntry[] = [];
  filteredEntries: WorkEntry[] = [];
  expenditures: Expenditure[] = [];
  loading: boolean = false;

  // Filter properties
  fromDate: Date | null = null;
  toDate: Date | null = null;
  activeFilter: string | null = null;

  // Table properties
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;
  displayAddWorkDialog: boolean = false;
  displayExpenseViewDialog: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private workService: WorkManagementService,
    private branchService: BranchService,
    private expenditureService: ExpenditureService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadWorkEntries();
    this.loadExpenditures();

    // Reload when branch changes
    this.branchService.getSelectedBranch()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearFilters(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openAddWorkDialog(): void {
    this.displayAddWorkDialog = true;
  }

  openAddExpensesDialog(): void {
    this.displayExpenseViewDialog = true;
  }

  onWorkEntrySaved(): void {
    this.displayAddWorkDialog = false;
  }

  onExpenseSaved(): void {
    this.displayExpenseViewDialog = false;
    this.expenditureService.loadExpenditures();
  }

  private loadWorkEntries(): void {
    this.loading = true;
    this.workService.getEntries()
      .pipe(takeUntil(this.destroy$))
      .subscribe(entries => {
        this.workEntries = entries;
        this.loading = false;
        if (this.fromDate || this.toDate) {
          this.applyFilter();
        } else {
          this.filteredEntries = entries;
          this.totalRecords = entries.length;
        }
      });
  }

  private loadExpenditures(): void {
    this.expenditureService.getAllExpenditures()
      .pipe(takeUntil(this.destroy$))
      .subscribe(expenditures => {
        this.expenditures = expenditures;
      });
  }

  filterThisWeek(): void {
    this.activeFilter = 'week';
    const today = new Date();
    const dayOfWeek = today.getDay();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - dayOfWeek);
    firstDay.setHours(0, 0, 0, 0);

    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    lastDay.setHours(23, 59, 59, 999);

    this.fromDate = firstDay;
    this.toDate = lastDay;
    this.applyFilter();
  }

  filterThisMonth(): void {
    this.activeFilter = 'month';
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    this.fromDate = firstDay;
    this.toDate = lastDay;
    this.applyFilter();
  }

  filterThisYear(): void {
    this.activeFilter = 'year';
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);
    const lastDay = new Date(today.getFullYear(), 11, 31);
    lastDay.setHours(23, 59, 59, 999);

    this.fromDate = firstDay;
    this.toDate = lastDay;
    this.applyFilter();
  }

  onFromDateChange(value: Date): void {
    this.fromDate = value;
    this.activeFilter = 'custom';
    this.applyFilter();
  }

  onToDateChange(value: Date): void {
    this.toDate = value;
    this.activeFilter = 'custom';
    this.applyFilter();
  }

  onCustomDateFilter(): void {
    this.activeFilter = 'custom';
    this.applyFilter();
  }

  private applyFilter(): void {
    this.filteredEntries = this.workService.filterEntries(this.fromDate, this.toDate);
    this.totalRecords = this.filteredEntries.length;
    this.first = 0;
  }

  clearFilters(showToast: boolean = true): void {
    this.fromDate = null;
    this.toDate = null;
    this.activeFilter = null;
    this.filteredEntries = this.workEntries;
    this.totalRecords = this.workEntries.length;
    this.first = 0;

    if (showToast) {
      this.messageService.add({
        severity: 'info',
        summary: 'Filters Cleared',
        detail: 'All filters have been reset',
        life: 2000
      });
    }
  }

  confirmDeleteEntry(entry: WorkEntry): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this work entry for ${entry.employeeName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteEntry(entry)
    });
  }

  private deleteEntry(entry: WorkEntry): void {
    this.workService.deleteEntry(entry.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Work entry has been deleted',
          life: 3000
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete work entry',
          life: 3000
        });
      }
    });
  }

  confirmDeleteExpenditure(expenditure: Expenditure): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this ${expenditure.id.expenseType} expense?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteExpenditure(expenditure)
    });
  }

  private deleteExpenditure(expenditure: Expenditure): void {
    this.expenditureService.deleteExpenditure(expenditure.id.date, expenditure.id.expenseType).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Expense has been deleted',
          life: 3000
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete expense',
          life: 3000
        });
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTotalFabricMeters(): number {
    return this.filteredEntries.reduce((sum, entry) => sum + entry.fabricMeters, 0);
  }

  getAverageFabricMeters(): number {
    if (this.filteredEntries.length === 0) return 0;
    return this.getTotalFabricMeters() / this.filteredEntries.length;
  }

  getTotalExpenses(): number {
    return this.expenditures.reduce((sum, e) => sum + e.amount, 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}

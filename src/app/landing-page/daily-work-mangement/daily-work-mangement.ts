import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkEntry } from './model/work-entry.model';
import { Expenditure as ExpType } from '../../../services/expenditure.service';
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
  allExpenditures: Expenditure[] = [];
  expenditures: Expenditure[] = [];
  loading: boolean = false;

  // Work Records filter properties
  fromDate: Date | null = null;
  toDate: Date | null = null;
  activeFilter: string | null = null;
  searchEmployeeName: string = '';
  selectedWorkType: string | null = null;
  workTypes: string[] = [];

  // Expense filter properties
  expenseFromDate: Date | null = null;
  expenseToDate: Date | null = null;
  selectedExpenseType: string | null = null;
  expenseTypes: string[] = [];

  // Table properties
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;
  displayAddWorkDialog: boolean = false;
  displayExpenseViewDialog: boolean = false;
  selectedWorkEntry: WorkEntry | null = null;
  selectedExpense: ExpType | null = null;

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
    this.selectedWorkEntry = null;
    this.displayAddWorkDialog = true;
  }

  editWorkEntry(entry: WorkEntry): void {
    this.selectedWorkEntry = entry;
    this.displayAddWorkDialog = true;
  }

  onWorkDialogHide(): void {
    this.selectedWorkEntry = null;
  }

  openAddExpensesDialog(): void {
    this.selectedExpense = null;
    this.displayExpenseViewDialog = true;
  }

  editExpense(expense: ExpType): void {
    this.selectedExpense = expense;
    this.displayExpenseViewDialog = true;
  }

  onExpenseDialogHide(): void {
    this.selectedExpense = null;
  }

  onWorkEntrySaved(): void {
    this.displayAddWorkDialog = false;
    this.selectedWorkEntry = null;
  }

  onExpenseSaved(): void {
    this.displayExpenseViewDialog = false;
    this.selectedExpense = null;
    const branchId = this.branchService.getSelectedBranchSnapshot().id;
    this.expenditureService.loadExpenditures(branchId);
    // Expenditure subject will emit and loadExpenditures subscriber will refilter
  }

  private loadWorkEntries(): void {
    this.loading = true;
    this.workService.getEntries()
      .pipe(takeUntil(this.destroy$))
      .subscribe(entries => {
        this.workEntries = entries;
        this.workTypes = [...new Set(entries.map(e => e.employeeType).filter(Boolean))];
        this.loading = false;
        this.applyFilter();
      });
  }

  private loadExpenditures(): void {
    this.expenditureService.getAllExpenditures()
      .pipe(takeUntil(this.destroy$))
      .subscribe(expenditures => {
        this.allExpenditures = expenditures;
        this.expenseTypes = [...new Set(expenditures.map(e => e.expenseType).filter(Boolean))];
        this.applyExpenseFilter();
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
    let entries = this.workService.filterEntries(this.fromDate, this.toDate);

    if (this.searchEmployeeName && this.searchEmployeeName.trim()) {
      const search = this.searchEmployeeName.trim().toLowerCase();
      entries = entries.filter(e => e.employeeName.toLowerCase().includes(search));
    }

    if (this.selectedWorkType) {
      entries = entries.filter(e => e.employeeType === this.selectedWorkType);
    }

    this.filteredEntries = entries;
    this.totalRecords = entries.length;
    this.first = 0;
  }

  onSearchEmployeeName(): void {
    this.applyFilter();
  }

  onWorkTypeFilterChange(): void {
    this.applyFilter();
  }

  applyExpenseFilter(): void {
    let expenses = [...this.allExpenditures];

    if (this.expenseFromDate || this.expenseToDate) {
      expenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        expDate.setHours(0, 0, 0, 0);
        if (this.expenseFromDate && this.expenseToDate) {
          const from = new Date(this.expenseFromDate);
          from.setHours(0, 0, 0, 0);
          const to = new Date(this.expenseToDate);
          to.setHours(23, 59, 59, 999);
          return expDate >= from && expDate <= to;
        } else if (this.expenseFromDate) {
          const from = new Date(this.expenseFromDate);
          from.setHours(0, 0, 0, 0);
          return expDate >= from;
        } else if (this.expenseToDate) {
          const to = new Date(this.expenseToDate);
          to.setHours(23, 59, 59, 999);
          return expDate <= to;
        }
        return true;
      });
    }

    if (this.selectedExpenseType) {
      expenses = expenses.filter(e => e.expenseType === this.selectedExpenseType);
    }

    this.expenditures = expenses;
  }

  clearExpenseFilters(): void {
    this.expenseFromDate = null;
    this.expenseToDate = null;
    this.selectedExpenseType = null;
    this.applyExpenseFilter();
    this.messageService.add({
      severity: 'info',
      summary: 'Filters Cleared',
      detail: 'Expense filters have been reset',
      life: 2000
    });
  }

  clearFilters(showToast: boolean = true): void {
    this.fromDate = null;
    this.toDate = null;
    this.activeFilter = null;
    this.searchEmployeeName = '';
    this.selectedWorkType = null;
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
      message: `Are you sure you want to delete this ${expenditure.expenseType} expense?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteExpenditure(expenditure)
    });
  }

  private deleteExpenditure(expenditure: Expenditure): void {
    this.expenditureService.deleteExpenditure(expenditure.id || '', expenditure.expenseType).subscribe({
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

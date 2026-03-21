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

  // Filter properties (shared for work records and expenses)
  customDateRange: Date[] = [];

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
        this.loading = false;
        this.applyFilter();
      });
  }

  private loadExpenditures(): void {
    this.expenditureService.getAllExpenditures()
      .pipe(takeUntil(this.destroy$))
      .subscribe(expenditures => {
        this.allExpenditures = expenditures;
        this.applyFilter();
      });
  }

  onApplyFilter(): void {
    this.applyFilter();
  }

  private parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  private applyFilter(): void {
    if (this.customDateRange && this.customDateRange.length === 2 && this.customDateRange[1]) {
      const start = new Date(this.customDateRange[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(this.customDateRange[1]);
      end.setHours(23, 59, 59, 999);

      this.filteredEntries = this.workEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      });

      this.expenditures = this.allExpenditures.filter(exp => {
        const expDate = this.parseLocalDate(exp.date);
        return expDate >= start && expDate <= end;
      });
    } else {
      this.filteredEntries = [...this.workEntries];
      this.expenditures = [...this.allExpenditures];
    }

    this.totalRecords = this.filteredEntries.length;
    this.first = 0;
  }

  clearFilters(showToast: boolean = true): void {
    this.customDateRange = [];
    this.filteredEntries = [...this.workEntries];
    this.totalRecords = this.workEntries.length;
    this.first = 0;
    this.expenditures = [...this.allExpenditures];

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

import { Component } from '@angular/core';
import { WorkEntry } from './model/work-entry.model';
import { Subject, takeUntil } from 'rxjs';
import { WorkManagementService } from '../../../services/work-management.service';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../shared-imports';
import { AddWorkForm } from './add-work-form/add-work-form';
import { AddExpense } from '../salary-details/add-expense/add-expense';

@Component({
  selector: 'app-daily-work-mangement',
  imports: [SHARED_IMPORTS, AddWorkForm,AddExpense],
  providers: [MessageService],
  templateUrl: './daily-work-mangement.html',
  styleUrl: './daily-work-mangement.scss',
})
export class DailyWorkMangement {
  workEntries: WorkEntry[] = [];
  filteredEntries: WorkEntry[] = [];

  // Filter properties
  fromDate: Date | null = null;
  toDate: Date | null = null;
  activeFilter: string | null = null;

  // Table properties
  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;
  displayAddWorkDialog: boolean = false;
  private destroy$ = new Subject<void>();
  displayExpenseViewDialog: boolean = false;

  constructor(
    private workService: WorkManagementService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadWorkEntries();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openAddWorkDialog() {
    this.displayAddWorkDialog = true
  }

  openAddExpensesDialog(): void {
    this.displayExpenseViewDialog = true;
  }

  private loadWorkEntries(): void {
    this.workService.getEntries()
      .pipe(takeUntil(this.destroy$))
      .subscribe(entries => {
        this.workEntries = entries;
        this.filteredEntries = entries;
        this.totalRecords = entries.length;
      });
  }

  // Quick filter methods
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

  onCustomDateFilter(): void {
    this.activeFilter = 'custom';
    this.applyFilter();
  }

  private applyFilter(): void {
    this.filteredEntries = this.workService.filterEntries(this.fromDate, this.toDate);
    this.totalRecords = this.filteredEntries.length;
    this.first = 0; // Reset to first page
  }

  clearFilters(): void {
    this.fromDate = null;
    this.toDate = null;
    this.activeFilter = null;
    this.filteredEntries = this.workEntries;
    this.totalRecords = this.workEntries.length;
    this.first = 0;

    this.messageService.add({
      severity: 'info',
      summary: 'Filters Cleared',
      detail: 'All filters have been reset',
      life: 2000
    });
  }

  // Utility methods
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
}

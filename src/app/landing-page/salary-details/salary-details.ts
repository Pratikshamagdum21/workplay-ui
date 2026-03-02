import { Component, OnInit, OnDestroy } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared-imports';
import { SalaryService } from '../../../services/salary.service';
import { BranchService } from '../../../services/branch.service';
import { ExpenditureService, Expenditure } from '../../../services/expenditure.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { PaySalary } from './pay-salary/pay-salary';
import { AddExpense } from './add-expense/add-expense';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee } from '../employee-details/model/employee.model';
import { ConfirmationService, MessageService } from 'primeng/api';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-salary-details',
  imports: [[...SHARED_IMPORTS], PaySalary, AddExpense],
  providers: [MessageService, ConfirmationService],
  templateUrl: './salary-details.html',
  styleUrl: './salary-details.scss',
})
export class SalaryDetails implements OnInit, OnDestroy {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  filteredsalary: any[] = [];
  allSalaryHistory: any[] = [];
  loading: boolean = false;
  displayViewDialog = false;
  displayExpenseViewDialog = false;
  selectedSalary: any = null;
  totalSalary: number = 0;
  expenditures: Expenditure[] = [];
  allExpenditures: Expenditure[] = [];
  filteredExpenditures: Expenditure[] = [];
  totalSalaryPaid: number = 0;

  filterOptions: FilterOption[] = [
    { label: 'All Time', value: 'all' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'Custom Range', value: 'custom' }
  ];

  selectedFilter: string = 'all';
  customDateRange: Date[] = [];
  showCustomDatePicker: boolean = false;

  currentYear = new Date().getFullYear();

  private destroy$ = new Subject<void>();

  constructor(
    private salaryService: SalaryService,
    private branchService: BranchService,
    private expenditureService: ExpenditureService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadSalaryHistory();
    this.loadExpenditures();

    // Reload when branch changes
    this.branchService.getSelectedBranch()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadEmployees());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEmployees(): void {
    this.loading = true;
    this.salaryService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.filteredEmployees = employees;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private loadSalaryHistory(): void {
    this.salaryService.getSalaryHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.allSalaryHistory = history as any[];
        this.filteredsalary = [...this.allSalaryHistory];
        this.totalSalaryPaid = this.filteredsalary.reduce((sum, p) => sum + p.finalPay, 0);
      });
  }

  private loadExpenditures(): void {
    this.expenditureService.getAllExpenditures()
      .pipe(takeUntil(this.destroy$))
      .subscribe(expenditures => {
        this.allExpenditures = expenditures;
        this.expenditures = expenditures;
        this.filteredExpenditures = [...expenditures];
      });
  }

  getTotalExpenses(): number {
    return this.filteredExpenditures.reduce((sum, e) => sum + e.amount, 0);
  }

  onExpenseSaved(): void {
    this.displayExpenseViewDialog = false;
    this.expenditureService.loadExpenditures();
  }

  confirmDeleteExpenditure(exp: Expenditure): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this ${exp.id.expenseType} expense?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.expenditureService.deleteExpenditure(exp.id.date, exp.id.expenseType).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Expense deleted successfully',
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
    });
  }

  onFilterChange(event: any): void {
    this.selectedFilter = event.value;
    this.showCustomDatePicker = this.selectedFilter === 'custom';
    if (this.selectedFilter !== 'custom') {
      this.customDateRange = [];
    }
  }

  onCustomDateChange(): void {
    // No-op; user must click Apply
  }

  onApplyFilter(): void {
    this.applyFilter();
  }

  getTotalFabricMeters(): number {
    return 1000;
  }

  private getFilterDateRange(): { start: Date; end: Date } | null {
    const now = new Date();

    switch (this.selectedFilter) {
      case 'all':
        return null;
      case 'week': {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case 'year': {
        const start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case 'custom': {
        if (this.customDateRange && this.customDateRange.length === 2 && this.customDateRange[1]) {
          const start = new Date(this.customDateRange[0]);
          start.setHours(0, 0, 0, 0);
          const end = new Date(this.customDateRange[1]);
          end.setHours(23, 59, 59, 999);
          return { start, end };
        }
        return null;
      }
      default:
        return null;
    }
  }

  private applyFilter(): void {
    const range = this.getFilterDateRange();

    if (!range) {
      // 'all' or incomplete custom range — show everything
      this.filteredsalary = [...this.allSalaryHistory];
      this.filteredExpenditures = [...this.allExpenditures];
      this.filteredEmployees = this.employees;
    } else {
      // Filter salary history by createdAt
      this.filteredsalary = this.allSalaryHistory.filter(record => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= range.start && recordDate <= range.end;
      });

      // Filter expenditures by id.date
      this.filteredExpenditures = this.allExpenditures.filter(exp => {
        const expDate = new Date(exp.id.date);
        return expDate >= range.start && expDate <= range.end;
      });

      this.filteredEmployees = this.employees;
    }

    // Recalculate totals based on filtered data
    this.totalSalaryPaid = this.filteredsalary.reduce((sum, p) => sum + p.finalPay, 0);
  }

  clearFilter(): void {
    this.selectedFilter = 'all';
    this.customDateRange = [];
    this.showCustomDatePicker = false;
    this.filteredsalary = [...this.allSalaryHistory];
    this.filteredExpenditures = [...this.allExpenditures];
    this.filteredEmployees = this.employees;
    this.totalSalaryPaid = this.allSalaryHistory.reduce((sum, p) => sum + p.finalPay, 0);
  }

  /**
   * Year-end bonus for employees WITHOUT per-salary bonus (isBonused = false).
   * (totalYearSalary / 100) * 16.66
   */
  getYearEndBonus(employee: Employee): number {
    const yearTotal = this.salaryService.getEmployeeYearSalary(employee.id, this.currentYear);
    return this.salaryService.calculateYearEndBonus(yearTotal);
  }

  /**
   * Year-to-date salary total for a non-bonus employee
   */
  getYearToDateSalary(employee: Employee): number {
    return this.salaryService.getEmployeeYearSalary(employee.id, this.currentYear);
  }

  generatePDFReport(): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Salary & Expense Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
    doc.text(`Branch: ${this.branchService.getSelectedBranchSnapshot().name}`, 14, 37);

    const tableData = this.filteredsalary.map(emp => [
      emp.name,
      this.getSalaryTypeLabel(emp.salaryType),
      emp.salaryType === 'WEEKLY'
        ? this.formatCurrency(emp.rate || 0) + '/meter'
        : this.formatCurrency(emp.salary || 0) + '/month',
      this.formatCurrency(emp.advanceAmount),
      this.formatCurrency(emp.advanceRemaining),
      emp.isBonused ? 'Per Salary (16.66%)' : 'Year-End (16.66%)'
    ]);

    autoTable(doc, {
      head: [['Employee Name', 'Salary Type', 'Rate/Salary', 'Advance Taken', 'Advance Remaining', 'Bonus']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 30, halign: 'center' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary', 14, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const totalAdvanceTaken = this.filteredsalary.reduce((sum, emp) => sum + emp.advanceAmount, 0);
    const totalAdvanceRemaining = this.filteredsalary.reduce((sum, emp) => sum + emp.advanceRemaining, 0);
    const totalYearEndBonus = this.filteredsalary
      .filter(emp => !emp.isBonused)
      .reduce((sum, emp) => sum + this.getYearEndBonus(emp), 0);

    doc.text(`Total Records: ${this.filteredsalary.length}`, 14, finalY + 25);
    doc.text(`Total Advance Taken: ${this.formatCurrency(totalAdvanceTaken)}`, 14, finalY + 32);
    doc.text(`Total Advance Remaining: ${this.formatCurrency(totalAdvanceRemaining)}`, 14, finalY + 39);
    doc.text(`Projected Year-End Bonus (non-bonus employees): ${this.formatCurrency(totalYearEndBonus)}`, 14, finalY + 46);

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`Salary_Report_${new Date().getTime()}.pdf`);
  }

  getSalaryTypeLabel(type: string): string {
    return type;
  }

  getSalaryTypeSeverity(type: string): 'success' | 'info' {
    return type === 'WEEKLY' ? 'success' : 'info';
  }

  getBonusLabel(isBonused: boolean): string {
    return isBonused ? 'Per Salary (16.66%)' : 'Year-End (16.66%)';
  }

  getBonusSeverity(isBonused: boolean): 'success' | 'warn' {
    return isBonused ? 'success' : 'warn';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getBonusedCount(): number {
    return this.filteredEmployees.filter(e => e.isBonused).length;
  }

  getNonBonusedCount(): number {
    return this.filteredEmployees.filter(e => !e.isBonused).length;
  }

  getNonBonusedEmployees(): Employee[] {
    return this.filteredEmployees.filter(e => !e.isBonused);
  }

  paySalary(employee: any): void {}

  openPaySalaryDialog(): void {
    this.selectedSalary = null;
    this.displayViewDialog = true;
  }

  editSalary(salary: any): void {
    this.selectedSalary = salary;
    this.displayViewDialog = true;
  }

  onSalarySaved(): void {
    this.displayViewDialog = false;
    this.selectedSalary = null;
  }

  onDialogHide(): void {
    this.selectedSalary = null;
  }

  openAddExpensesDialog(): void {
    this.displayExpenseViewDialog = true;
  }
}


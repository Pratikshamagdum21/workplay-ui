import { Component, OnInit, OnDestroy } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared-imports';
import { SalaryService } from '../../../services/salary.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { PaySalary } from './pay-salary/pay-salary';
import { AddExpense } from './add-expense/add-expense';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee } from '../employee-details/model/employee.model';
import { ExpenditureService, Expenditure } from '../../../services/expenditure.service';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-salary-details',
  imports: [[...SHARED_IMPORTS], PaySalary, AddExpense],
  templateUrl: './salary-details.html',
  styleUrl: './salary-details.scss',
})
export class SalaryDetails implements OnInit, OnDestroy {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  loading: boolean = false;
  displayViewDialog = false;
  displayExpenseViewDialog = false;
  totalSalary: number = 0;
  totalExpenses: number = 0;
  expenditures: Expenditure[] = [];

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

  private destroy$ = new Subject<void>();

  constructor(
    private salaryService: SalaryService,
    private expenditureService: ExpenditureService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadExpenditures();
    this.loadSalaryTotals();
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

  private loadExpenditures(): void {
    this.expenditureService.getAllExpenditures()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expenditures) => {
          this.expenditures = expenditures;
          this.totalExpenses = expenditures.reduce((sum, e) => sum + e.amount, 0);
        },
        error: () => {}
      });
  }

  private loadSalaryTotals(): void {
    this.salaryService.salaryHistory$
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.totalSalary = history.reduce((sum, payload) => sum + payload.finalPay, 0);
      });
  }

  onFilterChange(event: any): void {
    this.selectedFilter = event.value;
    this.showCustomDatePicker = this.selectedFilter === 'custom';
    if (this.selectedFilter !== 'custom') {
      this.customDateRange = [];
      this.applyFilter();
    }
  }

  onCustomDateChange(): void {
    if (this.customDateRange && this.customDateRange.length === 2) {
      this.applyFilter();
    }
  }

  onExpenseSaved(): void {
    this.displayExpenseViewDialog = false;
    this.loadExpenditures();
  }

  getTotalFabricMeters(): number {
    return 1000;
  }

  private applyFilter(): void {
    this.filteredEmployees = this.employees;
  }

  clearFilter(): void {
    this.selectedFilter = 'all';
    this.customDateRange = [];
    this.showCustomDatePicker = false;
    this.filteredEmployees = this.employees;
  }

  generatePDFReport(): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Salary & Expense Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);

    const tableData = this.filteredEmployees.map(emp => [
      emp.name,
      this.getSalaryTypeLabel(emp.salaryType),
      emp.salaryType === 'WEEKLY'
        ? this.formatCurrency(emp.rate || 0) + '/meter'
        : this.formatCurrency(emp.salary || 0) + '/month',
      this.formatCurrency(emp.advanceAmount),
      this.formatCurrency(emp.advanceRemaining),
      this.getBonusLabel(emp.isBonused)
    ]);

    autoTable(doc, {
      head: [['Employee Name', 'Salary Type', 'Rate/Salary', 'Advance Taken', 'Advance Remaining', 'Bonus']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary', 14, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const totalAdvanceTaken = this.filteredEmployees.reduce((sum, emp) => sum + emp.advanceAmount, 0);
    const totalAdvanceRemaining = this.filteredEmployees.reduce((sum, emp) => sum + emp.advanceRemaining, 0);

    doc.text(`Total Records: ${this.filteredEmployees.length}`, 14, finalY + 25);
    doc.text(`Total Advance Taken: ${this.formatCurrency(totalAdvanceTaken)}`, 14, finalY + 32);
    doc.text(`Total Advance Remaining: ${this.formatCurrency(totalAdvanceRemaining)}`, 14, finalY + 39);
    doc.text(`Total Salary Paid: ${this.formatCurrency(this.totalSalary)}`, 14, finalY + 46);
    doc.text(`Total Expenses: ${this.formatCurrency(this.totalExpenses)}`, 14, finalY + 53);

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

  getExpenseTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      ELECTRICITY: 'Electricity',
      MAINTENANCE: 'Maintenance',
      WORKER: 'Worker Payment',
      MATERIAL: 'Material Purchase',
      TRANSPORT: 'Transport',
      OTHER: 'Other'
    };
    return labels[type] || type;
  }

  getSalaryTypeLabel(type: string): string {
    return type === 'WEEKLY' ? 'Weekly (Meter-based)' : 'Monthly (Fixed)';
  }

  getSalaryTypeSeverity(type: string): 'success' | 'info' {
    return type === 'WEEKLY' ? 'success' : 'info';
  }

  getBonusLabel(isBonused: boolean): string {
    return isBonused ? 'Eligible' : 'Not Eligible';
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

  paySalary(employee: any): void {
  }

  openPaySalaryDialog(): void {
    this.displayViewDialog = true;
  }

  openAddExpensesDialog(): void {
    this.displayExpenseViewDialog = true;
  }
}

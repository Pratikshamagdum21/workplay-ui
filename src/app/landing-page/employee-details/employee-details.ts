import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EmployeeService } from '../../../services/employee.service';
import { Subject, takeUntil } from 'rxjs';
import { Employee } from './model/employee.model';
import { SHARED_IMPORTS } from '../../shared-imports';
import { AddEmployee } from './add-employee/add-employee';
import { ViewEmployeeDetails } from './view-employee-details/view-employee-details';

@Component({
  selector: 'app-employee-details',
  imports: [[...SHARED_IMPORTS], AddEmployee, ViewEmployeeDetails],
  providers: [MessageService, ConfirmationService],
  templateUrl: './employee-details.html',
  styleUrl: './employee-details.scss',
})
export class EmployeeDetails implements OnInit, OnDestroy {
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  loading: boolean = false;

  displayAddDialog: boolean = false;
  displayEditDialog: boolean = false;
  displayViewDialog: boolean = false;

  isEditMode: boolean = false;

  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEmployees(): void {
    this.loading = true;
    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.totalRecords = employees.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.selectedEmployee = null;
    this.displayAddDialog = true;
  }

  closeAddDialog(): void {
    this.displayAddDialog = false;
    this.selectedEmployee = null;
  }

  onEmployeeAdded(): void {
    this.displayAddDialog = false;
    this.first = 0;
  }

  openEditDialog(employee: Employee): void {
    this.isEditMode = true;
    this.selectedEmployee = { ...employee };
    this.displayEditDialog = true;
  }

  closeEditDialog(): void {
    this.displayEditDialog = false;
    this.selectedEmployee = null;
    this.isEditMode = false;
  }

  onEmployeeUpdated(): void {
    this.displayEditDialog = false;
    this.selectedEmployee = null;
    this.isEditMode = false;
  }

  openViewDialog(employee: Employee): void {
    this.selectedEmployee = employee;
    this.displayViewDialog = true;
  }

  closeViewDialog(): void {
    this.displayViewDialog = false;
    this.selectedEmployee = null;
  }

  confirmDelete(employee: Employee): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${employee.name}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteEmployee(employee)
    });
  }

  private deleteEmployee(employee: Employee): void {
    this.employeeService.deleteEmployee(employee.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `${employee.name} has been deleted`,
          life: 3000
        });
      },
      error: () => {}
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getSalaryTypeLabel(type: string): string {
    return type === 'WEEKLY' ? 'Weekly' : 'Monthly';
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { Customer } from '../model/invoice.model';
import { CustomerService } from '../../../../services/customer.service';
import { AddCustomer } from '../add-customer/add-customer';

@Component({
  selector: 'app-manage-customers',
  standalone: true,
  imports: [...SHARED_IMPORTS, AddCustomer],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manage-customers.html',
  styleUrl: './manage-customers.scss'
})
export class ManageCustomers implements OnInit, OnDestroy {
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  loading = false;

  displayAddDialog = false;
  displayEditDialog = false;
  isEditMode = false;

  first = 0;
  rows = 10;
  totalRecords = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private customerService: CustomerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customers = customers;
          this.totalRecords = customers.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.selectedCustomer = null;
    this.displayAddDialog = true;
  }

  closeAddDialog(): void {
    this.displayAddDialog = false;
    this.selectedCustomer = null;
  }

  onCustomerAdded(): void {
    this.displayAddDialog = false;
    this.selectedCustomer = null;
    this.first = 0;
  }

  openEditDialog(customer: Customer): void {
    this.isEditMode = true;
    this.selectedCustomer = { ...customer };
    this.displayEditDialog = true;
  }

  closeEditDialog(): void {
    this.displayEditDialog = false;
    this.selectedCustomer = null;
    this.isEditMode = false;
  }

  onCustomerUpdated(): void {
    this.displayEditDialog = false;
    this.selectedCustomer = null;
    this.isEditMode = false;
  }

  confirmDelete(customer: Customer): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${customer.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteCustomer(customer)
    });
  }

  private deleteCustomer(customer: Customer): void {
    this.customerService.deleteCustomer(customer.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `${customer.name} has been deleted`,
          life: 3000
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete customer',
          life: 3000
        });
      }
    });
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { Invoice } from '../model/invoice.model';
import { InvoiceService } from '../../../../services/invoice.service';
import { CreateInvoice } from '../create-invoice/create-invoice';
import { ManageCustomers } from '../manage-customers/manage-customers';
import { ManageFabricQualities } from '../manage-fabric-qualities/manage-fabric-qualities';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [...SHARED_IMPORTS, CreateInvoice, ManageCustomers, ManageFabricQualities],
  providers: [MessageService],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss'
})
export class InvoiceList implements OnInit, OnDestroy {
  invoices: Invoice[] = [];
  selectedInvoices: Invoice[] = [];
  loading = false;
  displayCreateDialog = false;
  activeTab: string = '0';

  first = 0;
  rows = 10;
  totalRecords = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private invoiceService: InvoiceService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInvoices(): void {
    this.loading = true;
    this.invoiceService.getInvoices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (invoices) => {
          this.invoices = invoices;
          this.totalRecords = invoices.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  openCreateDialog(): void {
    this.displayCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.displayCreateDialog = false;
  }

  onInvoiceCreated(): void {
    this.displayCreateDialog = false;
    this.first = 0;
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Invoice created successfully',
      life: 3000
    });
  }

  downloadInvoice(invoice: Invoice): void {
    this.invoiceService.downloadInvoice(invoice.id).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `Invoice_${invoice.invoiceNumber}.pdf`);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to download invoice',
          life: 3000
        });
      }
    });
  }

  downloadSelected(): void {
    if (this.selectedInvoices.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one invoice',
        life: 3000
      });
      return;
    }

    const ids = this.selectedInvoices.map(inv => inv.id);
    this.invoiceService.downloadBulkInvoices(ids).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, 'Invoices_Bulk.pdf');
        this.selectedInvoices = [];
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to download invoices',
          life: 3000
        });
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN');
  }
}

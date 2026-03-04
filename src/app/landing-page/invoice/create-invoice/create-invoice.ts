import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { Customer, FabricQuality, BusinessInfo } from '../model/invoice.model';
import { InvoiceService } from '../../../../services/invoice.service';
import { CustomerService } from '../../../../services/customer.service';
import { FabricQualityService } from '../../../../services/fabric-quality.service';
import { BusinessInfoService } from '../../../../services/business-info.service';
import { AddCustomer } from '../add-customer/add-customer';
import { BusinessInfoConfig } from '../business-info/business-info';

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [...SHARED_IMPORTS, AddCustomer, BusinessInfoConfig],
  providers: [MessageService],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.scss'
})
export class CreateInvoice implements OnInit, OnDestroy {
  @Output() invoiceSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  invoiceForm!: FormGroup;
  customers: Customer[] = [];
  fabricQualities: FabricQuality[] = [];
  businessInfo: BusinessInfo | null = null;
  selectedCustomer: Customer | null = null;
  selectedQuality: FabricQuality | null = null;

  displayAddCustomerDialog = false;
  displayBusinessInfoDialog = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    private fabricQualityService: FabricQualityService,
    private businessInfoService: BusinessInfoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      invoiceDate: [new Date(), Validators.required],

      customerName: ['', Validators.required],
      customerAddress: [''],
      customerContact: [''],
      customerGstin: [''],
      customerState: [''],

      qualityName: ['', Validators.required],
      width: [''],
      fani: [''],
      peak: [''],
      warp: [''],
      weft: [''],

      rolls: [0, [Validators.required, Validators.min(0)]],
      meters: [0, [Validators.required, Validators.min(0)]],
      rate: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private loadData(): void {
    this.customerService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(customers => this.customers = customers);

    this.fabricQualityService.getQualities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(qualities => this.fabricQualities = qualities);

    this.businessInfoService.getBusinessInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => this.businessInfo = info);
  }

  onCustomerChange(event: any): void {
    const customer = event.value as Customer;
    if (customer) {
      this.selectedCustomer = customer;
      this.invoiceForm.patchValue({
        customerName: customer.name,
        customerAddress: customer.address,
        customerContact: customer.contactNumber,
        customerGstin: customer.gstin,
        customerState: customer.state
      });
    }
  }

  onQualityChange(event: any): void {
    const quality = event.value as FabricQuality;
    if (quality) {
      this.selectedQuality = quality;
      this.invoiceForm.patchValue({
        qualityName: quality.name,
        width: quality.width,
        fani: quality.fani,
        peak: quality.peak,
        warp: quality.warp,
        weft: quality.weft
      });
    }
  }

  get totalAmount(): number {
    const meters = this.invoiceForm.get('meters')?.value || 0;
    const rate = this.invoiceForm.get('rate')?.value || 0;
    return meters * rate;
  }

  get cgstAmount(): number {
    return this.totalAmount * 0.025; // 2.5% CGST
  }

  get sgstAmount(): number {
    return this.totalAmount * 0.025; // 2.5% SGST
  }

  get netPayable(): number {
    return this.totalAmount + this.cgstAmount + this.sgstAmount;
  }

  get amountInWords(): string {
    return this.convertNumberToWords(this.netPayable);
  }

  openAddCustomerDialog(): void {
    this.displayAddCustomerDialog = true;
  }

  closeAddCustomerDialog(): void {
    this.displayAddCustomerDialog = false;
  }

  onCustomerAdded(): void {
    this.displayAddCustomerDialog = false;
    this.customerService.refreshCustomers();
  }

  openBusinessInfoDialog(): void {
    this.displayBusinessInfoDialog = true;
  }

  closeBusinessInfoDialog(): void {
    this.displayBusinessInfoDialog = false;
  }

  onBusinessInfoSaved(): void {
    this.displayBusinessInfoDialog = false;
    this.businessInfoService.refreshBusinessInfo();
  }

  submit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all required fields',
        life: 3000
      });
      return;
    }

    if (!this.businessInfo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Info',
        detail: 'Please configure business information first',
        life: 3000
      });
      return;
    }

    const formVal = this.invoiceForm.value;
    const invoiceDate = formVal.invoiceDate instanceof Date
      ? formVal.invoiceDate.toISOString().split('T')[0]
      : formVal.invoiceDate;

    const invoice = {
      invoiceNumber: formVal.invoiceNumber,
      invoiceDate,
      customerName: formVal.customerName,
      customerAddress: formVal.customerAddress,
      customerContact: formVal.customerContact,
      customerGstin: formVal.customerGstin,
      customerState: formVal.customerState,
      qualityName: formVal.qualityName,
      width: formVal.width,
      fani: formVal.fani,
      peak: formVal.peak,
      warp: formVal.warp,
      weft: formVal.weft,
      rolls: formVal.rolls,
      meters: formVal.meters,
      rate: formVal.rate,
      totalAmount: this.totalAmount,
      cgstAmount: this.cgstAmount,
      sgstAmount: this.sgstAmount,
      netPayable: this.netPayable,
      amountInWords: this.amountInWords
    };

    this.invoiceService.createInvoice(invoice).subscribe({
      next: () => {
        this.invoiceSaved.emit();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create invoice',
          life: 3000
        });
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  private convertNumberToWords(num: number): string {
    if (num === 0) return 'Zero Rupees Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numToWords(n % 100) : '');
      if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
      if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
      return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = numToWords(rupees) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + numToWords(paise) + ' Paise';
    }
    result += ' Only';
    return result;
  }
}

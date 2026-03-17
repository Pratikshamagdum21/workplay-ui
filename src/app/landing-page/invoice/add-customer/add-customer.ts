import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { Customer } from '../model/invoice.model';
import { CustomerService } from '../../../../services/customer.service';

@Component({
  selector: 'app-add-customer',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  providers: [MessageService],
  templateUrl: './add-customer.html',
  styleUrl: './add-customer.scss'
})
export class AddCustomer implements OnInit {
  @Input() isEditMode = false;
  @Input() customerData: Customer | null = null;
  @Output() customerSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  customerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      name: [this.customerData?.name || '', Validators.required],
      address: [this.customerData?.address || ''],
      contactNumber: [this.customerData?.contactNumber || ''],
      gstin: [this.customerData?.gstin || ''],
      state: [this.customerData?.state || '']
    });
  }

  submit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const operation = this.isEditMode && this.customerData
      ? this.customerService.updateCustomer(this.customerData.id, this.customerForm.value)
      : this.customerService.addCustomer(this.customerForm.value);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.isEditMode ? 'Customer updated successfully' : 'Customer added successfully',
          life: 3000
        });
        this.customerSaved.emit();
        if (!this.isEditMode) {
          this.customerForm.reset();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.isEditMode ? 'Failed to update customer' : 'Failed to add customer',
          life: 3000
        });
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { CustomerService } from '../../../../services/customer.service';

@Component({
  selector: 'app-add-customer',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  providers: [MessageService],
  templateUrl: './add-customer.html',
  styleUrl: './add-customer.scss'
})
export class AddCustomer {
  @Output() customerSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  customerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private messageService: MessageService
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      contactNumber: [''],
      gstin: [''],
      state: ['']
    });
  }

  submit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.customerService.addCustomer(this.customerForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Customer added successfully',
          life: 3000
        });
        this.customerSaved.emit();
        this.customerForm.reset();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add customer',
          life: 3000
        });
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

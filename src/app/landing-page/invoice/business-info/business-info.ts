import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { BusinessInfo } from '../model/invoice.model';
import { BusinessInfoService } from '../../../../services/business-info.service';

@Component({
  selector: 'app-business-info',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  providers: [MessageService],
  templateUrl: './business-info.html',
  styleUrl: './business-info.scss'
})
export class BusinessInfoConfig implements OnInit {
  @Input() businessInfo: BusinessInfo | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  businessForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private businessInfoService: BusinessInfoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.businessForm = this.fb.group({
      businessName: [this.businessInfo?.businessName || '', Validators.required],
      ownerName: [this.businessInfo?.ownerName || '', Validators.required],
      address: [this.businessInfo?.address || '', Validators.required],
      gstin: [this.businessInfo?.gstin || '', Validators.required],
      state: [this.businessInfo?.state || '', Validators.required],
      phoneNumber: [this.businessInfo?.phoneNumber || '', Validators.required]
    });
  }

  submit(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    const formVal = this.businessForm.value;
    const info: BusinessInfo = {
      id: this.businessInfo?.id || null,
      ...formVal
    };

    const operation = this.businessInfo?.id
      ? this.businessInfoService.updateBusinessInfo(info)
      : this.businessInfoService.saveBusinessInfo(info);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Business information saved successfully',
          life: 3000
        });
        this.saved.emit();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save business information',
          life: 3000
        });
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

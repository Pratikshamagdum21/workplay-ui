import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { Expenditure, ExpenditureService } from '../../../../services/expenditure.service';
import { BranchService } from '../../../../services/branch.service';

@Component({
  selector: 'app-add-expense',
  imports: [[...SHARED_IMPORTS]],
  providers: [MessageService],
  templateUrl: './add-expense.html',
  styleUrl: './add-expense.scss',
})
export class AddExpense implements OnInit, OnChanges {
  @Input() expenseData: Expenditure | null = null;
  @Output() saved = new EventEmitter<any>();

  expenseForm!: FormGroup;
  saving: boolean = false;
  isEditMode: boolean = false;

  selectedReceiptFile: File | null = null;
  receiptPreviewUrl: string | null = null;
  receiptError: string | null = null;
  showImageViewer: boolean = false;
  imageZoom: number = 1;

  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageWidth = 1024;
  private readonly compressionQuality = 0.7;

  expenseTypes = [
    { label: 'Light Bill', value: 'Light Bill' },
    { label: 'Vaifani', value: 'Vaifani' },
    { label: 'Welding', value: 'Welding' },
    { label: 'Friday Extra', value: 'Friday Extra' },
    { label: 'Worker Beam', value: 'Worker Beam' },
    { label: 'Electrician', value: 'Electrician' },
    { label: 'Checker', value: 'Checker' },
    { label: 'Petrol', value: 'Petrol' },
    { label: 'Sutar', value: 'Sutar' },
    { label: 'Worker Payment', value: 'WORKER' },
    { label: 'Mill Store', value: 'MATERIAL' },
    { label: 'Transport', value: 'TRANSPORT' },
    { label: 'Other', value: 'OTHER' }
  ];

  constructor(
    private fb: FormBuilder,
    private expenditureService: ExpenditureService,
    private messageService: MessageService,
    private branchService: BranchService
  ) {

  }

  ngOnInit(): void {
    this.expenseForm = this.fb.group({
      expenseType: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date(), Validators.required],
      note: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expenseData'] && this.expenseForm) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.expenseData) {
      this.isEditMode = true;
      this.expenseForm.patchValue({
        expenseType: this.expenseData.expenseType,
        amount: this.expenseData.amount,
        date: new Date(this.expenseData.date),
        note: this.expenseData.note || ''
      });
    } else {
      this.isEditMode = false;
      this.expenseForm.reset({ date: new Date() });
      this.clearReceipt();
    }
  }

  onReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receiptError = null;

    if (!input.files || input.files.length === 0) {
      this.clearReceipt();
      return;
    }

    const file = input.files[0];

    if (!this.allowedImageTypes.includes(file.type)) {
      this.receiptError = 'Only image files (JPG, PNG, WEBP) are allowed.';
      this.clearReceipt();
      input.value = '';
      return;
    }

    this.compressImage(file);
  }

  private compressImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > this.maxImageWidth) {
          height = Math.round(height * (this.maxImageWidth / width));
          width = this.maxImageWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              this.selectedReceiptFile = new File([blob], file.name, { type: 'image/jpeg' });
              if (this.receiptPreviewUrl) {
                URL.revokeObjectURL(this.receiptPreviewUrl);
              }
              this.receiptPreviewUrl = URL.createObjectURL(blob);
            }
          },
          'image/jpeg',
          this.compressionQuality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearReceipt(): void {
    if (this.receiptPreviewUrl) {
      URL.revokeObjectURL(this.receiptPreviewUrl);
    }
    this.selectedReceiptFile = null;
    this.receiptPreviewUrl = null;
    this.receiptError = null;
    this.closeImageViewer();
  }

  openImageViewer(): void {
    this.imageZoom = 1;
    this.showImageViewer = true;
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
    this.imageZoom = 1;
  }

  zoomIn(): void {
    if (this.imageZoom < 3) {
      this.imageZoom = Math.round((this.imageZoom + 0.25) * 100) / 100;
    }
  }

  zoomOut(): void {
    if (this.imageZoom > 0.25) {
      this.imageZoom = Math.round((this.imageZoom - 0.25) * 100) / 100;
    }
  }

  resetZoom(): void {
    this.imageZoom = 1;
  }

  submit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const formValue = this.expenseForm.value;
    const date = formValue.date instanceof Date
      ? formValue.date.toISOString().split('T')[0]
      : formValue.date;
    const branch = this.branchService.getSelectedBranchSnapshot();
    const expenditure = {
      branchId: branch.id,
      date: date,
      expenseType: formValue.expenseType,
      amount: formValue.amount,
      note: formValue.note || ''
    };

    this.saving = true;

    const request$ = this.isEditMode && this.expenseData?.id
      ? this.expenditureService.updateExpenditure(this.expenseData.id, expenditure, this.selectedReceiptFile)
      : this.expenditureService.saveExpenditure(expenditure, this.selectedReceiptFile);

    request$.subscribe({
      next: (result) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.isEditMode ? 'Expense updated successfully' : 'Expense saved successfully',
          life: 3000
        });
        this.saving = false;
        this.saved.emit(result);
        this.isEditMode = false;
        this.expenseData = null;
        this.expenseForm.reset({ date: new Date() });
        this.clearReceipt();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  cancel(){
    this.saved.emit();
  }
}

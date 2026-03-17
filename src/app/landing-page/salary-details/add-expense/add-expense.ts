import { Component, EventEmitter, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { Expenditure, ExpenditureService } from '../../../../services/expenditure.service';
import { BranchService } from '../../../../services/branch.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

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

  selectedReceiptFiles: File[] = [];
  receiptPreviewUrls: string[] = [];
  existingReceiptUrls: string[] = [];
  receiptError: string | null = null;
  showImageViewer: boolean = false;
  imageZoom: number = 1;
  viewerImageIndex: number = 0;

  isNativePlatform = Capacitor.isNativePlatform();

  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageWidth = 1024;

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
    { label: 'Worker Payment', value: 'Worker Payment' },
    { label: 'Mill Store', value: 'Mill Store' },
    { label: 'Mending', value: 'Mending' },
    { label: 'Transport', value: 'TRANSPORT' },
    { label: 'Other', value: 'OTHER' }
  ];

  constructor(
    private fb: FormBuilder,
    private expenditureService: ExpenditureService,
    private messageService: MessageService,
    private branchService: BranchService,
    private ngZone: NgZone
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
      this.clearReceipt();
      this.loadExistingReceipts();
    } else {
      this.isEditMode = false;
      this.expenseForm.reset({ date: new Date() });
      this.clearReceipt();
    }
  }

  private loadExistingReceipts(): void {
    if (this.expenseData?.receiptIds && this.expenseData.receiptIds.length > 0) {
      this.existingReceiptUrls = this.expenseData.receiptIds.map(
        id => this.expenditureService.getReceiptImageUrl(id)
      );
      this.receiptPreviewUrls = [...this.existingReceiptUrls];
    }
  }

  onReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receiptError = null;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    for (const file of files) {
      if (!this.allowedImageTypes.includes(file.type)) {
        this.receiptError = 'Only image files (JPG, PNG, WEBP) are allowed.';
        continue;
      }
      this.resizeImage(file);
    }

    input.value = '';
  }

  async captureFromCamera(): Promise<void> {
    try {
      this.receiptError = null;
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: this.maxImageWidth,
        correctOrientation: true,
      });

      if (image.dataUrl) {
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const fileName = `camera_receipt_${Date.now()}.${image.format || 'jpeg'}`;
        const file = new File([blob], fileName, { type: `image/${image.format || 'jpeg'}` });

        this.ngZone.run(() => {
          this.selectedReceiptFiles.push(file);
          this.receiptPreviewUrls.push(image.dataUrl!);
        });
      }
    } catch (error: any) {
      if (error?.message !== 'User cancelled photos app') {
        this.ngZone.run(() => {
          this.receiptError = 'Failed to capture photo. Please try again.';
        });
      }
    }
  }

  private resizeImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > this.maxImageWidth) {
          height = Math.round(height * (this.maxImageWidth / width));
          width = this.maxImageWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              this.ngZone.run(() => {
                const resizedFile = new File([blob], file.name, { type: 'image/png' });
                this.selectedReceiptFiles.push(resizedFile);
                this.receiptPreviewUrls.push(URL.createObjectURL(blob));
              });
            }
          },
          'image/png',
          1.0
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeReceipt(index: number): void {
    const url = this.receiptPreviewUrls[index];
    const existingIndex = this.existingReceiptUrls.indexOf(url);
    if (existingIndex !== -1) {
      this.existingReceiptUrls.splice(existingIndex, 1);
    } else {
      const newFileIndex = index - this.existingReceiptUrls.length;
      if (newFileIndex >= 0 && newFileIndex < this.selectedReceiptFiles.length) {
        URL.revokeObjectURL(url);
        this.selectedReceiptFiles.splice(newFileIndex, 1);
      }
    }
    this.receiptPreviewUrls.splice(index, 1);
    if (this.showImageViewer) {
      if (this.receiptPreviewUrls.length === 0) {
        this.closeImageViewer();
      } else if (this.viewerImageIndex >= this.receiptPreviewUrls.length) {
        this.viewerImageIndex = this.receiptPreviewUrls.length - 1;
      }
    }
  }

  clearReceipt(): void {
    for (const url of this.receiptPreviewUrls) {
      if (!this.existingReceiptUrls.includes(url)) {
        URL.revokeObjectURL(url);
      }
    }
    this.selectedReceiptFiles = [];
    this.receiptPreviewUrls = [];
    this.existingReceiptUrls = [];
    this.receiptError = null;
    this.closeImageViewer();
  }

  openImageViewer(index: number = 0): void {
    this.viewerImageIndex = index;
    this.imageZoom = 1;
    this.showImageViewer = true;
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
    this.imageZoom = 1;
  }

  viewerPrev(): void {
    if (this.viewerImageIndex > 0) {
      this.viewerImageIndex--;
      this.imageZoom = 1;
    }
  }

  viewerNext(): void {
    if (this.viewerImageIndex < this.receiptPreviewUrls.length - 1) {
      this.viewerImageIndex++;
      this.imageZoom = 1;
    }
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

    const receiptFiles = this.selectedReceiptFiles.length > 0 ? this.selectedReceiptFiles : null;

    const request$ = this.isEditMode && this.expenseData?.id
      ? this.expenditureService.updateExpenditure(this.expenseData.id, expenditure, receiptFiles)
      : this.expenditureService.saveExpenditure(expenditure, receiptFiles);

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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { SimpleChange } from '@angular/core';
import { AddExpense } from './add-expense';
import { ExpenditureService, Expenditure } from '../../../../services/expenditure.service';
import { BranchService } from '../../../../services/branch.service';
import { of, throwError } from 'rxjs';
import { Camera } from '@capacitor/camera';

describe('AddExpense', () => {
  let component: AddExpense;
  let fixture: ComponentFixture<AddExpense>;
  let expenditureService: jasmine.SpyObj<ExpenditureService>;
  let messageService: MessageService;

  const mockExpenditure: Expenditure = {
    id: 'exp1', date: '2025-01-06', expenseType: 'Light Bill',
    amount: 500, note: 'Test note', receiptIds: ['r1']
  };

  beforeEach(async () => {
    const expServiceSpy = jasmine.createSpyObj('ExpenditureService', [
      'saveExpenditure', 'updateExpenditure', 'getReceiptImageUrl', 'getAllExpenditures'
    ]);
    expServiceSpy.getReceiptImageUrl.and.callFake((id: string) => `http://api/receipt/${id}`);
    expServiceSpy.getAllExpenditures.and.returnValue(of([]));

    const branchServiceMock = {
      getSelectedBranch: () => of({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getSelectedBranchSnapshot: () => ({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getBranches: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [AddExpense, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ExpenditureService, useValue: expServiceSpy },
        { provide: BranchService, useValue: branchServiceMock },
        MessageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddExpense);
    component = fixture.componentInstance;
    expenditureService = TestBed.inject(ExpenditureService) as jasmine.SpyObj<ExpenditureService>;
    messageService = fixture.debugElement.injector.get(MessageService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should create form with required fields', () => {
      expect(component.expenseForm).toBeTruthy();
      expect(component.expenseForm.get('expenseType')).toBeTruthy();
      expect(component.expenseForm.get('amount')).toBeTruthy();
      expect(component.expenseForm.get('date')).toBeTruthy();
      expect(component.expenseForm.get('note')).toBeTruthy();
    });

    it('should have default date set to today', () => {
      const dateValue = component.expenseForm.get('date')?.value;
      expect(dateValue).toBeTruthy();
      expect(dateValue instanceof Date).toBeTrue();
    });

    it('should have 14 expense types', () => {
      expect(component.expenseTypes.length).toBe(14);
    });
  });

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      component.expenseForm.get('date')?.setValue(null);
      expect(component.expenseForm.valid).toBeFalse();
    });

    it('should require expenseType', () => {
      expect(component.expenseForm.get('expenseType')?.hasError('required')).toBeTrue();
    });

    it('should require amount', () => {
      expect(component.expenseForm.get('amount')?.hasError('required')).toBeTrue();
    });

    it('should require amount >= 1', () => {
      component.expenseForm.get('amount')?.setValue(0);
      expect(component.expenseForm.get('amount')?.hasError('min')).toBeTrue();
    });

    it('should accept valid amount', () => {
      component.expenseForm.get('amount')?.setValue(100);
      expect(component.expenseForm.get('amount')?.valid).toBeTrue();
    });

    it('should not require note', () => {
      expect(component.expenseForm.get('note')?.valid).toBeTrue();
    });
  });

  describe('receipt image handling', () => {
    it('should reject non-image files', () => {
      const event = {
        target: {
          files: [new File(['test'], 'document.pdf', { type: 'application/pdf' })],
          value: 'document.pdf'
        }
      } as any;

      component.onReceiptSelected(event);
      expect(component.receiptError).toBe('Only image files (JPG, PNG, WEBP) are allowed.');
    });

    it('should handle empty file selection', () => {
      const event = { target: { files: null } } as any;
      component.onReceiptSelected(event);
      expect(component.receiptError).toBeNull();
    });

    it('should handle zero files', () => {
      const event = { target: { files: [], value: '' } } as any;
      component.onReceiptSelected(event);
      expect(component.receiptError).toBeNull();
    });

    it('should remove receipt at index', () => {
      // Add mock preview URLs
      component.receiptPreviewUrls = ['url1', 'url2', 'url3'];
      component.selectedReceiptFiles = [
        new File(['1'], '1.png', { type: 'image/png' }),
        new File(['2'], '2.png', { type: 'image/png' }),
        new File(['3'], '3.png', { type: 'image/png' })
      ];

      component.removeReceipt(1);
      expect(component.receiptPreviewUrls.length).toBe(2);
      expect(component.selectedReceiptFiles.length).toBe(2);
    });

    it('should remove existing receipt correctly', () => {
      component.existingReceiptUrls = ['existing1'];
      component.receiptPreviewUrls = ['existing1', 'new1'];
      component.selectedReceiptFiles = [new File(['1'], '1.png', { type: 'image/png' })];

      component.removeReceipt(0); // Remove existing
      expect(component.existingReceiptUrls.length).toBe(0);
      expect(component.receiptPreviewUrls.length).toBe(1);
    });

    it('should clear all receipts', () => {
      component.receiptPreviewUrls = ['url1', 'url2'];
      component.selectedReceiptFiles = [new File(['1'], '1.png', { type: 'image/png' })];
      component.existingReceiptUrls = ['url1'];

      component.clearReceipt();
      expect(component.receiptPreviewUrls.length).toBe(0);
      expect(component.selectedReceiptFiles.length).toBe(0);
      expect(component.existingReceiptUrls.length).toBe(0);
      expect(component.receiptError).toBeNull();
    });
  });

  describe('image viewer', () => {
    beforeEach(() => {
      component.receiptPreviewUrls = ['url1', 'url2', 'url3'];
    });

    it('should open image viewer at given index', () => {
      component.openImageViewer(1);
      expect(component.showImageViewer).toBeTrue();
      expect(component.viewerImageIndex).toBe(1);
      expect(component.imageZoom).toBe(1);
    });

    it('should default to index 0', () => {
      component.openImageViewer();
      expect(component.viewerImageIndex).toBe(0);
    });

    it('should close image viewer', () => {
      component.openImageViewer(1);
      component.closeImageViewer();
      expect(component.showImageViewer).toBeFalse();
      expect(component.imageZoom).toBe(1);
    });

    it('should navigate to previous image', () => {
      component.openImageViewer(2);
      component.viewerPrev();
      expect(component.viewerImageIndex).toBe(1);
    });

    it('should not go before first image', () => {
      component.openImageViewer(0);
      component.viewerPrev();
      expect(component.viewerImageIndex).toBe(0);
    });

    it('should navigate to next image', () => {
      component.openImageViewer(0);
      component.viewerNext();
      expect(component.viewerImageIndex).toBe(1);
    });

    it('should not go past last image', () => {
      component.openImageViewer(2);
      component.viewerNext();
      expect(component.viewerImageIndex).toBe(2);
    });

    it('should zoom in', () => {
      component.zoomIn();
      expect(component.imageZoom).toBe(1.25);
    });

    it('should zoom out', () => {
      component.zoomOut();
      expect(component.imageZoom).toBe(0.75);
    });

    it('should not zoom in beyond 3', () => {
      component.imageZoom = 3;
      component.zoomIn();
      expect(component.imageZoom).toBe(3);
    });

    it('should not zoom out below 0.25', () => {
      component.imageZoom = 0.25;
      component.zoomOut();
      expect(component.imageZoom).toBe(0.25);
    });

    it('should reset zoom', () => {
      component.imageZoom = 2.5;
      component.resetZoom();
      expect(component.imageZoom).toBe(1);
    });

    it('should close viewer when last receipt is removed', () => {
      component.receiptPreviewUrls = ['url1'];
      component.selectedReceiptFiles = [new File(['1'], '1.png', { type: 'image/png' })];
      component.openImageViewer(0);

      component.removeReceipt(0);
      expect(component.showImageViewer).toBeFalse();
    });

    it('should adjust viewer index when current image is removed', () => {
      component.receiptPreviewUrls = ['url1', 'url2'];
      component.selectedReceiptFiles = [
        new File(['1'], '1.png', { type: 'image/png' }),
        new File(['2'], '2.png', { type: 'image/png' })
      ];
      component.openImageViewer(1);

      component.removeReceipt(1);
      expect(component.viewerImageIndex).toBe(0);
    });
  });

  describe('ngOnChanges', () => {
    it('should populate form when expense data changes', () => {
      component.expenseData = mockExpenditure;
      component.ngOnChanges({
        expenseData: new SimpleChange(null, mockExpenditure, false)
      });

      expect(component.isEditMode).toBeTrue();
      expect(component.expenseForm.get('expenseType')?.value).toBe('Light Bill');
      expect(component.expenseForm.get('amount')?.value).toBe(500);
    });

    it('should load existing receipts in edit mode', () => {
      component.expenseData = mockExpenditure;
      component.ngOnChanges({
        expenseData: new SimpleChange(null, mockExpenditure, false)
      });

      expect(component.existingReceiptUrls.length).toBe(1);
      expect(component.receiptPreviewUrls.length).toBe(1);
    });

    it('should reset form when expense data is null', () => {
      component.expenseData = null;
      component.ngOnChanges({
        expenseData: new SimpleChange(mockExpenditure, null, false)
      });

      expect(component.isEditMode).toBeFalse();
    });
  });

  describe('submit', () => {
    it('should not submit when form is invalid', () => {
      component.submit();
      expect(expenditureService.saveExpenditure).not.toHaveBeenCalled();
    });

    it('should save new expenditure when valid', () => {
      component.expenseForm.patchValue({
        expenseType: 'Petrol',
        amount: 200,
        date: new Date(2025, 0, 10),
        note: 'Fuel'
      });

      const savedExp = { ...mockExpenditure, id: 'exp2' };
      expenditureService.saveExpenditure.and.returnValue(of(savedExp));
      spyOn(messageService, 'add');
      spyOn(component.saved, 'emit');

      component.submit();

      expect(expenditureService.saveExpenditure).toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        detail: 'Expense saved successfully'
      }));
      expect(component.saved.emit).toHaveBeenCalledWith(savedExp);
      expect(component.saving).toBeFalse();
    });

    it('should update expenditure in edit mode', () => {
      component.isEditMode = true;
      component.expenseData = mockExpenditure;
      component.expenseForm.patchValue({
        expenseType: 'Light Bill',
        amount: 600,
        date: new Date(2025, 0, 6),
        note: 'Updated'
      });

      const updatedExp = { ...mockExpenditure, amount: 600 };
      expenditureService.updateExpenditure.and.returnValue(of(updatedExp));
      spyOn(messageService, 'add');

      component.submit();

      expect(expenditureService.updateExpenditure).toHaveBeenCalledWith(
        'exp1', jasmine.any(Object), null
      );
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        detail: 'Expense updated successfully'
      }));
    });

    it('should include receipt files in save when available', () => {
      component.expenseForm.patchValue({
        expenseType: 'Petrol',
        amount: 200,
        date: new Date(2025, 0, 10)
      });
      component.selectedReceiptFiles = [new File(['test'], 'receipt.png', { type: 'image/png' })];

      expenditureService.saveExpenditure.and.returnValue(of(mockExpenditure));

      component.submit();

      expect(expenditureService.saveExpenditure).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.arrayContaining([jasmine.any(File)])
      );
    });

    it('should set saving to false on error', () => {
      component.expenseForm.patchValue({
        expenseType: 'Petrol',
        amount: 200,
        date: new Date()
      });

      expenditureService.saveExpenditure.and.returnValue(throwError(() => new Error('fail')));
      component.submit();
      expect(component.saving).toBeFalse();
    });
  });

  describe('camera capture', () => {
    it('should add captured photo to receipts', async () => {
      const mockDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      spyOn(Camera, 'getPhoto').and.returnValue(Promise.resolve({
        dataUrl: mockDataUrl,
        format: 'jpeg',
        saved: false,
      }));

      // Mock fetch for data URL conversion
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response(mockBlob)));

      await component.captureFromCamera();

      expect(Camera.getPhoto).toHaveBeenCalled();
      expect(component.selectedReceiptFiles.length).toBe(1);
      expect(component.receiptPreviewUrls.length).toBe(1);
      expect(component.selectedReceiptFiles[0].name).toContain('camera_receipt_');
    });

    it('should not show error when user cancels camera', async () => {
      spyOn(Camera, 'getPhoto').and.returnValue(
        Promise.reject({ message: 'User cancelled photos app' })
      );

      await component.captureFromCamera();

      expect(component.receiptError).toBeNull();
    });

    it('should show error on camera failure', async () => {
      spyOn(Camera, 'getPhoto').and.returnValue(
        Promise.reject({ message: 'Camera not available' })
      );

      await component.captureFromCamera();

      expect(component.receiptError).toBe('Failed to capture photo. Please try again.');
    });
  });

  describe('cancel', () => {
    it('should emit saved event', () => {
      spyOn(component.saved, 'emit');
      component.cancel();
      expect(component.saved.emit).toHaveBeenCalled();
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ExpenditureService, Expenditure } from './expenditure.service';
import { BranchService } from './branch.service';
import { environment } from '../environments/environment';
import { BehaviorSubject } from 'rxjs';

describe('ExpenditureService', () => {
  let service: ExpenditureService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/expenditure`;

  const selectedBranchSubject = new BehaviorSubject({ id: 1, name: 'Unit 1', code: 'MB-001' });

  const mockBranchService = {
    getSelectedBranch: () => selectedBranchSubject.asObservable(),
    getSelectedBranchSnapshot: () => selectedBranchSubject.value
  };

  const mockExpenditure: Expenditure = {
    id: 'exp1',
    date: '2025-01-06',
    expenseType: 'Light Bill',
    amount: 500,
    note: 'January bill',
    branchId: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ExpenditureService,
        { provide: BranchService, useValue: mockBranchService }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ExpenditureService);

    // Flush initial load
    const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllExpenditure`);
    req.flush([mockExpenditure]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllExpenditures', () => {
    it('should return expenditures observable', () => {
      let expenditures: Expenditure[] = [];
      service.getAllExpenditures().subscribe(e => expenditures = e);
      expect(expenditures.length).toBe(1);
      expect(expenditures[0].expenseType).toBe('Light Bill');
    });
  });

  describe('saveExpenditure', () => {
    it('should POST without images (JSON body)', () => {
      const newExp: Expenditure = {
        date: '2025-01-10',
        expenseType: 'Petrol',
        amount: 200,
        note: 'Fuel'
      };

      service.saveExpenditure(newExp).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newExp);
      req.flush({ ...newExp, id: 'exp2' });

      let expenditures: Expenditure[] = [];
      service.getAllExpenditures().subscribe(e => expenditures = e);
      expect(expenditures.length).toBe(2);
    });

    it('should POST with images as FormData', () => {
      const newExp: Expenditure = {
        date: '2025-01-10',
        expenseType: 'Petrol',
        amount: 200,
        note: 'Fuel'
      };

      const mockFile = new File(['test'], 'receipt.png', { type: 'image/png' });

      service.saveExpenditure(newExp, [mockFile]).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush({ ...newExp, id: 'exp2', receiptIds: ['r1'] });
    });

    it('should reload expenditures when saved response is null', () => {
      const newExp: Expenditure = {
        date: '2025-01-10',
        expenseType: 'Petrol',
        amount: 200,
        note: ''
      };

      service.saveExpenditure(newExp).subscribe();

      const saveReq = httpMock.expectOne(`${baseUrl}/save`);
      saveReq.flush(null);

      // Should trigger a reload
      const reloadReq = httpMock.expectOne(r => r.url === `${baseUrl}/getAllExpenditure`);
      reloadReq.flush([]);
    });
  });

  describe('updateExpenditure', () => {
    it('should PUT without images (JSON body)', () => {
      const updates: Expenditure = { ...mockExpenditure, amount: 600 };

      service.updateExpenditure('exp1', updates).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/update/exp1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(updates);

      let expenditures: Expenditure[] = [];
      service.getAllExpenditures().subscribe(e => expenditures = e);
      expect(expenditures[0].amount).toBe(600);
    });

    it('should PUT with new images as FormData', () => {
      const updates: Expenditure = { ...mockExpenditure, amount: 600 };
      const mockFile = new File(['test'], 'receipt.png', { type: 'image/png' });

      service.updateExpenditure('exp1', updates, [mockFile]).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/update/exp1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush(updates);
    });

    it('should PUT with existing receipt IDs as FormData', () => {
      const updates: Expenditure = { ...mockExpenditure };

      service.updateExpenditure('exp1', updates, null, ['r1', 'r2']).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/update/exp1`);
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush(updates);
    });
  });

  describe('deleteExpenditure', () => {
    it('should DELETE with id and expenseType params', () => {
      service.deleteExpenditure('exp1', 'Light Bill').subscribe();

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/delete`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.params.get('id')).toBe('exp1');
      expect(req.request.params.get('expenseType')).toBe('Light Bill');
      req.flush('deleted');

      let expenditures: Expenditure[] = [];
      service.getAllExpenditures().subscribe(e => expenditures = e);
      expect(expenditures.length).toBe(0);
    });

    it('should only delete matching id AND expenseType', () => {
      // Add another expenditure first
      service.saveExpenditure({ date: '2025-02-01', expenseType: 'Petrol', amount: 300, note: '' }).subscribe();
      const saveReq = httpMock.expectOne(`${baseUrl}/save`);
      saveReq.flush({ id: 'exp2', date: '2025-02-01', expenseType: 'Petrol', amount: 300, note: '' });

      // Delete original
      service.deleteExpenditure('exp1', 'Light Bill').subscribe();
      const delReq = httpMock.expectOne(r => r.url === `${baseUrl}/delete`);
      delReq.flush('deleted');

      let expenditures: Expenditure[] = [];
      service.getAllExpenditures().subscribe(e => expenditures = e);
      expect(expenditures.length).toBe(1);
      expect(expenditures[0].id).toBe('exp2');
    });
  });

  describe('getReceiptImageUrl', () => {
    it('should return correct URL for receipt', () => {
      expect(service.getReceiptImageUrl('r123')).toBe(`${baseUrl}/receipt/r123`);
    });
  });

  describe('branch change', () => {
    it('should reload expenditures when branch changes', () => {
      selectedBranchSubject.next({ id: 2, name: 'Unit 2', code: 'NB-002' });

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllExpenditure`);
      expect(req.request.params.get('branchId')).toBe('2');
      req.flush([]);
    });
  });
});

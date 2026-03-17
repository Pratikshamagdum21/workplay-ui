import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WorkManagementService } from './work-management.service';
import { BranchService } from './branch.service';
import { EmployeeService } from './employee.service';
import { WorkEntry } from '../app/landing-page/daily-work-mangement/model/work-entry.model';
import { environment } from '../environments/environment';
import { BehaviorSubject, of } from 'rxjs';

describe('WorkManagementService', () => {
  let service: WorkManagementService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/work`;

  const selectedBranchSubject = new BehaviorSubject({ id: 1, name: 'Unit 1', code: 'MB-001' });

  const mockBranchService = {
    getSelectedBranch: () => selectedBranchSubject.asObservable(),
    getSelectedBranchSnapshot: () => selectedBranchSubject.value
  };

  const mockEmployeeService = {
    getEmployees: () => of([
      { id: 1, name: 'Emp1', salaryType: 'WEEKLY' },
      { id: 2, name: 'Emp2', salaryType: 'MONTHLY' }
    ])
  };

  const now = new Date();
  const mockEntries: any[] = [
    { id: '1', employeeName: 'Emp1', employeeType: 'Cotton', fabricMeters: 50, date: '2025-01-06', createdAt: '2025-01-06T10:00:00Z' },
    { id: '2', employeeName: 'Emp1', employeeType: 'Cotton', fabricMeters: 60, date: '2025-01-07', createdAt: '2025-01-07T10:00:00Z' }
  ];

  beforeEach(() => {
    // Reset branch to id: 1 before each test
    selectedBranchSubject.next({ id: 1, name: 'Unit 1', code: 'MB-001' });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkManagementService,
        { provide: BranchService, useValue: mockBranchService },
        { provide: EmployeeService, useValue: mockEmployeeService }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(WorkManagementService);

    // Flush initial load
    const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllWork`);
    req.flush(mockEntries);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getWorkTypes', () => {
    it('should return 5 work types', () => {
      const types = service.getWorkTypes();
      expect(types.length).toBe(5);
      expect(types.map(t => t.name)).toEqual(['Diwanji', 'Weaver', 'Jober', 'Kandi', 'Mending']);
    });

    it('should return a copy', () => {
      expect(service.getWorkTypes()).not.toBe(service.getWorkTypes());
    });
  });

  describe('getShifts', () => {
    it('should return 3 shifts', () => {
      const shifts = service.getShifts();
      expect(shifts.length).toBe(3);
      expect(shifts[0].name).toBe('Morning');
      expect(shifts[1].name).toBe('Afternoon');
      expect(shifts[2].name).toBe('Night');
    });
  });

  describe('getEntries', () => {
    it('should return work entries observable', () => {
      let entries: WorkEntry[] = [];
      service.getEntries().subscribe(e => entries = e);
      expect(entries.length).toBe(2);
    });
  });

  describe('getAllEntries', () => {
    it('should return entries synchronously', () => {
      const entries = service.getAllEntries();
      expect(entries.length).toBe(2);
    });
  });

  describe('getEmployees', () => {
    it('should delegate to EmployeeService', () => {
      let employees: any[] = [];
      service.getEmployees().subscribe(e => employees = e);
      expect(employees.length).toBe(2);
    });
  });

  describe('addEntry', () => {
    it('should POST to /work/saveWork and add to subject', () => {
      const newEntry = {
        employeeName: 'Emp1',
        employeeType: 'Cotton',
        fabricMeters: 100,
        date: new Date(2025, 0, 8)
      };

      const saved = {
        id: '3', ...newEntry,
        date: '2025-01-08',
        createdAt: '2025-01-08T10:00:00Z'
      };

      service.addEntry(newEntry as any).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/saveWork`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.branchId).toBe(1);
      expect(req.request.body.date).toBe('2025-01-08');
      req.flush(saved);

      expect(service.getAllEntries().length).toBe(3);
    });

    it('should format endDate when provided', () => {
      const newEntry = {
        employeeName: 'Emp1',
        employeeType: 'Cotton',
        fabricMeters: 100,
        date: new Date(2025, 0, 4), // Saturday
        endDate: new Date(2025, 0, 10) // Friday
      };

      service.addEntry(newEntry as any).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/saveWork`);
      expect(req.request.body.endDate).toBe('2025-01-10');
      req.flush({ id: '4', ...newEntry, date: '2025-01-04', endDate: '2025-01-10', createdAt: '2025-01-08T10:00:00Z' });
    });
  });

  describe('deleteEntry', () => {
    it('should DELETE /work/deleteWork with id param', () => {
      service.deleteEntry('1').subscribe();

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/deleteWork`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.params.get('id')).toBe('1');
      req.flush('deleted');

      expect(service.getAllEntries().length).toBe(1);
    });
  });

  describe('refreshEntries', () => {
    it('should reload entries from API', () => {
      service.refreshEntries();

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllWork`);
      expect(req.request.params.get('branchId')).toBe('1');
      req.flush([]);

      expect(service.getAllEntries().length).toBe(0);
    });
  });

  describe('filterEntries', () => {
    it('should return all entries when no dates provided', () => {
      const result = service.filterEntries(null, null);
      expect(result.length).toBe(2);
    });

    it('should filter entries within date range', () => {
      const from = new Date(2025, 0, 7);
      const to = new Date(2025, 0, 7);
      const result = service.filterEntries(from, to);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter entries from a start date', () => {
      const from = new Date(2025, 0, 7);
      const result = service.filterEntries(from, null);
      expect(result.length).toBe(1);
    });

    it('should filter entries up to an end date', () => {
      const to = new Date(2025, 0, 6);
      const result = service.filterEntries(null, to);
      expect(result.length).toBe(1);
    });
  });

  describe('branch change', () => {
    it('should reload entries when branch changes', () => {
      selectedBranchSubject.next({ id: 2, name: 'Unit 2', code: 'NB-002' });

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllWork`);
      expect(req.request.params.get('branchId')).toBe('2');
      req.flush([]);
    });
  });

  describe('sorting', () => {
    it('should sort entries by createdAt descending', () => {
      const entries = service.getAllEntries();
      if (entries.length > 1) {
        expect(entries[0].createdAt.getTime()).toBeGreaterThanOrEqual(entries[1].createdAt.getTime());
      }
    });
  });
});

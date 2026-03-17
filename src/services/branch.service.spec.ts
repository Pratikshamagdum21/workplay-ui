import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BranchService, Branch } from './branch.service';
import { environment } from '../environments/environment';

describe('BranchService', () => {
  let service: BranchService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/branch`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BranchService
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(BranchService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Helper to flush the initial loadBranches call that happens in constructor
  function flushInitialLoad(response?: Branch[]) {
    const req = httpMock.expectOne(`${baseUrl}/getAllBranches`);
    if (response) {
      req.flush(response);
    } else {
      req.flush([]);
    }
  }

  it('should be created', () => {
    flushInitialLoad();
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load branches from API on creation', () => {
      const mockBranches: Branch[] = [
        { id: 10, name: 'Branch A', code: 'BA-01' },
        { id: 20, name: 'Branch B', code: 'BB-02' }
      ];
      flushInitialLoad(mockBranches);

      let branches: Branch[] = [];
      service.getBranches().subscribe(b => branches = b);
      expect(branches).toEqual(mockBranches);
    });

    it('should use fallback branches when API fails', () => {
      const req = httpMock.expectOne(`${baseUrl}/getAllBranches`);
      req.error(new ProgressEvent('Network error'));

      let branches: Branch[] = [];
      service.getBranches().subscribe(b => branches = b);
      expect(branches.length).toBe(3);
      expect(branches[0].name).toBe('Unit 1');
    });

    it('should keep fallback branches when API returns empty array', () => {
      flushInitialLoad([]);

      let branches: Branch[] = [];
      service.getBranches().subscribe(b => branches = b);
      // Empty array means fallback stays
      expect(branches.length).toBe(3);
    });

    it('should select first branch by default after API load', () => {
      const mockBranches: Branch[] = [
        { id: 10, name: 'Branch A', code: 'BA-01' },
        { id: 20, name: 'Branch B', code: 'BB-02' }
      ];
      flushInitialLoad(mockBranches);

      let selected: Branch = {} as Branch;
      service.getSelectedBranch().subscribe(b => selected = b);
      expect(selected.id).toBe(10);
    });
  });

  describe('getSelectedBranchSnapshot', () => {
    it('should return current selected branch synchronously', () => {
      flushInitialLoad();
      const snapshot = service.getSelectedBranchSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
    });
  });

  describe('setSelectedBranch', () => {
    it('should update the selected branch', () => {
      flushInitialLoad();
      const newBranch: Branch = { id: 99, name: 'New Branch', code: 'NB-99' };
      service.setSelectedBranch(newBranch);

      let selected: Branch = {} as Branch;
      service.getSelectedBranch().subscribe(b => selected = b);
      expect(selected).toEqual(newBranch);
      expect(service.getSelectedBranchSnapshot()).toEqual(newBranch);
    });
  });

  describe('branch persistence after API load', () => {
    it('should keep selected branch if it still exists after API load', () => {
      const fallback = service.getSelectedBranchSnapshot(); // id=1 (Unit 1)
      const mockBranches: Branch[] = [
        { id: 1, name: 'Unit 1 Updated', code: 'MB-001' },
        { id: 2, name: 'Unit 2', code: 'NB-002' }
      ];
      flushInitialLoad(mockBranches);

      const snapshot = service.getSelectedBranchSnapshot();
      expect(snapshot.id).toBe(1);
      expect(snapshot.name).toBe('Unit 1 Updated');
    });

    it('should switch to first branch if selected branch no longer exists', () => {
      // First set a branch that won't exist in the new list
      service.setSelectedBranch({ id: 999, name: 'Gone', code: 'X' });

      const mockBranches: Branch[] = [
        { id: 50, name: 'Branch X', code: 'BX-50' }
      ];
      flushInitialLoad(mockBranches);

      const snapshot = service.getSelectedBranchSnapshot();
      expect(snapshot.id).toBe(50);
    });
  });
});

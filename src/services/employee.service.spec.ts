import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EmployeeService } from './employee.service';
import { BranchService } from './branch.service';
import { Employee } from '../app/landing-page/employee-details/model/employee.model';
import { environment } from '../environments/environment';
import { BehaviorSubject } from 'rxjs';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/emp`;
  const branchUrl = `${environment.apiUrl}/branch`;

  // Mock BranchService with a controllable subject
  const selectedBranchSubject = new BehaviorSubject({ id: 1, name: 'Unit 1', code: 'MB-001' });
  const mockBranchService = {
    getSelectedBranch: () => selectedBranchSubject.asObservable(),
    getSelectedBranchSnapshot: () => selectedBranchSubject.value
  };

  const mockEmployee: Employee = {
    id: 1,
    name: 'Test Employee',
    isBonused: true,
    fabricType: 'Cotton',
    workType: 'Diwanji',
    salary: 5000,
    bonusAmount: 0,
    advanceAmount: 1000,
    advanceRemaining: 500,
    salaryType: 'WEEKLY',
    rate: 10,
    advanceTaken: 500,
    bonusEligible: true,
    clothDoneInMeter: 100
  };

  beforeEach(() => {
    // Reset branch to id: 1 before each test
    selectedBranchSubject.next({ id: 1, name: 'Unit 1', code: 'MB-001' });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EmployeeService,
        { provide: BranchService, useValue: mockBranchService }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EmployeeService);

    // Flush the initial load triggered by branch subscription in constructor
    const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllEmployees`);
    req.flush([mockEmployee]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFabricTypes', () => {
    it('should return 5 fabric types', () => {
      const types = service.getFabricTypes();
      expect(types.length).toBe(5);
      expect(types[0].name).toBe('Cotton');
    });

    it('should return a copy (not the original array)', () => {
      const types1 = service.getFabricTypes();
      const types2 = service.getFabricTypes();
      expect(types1).not.toBe(types2);
      expect(types1).toEqual(types2);
    });
  });

  describe('getBonusOptions', () => {
    it('should return 2 bonus options', () => {
      const options = service.getBonusOptions();
      expect(options.length).toBe(2);
      expect(options[0]).toEqual({ label: 'With Bonus', value: true });
      expect(options[1]).toEqual({ label: 'Without Bonus', value: false });
    });
  });

  describe('getEmployees', () => {
    it('should return employees observable', () => {
      let employees: Employee[] = [];
      service.getEmployees().subscribe(e => employees = e);
      expect(employees.length).toBe(1);
      expect(employees[0].name).toBe('Test Employee');
    });
  });

  describe('getEmployeeById', () => {
    it('should call PUT /emp/{id}', () => {
      service.getEmployeeById(1).subscribe(emp => {
        expect(emp.name).toBe('Test Employee');
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockEmployee);
    });
  });

  describe('addEmployee', () => {
    it('should POST to /emp/saveEmp with query params', () => {
      const newEmp: Omit<Employee, 'id'> = {
        name: 'New Employee',
        isBonused: false,
        fabricType: 'Rayon',
        workType: 'Weaver',
        salary: 8000,
        bonusAmount: 0,
        advanceAmount: 0,
        advanceRemaining: 0,
        salaryType: 'MONTHLY',
        rate: 0,
        advanceTaken: 0,
        bonusEligible: false,
        clothDoneInMeter: 0
      };

      const savedEmp = { ...newEmp, id: 12345 } as Employee;

      service.addEmployee(newEmp).subscribe(emp => {
        expect(emp.name).toBe('New Employee');
      });

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/saveEmp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      expect(req.request.params.get('name')).toBe('New Employee');
      expect(req.request.params.get('branchId')).toBe('1');
      req.flush(savedEmp);

      // Verify it was added to the subject
      let employees: Employee[] = [];
      service.getEmployees().subscribe(e => employees = e);
      expect(employees.length).toBe(2);
    });
  });

  describe('updateEmployee', () => {
    it('should POST to /emp/updateEmp/{id} with JSON body', () => {
      const updates = { name: 'Updated Name' };
      const updatedEmp = { ...mockEmployee, name: 'Updated Name' };

      service.updateEmployee(1, updates).subscribe(emp => {
        expect(emp.name).toBe('Updated Name');
      });

      const req = httpMock.expectOne(`${baseUrl}/updateEmp/1`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(updates);
      req.flush(updatedEmp);

      // Verify update in subject
      let employees: Employee[] = [];
      service.getEmployees().subscribe(e => employees = e);
      expect(employees[0].name).toBe('Updated Name');
    });
  });

  describe('deleteEmployee', () => {
    it('should DELETE /emp/deleteEmp with id param', () => {
      service.deleteEmployee(1).subscribe();

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/deleteEmp`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.params.get('id')).toBe('1');
      req.flush(null);

      // Verify removal from subject
      let employees: Employee[] = [];
      service.getEmployees().subscribe(e => employees = e);
      expect(employees.length).toBe(0);
    });
  });

  describe('updateAdvance', () => {
    it('should PATCH /emp/advancePaid with id and advancePaid params', () => {
      const updatedEmp = { ...mockEmployee, advanceRemaining: 300 };

      service.updateAdvance(1, 200).subscribe(emp => {
        expect(emp.advanceRemaining).toBe(300);
      });

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/advancePaid`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.params.get('id')).toBe('1');
      expect(req.request.params.get('advancePaid')).toBe('200');
      req.flush(updatedEmp);
    });
  });

  describe('refreshEmployees', () => {
    it('should reload employees from the API', () => {
      service.refreshEmployees();

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllEmployees`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('branchId')).toBe('1');
      req.flush([mockEmployee, { ...mockEmployee, id: 2, name: 'Second' }]);

      let employees: Employee[] = [];
      service.getEmployees().subscribe(e => employees = e);
      expect(employees.length).toBe(2);
    });
  });

  describe('branch change', () => {
    it('should reload employees when branch changes', () => {
      selectedBranchSubject.next({ id: 2, name: 'Unit 2', code: 'NB-002' });

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllEmployees`);
      expect(req.request.params.get('branchId')).toBe('2');
      req.flush([]);
    });
  });
});

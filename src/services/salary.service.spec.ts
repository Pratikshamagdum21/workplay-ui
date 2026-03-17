import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SalaryService, BONUS_RATE } from './salary.service';
import { BranchService } from './branch.service';
import { EmployeeService } from './employee.service';
import { DailyMeter, SalaryPayload, WeekRange } from '../app/landing-page/salary-details/salary.model';
import { environment } from '../environments/environment';
import { BehaviorSubject, of } from 'rxjs';
import { Employee } from '../app/landing-page/employee-details/model/employee.model';

describe('SalaryService', () => {
  let service: SalaryService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/salary`;

  const selectedBranchSubject = new BehaviorSubject({ id: 1, name: 'Unit 1', code: 'MB-001' });

  const mockEmployee: Employee = {
    id: 1, name: 'Test', isBonused: true, fabricType: 'Cotton', workType: 'Diwanji',
    salary: 5000, bonusAmount: 0, advanceAmount: 1000, advanceRemaining: 500,
    salaryType: 'WEEKLY', rate: 10, advanceTaken: 500, bonusEligible: true, clothDoneInMeter: 100
  };

  const employeesSubject = new BehaviorSubject<Employee[]>([mockEmployee]);

  const mockBranchService = {
    getSelectedBranch: () => selectedBranchSubject.asObservable(),
    getSelectedBranchSnapshot: () => selectedBranchSubject.value
  };

  const mockEmployeeService = {
    getEmployees: () => employeesSubject.asObservable(),
    getEmployeeById: (id: number) => of(mockEmployee)
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SalaryService,
        { provide: BranchService, useValue: mockBranchService },
        { provide: EmployeeService, useValue: mockEmployeeService }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SalaryService);

    // Flush initial salary history load triggered by branch subscription
    const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllSalary`);
    req.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('BONUS_RATE', () => {
    it('should be 16.66', () => {
      expect(BONUS_RATE).toBe(16.66);
    });
  });

  describe('calculatePerSalaryBonus', () => {
    it('should calculate 16.66% of salary', () => {
      expect(service.calculatePerSalaryBonus(1000)).toBe(166.6);
    });

    it('should return 0 for zero salary', () => {
      expect(service.calculatePerSalaryBonus(0)).toBe(0);
    });

    it('should handle large salaries', () => {
      expect(service.calculatePerSalaryBonus(50000)).toBe(8330);
    });
  });

  describe('calculateYearEndBonus', () => {
    it('should calculate 16.66% of total year salary', () => {
      expect(service.calculateYearEndBonus(100000)).toBe(16660);
    });

    it('should return 0 for zero total', () => {
      expect(service.calculateYearEndBonus(0)).toBe(0);
    });
  });

  describe('calculateWeeklySalary', () => {
    it('should compute correct weekly salary', () => {
      const meters: DailyMeter[] = [
        { date: '2025-01-04', meter: 50, isLeave: false, leaveDeduction: 0 },
        { date: '2025-01-05', meter: 60, isLeave: false, leaveDeduction: 0 },
        { date: '2025-01-06', meter: 40, isLeave: false, leaveDeduction: 0 }
      ];

      const result = service.calculateWeeklySalary(meters, 10, 100, 200);
      expect(result.totalMeters).toBe(150);
      expect(result.baseSalary).toBe(1500);
      expect(result.leaveDeductionTotal).toBe(0);
      expect(result.finalPay).toBe(1500 + 100 - 200 - 0); // 1400
    });

    it('should subtract leave deductions', () => {
      const meters: DailyMeter[] = [
        { date: '2025-01-04', meter: 100, isLeave: false, leaveDeduction: 0 },
        { date: '2025-01-05', meter: 0, isLeave: true, leaveDeduction: 50 }
      ];

      const result = service.calculateWeeklySalary(meters, 10, 0, 0);
      expect(result.totalMeters).toBe(100);
      expect(result.baseSalary).toBe(1000);
      expect(result.leaveDeductionTotal).toBe(50);
      expect(result.finalPay).toBe(950);
    });

    it('should handle all zeros', () => {
      const meters: DailyMeter[] = [];
      const result = service.calculateWeeklySalary(meters, 10, 0, 0);
      expect(result.totalMeters).toBe(0);
      expect(result.baseSalary).toBe(0);
      expect(result.finalPay).toBe(0);
    });
  });

  describe('calculateMonthlySalary', () => {
    it('should compute correct monthly salary', () => {
      const result = service.calculateMonthlySalary(10000, 2, 500, 200, 1000);
      expect(result.leaveDeductionTotal).toBe(1000);
      expect(result.finalPay).toBe(10000 + 200 - 1000 - 1000); // 8200
    });

    it('should handle zero leave days', () => {
      const result = service.calculateMonthlySalary(10000, 0, 500, 0, 0);
      expect(result.leaveDeductionTotal).toBe(0);
      expect(result.finalPay).toBe(10000);
    });

    it('should handle negative final pay when deductions exceed salary', () => {
      const result = service.calculateMonthlySalary(1000, 5, 500, 0, 500);
      expect(result.leaveDeductionTotal).toBe(2500);
      expect(result.finalPay).toBe(1000 + 0 - 500 - 2500); // -2000
    });
  });

  describe('getWeeklyData', () => {
    it('should generate daily meter entries for a week range', () => {
      const weekRange: WeekRange = {
        startDate: new Date(2025, 0, 4), // Saturday
        endDate: new Date(2025, 0, 10)   // Friday
      };

      service.getWeeklyData(1, weekRange).subscribe(data => {
        expect(data.length).toBe(7);
        data.forEach(d => {
          expect(d.meter).toBe(0);
          expect(d.isLeave).toBeFalse();
          expect(d.leaveDeduction).toBe(0);
        });
      });
    });
  });

  describe('getEmployees', () => {
    it('should delegate to EmployeeService', () => {
      let employees: Employee[] = [];
      service.getEmployees().subscribe(e => employees = e);
      expect(employees.length).toBe(1);
      expect(employees[0].name).toBe('Test');
    });
  });

  describe('getSalaryHistory', () => {
    it('should return salary history observable', () => {
      let history: SalaryPayload[] = [];
      service.getSalaryHistory().subscribe(h => history = h);
      expect(history).toEqual([]);
    });
  });

  describe('getEmployeeYearSalary', () => {
    it('should sum finalPay for given employee and year', () => {
      // We need to push some salary history into the subject
      // Re-initialize with salary data
      const salaryData: SalaryPayload[] = [
        { employeeId: 1, type: 'weekly', finalPay: 1000, createdAt: new Date(2025, 5, 1) } as any,
        { employeeId: 1, type: 'weekly', finalPay: 2000, createdAt: new Date(2025, 6, 1) } as any,
        { employeeId: 2, type: 'weekly', finalPay: 3000, createdAt: new Date(2025, 6, 1) } as any,
        { employeeId: 1, type: 'monthly', finalPay: 5000, createdAt: new Date(2024, 6, 1) } as any, // different year
      ];

      // Trigger branch change to reload
      selectedBranchSubject.next({ id: 1, name: 'Unit 1', code: 'MB-001' });
      const req = httpMock.expectOne(r => r.url === `${baseUrl}/getAllSalary`);
      req.flush(salaryData);

      expect(service.getEmployeeYearSalary(1, 2025)).toBe(3000);
      expect(service.getEmployeeYearSalary(2, 2025)).toBe(3000);
      expect(service.getEmployeeYearSalary(1, 2024)).toBe(5000);
      expect(service.getEmployeeYearSalary(1, 2023)).toBe(0);
    });
  });

  describe('saveWeeklySalary', () => {
    it('should POST salary and reload history', () => {
      const payload = {
        employeeId: 1, type: 'weekly' as const, meterDetails: [], ratePerMeter: 10,
        totalMeters: 100, baseSalary: 1000, bonus: 0, leaveDeductionTotal: 0,
        advanceTakenTotal: 0, advanceDeductedThisTime: 0, advanceRemaining: 0,
        finalPay: 1000, createdAt: new Date()
      };

      service.saveWeeklySalary(payload).subscribe();

      const saveReq = httpMock.expectOne(`${baseUrl}/saveSalary`);
      expect(saveReq.request.method).toBe('POST');
      expect(saveReq.request.body.branchId).toBe(1);
      saveReq.flush({});

      // Should trigger reload of salary history
      const reloadReq = httpMock.expectOne(r => r.url === `${baseUrl}/getAllSalary`);
      reloadReq.flush([]);
    });
  });

  describe('saveMonthlySalary', () => {
    it('should POST salary and reload history', () => {
      const payload = {
        employeeId: 1, type: 'monthly' as const, salary: 10000, leaveDays: 0,
        leaveDeductionPerDay: 0, leaveDeductionTotal: 0, bonus: 0,
        advanceTakenTotal: 0, advanceDeductedThisTime: 0, advanceRemaining: 0,
        finalPay: 10000, createdAt: new Date()
      };

      service.saveMonthlySalary(payload).subscribe();

      const saveReq = httpMock.expectOne(`${baseUrl}/saveSalary`);
      expect(saveReq.request.method).toBe('POST');
      saveReq.flush({});

      const reloadReq = httpMock.expectOne(r => r.url === `${baseUrl}/getAllSalary`);
      reloadReq.flush([]);
    });
  });
});

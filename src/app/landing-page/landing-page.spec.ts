import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LandingPage } from './landing-page';
import { EmployeeService } from '../../services/employee.service';
import { WorkManagementService } from '../../services/work-management.service';
import { BranchService } from '../../services/branch.service';
import { Employee } from './employee-details/model/employee.model';
import { WorkEntry } from './daily-work-mangement/model/work-entry.model';
import { BehaviorSubject, of } from 'rxjs';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;
  let router: Router;

  const now = new Date();
  const mockEmployees: Employee[] = [
    {
      id: 1, name: 'John', isBonused: true, fabricType: 'Cotton', workType: 'Diwanji',
      salary: 5000, bonusAmount: 0, advanceAmount: 1000, advanceRemaining: 500,
      salaryType: 'WEEKLY', rate: 10, advanceTaken: 500, bonusEligible: true, clothDoneInMeter: 100
    },
    {
      id: 2, name: 'Jane', isBonused: false, fabricType: 'Rayon', workType: 'Weaver',
      salary: 15000, bonusAmount: 0, advanceAmount: 0, advanceRemaining: 0,
      salaryType: 'MONTHLY', rate: 0, advanceTaken: 0, bonusEligible: false, clothDoneInMeter: 0
    }
  ];

  const mockEntries: WorkEntry[] = [
    { id: '1', employeeName: 'John', employeeType: 'Cotton', fabricMeters: 50, date: new Date(now.getFullYear(), now.getMonth(), 1), createdAt: new Date() },
    { id: '2', employeeName: 'John', employeeType: 'Cotton', fabricMeters: 60, date: new Date(now.getFullYear(), now.getMonth(), 2), createdAt: new Date() }
  ];

  const employeesSubject = new BehaviorSubject<Employee[]>(mockEmployees);
  const entriesSubject = new BehaviorSubject<WorkEntry[]>(mockEntries);

  beforeEach(async () => {
    const empServiceMock = {
      employees$: employeesSubject.asObservable(),
      getEmployees: () => employeesSubject.asObservable(),
      getFabricTypes: () => [],
      getBonusOptions: () => []
    };

    const workServiceMock = {
      getEntries: () => entriesSubject.asObservable(),
      getAllEntries: () => mockEntries,
      getWorkTypes: () => [],
      getShifts: () => [],
      getEmployees: () => of([])
    };

    const branchServiceMock = {
      getSelectedBranch: () => of({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getSelectedBranchSnapshot: () => ({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getBranches: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [LandingPage, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: EmployeeService, useValue: empServiceMock },
        { provide: WorkManagementService, useValue: workServiceMock },
        { provide: BranchService, useValue: branchServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('KPI calculations', () => {
    it('should count total employees', () => {
      expect(component.totalEmployees).toBe(2);
    });

    it('should count weekly employees', () => {
      expect(component.weeklyCount).toBe(1);
    });

    it('should count monthly employees', () => {
      expect(component.monthlyCount).toBe(1);
    });

    it('should calculate total advance outstanding', () => {
      expect(component.totalAdvanceOutstanding).toBe(500);
    });

    it('should count bonus eligible employees', () => {
      expect(component.bonusEligibleCount).toBe(1);
    });

    it('should calculate fabric meters this month', () => {
      expect(component.fabricThisMonth).toBe(110);
    });
  });

  describe('advance alerts', () => {
    it('should show employees with outstanding advance', () => {
      expect(component.advanceAlerts.length).toBe(1);
      expect(component.advanceAlerts[0].name).toBe('John');
    });
  });

  describe('recent entries', () => {
    it('should show up to 5 recent entries', () => {
      expect(component.recentEntries.length).toBeLessThanOrEqual(5);
    });

    it('should sort by date descending', () => {
      if (component.recentEntries.length > 1) {
        const first = new Date(component.recentEntries[0].date).getTime();
        const second = new Date(component.recentEntries[1].date).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });
  });

  describe('formatCurrency', () => {
    it('should format with rupee symbol', () => {
      expect(component.formatCurrency(5000)).toContain('₹');
      expect(component.formatCurrency(5000)).toContain('5,000');
    });
  });

  describe('goTo', () => {
    it('should navigate to the given path', () => {
      spyOn(router, 'navigate');
      component.goTo('/employee');
      expect(router.navigate).toHaveBeenCalledWith(['/employee']);
    });
  });
});

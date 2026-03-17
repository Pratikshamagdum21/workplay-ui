import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { SimpleChange } from '@angular/core';
import { PaySalary } from './pay-salary';
import { SalaryService } from '../../../../services/salary.service';
import { WorkManagementService } from '../../../../services/work-management.service';
import { EmployeeService } from '../../../../services/employee.service';
import { BranchService } from '../../../../services/branch.service';
import { Employee } from '../../employee-details/model/employee.model';
import { of, throwError } from 'rxjs';

describe('PaySalary', () => {
  let component: PaySalary;
  let fixture: ComponentFixture<PaySalary>;
  let salaryService: jasmine.SpyObj<SalaryService>;
  let messageService: MessageService;
  let router: Router;

  const weeklyEmployee: Employee = {
    id: 1, name: 'John', isBonused: true, fabricType: 'Cotton', workType: 'Diwanji',
    salary: 5000, bonusAmount: 0, advanceAmount: 1000, advanceRemaining: 500,
    salaryType: 'WEEKLY', rate: 10, advanceTaken: 500, bonusEligible: true, clothDoneInMeter: 100
  };

  const monthlyEmployee: Employee = {
    id: 2, name: 'Jane', isBonused: false, fabricType: 'Rayon', workType: 'Weaver',
    salary: 15000, bonusAmount: 0, advanceAmount: 0, advanceRemaining: 0,
    salaryType: 'MONTHLY', rate: 0, advanceTaken: 0, bonusEligible: false, clothDoneInMeter: 0
  };

  const weeklyFixedEmployee: Employee = {
    id: 3, name: 'Sam', isBonused: true, fabricType: 'Cotton', workType: 'Kandi',
    salary: 3000, bonusAmount: 0, advanceAmount: 500, advanceRemaining: 200,
    salaryType: 'WEEKLY_F', rate: 0, advanceTaken: 300, bonusEligible: true, clothDoneInMeter: 0
  };

  beforeEach(async () => {
    const salaryServiceSpy = jasmine.createSpyObj('SalaryService', [
      'getEmployees', 'getEmployeeById', 'getWeeklyData',
      'calculatePerSalaryBonus', 'calculateYearEndBonus',
      'calculateWeeklySalary', 'calculateMonthlySalary',
      'saveWeeklySalary', 'saveMonthlySalary',
      'getSalaryHistory', 'getEmployeeYearSalary'
    ]);
    salaryServiceSpy.getEmployees.and.returnValue(of([weeklyEmployee, monthlyEmployee, weeklyFixedEmployee]));
    salaryServiceSpy.getEmployeeById.and.callFake((id: number) => {
      const emp = [weeklyEmployee, monthlyEmployee, weeklyFixedEmployee].find(e => e.id === id);
      return of(emp);
    });
    salaryServiceSpy.getWeeklyData.and.returnValue(of([
      { date: '2025-01-04', meter: 0, isLeave: false, leaveDeduction: 0, note: '' },
      { date: '2025-01-05', meter: 0, isLeave: false, leaveDeduction: 0, note: '' }
    ]));
    salaryServiceSpy.calculatePerSalaryBonus.and.callFake((s: number) => parseFloat(((s / 100) * 16.66).toFixed(2)));
    salaryServiceSpy.calculateWeeklySalary.and.callFake((meters: any[], rate: number, bonus: number, advance: number) => {
      const totalMeters = meters.reduce((s: number, d: any) => s + d.meter, 0);
      const baseSalary = totalMeters * rate;
      const leaveDeductionTotal = meters.reduce((s: number, d: any) => s + d.leaveDeduction, 0);
      return { totalMeters, baseSalary, leaveDeductionTotal, finalPay: baseSalary + bonus - advance - leaveDeductionTotal };
    });
    salaryServiceSpy.calculateMonthlySalary.and.callFake(
      (salary: number, leaveDays: number, leavePerDay: number, bonus: number, advance: number) => {
        const leaveDeductionTotal = leaveDays * leavePerDay;
        return { leaveDeductionTotal, finalPay: salary + bonus - advance - leaveDeductionTotal };
      }
    );
    salaryServiceSpy.saveWeeklySalary.and.returnValue(of({}));
    salaryServiceSpy.saveMonthlySalary.and.returnValue(of({}));

    const workServiceMock = {
      getWorkTypes: () => [],
      getShifts: () => [],
      getEmployees: () => of([]),
      filterEntries: () => []
    };

    const branchServiceMock = {
      getSelectedBranch: () => of({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getSelectedBranchSnapshot: () => ({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getBranches: () => of([])
    };

    const empServiceMock = {
      getEmployees: () => of([]),
      getFabricTypes: () => [],
      getBonusOptions: () => []
    };

    await TestBed.configureTestingModule({
      imports: [PaySalary, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'salary', component: PaySalary }]),
        { provide: SalaryService, useValue: salaryServiceSpy },
        { provide: WorkManagementService, useValue: workServiceMock },
        { provide: BranchService, useValue: branchServiceMock },
        { provide: EmployeeService, useValue: empServiceMock },
        MessageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaySalary);
    component = fixture.componentInstance;
    salaryService = TestBed.inject(SalaryService) as jasmine.SpyObj<SalaryService>;
    messageService = fixture.debugElement.injector.get(MessageService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load employees on init', () => {
    expect(component.employees.length).toBe(3);
  });

  describe('employee type checks', () => {
    it('should detect weekly worker', () => {
      component.employee = weeklyEmployee;
      expect(component.isWeeklyWorker()).toBeTrue();
      expect(component.isMonthlyWorker()).toBeFalse();
      expect(component.isWeeklyFixedWorker()).toBeFalse();
    });

    it('should detect monthly worker', () => {
      component.employee = monthlyEmployee;
      expect(component.isMonthlyWorker()).toBeTrue();
      expect(component.isWeeklyWorker()).toBeFalse();
    });

    it('should detect weekly fixed worker', () => {
      component.employee = weeklyFixedEmployee;
      expect(component.isWeeklyFixedWorker()).toBeTrue();
    });
  });

  describe('isBonusedEmployee', () => {
    it('should return true for bonused employee', () => {
      component.employee = weeklyEmployee;
      expect(component.isBonusedEmployee).toBeTrue();
    });

    it('should return false for non-bonused employee', () => {
      component.employee = monthlyEmployee;
      expect(component.isBonusedEmployee).toBeFalse();
    });
  });

  describe('onEmployeeSelect', () => {
    it('should load employee details for valid id', () => {
      component.onEmployeeSelect({ value: 2 });
      expect(component.employee?.name).toBe('Jane');
      expect(component.salaryForm).toBeTruthy();
    });

    it('should clear employee for null value', () => {
      component.employee = weeklyEmployee;
      component.onEmployeeSelect({ value: null });
      expect(component.employee).toBeNull();
    });
  });

  describe('monthly salary form', () => {
    beforeEach(() => {
      component.onEmployeeSelect({ value: 2 });
    });

    it('should initialize monthly form with salary', () => {
      expect(component.salaryForm.get('salary')?.value).toBe(15000);
    });

    it('should calculate monthly salary', () => {
      component.salaryForm.patchValue({ leaveDays: 2, leaveDeductionPerDay: 500 });
      expect(component.leaveDeductionTotal).toBe(1000);
      expect(component.finalPay).toBe(14000); // 15000 - 0 - 0 - 1000
    });
  });

  describe('weekly fixed salary form', () => {
    beforeEach(() => {
      component.onEmployeeSelect({ value: 3 });
    });

    it('should initialize weekly fixed form', () => {
      expect(component.salaryForm.get('salary')).toBeTruthy();
      expect(component.salaryForm.get('weekRange')).toBeTruthy();
    });
  });

  describe('onSubmit validation', () => {
    it('should show error when no employee selected', () => {
      spyOn(messageService, 'add');
      component.onSubmit();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Validation Error'
      }));
    });

    it('should show error when advance deduction exceeds remaining', () => {
      component.onEmployeeSelect({ value: 2 });
      component.salaryForm.patchValue({ advanceDeductedThisTime: 1000 });
      // monthlyEmployee.advanceRemaining is 0
      spyOn(messageService, 'add');

      component.onSubmit();

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        summary: 'Invalid Advance Deduction'
      }));
    });
  });

  describe('save monthly salary', () => {
    it('should save and emit on success', () => {
      component.onEmployeeSelect({ value: 2 });
      spyOn(messageService, 'add');
      spyOn(component.saved, 'emit');

      component.onSubmit();

      expect(salaryService.saveMonthlySalary).toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        detail: 'Monthly salary saved successfully'
      }));
      expect(component.saved.emit).toHaveBeenCalled();
    });

    it('should set saving to false on error', () => {
      component.onEmployeeSelect({ value: 2 });
      salaryService.saveMonthlySalary.and.returnValue(throwError(() => new Error('fail')));
      component.onSubmit();
      expect(component.saving).toBeFalse();
    });
  });

  describe('ngOnChanges - edit mode', () => {
    it('should enter edit mode when salaryData is set', () => {
      const salaryData = { id: 10, employeeId: 2, type: 'monthly', salary: 15000 };
      component.salaryData = salaryData;
      component.ngOnChanges({
        salaryData: new SimpleChange(null, salaryData, false)
      });

      expect(component.isEditMode).toBeTrue();
      expect(component.editSalaryId).toBe(10);
      expect(component.selectedEmployeeId).toBe(2);
    });

    it('should exit edit mode when salaryData is cleared', () => {
      component.isEditMode = true;
      component.salaryData = null;
      component.ngOnChanges({
        salaryData: new SimpleChange({}, null, false)
      });

      expect(component.isEditMode).toBeFalse();
      expect(component.editSalaryId).toBeNull();
      expect(component.selectedEmployeeId).toBeNull();
    });
  });

  describe('formatCurrency', () => {
    it('should format in INR', () => {
      expect(component.formatCurrency(5000)).toContain('5,000');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const formatted = component.formatDate('2025-01-06');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('6');
    });
  });

  describe('cancel', () => {
    it('should navigate to /salary', () => {
      spyOn(router, 'navigate');
      component.cancel();
      expect(router.navigate).toHaveBeenCalledWith(['/salary']);
    });
  });
});

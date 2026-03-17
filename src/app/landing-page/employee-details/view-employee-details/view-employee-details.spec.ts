import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewEmployeeDetails } from './view-employee-details';
import { SalaryService } from '../../../../services/salary.service';
import { EmployeeService } from '../../../../services/employee.service';
import { BranchService } from '../../../../services/branch.service';
import { Employee } from '../model/employee.model';
import { of } from 'rxjs';

describe('ViewEmployeeDetails', () => {
  let component: ViewEmployeeDetails;
  let fixture: ComponentFixture<ViewEmployeeDetails>;
  let salaryService: jasmine.SpyObj<SalaryService>;

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

  beforeEach(async () => {
    const salaryServiceSpy = jasmine.createSpyObj('SalaryService', [
      'getEmployeeYearSalary', 'calculateYearEndBonus', 'getSalaryHistory',
      'getEmployees', 'calculatePerSalaryBonus'
    ]);
    salaryServiceSpy.getEmployeeYearSalary.and.returnValue(50000);
    salaryServiceSpy.calculateYearEndBonus.and.returnValue(8330);
    salaryServiceSpy.getSalaryHistory.and.returnValue(of([
      { employeeId: 1, bonus: 100, finalPay: 1000 },
      { employeeId: 1, bonus: 200, finalPay: 2000 }
    ]));

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
      imports: [ViewEmployeeDetails, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SalaryService, useValue: salaryServiceSpy },
        { provide: EmployeeService, useValue: empServiceMock },
        { provide: BranchService, useValue: branchServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewEmployeeDetails);
    component = fixture.componentInstance;
    salaryService = TestBed.inject(SalaryService) as jasmine.SpyObj<SalaryService>;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('with bonused employee', () => {
    beforeEach(() => {
      component.employee = weeklyEmployee;
      fixture.detectChanges();
    });

    it('should calculate total bonus paid from history', () => {
      expect(component.totalBonusPaid).toBe(300);
    });

    it('should have zero year-end bonus for bonused employees', () => {
      expect(component.yearEndBonusAmount).toBe(0);
    });
  });

  describe('with non-bonused employee', () => {
    beforeEach(() => {
      component.employee = monthlyEmployee;
      fixture.detectChanges();
    });

    it('should calculate year-end bonus', () => {
      expect(salaryService.getEmployeeYearSalary).toHaveBeenCalledWith(2, component.currentYear);
      expect(component.yearEndBonusAmount).toBe(8330);
    });

    it('should have zero total bonus paid', () => {
      expect(component.totalBonusPaid).toBe(0);
    });
  });

  describe('with null employee', () => {
    it('should reset bonus data', () => {
      component.employee = null;
      fixture.detectChanges();
      expect(component.yearEndBonusAmount).toBe(0);
      expect(component.totalBonusPaid).toBe(0);
    });
  });

  describe('helper methods', () => {
    it('should return correct bonus labels', () => {
      component.employee = weeklyEmployee;
      expect(component.getBonusLabel()).toBe('With Bonus');
      expect(component.getBonusSeverity()).toBe('success');

      component.employee = monthlyEmployee;
      expect(component.getBonusLabel()).toBe('Without Bonus');
      expect(component.getBonusSeverity()).toBe('warn');
    });

    it('should return correct salary type labels', () => {
      component.employee = weeklyEmployee;
      expect(component.getSalaryTypeLabel()).toBe('Weekly (Per Meter)');

      component.employee = monthlyEmployee;
      expect(component.getSalaryTypeLabel()).toBe('Monthly (Fixed)');

      component.employee = { ...weeklyEmployee, salaryType: 'WEEKLY_F' };
      expect(component.getSalaryTypeLabel()).toBe('Weekly (Fixed)');
    });

    it('should format currency in INR', () => {
      expect(component.formatCurrency(5000)).toContain('5,000');
    });
  });

  describe('onClose', () => {
    it('should emit closed event', () => {
      spyOn(component.closed, 'emit');
      component.onClose();
      expect(component.closed.emit).toHaveBeenCalled();
    });
  });
});

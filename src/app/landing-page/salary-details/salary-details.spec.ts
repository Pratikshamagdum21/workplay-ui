import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SalaryDetails } from './salary-details';
import { SalaryService } from '../../../services/salary.service';
import { BranchService } from '../../../services/branch.service';
import { ExpenditureService, Expenditure } from '../../../services/expenditure.service';
import { EmployeeService } from '../../../services/employee.service';
import { WorkManagementService } from '../../../services/work-management.service';
import { Employee } from '../employee-details/model/employee.model';
import { BehaviorSubject, of } from 'rxjs';

describe('SalaryDetails', () => {
  let component: SalaryDetails;
  let fixture: ComponentFixture<SalaryDetails>;
  let confirmationService: ConfirmationService;
  let messageService: MessageService;
  let expenditureService: jasmine.SpyObj<ExpenditureService>;

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

  const mockSalaryHistory = [
    { employeeId: 1, type: 'weekly', finalPay: 5000, totalMeters: 500, createdAt: new Date() },
    { employeeId: 2, type: 'monthly', finalPay: 15000, totalMeters: 0, createdAt: new Date() }
  ];

  const mockExpenditures: Expenditure[] = [
    { id: 'e1', date: '2025-01-06', expenseType: 'Petrol', amount: 200, note: '' },
    { id: 'e2', date: '2025-01-07', expenseType: 'Light Bill', amount: 500, note: '' }
  ];

  const employeesSubject = new BehaviorSubject<Employee[]>(mockEmployees);
  const salaryHistorySubject = new BehaviorSubject<any[]>(mockSalaryHistory);
  const expendituresSubject = new BehaviorSubject<Expenditure[]>(mockExpenditures);

  beforeEach(async () => {
    const salaryServiceMock = {
      getEmployees: () => employeesSubject.asObservable(),
      getSalaryHistory: () => salaryHistorySubject.asObservable(),
      getEmployeeYearSalary: () => 50000,
      calculateYearEndBonus: (total: number) => parseFloat(((total / 100) * 16.66).toFixed(2)),
      calculatePerSalaryBonus: (salary: number) => parseFloat(((salary / 100) * 16.66).toFixed(2)),
      getEmployeeById: (id: number) => of(mockEmployees.find(e => e.id === id))
    };

    const expServiceSpy = jasmine.createSpyObj('ExpenditureService', [
      'getAllExpenditures', 'deleteExpenditure', 'loadExpenditures',
      'saveExpenditure', 'getReceiptImageUrl'
    ]);
    expServiceSpy.getAllExpenditures.and.returnValue(expendituresSubject.asObservable());
    expServiceSpy.getReceiptImageUrl.and.returnValue('');

    const branchServiceMock = {
      getSelectedBranch: () => of({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getSelectedBranchSnapshot: () => ({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getBranches: () => of([])
    };

    const empServiceMock = {
      getEmployees: () => employeesSubject.asObservable(),
      employees$: employeesSubject.asObservable(),
      getFabricTypes: () => [],
      getBonusOptions: () => []
    };

    const workServiceMock = {
      getWorkTypes: () => [],
      getShifts: () => [],
      getEmployees: () => of([]),
      getEntries: () => of([]),
      filterEntries: () => []
    };

    await TestBed.configureTestingModule({
      imports: [SalaryDetails, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SalaryService, useValue: salaryServiceMock },
        { provide: ExpenditureService, useValue: expServiceSpy },
        { provide: BranchService, useValue: branchServiceMock },
        { provide: EmployeeService, useValue: empServiceMock },
        { provide: WorkManagementService, useValue: workServiceMock },
        MessageService,
        ConfirmationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SalaryDetails);
    component = fixture.componentInstance;
    expenditureService = TestBed.inject(ExpenditureService) as jasmine.SpyObj<ExpenditureService>;
    confirmationService = fixture.debugElement.injector.get(ConfirmationService);
    messageService = fixture.debugElement.injector.get(MessageService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load employees on init', () => {
    expect(component.employees.length).toBe(2);
  });

  it('should load salary history on init', () => {
    expect(component.allSalaryHistory.length).toBe(2);
    expect(component.totalSalaryPaid).toBe(20000);
  });

  it('should load expenditures on init', () => {
    expect(component.expenditures.length).toBe(2);
  });

  describe('getTotalExpenses', () => {
    it('should sum filtered expenditure amounts', () => {
      expect(component.getTotalExpenses()).toBe(700);
    });
  });

  describe('getTotalFabricMeters', () => {
    it('should sum totalMeters from salary history', () => {
      expect(component.getTotalFabricMeters()).toBe(500);
    });
  });

  describe('filter options', () => {
    it('should have 5 filter options', () => {
      expect(component.filterOptions.length).toBe(5);
    });

    it('should default to all', () => {
      expect(component.selectedFilter).toBe('all');
    });
  });

  describe('onFilterChange', () => {
    it('should show custom date picker for custom filter', () => {
      component.onFilterChange({ value: 'custom' });
      expect(component.showCustomDatePicker).toBeTrue();
    });

    it('should hide custom date picker for non-custom filters', () => {
      component.onFilterChange({ value: 'week' });
      expect(component.showCustomDatePicker).toBeFalse();
      expect(component.customDateRange).toEqual([]);
    });
  });

  describe('clearFilter', () => {
    it('should reset all filter state', () => {
      component.selectedFilter = 'week';
      component.showCustomDatePicker = true;
      component.customDateRange = [new Date(), new Date()];

      component.clearFilter();

      expect(component.selectedFilter).toBe('all');
      expect(component.showCustomDatePicker).toBeFalse();
      expect(component.customDateRange).toEqual([]);
      expect(component.filteredsalary.length).toBe(2);
    });
  });

  describe('dialog management', () => {
    it('should open pay salary dialog', () => {
      component.openPaySalaryDialog();
      expect(component.displayViewDialog).toBeTrue();
      expect(component.selectedSalary).toBeNull();
    });

    it('should open edit salary dialog', () => {
      const salary = { id: 1, type: 'weekly' };
      component.editSalary(salary);
      expect(component.displayViewDialog).toBeTrue();
      expect(component.selectedSalary).toBe(salary);
    });

    it('should close dialog on salary saved', () => {
      component.displayViewDialog = true;
      component.onSalarySaved();
      expect(component.displayViewDialog).toBeFalse();
      expect(component.selectedSalary).toBeNull();
    });

    it('should reset selected salary on dialog hide', () => {
      component.selectedSalary = { id: 1 };
      component.onDialogHide();
      expect(component.selectedSalary).toBeNull();
    });

    it('should open add expense dialog', () => {
      component.openAddExpensesDialog();
      expect(component.displayExpenseViewDialog).toBeTrue();
      expect(component.selectedExpense).toBeNull();
    });

    it('should edit expense', () => {
      component.editExpense(mockExpenditures[0]);
      expect(component.displayExpenseViewDialog).toBeTrue();
      expect(component.selectedExpense).toBe(mockExpenditures[0]);
    });

    it('should close expense dialog and reload on save', () => {
      component.displayExpenseViewDialog = true;
      component.onExpenseSaved();
      expect(component.displayExpenseViewDialog).toBeFalse();
      expect(expenditureService.loadExpenditures).toHaveBeenCalledWith(1);
    });
  });

  describe('helper methods', () => {
    it('should return salary type severity', () => {
      expect(component.getSalaryTypeSeverity('WEEKLY')).toBe('success');
      expect(component.getSalaryTypeSeverity('MONTHLY')).toBe('info');
    });

    it('should return bonus label', () => {
      expect(component.getBonusLabel(true)).toBe('Per Salary (16.66%)');
      expect(component.getBonusLabel(false)).toBe('Year-End (16.66%)');
    });

    it('should return bonus severity', () => {
      expect(component.getBonusSeverity(true)).toBe('success');
      expect(component.getBonusSeverity(false)).toBe('warn');
    });

    it('should format currency in INR', () => {
      expect(component.formatCurrency(5000)).toContain('5,000');
    });

    it('should count bonused employees', () => {
      expect(component.getBonusedCount()).toBe(1);
    });

    it('should count non-bonused employees', () => {
      expect(component.getNonBonusedCount()).toBe(1);
    });

    it('should get non-bonused employees', () => {
      const nonBonused = component.getNonBonusedEmployees();
      expect(nonBonused.length).toBe(1);
      expect(nonBonused[0].name).toBe('Jane');
    });

    it('should get unique salary types', () => {
      const types = component.getUniqueSalaryTypes();
      expect(types).toContain('weekly');
      expect(types).toContain('monthly');
    });

    it('should get unique expense types', () => {
      const types = component.getUniqueExpenseTypes();
      expect(types).toContain('Petrol');
      expect(types).toContain('Light Bill');
    });
  });

  describe('confirmDeleteExpenditure', () => {
    it('should trigger confirmation dialog', () => {
      spyOn(confirmationService, 'confirm');
      component.confirmDeleteExpenditure(mockExpenditures[0]);
      expect(confirmationService.confirm).toHaveBeenCalledWith(jasmine.objectContaining({
        message: jasmine.stringContaining('Petrol')
      }));
    });
  });
});

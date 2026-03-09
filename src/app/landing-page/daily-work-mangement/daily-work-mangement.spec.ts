import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DailyWorkMangement } from './daily-work-mangement';
import { WorkManagementService } from '../../../services/work-management.service';
import { BranchService } from '../../../services/branch.service';
import { ExpenditureService, Expenditure } from '../../../services/expenditure.service';
import { EmployeeService } from '../../../services/employee.service';
import { WorkEntry } from './model/work-entry.model';
import { BehaviorSubject, of } from 'rxjs';

describe('DailyWorkMangement', () => {
  let component: DailyWorkMangement;
  let fixture: ComponentFixture<DailyWorkMangement>;
  let workService: jasmine.SpyObj<WorkManagementService>;
  let expenditureService: jasmine.SpyObj<ExpenditureService>;
  let messageService: MessageService;
  let confirmationService: ConfirmationService;

  const mockEntries: WorkEntry[] = [
    { id: '1', employeeName: 'Emp1', employeeType: 'Cotton', fabricMeters: 50, date: new Date(2025, 0, 6), createdAt: new Date(2025, 0, 6) },
    { id: '2', employeeName: 'Emp2', employeeType: 'Rayon', fabricMeters: 60, date: new Date(2025, 0, 7), createdAt: new Date(2025, 0, 7) },
    { id: '3', employeeName: 'Emp1', employeeType: 'Cotton', fabricMeters: 40, date: new Date(2025, 0, 8), createdAt: new Date(2025, 0, 8) }
  ];

  const mockExpenditures: Expenditure[] = [
    { id: 'e1', date: '2025-01-06', expenseType: 'Petrol', amount: 200, note: '' },
    { id: 'e2', date: '2025-01-07', expenseType: 'Light Bill', amount: 500, note: '' }
  ];

  const entriesSubject = new BehaviorSubject<WorkEntry[]>(mockEntries);
  const expendituresSubject = new BehaviorSubject<Expenditure[]>(mockExpenditures);

  beforeEach(async () => {
    const workServiceSpy = jasmine.createSpyObj('WorkManagementService', [
      'getEntries', 'getAllEntries', 'filterEntries', 'deleteEntry',
      'getWorkTypes', 'getShifts', 'getEmployees', 'addEntry'
    ]);
    workServiceSpy.getEntries.and.returnValue(entriesSubject.asObservable());
    workServiceSpy.getAllEntries.and.returnValue(mockEntries);
    workServiceSpy.filterEntries.and.callFake((from: Date | null, to: Date | null) => {
      if (!from && !to) return mockEntries;
      return mockEntries.filter(e => {
        const d = new Date(e.date);
        if (from && to) return d >= from && d <= to;
        if (from) return d >= from;
        if (to) return d <= to;
        return true;
      });
    });
    workServiceSpy.getWorkTypes.and.returnValue([]);
    workServiceSpy.getShifts.and.returnValue([]);
    workServiceSpy.getEmployees.and.returnValue(of([]));

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
      getEmployees: () => of([]),
      getFabricTypes: () => [],
      getBonusOptions: () => []
    };

    await TestBed.configureTestingModule({
      imports: [DailyWorkMangement, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: WorkManagementService, useValue: workServiceSpy },
        { provide: ExpenditureService, useValue: expServiceSpy },
        { provide: BranchService, useValue: branchServiceMock },
        { provide: EmployeeService, useValue: empServiceMock },
        MessageService,
        ConfirmationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DailyWorkMangement);
    component = fixture.componentInstance;
    workService = TestBed.inject(WorkManagementService) as jasmine.SpyObj<WorkManagementService>;
    expenditureService = TestBed.inject(ExpenditureService) as jasmine.SpyObj<ExpenditureService>;
    messageService = fixture.debugElement.injector.get(MessageService);
    confirmationService = fixture.debugElement.injector.get(ConfirmationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load work entries on init', () => {
    expect(component.workEntries.length).toBe(3);
    expect(component.filteredEntries.length).toBe(3);
    expect(component.totalRecords).toBe(3);
  });

  it('should load expenditures on init', () => {
    expect(component.expenditures.length).toBe(2);
  });

  describe('dialog management', () => {
    it('should open add work dialog', () => {
      component.openAddWorkDialog();
      expect(component.displayAddWorkDialog).toBeTrue();
    });

    it('should open add expense dialog', () => {
      component.openAddExpensesDialog();
      expect(component.displayExpenseViewDialog).toBeTrue();
    });

    it('should close work dialog on entry saved', () => {
      component.displayAddWorkDialog = true;
      component.onWorkEntrySaved();
      expect(component.displayAddWorkDialog).toBeFalse();
    });

    it('should close expense dialog and reload on expense saved', () => {
      component.displayExpenseViewDialog = true;
      component.onExpenseSaved();
      expect(component.displayExpenseViewDialog).toBeFalse();
      expect(expenditureService.loadExpenditures).toHaveBeenCalledWith(1);
    });
  });

  describe('filters', () => {
    it('should filter this week', () => {
      component.filterThisWeek();
      expect(component.activeFilter).toBe('week');
      expect(component.fromDate).toBeTruthy();
      expect(component.toDate).toBeTruthy();
    });

    it('should filter this month', () => {
      component.filterThisMonth();
      expect(component.activeFilter).toBe('month');
      expect(component.fromDate).toBeTruthy();
      expect(component.toDate).toBeTruthy();
    });

    it('should filter this year', () => {
      component.filterThisYear();
      expect(component.activeFilter).toBe('year');
      const year = new Date().getFullYear();
      expect(component.fromDate?.getFullYear()).toBe(year);
    });

    it('should handle custom from date change', () => {
      const date = new Date(2025, 0, 6);
      component.onFromDateChange(date);
      expect(component.fromDate).toEqual(date);
      expect(component.activeFilter).toBe('custom');
    });

    it('should handle custom to date change', () => {
      const date = new Date(2025, 0, 10);
      component.onToDateChange(date);
      expect(component.toDate).toEqual(date);
      expect(component.activeFilter).toBe('custom');
    });

    it('should clear filters and show toast', () => {
      spyOn(messageService, 'add');
      component.fromDate = new Date();
      component.toDate = new Date();
      component.activeFilter = 'week';

      component.clearFilters();

      expect(component.fromDate).toBeNull();
      expect(component.toDate).toBeNull();
      expect(component.activeFilter).toBeNull();
      expect(component.first).toBe(0);
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'info',
        summary: 'Filters Cleared'
      }));
    });

    it('should clear filters silently when showToast is false', () => {
      spyOn(messageService, 'add');
      component.clearFilters(false);
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('should reset pagination on filter', () => {
      component.first = 20;
      component.filterThisMonth();
      expect(component.first).toBe(0);
    });
  });

  describe('delete operations', () => {
    it('should confirm before deleting work entry', () => {
      spyOn(confirmationService, 'confirm');
      component.confirmDeleteEntry(mockEntries[0]);
      expect(confirmationService.confirm).toHaveBeenCalledWith(jasmine.objectContaining({
        message: jasmine.stringContaining('Emp1')
      }));
    });

    it('should delete work entry on accept', () => {
      workService.deleteEntry.and.returnValue(of('deleted'));
      spyOn(messageService, 'add');

      spyOn(confirmationService, 'confirm').and.callFake((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.confirmDeleteEntry(mockEntries[0]);
      expect(workService.deleteEntry).toHaveBeenCalledWith('1');
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success'
      }));
    });

    it('should confirm before deleting expenditure', () => {
      spyOn(confirmationService, 'confirm');
      component.confirmDeleteExpenditure(mockExpenditures[0]);
      expect(confirmationService.confirm).toHaveBeenCalledWith(jasmine.objectContaining({
        message: jasmine.stringContaining('Petrol')
      }));
    });

    it('should delete expenditure on accept', () => {
      expenditureService.deleteExpenditure.and.returnValue(of('deleted'));
      spyOn(messageService, 'add');

      spyOn(confirmationService, 'confirm').and.callFake((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.confirmDeleteExpenditure(mockExpenditures[0]);
      expect(expenditureService.deleteExpenditure).toHaveBeenCalledWith('e1', 'Petrol');
    });
  });

  describe('KPI calculations', () => {
    it('should calculate total fabric meters', () => {
      expect(component.getTotalFabricMeters()).toBe(150); // 50 + 60 + 40
    });

    it('should calculate average fabric meters', () => {
      expect(component.getAverageFabricMeters()).toBe(50); // 150 / 3
    });

    it('should return 0 average when no entries', () => {
      component.filteredEntries = [];
      expect(component.getAverageFabricMeters()).toBe(0);
    });

    it('should calculate total expenses', () => {
      expect(component.getTotalExpenses()).toBe(700); // 200 + 500
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const formatted = component.formatDate(new Date(2025, 0, 6));
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('6');
      expect(formatted).toContain('2025');
    });
  });

  describe('formatCurrency', () => {
    it('should format in INR', () => {
      const formatted = component.formatCurrency(5000);
      expect(formatted).toContain('5,000');
    });
  });
});

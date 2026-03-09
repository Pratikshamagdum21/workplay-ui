import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EmployeeDetails } from './employee-details';
import { EmployeeService } from '../../../services/employee.service';
import { BranchService } from '../../../services/branch.service';
import { Employee } from './model/employee.model';
import { BehaviorSubject, of } from 'rxjs';
import { WorkManagementService } from '../../../services/work-management.service';

describe('EmployeeDetails', () => {
  let component: EmployeeDetails;
  let fixture: ComponentFixture<EmployeeDetails>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let messageService: MessageService;
  let confirmationService: ConfirmationService;

  const mockEmployees: Employee[] = [
    {
      id: 1, name: 'John Doe', isBonused: true, fabricType: 'Cotton', workType: 'Diwanji',
      salary: 5000, bonusAmount: 0, advanceAmount: 1000, advanceRemaining: 500,
      salaryType: 'WEEKLY', rate: 10, advanceTaken: 500, bonusEligible: true, clothDoneInMeter: 100
    },
    {
      id: 2, name: 'Jane Smith', isBonused: false, fabricType: 'Rayon', workType: 'Weaver',
      salary: 15000, bonusAmount: 0, advanceAmount: 0, advanceRemaining: 0,
      salaryType: 'MONTHLY', rate: 0, advanceTaken: 0, bonusEligible: false, clothDoneInMeter: 0
    }
  ];

  const employeesSubject = new BehaviorSubject<Employee[]>(mockEmployees);

  beforeEach(async () => {
    const empServiceSpy = jasmine.createSpyObj('EmployeeService', [
      'getEmployees', 'deleteEmployee', 'getFabricTypes', 'getBonusOptions'
    ]);
    empServiceSpy.getEmployees.and.returnValue(employeesSubject.asObservable());
    empServiceSpy.employees$ = employeesSubject.asObservable();
    empServiceSpy.getFabricTypes.and.returnValue([]);
    empServiceSpy.getBonusOptions.and.returnValue([]);

    const branchServiceMock = {
      getSelectedBranch: () => of({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getSelectedBranchSnapshot: () => ({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getBranches: () => of([{ id: 1, name: 'Unit 1', code: 'MB-001' }])
    };

    const workServiceMock = {
      getWorkTypes: () => [],
      getShifts: () => [],
      getEmployees: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [EmployeeDetails, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: EmployeeService, useValue: empServiceSpy },
        { provide: BranchService, useValue: branchServiceMock },
        { provide: WorkManagementService, useValue: workServiceMock },
        MessageService,
        ConfirmationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDetails);
    component = fixture.componentInstance;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    messageService = fixture.debugElement.injector.get(MessageService);
    confirmationService = fixture.debugElement.injector.get(ConfirmationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load employees on init', () => {
    expect(component.employees.length).toBe(2);
    expect(component.totalRecords).toBe(2);
    expect(component.loading).toBeFalse();
  });

  describe('dialog management', () => {
    it('should open add dialog', () => {
      component.openAddDialog();
      expect(component.displayAddDialog).toBeTrue();
      expect(component.isEditMode).toBeFalse();
    });

    it('should close add dialog', () => {
      component.openAddDialog();
      component.closeAddDialog();
      expect(component.displayAddDialog).toBeFalse();
    });

    it('should open edit dialog with employee copy', () => {
      component.openEditDialog(mockEmployees[0]);
      expect(component.displayEditDialog).toBeTrue();
      expect(component.isEditMode).toBeTrue();
      expect(component.selectedEmployee.name).toBe('John Doe');
      expect(component.selectedEmployee).not.toBe(mockEmployees[0]);
    });

    it('should close edit dialog and reset state', () => {
      component.openEditDialog(mockEmployees[0]);
      component.closeEditDialog();
      expect(component.displayEditDialog).toBeFalse();
      expect(component.isEditMode).toBeFalse();
    });

    it('should open view dialog', () => {
      component.openViewDialog(mockEmployees[0]);
      expect(component.displayViewDialog).toBeTrue();
      expect(component.selectedEmployee).toBe(mockEmployees[0]);
    });

    it('should close view dialog', () => {
      component.openViewDialog(mockEmployees[0]);
      component.closeViewDialog();
      expect(component.displayViewDialog).toBeFalse();
    });
  });

  describe('onEmployeeAdded', () => {
    it('should close dialog and reset pagination', () => {
      component.displayAddDialog = true;
      component.first = 20;
      component.onEmployeeAdded();
      expect(component.displayAddDialog).toBeFalse();
      expect(component.first).toBe(0);
    });
  });

  describe('onEmployeeUpdated', () => {
    it('should close edit dialog and reset state', () => {
      component.displayEditDialog = true;
      component.isEditMode = true;
      component.onEmployeeUpdated();
      expect(component.displayEditDialog).toBeFalse();
      expect(component.isEditMode).toBeFalse();
    });
  });

  describe('confirmDelete', () => {
    it('should call confirmation service', () => {
      spyOn(confirmationService, 'confirm');
      component.confirmDelete(mockEmployees[0]);
      expect(confirmationService.confirm).toHaveBeenCalledWith(jasmine.objectContaining({
        message: 'Are you sure you want to delete John Doe?',
        header: 'Confirm Delete'
      }));
    });

    it('should delete employee on accept and show success message', () => {
      employeeService.deleteEmployee.and.returnValue(of(undefined as any));
      spyOn(messageService, 'add');

      spyOn(confirmationService, 'confirm').and.callFake((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.confirmDelete(mockEmployees[0]);
      expect(employeeService.deleteEmployee).toHaveBeenCalledWith(1);
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Deleted'
      }));
    });
  });

  describe('formatCurrency', () => {
    it('should format amount in INR', () => {
      const formatted = component.formatCurrency(5000);
      expect(formatted).toContain('5,000');
    });

    it('should format zero', () => {
      const formatted = component.formatCurrency(0);
      expect(formatted).toContain('0');
    });
  });

  describe('getSalaryTypeLabel', () => {
    it('should return Weekly for WEEKLY type', () => {
      expect(component.getSalaryTypeLabel('WEEKLY')).toBe('Weekly');
    });

    it('should return Monthly for MONTHLY type', () => {
      expect(component.getSalaryTypeLabel('MONTHLY')).toBe('Monthly');
    });
  });

  describe('pagination', () => {
    it('should have default 10 rows per page', () => {
      expect(component.rows).toBe(10);
    });

    it('should start at first page', () => {
      expect(component.first).toBe(0);
    });
  });
});

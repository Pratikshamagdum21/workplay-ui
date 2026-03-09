import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { AddWorkForm } from './add-work-form';
import { WorkManagementService } from '../../../../services/work-management.service';
import { EmployeeService } from '../../../../services/employee.service';
import { BranchService } from '../../../../services/branch.service';
import { of, throwError } from 'rxjs';

describe('AddWorkForm', () => {
  let component: AddWorkForm;
  let fixture: ComponentFixture<AddWorkForm>;
  let workService: jasmine.SpyObj<WorkManagementService>;
  let messageService: MessageService;

  beforeEach(async () => {
    const workServiceSpy = jasmine.createSpyObj('WorkManagementService', [
      'getWorkTypes', 'getShifts', 'getEmployees', 'addEntry'
    ]);
    workServiceSpy.getWorkTypes.and.returnValue([
      { id: '1', name: 'Diwanji' }, { id: '2', name: 'Weaver' }
    ]);
    workServiceSpy.getShifts.and.returnValue([
      { id: '1', name: 'Morning', timeRange: '6:00 AM - 2:00 PM' }
    ]);
    workServiceSpy.getEmployees.and.returnValue(of([
      { id: 1, name: 'Emp1', salaryType: 'WEEKLY', fabricType: 'Cotton', workType: 'Diwanji' },
      { id: 2, name: 'Emp2', salaryType: 'MONTHLY', fabricType: 'Rayon', workType: 'Weaver' }
    ]));

    const empServiceMock = {
      getFabricTypes: () => [{ id: '1', name: 'Cotton' }],
      getEmployees: () => of([]),
      getBonusOptions: () => []
    };

    const branchServiceMock = {
      getSelectedBranch: () => of({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getSelectedBranchSnapshot: () => ({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getBranches: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [AddWorkForm, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: WorkManagementService, useValue: workServiceSpy },
        { provide: EmployeeService, useValue: empServiceMock },
        { provide: BranchService, useValue: branchServiceMock },
        MessageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddWorkForm);
    component = fixture.componentInstance;
    workService = TestBed.inject(WorkManagementService) as jasmine.SpyObj<WorkManagementService>;
    messageService = fixture.debugElement.injector.get(MessageService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should create form with required fields', () => {
      expect(component.workForm).toBeTruthy();
      expect(component.workForm.get('employeeName')).toBeTruthy();
      expect(component.workForm.get('employeeType')).toBeTruthy();
      expect(component.workForm.get('workType')).toBeTruthy();
      expect(component.workForm.get('fabricMeters')).toBeTruthy();
      expect(component.workForm.get('date')).toBeTruthy();
    });

    it('should default to range mode', () => {
      expect(component.isRangeMode).toBeTrue();
    });

    it('should load master data', () => {
      expect(component.workTypes.length).toBe(2);
      expect(component.shifts.length).toBe(1);
      expect(component.fabricTypes.length).toBe(1);
    });

    it('should filter only WEEKLY employees', () => {
      expect(component.employees.length).toBe(1);
      expect(component.employees[0].name).toBe('Emp1');
    });
  });

  describe('form validation', () => {
    it('should require employeeName', () => {
      expect(component.workForm.get('employeeName')?.hasError('required')).toBeTrue();
    });

    it('should require fabricMeters >= 1', () => {
      const control = component.workForm.get('fabricMeters');
      control?.setValue(0);
      expect(control?.hasError('min')).toBeTrue();
    });

    it('should accept valid fabricMeters', () => {
      const control = component.workForm.get('fabricMeters');
      control?.setValue(50);
      expect(control?.valid).toBeTrue();
    });
  });

  describe('date range validation', () => {
    it('should show error for non-Saturday start', () => {
      component.isRangeMode = true;
      // Monday to Friday
      const monday = new Date(2025, 0, 6);   // Monday
      const friday = new Date(2025, 0, 10);   // Friday
      component.workForm.get('date')?.setValue([monday, friday]);

      expect(component.dateRangeError).toBe('Week range must start on Saturday and end on Friday');
    });

    it('should clear error for valid Saturday-to-Friday range', () => {
      component.isRangeMode = true;
      const saturday = new Date(2025, 0, 4);  // Saturday
      const friday = new Date(2025, 0, 10);   // Friday
      component.workForm.get('date')?.setValue([saturday, friday]);

      expect(component.dateRangeError).toBeNull();
    });

    it('should clear error when only start date selected', () => {
      component.isRangeMode = true;
      component.workForm.get('date')?.setValue([new Date(2025, 0, 4), null]);
      expect(component.dateRangeError).toBeNull();
    });

    it('should clear error in single date mode', () => {
      component.isRangeMode = false;
      component.workForm.get('date')?.setValue(new Date());
      expect(component.dateRangeError).toBeNull();
    });
  });

  describe('onDateModeChange', () => {
    it('should clear date range error', () => {
      component.dateRangeError = 'some error';
      component.onDateModeChange();
      expect(component.dateRangeError).toBeNull();
    });

    it('should set date to array in range mode', () => {
      component.isRangeMode = true;
      component.onDateModeChange();
      expect(Array.isArray(component.workForm.get('date')?.value)).toBeTrue();
    });

    it('should set date to Date in single mode', () => {
      component.isRangeMode = false;
      component.onDateModeChange();
      expect(component.workForm.get('date')?.value instanceof Date).toBeTrue();
    });
  });

  describe('onEmployeeChange', () => {
    it('should auto-fill and disable fields when employee selected', () => {
      component.onEmployeeChange({ value: { fabricType: 'Cotton', workType: 'Diwanji' } });

      expect(component.workForm.get('employeeType')?.value).toBe('Cotton');
      expect(component.workForm.get('workType')?.value).toBe('Diwanji');
      expect(component.workForm.get('employeeType')?.disabled).toBeTrue();
      expect(component.workForm.get('workType')?.disabled).toBeTrue();
    });

    it('should clear and enable fields when employee deselected', () => {
      component.onEmployeeChange({ value: null });

      expect(component.workForm.get('employeeType')?.value).toBe('');
      expect(component.workForm.get('workType')?.value).toBe('');
      expect(component.workForm.get('employeeType')?.enabled).toBeTrue();
      expect(component.workForm.get('workType')?.enabled).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    it('should not submit when date range error exists', () => {
      component.dateRangeError = 'Invalid range';
      component.onSubmit();
      expect(workService.addEntry).not.toHaveBeenCalled();
    });

    it('should not submit when form is invalid', () => {
      spyOn(messageService, 'add');
      component.onSubmit();
      expect(workService.addEntry).not.toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error'
      }));
    });

    it('should submit valid single-date form', () => {
      component.isRangeMode = false;
      component.workForm.patchValue({
        employeeName: { name: 'Emp1' },
        employeeType: 'Cotton',
        workType: 'Diwanji',
        fabricMeters: 50,
        date: new Date(2025, 0, 6)
      });
      // Enable disabled fields for validation
      component.workForm.get('employeeType')?.enable();
      component.workForm.get('workType')?.enable();

      const savedEntry = {
        id: '1', employeeName: 'Emp1', employeeType: 'Cotton',
        fabricMeters: 50, date: new Date(), createdAt: new Date()
      };
      workService.addEntry.and.returnValue(of(savedEntry as any));
      spyOn(messageService, 'add');
      spyOn(component.entrySaved, 'emit');

      component.onSubmit();

      expect(workService.addEntry).toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success'
      }));
      expect(component.entrySaved.emit).toHaveBeenCalled();
      expect(component.saving).toBeFalse();
    });

    it('should show error when range mode missing end date', () => {
      component.isRangeMode = true;
      component.workForm.patchValue({
        employeeName: { name: 'Emp1' },
        employeeType: 'Cotton',
        workType: 'Diwanji',
        fabricMeters: 50,
        date: [new Date(2025, 0, 4), null] // Missing end date
      });
      component.workForm.get('employeeType')?.enable();
      component.workForm.get('workType')?.enable();

      spyOn(messageService, 'add');
      component.onSubmit();

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        detail: 'Please select both start and end dates'
      }));
      expect(component.saving).toBeFalse();
    });

    it('should set saving to false on error', () => {
      component.isRangeMode = false;
      component.workForm.patchValue({
        employeeName: { name: 'Emp1' },
        employeeType: 'Cotton',
        workType: 'Diwanji',
        fabricMeters: 50,
        date: new Date()
      });
      component.workForm.get('employeeType')?.enable();
      component.workForm.get('workType')?.enable();

      workService.addEntry.and.returnValue(throwError(() => new Error('fail')));
      component.onSubmit();
      expect(component.saving).toBeFalse();
    });
  });

  describe('isFieldInvalid', () => {
    it('should return false for untouched fields', () => {
      expect(component.isFieldInvalid('employeeName')).toBeFalse();
    });

    it('should return true for touched invalid field', () => {
      const control = component.workForm.get('employeeName');
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.isFieldInvalid('employeeName')).toBeTrue();
    });
  });

  describe('getErrorMessage', () => {
    it('should return required message', () => {
      expect(component.getErrorMessage('employeeName')).toBe('Employee Name is required');
    });

    it('should return min message', () => {
      component.workForm.get('fabricMeters')?.setValue(0);
      const msg = component.getErrorMessage('fabricMeters');
      expect(msg).toContain('must be at least');
    });
  });

  describe('resetForm', () => {
    it('should reset form and enable fields', () => {
      component.workForm.get('employeeType')?.disable();
      component.workForm.get('workType')?.disable();
      component.isRangeMode = true;

      component.resetForm();

      expect(component.isRangeMode).toBeFalse();
      expect(component.workForm.get('employeeType')?.enabled).toBeTrue();
      expect(component.workForm.get('workType')?.enabled).toBeTrue();
    });
  });
});

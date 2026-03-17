import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { AddEmployee } from './add-employee';
import { EmployeeService } from '../../../../services/employee.service';
import { BranchService } from '../../../../services/branch.service';
import { WorkManagementService } from '../../../../services/work-management.service';
import { Employee } from '../model/employee.model';
import { of, throwError } from 'rxjs';

describe('AddEmployee', () => {
  let component: AddEmployee;
  let fixture: ComponentFixture<AddEmployee>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let messageService: MessageService;

  const mockEmployee: Employee = {
    id: 1, name: 'Test Employee', isBonused: true, fabricType: 'Cotton', workType: 'Diwanji',
    salary: 5000, bonusAmount: 833, advanceAmount: 1000, advanceRemaining: 500,
    salaryType: 'WEEKLY', rate: 10, advanceTaken: 500, bonusEligible: true, clothDoneInMeter: 100
  };

  beforeEach(async () => {
    const empServiceSpy = jasmine.createSpyObj('EmployeeService', [
      'getFabricTypes', 'getBonusOptions', 'addEmployee', 'updateEmployee', 'getEmployees'
    ]);
    empServiceSpy.getFabricTypes.and.returnValue([
      { id: '1', name: 'Cotton' }, { id: '2', name: 'Rayon' }
    ]);
    empServiceSpy.getBonusOptions.and.returnValue([
      { label: 'With Bonus', value: true }, { label: 'Without Bonus', value: false }
    ]);
    empServiceSpy.getEmployees.and.returnValue(of([]));

    const branchServiceMock = {
      getSelectedBranch: () => of({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getSelectedBranchSnapshot: () => ({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getBranches: () => of([])
    };

    const workServiceMock = {
      getWorkTypes: () => [{ id: '1', name: 'Diwanji' }, { id: '2', name: 'Weaver' }],
      getShifts: () => [],
      getEmployees: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [AddEmployee, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: EmployeeService, useValue: empServiceSpy },
        { provide: BranchService, useValue: branchServiceMock },
        { provide: WorkManagementService, useValue: workServiceMock },
        MessageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEmployee);
    component = fixture.componentInstance;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    messageService = fixture.debugElement.injector.get(MessageService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should create the form with required fields', () => {
      expect(component.employeeForm).toBeTruthy();
      expect(component.employeeForm.get('name')).toBeTruthy();
      expect(component.employeeForm.get('salaryType')).toBeTruthy();
      expect(component.employeeForm.get('fabricType')).toBeTruthy();
      expect(component.employeeForm.get('workType')).toBeTruthy();
      expect(component.employeeForm.get('isBonused')).toBeTruthy();
    });

    it('should load fabric types from service', () => {
      expect(component.fabricTypes.length).toBe(2);
      expect(component.fabricTypes[0].name).toBe('Cotton');
    });

    it('should load bonus options from service', () => {
      expect(component.bonusOptions.length).toBe(2);
    });

    it('should load work types from service', () => {
      expect(component.workTypes.length).toBe(2);
    });

    it('should have 3 salary types', () => {
      expect(component.salaryTypes.length).toBe(3);
      expect(component.salaryTypes.map(s => s.value)).toEqual(['MONTHLY', 'WEEKLY', 'WEEKLY_F']);
    });
  });

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.employeeForm.valid).toBeFalse();
    });

    it('should require name', () => {
      const nameControl = component.employeeForm.get('name');
      expect(nameControl?.hasError('required')).toBeTrue();
    });

    it('should require salaryType', () => {
      const control = component.employeeForm.get('salaryType');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require fabricType', () => {
      const control = component.employeeForm.get('fabricType');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should enforce minimum 0 for advanceAmount', () => {
      const control = component.employeeForm.get('advanceAmount');
      control?.setValue(-1);
      expect(control?.hasError('min')).toBeTrue();
    });

    it('should enforce minimum 0 for salary', () => {
      const control = component.employeeForm.get('salary');
      control?.setValue(-1);
      expect(control?.hasError('min')).toBeTrue();
    });

    it('should be valid when all required fields are filled', () => {
      component.employeeForm.patchValue({
        name: 'Test',
        salaryType: 'MONTHLY',
        fabricType: 'Cotton',
        workType: 'Diwanji',
        isBonused: false
      });
      expect(component.employeeForm.valid).toBeTrue();
    });
  });

  describe('salary type helpers', () => {
    it('should detect WEEKLY salary type', () => {
      component.employeeForm.get('salaryType')?.setValue('WEEKLY');
      expect(component.isWeekly()).toBeTrue();
      expect(component.isMonthly()).toBeFalse();
      expect(component.isWeeklyFixed()).toBeFalse();
    });

    it('should detect MONTHLY salary type', () => {
      component.employeeForm.get('salaryType')?.setValue('MONTHLY');
      expect(component.isMonthly()).toBeTrue();
      expect(component.isWeekly()).toBeFalse();
      expect(component.isWeeklyFixed()).toBeFalse();
    });

    it('should detect WEEKLY_F salary type', () => {
      component.employeeForm.get('salaryType')?.setValue('WEEKLY_F');
      expect(component.isWeeklyFixed()).toBeTrue();
      expect(component.isWeekly()).toBeFalse();
      expect(component.isMonthly()).toBeFalse();
    });
  });

  describe('isBonus', () => {
    it('should return true when isBonused is true', () => {
      component.employeeForm.get('isBonused')?.setValue(true);
      expect(component.isBonus()).toBeTrue();
    });

    it('should return false when isBonused is false', () => {
      component.employeeForm.get('isBonused')?.setValue(false);
      expect(component.isBonus()).toBeFalse();
    });
  });

  describe('isFieldInvalid', () => {
    it('should return false for untouched fields', () => {
      expect(component.isFieldInvalid('name')).toBeFalse();
    });

    it('should return true for touched invalid fields', () => {
      const control = component.employeeForm.get('name');
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.isFieldInvalid('name')).toBeTrue();
    });

    it('should return false for valid touched fields', () => {
      const control = component.employeeForm.get('name');
      control?.setValue('Valid Name');
      control?.markAsTouched();
      expect(component.isFieldInvalid('name')).toBeFalse();
    });
  });

  describe('getErrorMessage', () => {
    it('should return required message for empty required field', () => {
      const control = component.employeeForm.get('name');
      control?.markAsTouched();
      expect(component.getErrorMessage('name')).toBe('Employee Name is required');
    });

    it('should return min message for below-minimum field', () => {
      const control = component.employeeForm.get('salary');
      control?.setValue(-1);
      control?.markAsTouched();
      expect(component.getErrorMessage('salary')).toContain('must be at least');
    });

    it('should return empty string for valid field', () => {
      component.employeeForm.get('name')?.setValue('Valid');
      expect(component.getErrorMessage('name')).toBe('');
    });
  });

  describe('onSubmit - add mode', () => {
    beforeEach(() => {
      component.isEditMode = false;
      component.employeeForm.patchValue({
        name: 'New Employee',
        salaryType: 'MONTHLY',
        fabricType: 'Cotton',
        workType: 'Diwanji',
        isBonused: false,
        salary: 10000
      });
    });

    it('should not submit when form is invalid', () => {
      component.employeeForm.get('name')?.setValue('');
      spyOn(messageService, 'add');
      component.onSubmit();
      expect(employeeService.addEmployee).not.toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Validation Error'
      }));
    });

    it('should add employee when form is valid', () => {
      employeeService.addEmployee.and.returnValue(of({ id: 100, name: 'New Employee' } as Employee));
      spyOn(messageService, 'add');
      spyOn(component.employeeSaved, 'emit');

      component.onSubmit();

      expect(employeeService.addEmployee).toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        detail: 'Employee added successfully'
      }));
      expect(component.employeeSaved.emit).toHaveBeenCalled();
      expect(component.saving).toBeFalse();
    });

    it('should set saving to false on error', () => {
      employeeService.addEmployee.and.returnValue(throwError(() => new Error('fail')));
      component.onSubmit();
      expect(component.saving).toBeFalse();
    });
  });

  describe('onSubmit - edit mode', () => {
    beforeEach(() => {
      component.isEditMode = true;
      component.employeeData = mockEmployee;
      component.employeeForm.patchValue({
        name: 'Updated Name',
        salaryType: 'WEEKLY',
        fabricType: 'Cotton',
        workType: 'Diwanji',
        isBonused: true,
        salary: 5000,
        rate: 10
      });
    });

    it('should update employee when form is valid', () => {
      employeeService.updateEmployee.and.returnValue(of({ ...mockEmployee, name: 'Updated Name' }));
      spyOn(messageService, 'add');
      spyOn(component.employeeSaved, 'emit');

      component.onSubmit();

      expect(employeeService.updateEmployee).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        detail: 'Employee updated successfully'
      }));
      expect(component.employeeSaved.emit).toHaveBeenCalled();
    });
  });

  describe('edit mode initialization', () => {
    it('should populate form with employee data when in edit mode', () => {
      component.isEditMode = true;
      component.employeeData = mockEmployee;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.employeeForm.get('name')?.value).toBe('Test Employee');
      expect(component.employeeForm.get('salaryType')?.value).toBe('WEEKLY');
      expect(component.employeeForm.get('fabricType')?.value).toBe('Cotton');
    });
  });

  describe('onCancel', () => {
    it('should reset form and emit cancelled', () => {
      spyOn(component.cancelled, 'emit');
      component.employeeForm.get('name')?.setValue('something');
      component.onCancel();
      expect(component.cancelled.emit).toHaveBeenCalled();
    });
  });

  describe('resetForm', () => {
    it('should reset form to defaults', () => {
      component.employeeForm.patchValue({ name: 'Test', salary: 5000 });
      component.resetForm();
      expect(component.employeeForm.get('name')?.value).toBeFalsy();
      expect(component.employeeForm.get('salary')?.value).toBe(0);
      expect(component.employeeForm.get('advanceAmount')?.value).toBe(0);
    });
  });
});

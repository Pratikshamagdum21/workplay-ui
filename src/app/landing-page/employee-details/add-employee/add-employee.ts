import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BonusOption, Employee, FabricType } from '../model/employee.model';
import { MessageService } from 'primeng/api';
import { EmployeeService } from '../../../../services/employee.service';
import { SHARED_IMPORTS } from '../../../shared-imports';

@Component({
  selector: 'app-add-employee',
  imports: [[...SHARED_IMPORTS]],
  providers: [MessageService],
  templateUrl: './add-employee.html',
  styleUrl: './add-employee.scss',
})
export class AddEmployee implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() employeeData!: Employee;
  @Output() employeeSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  employeeForm!: FormGroup;
  saving: boolean = false;

  fabricTypes: FabricType[] = [];
  bonusOptions: BonusOption[] = [];
  salaryTypes = [
    { label: 'Monthly (Fixed)', value: 'MONTHLY' },
    { label: 'Weekly (Per Meter)', value: 'WEEKLY' },
    { label: 'Weekly (Fixed)', value: 'WEEKLY(Fix)' }
  ];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fabricTypes = this.employeeService.getFabricTypes();
    this.bonusOptions = this.employeeService.getBonusOptions();

    if (this.isEditMode && this.employeeData) {
      this.populateForm();
    }
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      salaryType: ['', Validators.required],
      fabricType: ['', Validators.required],
      isBonused: [, Validators.required],
      bonusAmount: [0, [Validators.required, Validators.min(0)]],
      advanceAmount: [0, [Validators.required, Validators.min(0)]],
      salary: [0, [Validators.min(0)]],
      rate: [0, [Validators.min(0)]],
      clothDoneInMeter: [0]
    });
  }

  private populateForm(): void {
    if (this.employeeData) {
      this.employeeForm.patchValue({
        name: this.employeeData.name,
        salaryType: this.employeeData.salaryType,
        fabricType: this.employeeData.fabricType,
        isBonused: this.employeeData.isBonused,
        bonusAmount: this.employeeData.bonusAmount,
        advanceAmount: this.employeeData.advanceAmount,
        salary: this.employeeData.salary,
        rate: this.employeeData.rate,
        clothDoneInMeter: this.employeeData.clothDoneInMeter
      });
    }
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched(this.employeeForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly',
        life: 3000
      });
      return;
    }

    this.saving = true;
    const formValue = this.employeeForm.value;

    if (this.isEditMode && this.employeeData) {
      this.employeeService.updateEmployee(this.employeeData.id, formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Employee updated successfully',
            life: 3000
          });
          this.saving = false;
          this.employeeSaved.emit();
          this.resetForm();
        },
        error: () => {
          this.saving = false;
        }
      });
    } else {
      const newEmployee: Omit<Employee, 'id'> = {
        name: formValue.name,
        salaryType: formValue.salaryType,
        fabricType: formValue.fabricType,
        isBonused: formValue.isBonused,
        bonusAmount: formValue.bonusAmount ?? 0,
        advanceAmount: formValue.advanceAmount ?? 0,
        advanceRemaining: formValue.advanceAmount ?? 0,
        salary: formValue.salary ?? 0,
        rate: formValue.rate ?? 0,
        clothDoneInMeter: formValue.clothDoneInMeter ?? 0,
        advanceTaken: 0,
        bonusEligible: false
      };

      this.employeeService.addEmployee(newEmployee).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Employee added successfully',
            life: 3000
          });
          this.saving = false;
          this.employeeSaved.emit();
          this.resetForm();
        },
        error: () => {
          this.saving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  resetForm(): void {
    this.employeeForm.reset({
      salaryType: 'MONTHLY',
      isBonused: false,
      bonusAmount: 0,
      advanceAmount: 0,
      salary: 0,
      rate: 0,
      clothDoneInMeter: 0
    });
  }

  isWeekly(): boolean {
    const salaryType = this.employeeForm.get('salaryType')?.value;
    return salaryType === 'WEEKLY';
  }
  isBonus(): boolean {
    return this.employeeForm.get('isBonused')?.value === true;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('min')) {
      const minValue = field.errors?.['min'].min;
      return `${this.getFieldLabel(fieldName)} must be at least ${minValue}`;
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Employee Name',
      salaryType: 'Salary Type',
      fabricType: 'Fabric Type',
      isBonused: 'Bonus Eligibility',
      bonusAmount: 'Bonus Amount',
      advanceAmount: 'Advance Amount',
      salary: 'Monthly Salary',
      rate: 'Rate Per Meter'
    };
    return labels[fieldName] || fieldName;
  }
}

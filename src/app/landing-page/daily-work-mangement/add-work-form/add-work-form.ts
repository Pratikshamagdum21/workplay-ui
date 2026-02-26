import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { WorkManagementService } from '../../../../services/work-management.service';
import { WorkType, Shift } from '../model/work-entry.model';
import { SHARED_IMPORTS } from '../../../shared-imports';

@Component({
  selector: 'app-add-work-form',
  imports: [SHARED_IMPORTS],
  providers: [MessageService],
  templateUrl: './add-work-form.html',
  styleUrl: './add-work-form.scss',
})
export class AddWorkForm implements OnInit, OnDestroy {
  @Output() entrySaved = new EventEmitter<void>();

  workForm!: FormGroup;
  employees: { id: string; name: string }[] = [];
  workTypes: WorkType[] = [];
  shifts: Shift[] = [];
  saving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private workService: WorkManagementService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadMasterData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.workForm = this.fb.group({
      employeeName: ['', Validators.required],
      employeeType: ['', Validators.required],
      shift: ['', Validators.required],
      fabricMeters: [null, [Validators.required, Validators.min(1)]],
      date: [new Date(), Validators.required]
    });
  }

  private loadMasterData(): void {
    // Load employees from the real EmployeeService via WorkManagementService
    this.workService.getEmployeeNames()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
      });
    this.workTypes = this.workService.getWorkTypes();
    this.shifts = this.workService.getShifts();
  }

  onSubmit(): void {
    if (this.workForm.invalid) {
      this.markFormGroupTouched(this.workForm);
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly',
        life: 3000
      });
      return;
    }

    this.saving = true;
    const formValue = this.workForm.value;

    const workEntry = {
      employeeName: formValue.employeeName,
      employeeType: formValue.employeeType,
      shift: formValue.shift,
      fabricMeters: formValue.fabricMeters,
      date: formValue.date
    };

    this.workService.addEntry(workEntry)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Work entry added successfully',
            life: 3000
          });
          this.saving = false;
          this.resetForm();
          this.entrySaved.emit();
        },
        error: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save work entry. Please try again.',
            life: 3000
          });
        }
      });
  }

  resetForm(): void {
    this.workForm.reset({ date: new Date() });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.workForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.workForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('min')) {
      const minValue = field.errors?.['min'].min;
      return `${this.getFieldLabel(fieldName)} must be at least ${minValue}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      employeeName: 'Employee Name',
      employeeType: 'Work Type',
      shift: 'Shift',
      fabricMeters: 'Fabric Meters',
      date: 'Date'
    };
    return labels[fieldName] || fieldName;
  }
}

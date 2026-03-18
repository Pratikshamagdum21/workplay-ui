import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { WorkManagementService } from '../../../../services/work-management.service';
import { WorkEntry, WorkType, Shift, Employee } from '../model/work-entry.model';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { FabricType } from '../../employee-details/model/employee.model';
import { EmployeeService } from '../../../../services/employee.service';

@Component({
  selector: 'app-add-work-form',
  imports: [SHARED_IMPORTS],
  providers: [MessageService],
  templateUrl: './add-work-form.html',
  styleUrl: './add-work-form.scss',
})
export class AddWorkForm implements OnInit, OnDestroy, OnChanges {
  @Input() entryData: WorkEntry | null = null;
  @Output() entrySaved = new EventEmitter<void>();
  isEditMode = false;
selectedEmp!:Employee;
  workForm!: FormGroup;
  employees: { id: string; name: string }[] = [];
  workTypes: WorkType[] = [];
  fabricTypes: FabricType[] = [];
  shifts: Shift[] = [];
  saving = false;
  isRangeMode = true;
  dateRangeError: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private workService: WorkManagementService,
    private messageService: MessageService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadMasterData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entryData'] && this.workForm) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.entryData) {
      this.isEditMode = true;
      const hasEndDate = !!this.entryData.endDate;
      this.isRangeMode = hasEndDate;

      this.workForm.patchValue({
        employeeName: this.entryData.employeeName,
        employeeType: this.entryData.employeeType,
        workType: (this.entryData as any).workType || '',
        fabricMeters: this.entryData.fabricMeters,
        date: hasEndDate
          ? [new Date(this.entryData.date), new Date(this.entryData.endDate!)]
          : new Date(this.entryData.date)
      });
      // Disable employee-derived fields in edit mode
      this.workForm.get('employeeType')?.disable();
      this.workForm.get('workType')?.disable();
    } else {
      this.isEditMode = false;
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.workForm = this.fb.group({
      employeeName: ['', Validators.required],
      employeeType: ['', Validators.required],
      workType: ['', Validators.required],
      fabricMeters: [null, [Validators.required, Validators.min(1)]],
      date: [new Date(), Validators.required]
    });

    // Validate Sat-Fri range on date selection
    this.workForm.get('date')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (!this.isRangeMode || !Array.isArray(value)) {
          this.dateRangeError = null;
          return;
        }
        const [start, end] = value;
        if (start && end) {
          const s = start instanceof Date ? start : new Date(start);
          const e = end instanceof Date ? end : new Date(end);
          if (s.getDay() !== 6 || e.getDay() !== 5) {
            this.dateRangeError = 'Week range must start on Saturday and end on Friday';
          } else {
            this.dateRangeError = null;
          }
        } else {
          this.dateRangeError = null;
        }
      });
  }

  private loadMasterData(): void {
    // Load employees from the real EmployeeService via WorkManagementService
    this.fabricTypes = this.employeeService.getFabricTypes();

    this.workService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees.filter(emp => emp.salaryType === 'WEEKLY');
      });
    this.workTypes = this.workService.getWorkTypes();
    this.shifts = this.workService.getShifts();
  }

  onDateModeChange(): void {
    this.dateRangeError = null;
    this.workForm.get('date')?.setValue(this.isRangeMode ? [] : new Date());
  }

  onEmployeeChange(event: any): void {
    const emp = event?.value;
    if (emp) {
      this.workForm.patchValue({
        employeeType: emp.fabricType || '',
        workType: emp.workType || ''
      });
      this.workForm.get('employeeType')?.disable();
      this.workForm.get('workType')?.disable();
    } else {
      this.workForm.patchValue({ employeeType: '', workType: '' });
      this.workForm.get('employeeType')?.enable();
      this.workForm.get('workType')?.enable();
    }
  }
  onSubmit(): void {
    if (this.dateRangeError) return;
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
    const formValue = this.workForm.getRawValue();

    let date: Date;
    let endDate: Date | undefined;

    if (this.isRangeMode && Array.isArray(formValue.date)) {
      const [start, end] = formValue.date;
      if (!start || !end) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Please select both start and end dates',
          life: 3000
        });
        this.saving = false;
        return;
      }
      date = start instanceof Date ? start : new Date(start);
      endDate = end instanceof Date ? end : new Date(end);
    } else {
      date = formValue.date instanceof Date
        ? formValue.date
        : new Date(formValue.date);
    }

    const workEntry = {
      employeeName: formValue.employeeName?.name || formValue.employeeName,
      employeeType: formValue.employeeType,
      fabricMeters: formValue.fabricMeters,
      date: date,
      ...(endDate && { endDate })
    };

    const request$ = this.isEditMode && this.entryData?.id
      ? this.workService.updateEntry(this.entryData.id, workEntry)
      : this.workService.addEntry(workEntry);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: this.isEditMode ? 'Work entry updated successfully' : 'Work entry added successfully',
            life: 3000
          });
          this.saving = false;
          this.isEditMode = false;
          this.entryData = null;
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
    this.isRangeMode = false;
    this.workForm.get('employeeType')?.enable();
    this.workForm.get('workType')?.enable();
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

import { SHARED_IMPORTS } from '../../../shared-imports';
import { MessageService } from 'primeng/api';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SalaryPayload } from '../salary.model';
import {
  DailyMeter,
  WeeklySalaryPayload,
  MonthlySalaryPayload,
  WeekRange
} from '../salary.model';
import { SalaryService } from '../../../../services/salary.service';
import { Employee } from '../../employee-details/model/employee.model';
import { WorkManagementService } from '../../../../services/work-management.service';

@Component({
  selector: 'app-pay-salary',
  imports: [SHARED_IMPORTS],
  providers: [MessageService],
  templateUrl: './pay-salary.html',
  styleUrl: './pay-salary.scss',
})
export class PaySalary implements OnInit, OnDestroy, OnChanges {
  @Input() salaryData: any = null;
  @Output() saved = new EventEmitter<void>();

  employees: Employee[] = [];
  selectedEmployeeId: number | null = null;
  employee: Employee | null = null;
  salaryForm!: FormGroup;
  loading: boolean = false;
  saving: boolean = false;

  isEditMode: boolean = false;
  editSalaryId: number | null = null;

  weekRange: Date[] = [];
  minDate: Date = new Date();
  maxDate: Date = new Date();

  totalMeters: number = 0;
  baseSalary: number = 0;
  leaveDeductionTotal: number = 0;
  finalPay: number = 0;
  autoBonus: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private salaryService: SalaryService,
    private workService: WorkManagementService,
    private messageService: MessageService
  ) {
    this.minDate.setMonth(this.minDate.getMonth() - 3);
    this.maxDate.setMonth(this.maxDate.getMonth() + 1);
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['salaryData'] && this.salaryData) {
      this.isEditMode = true;
      this.editSalaryId = this.salaryData.id || null;
      this.selectedEmployeeId = this.salaryData.employeeId;
      this.loadEmployeeForEdit(this.salaryData.employeeId);
    } else if (changes['salaryData'] && !this.salaryData) {
      this.isEditMode = false;
      this.editSalaryId = null;
      this.resetForm();
      this.selectedEmployeeId = null;
      this.employee = null;
    }
  }

  private loadEmployeeForEdit(employeeId: number): void {
    this.loading = true;
    this.salaryService.getEmployeeById(employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employee) => {
          if (employee) {
            this.employee = employee;
            this.initializeForm();
            this.prefillFormWithSalaryData();
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private prefillFormWithSalaryData(): void {
    if (!this.salaryData || !this.salaryForm) return;

    const data = this.salaryData;

    if (this.employee?.salaryType === 'WEEKLY') {
      this.salaryForm.patchValue({
        ratePerMeter: data.ratePerMeter || this.employee?.rate || 0,
        advanceDeductedThisTime: data.advanceDeductedThisTime || 0
      });

      // If meterDetails exist from the salary record, populate them
      if (data.meterDetails && data.meterDetails.length > 0) {
        this.setMeterDetails(data.meterDetails);
        this.calculateWeeklySalary();
      }

      // If week range can be derived from meterDetails
      if (data.meterDetails && data.meterDetails.length > 0) {
        const dates = data.meterDetails.map((d: any) => new Date(d.date));
        const startDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
        const endDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
        this.salaryForm.patchValue({ weekRange: [startDate, endDate] }, { emitEvent: false });
      }
    } else {
      this.salaryForm.patchValue({
        salary: data.salary || this.employee?.salary || 0,
        leaveDays: data.leaveDays || 0,
        leaveDeductionPerDay: data.leaveDeductionPerDay || 0,
        advanceDeductedThisTime: data.advanceDeductedThisTime || 0
      });
      this.calculateMonthlySalary();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Whether the selected employee receives auto-bonus on each payout */
  get isBonusedEmployee(): boolean {
    return this.employee?.isBonused === true;
  }

  private loadEmployees(): void {
    this.loading = true;
    this.salaryService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load employees',
            life: 3000
          });
        }
      });
  }

  onEmployeeSelect(event: any): void {
    const employeeId = event.value;
    if (employeeId) {
      this.loadEmployeeDetails(employeeId);
    } else {
      this.employee = null;
      this.resetForm();
    }
  }

  private loadEmployeeDetails(id: number): void {
    this.loading = true;
    this.salaryService.getEmployeeById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employee) => {
          if (employee) {
            this.employee = employee;
            this.initializeForm();
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load employee details',
            life: 3000
          });
        }
      });
  }

  private initializeForm(): void {
    if (!this.employee) return;

    if (this.employee.salaryType === 'WEEKLY') {
      this.initializeWeeklyForm();
    } else {
      this.initializeMonthlyForm();
    }
  }

  private initializeWeeklyForm(): void {
    this.salaryForm = this.fb.group({
      weekRange: [null, Validators.required],
      ratePerMeter: [this.employee?.rate || 0, [Validators.required, Validators.min(1)]],
      meterDetails: this.fb.array([]),
      advanceDeductedThisTime: [0, [Validators.required, Validators.min(0)]]
    });

    this.salaryForm.get('weekRange')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((range) => {
        if (range && range.length === 2) {
          this.loadWeeklyData(range[0], range[1]);
        }
      });

    this.salaryForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateWeeklySalary());
  }

  private initializeMonthlyForm(): void {
    this.salaryForm = this.fb.group({
      salary: [this.employee?.salary || 0, [Validators.required, Validators.min(1)]],
      leaveDays: [0, [Validators.required, Validators.min(0)]],
      leaveDeductionPerDay: [0, [Validators.required, Validators.min(0)]],
      advanceDeductedThisTime: [0, [Validators.required, Validators.min(0)]]
    });

    this.salaryForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateMonthlySalary());

    this.calculateMonthlySalary();
  }

  private loadWeeklyData(startDate: Date, endDate: Date): void {
    if (!this.employee) return;

    const weekRange: WeekRange = { startDate, endDate };
    this.salaryService.getWeeklyData(this.employee.id, weekRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe((dailyMeters) => {
        // Pre-populate meters from actual work records for this employee in the selected week
        const workEntries = this.workService.filterEntries(startDate, endDate)
          .filter(e => e.employeeName === this.employee?.name);

        // Build a map of date → total fabric meters from work entries
        const metersMap = new Map<string, number>();
        for (const entry of workEntries) {
          const dateKey = new Date(entry.date).toISOString().split('T')[0];
          metersMap.set(dateKey, (metersMap.get(dateKey) || 0) + entry.fabricMeters);
        }

        // Apply real meter values to the daily meter entries
        const populated = dailyMeters.map(day => ({
          ...day,
          meter: metersMap.get(day.date) || 0
        }));

        this.setMeterDetails(populated);
        this.calculateWeeklySalary();
      });
  }

  private setMeterDetails(dailyMeters: DailyMeter[]): void {
    const meterDetailsArray = this.salaryForm.get('meterDetails') as FormArray;
    meterDetailsArray.clear();
    dailyMeters.forEach(day => meterDetailsArray.push(this.createMeterDetailFormGroup(day)));
  }

  private createMeterDetailFormGroup(day: DailyMeter): FormGroup {
    const group = this.fb.group({
      date: [day.date],
      meter: [day.meter, [Validators.required, Validators.min(0)]],
      isLeave: [day.isLeave],
      leaveDeduction: [day.leaveDeduction, [Validators.required, Validators.min(0)]],
      note: [day.note || '']
    });

    group.get('meter')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((meter: any) => {
        if (meter > 0) {
          group.patchValue({ isLeave: false, leaveDeduction: 0 }, { emitEvent: false });
        }
      });

    group.get('isLeave')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLeave) => {
        const meter = group.get('meter')?.value;
        if (isLeave && meter || 0 > 0) {
          group.patchValue({ isLeave: false }, { emitEvent: false });
          this.messageService.add({
            severity: 'warn',
            summary: 'Invalid Leave',
            detail: 'Cannot mark as leave when meter is greater than 0',
            life: 3000
          });
        }
        if (!isLeave) {
          group.patchValue({ leaveDeduction: 0 }, { emitEvent: false });
        }
      });

    return group;
  }

  get meterDetailsArray(): FormArray {
    return this.salaryForm?.get('meterDetails') as FormArray;
  }

  private calculateWeeklySalary(): void {
    if (!this.employee || this.employee.salaryType !== 'WEEKLY' || !this.salaryForm) return;

    const meterDetails = this.meterDetailsArray?.value as DailyMeter[] || [];
    const ratePerMeter = this.salaryForm.get('ratePerMeter')?.value || 0;
    const advanceDeducted = this.salaryForm.get('advanceDeductedThisTime')?.value || 0;

    const totalMeters = meterDetails.reduce((sum, day) => sum + day.meter, 0);
    const baseSalary = totalMeters * ratePerMeter;
    const leaveDeductionTotal = meterDetails.reduce((sum, day) => sum + day.leaveDeduction, 0);

    // Auto-calculate bonus for isBonused employees; zero for others (year-end bonus only)
    this.autoBonus = this.isBonusedEmployee
      ? this.salaryService.calculatePerSalaryBonus(baseSalary)
      : 0;

    const calculation = this.salaryService.calculateWeeklySalary(
      meterDetails, ratePerMeter, this.autoBonus, advanceDeducted
    );

    this.totalMeters = calculation.totalMeters;
    this.baseSalary = calculation.baseSalary;
    this.leaveDeductionTotal = calculation.leaveDeductionTotal;
    this.finalPay = calculation.finalPay;
  }

  private calculateMonthlySalary(): void {
    if (!this.employee || this.employee.salaryType !== 'MONTHLY' || !this.salaryForm) return;

    const salary = this.salaryForm.get('salary')?.value || 0;
    const leaveDays = this.salaryForm.get('leaveDays')?.value || 0;
    const leaveDeductionPerDay = this.salaryForm.get('leaveDeductionPerDay')?.value || 0;
    const advanceDeducted = this.salaryForm.get('advanceDeductedThisTime')?.value || 0;

    // Auto-calculate bonus for isBonused employees; zero for others (year-end bonus only)
    this.autoBonus = this.isBonusedEmployee
      ? this.salaryService.calculatePerSalaryBonus(salary)
      : 0;

    const calculation = this.salaryService.calculateMonthlySalary(
      salary, leaveDays, leaveDeductionPerDay, this.autoBonus, advanceDeducted
    );

    this.leaveDeductionTotal = calculation.leaveDeductionTotal;
    this.finalPay = calculation.finalPay;
  }

  onSubmit(): void {
    if (!this.salaryForm || this.salaryForm.invalid || !this.employee) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly',
        life: 3000
      });
      return;
    }

    const advanceDeducted = this.salaryForm.get('advanceDeductedThisTime')?.value || 0;
    if (advanceDeducted > this.employee.advanceRemaining) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Advance Deduction',
        detail: `Cannot deduct more than remaining advance (${this.formatCurrency(this.employee.advanceRemaining)})`,
        life: 3000
      });
      return;
    }

    this.saving = true;

    if (this.employee.salaryType === 'WEEKLY') {
      this.saveWeeklySalary();
    } else {
      this.saveMonthlySalary();
    }
  }

  private saveWeeklySalary(): void {
    if (!this.employee) return;

    const formValue = this.salaryForm.value;
    const advanceDeducted = formValue.advanceDeductedThisTime;

    const payload: WeeklySalaryPayload = {
      employeeId: this.employee.id,
      employeeName: this.employee.name,
      type: 'weekly',
      meterDetails: formValue.meterDetails,
      ratePerMeter: formValue.ratePerMeter,
      totalMeters: this.totalMeters,
      baseSalary: this.baseSalary,
      bonus: this.autoBonus,
      leaveDeductionTotal: this.leaveDeductionTotal,
      advanceTakenTotal: this.employee.advanceAmount,
      advanceDeductedThisTime: advanceDeducted,
      advanceRemaining: this.employee.advanceRemaining - advanceDeducted,
      finalPay: this.finalPay,
      createdAt: this.isEditMode ? this.salaryData.createdAt : new Date()
    };

    if (this.isEditMode && this.editSalaryId) {
      payload.id = this.editSalaryId;
    }

    this.salaryService.saveWeeklySalary(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: this.isEditMode ? 'Weekly salary updated successfully' : 'Weekly salary saved successfully',
            life: 3000
          });
          this.saving = false;
          this.saved.emit();
          this.resetAfterSave();
        },
        error: () => {
          this.saving = false;
        }
      });
  }

  private saveMonthlySalary(): void {
    if (!this.employee) return;

    const formValue = this.salaryForm.value;
    const advanceDeducted = formValue.advanceDeductedThisTime;

    const payload: MonthlySalaryPayload = {
      employeeId: this.employee.id,
      employeeName: this.employee.name,
      type: 'monthly',
      salary: formValue.salary,
      leaveDays: formValue.leaveDays,
      leaveDeductionPerDay: formValue.leaveDeductionPerDay,
      leaveDeductionTotal: this.leaveDeductionTotal,
      bonus: this.autoBonus,
      advanceTakenTotal: this.employee.advanceAmount,
      advanceDeductedThisTime: advanceDeducted,
      advanceRemaining: this.employee.advanceRemaining - advanceDeducted,
      finalPay: this.finalPay,
      createdAt: this.isEditMode ? this.salaryData.createdAt : new Date()
    };

    if (this.isEditMode && this.editSalaryId) {
      payload.id = this.editSalaryId;
    }

    this.salaryService.saveMonthlySalary(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: this.isEditMode ? 'Monthly salary updated successfully' : 'Monthly salary saved successfully',
            life: 3000
          });
          this.saving = false;
          this.saved.emit();
          this.resetAfterSave();
        },
        error: () => {
          this.saving = false;
        }
      });
  }

  private resetAfterSave(): void {
    this.isEditMode = false;
    this.editSalaryId = null;
    this.selectedEmployeeId = null;
    this.employee = null;
    this.resetForm();
    this.loadEmployees();
  }

  private resetForm(): void {
    this.salaryForm = null as any;
    this.totalMeters = 0;
    this.baseSalary = 0;
    this.leaveDeductionTotal = 0;
    this.finalPay = 0;
    this.autoBonus = 0;
  }

  cancel(): void {
    this.router.navigate(['/salary']);
  }

  isWeeklyWorker(): boolean {
    return this.employee?.salaryType === 'WEEKLY';
  }

  isMonthlyWorker(): boolean {
    return this.employee?.salaryType === 'MONTHLY';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import {
  DailyMeter,
  WeeklySalaryPayload,
  MonthlySalaryPayload,
  SalaryPayload,
  WeekRange
} from '../app/landing-page/salary-details/salary.model';
import { environment } from '../environments/environment';
import { EmployeeService } from './employee.service';
import { Employee } from '../app/landing-page/employee-details/model/employee.model';
import { BranchService } from './branch.service';

export const BONUS_RATE = 16.66; // percentage applied per salary for isBonused employees

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private readonly baseUrl = `${environment.apiUrl}/salary`;

  private salaryHistorySubject = new BehaviorSubject<SalaryPayload[]>([]);
  public salaryHistory$ = this.salaryHistorySubject.asObservable();

  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService,
    private branchService: BranchService
  ) {
    // Reload salary history when branch changes
    this.branchService.getSelectedBranch().subscribe(branch => {
      this.loadSalaryHistory(branch.id);
    });
  }

  private loadSalaryHistory(branchId?: number): void {
    let params = new HttpParams();
    if (branchId != null) {
      params = params.set('branchId', branchId.toString());
    }
    this.http.get<SalaryPayload[]>(`${this.baseUrl}/getAllSalary`, { params }).subscribe({
      next: (history) => this.salaryHistorySubject.next(history),
      error: () => {}
    });
  }

  getEmployees(): Observable<Employee[]> {
    return this.employeeService.getEmployees();
  }

  getEmployeeById(id: number): Observable<Employee | undefined> {
    return this.employeeService.getEmployeeById(id);
  }

  getWeeklyData(employeeId: number, weekRange: WeekRange): Observable<DailyMeter[]> {
    const dailyMeters: DailyMeter[] = [];
    const currentDate = new Date(weekRange.startDate);

    while (currentDate <= weekRange.endDate) {
      dailyMeters.push({
        date: currentDate.toISOString().split('T')[0],
        meter: 0,
        isLeave: false,
        leaveDeduction: 0,
        note: ''
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return of(dailyMeters);
  }

  /**
   * Auto-bonus per salary payout for employees WITH bonus (isBonused = true).
   * Formula: (salary / 100) * 16.66
   */
  calculatePerSalaryBonus(salary: number): number {
    return parseFloat(((salary / 100) * BONUS_RATE).toFixed(2));
  }

  /**
   * Year-end bonus for employees WITHOUT per-salary bonus (isBonused = false).
   * Formula: (totalYearSalary / 100) * 16.66  — informational only, shown on salary page.
   */
  calculateYearEndBonus(totalYearSalary: number): number {
    return parseFloat(((totalYearSalary / 100) * BONUS_RATE).toFixed(2));
  }

  /**
   * Cumulative final pay for a given employee in a given calendar year from history.
   */
  getEmployeeYearSalary(employeeId: number, year: number): number {
    return this.salaryHistorySubject.value
      .filter(p => {
        const paidYear = new Date(p.createdAt).getFullYear();
        return p.employeeId === employeeId && paidYear === year;
      })
      .reduce((sum, p) => sum + p.finalPay, 0);
  }

  saveWeeklySalary(payload: WeeklySalaryPayload): Observable<any> {
    const branchId = this.branchService.getSelectedBranchSnapshot().id;
    return this.http.post(`${this.baseUrl}/saveSalary`, { ...payload, branchId }).pipe(
      tap(() => {
        this.salaryHistorySubject.next([...this.salaryHistorySubject.value, payload]);
        // Update employee advance balance
        this.employeeService.updateAdvance(
          payload.employeeId,
          payload.advanceDeductedThisTime
        ).subscribe();
      })
    );
  }

  saveMonthlySalary(payload: MonthlySalaryPayload): Observable<any> {
    const branchId = this.branchService.getSelectedBranchSnapshot().id;
    return this.http.post(`${this.baseUrl}/saveSalary`, { ...payload, branchId }).pipe(
      tap(() => {
        this.salaryHistorySubject.next([...this.salaryHistorySubject.value, payload]);
        // Update employee advance balance
        this.employeeService.updateAdvance(
          payload.employeeId,
          payload.advanceDeductedThisTime
        ).subscribe();
      })
    );
  }

  calculateWeeklySalary(
    meterDetails: DailyMeter[],
    ratePerMeter: number,
    bonus: number,
    advanceDeducted: number
  ): { totalMeters: number; baseSalary: number; leaveDeductionTotal: number; finalPay: number } {
    const totalMeters = meterDetails.reduce((sum, day) => sum + day.meter, 0);
    const baseSalary = totalMeters * ratePerMeter;
    const leaveDeductionTotal = meterDetails.reduce((sum, day) => sum + day.leaveDeduction, 0);
    const finalPay = baseSalary + bonus - advanceDeducted - leaveDeductionTotal;

    return { totalMeters, baseSalary, leaveDeductionTotal, finalPay };
  }

  calculateMonthlySalary(
    monthlySalary: number,
    leaveDays: number,
    leaveDeductionPerDay: number,
    bonus: number,
    advanceDeducted: number
  ): { leaveDeductionTotal: number; finalPay: number } {
    const leaveDeductionTotal = leaveDays * leaveDeductionPerDay;
    const finalPay = monthlySalary + bonus - advanceDeducted - leaveDeductionTotal;

    return { leaveDeductionTotal, finalPay };
  }

  getSalaryHistory(): Observable<SalaryPayload[]> {
    return this.salaryHistory$;
  }
}

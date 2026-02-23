import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private readonly baseUrl = `${environment.apiUrl}/emp`;

  private salaryHistorySubject = new BehaviorSubject<SalaryPayload[]>([]);
  public salaryHistory$ = this.salaryHistorySubject.asObservable();

  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService
  ) {}

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

  saveWeeklySalary(payload: WeeklySalaryPayload): Observable<Employee> {
    return this.employeeService.updateAdvance(
      payload.employeeId,
      payload.advanceDeductedThisTime
    ).pipe(
      tap(() => {
        const history = this.salaryHistorySubject.value;
        this.salaryHistorySubject.next([...history, payload]);
      })
    );
  }

  saveMonthlySalary(payload: MonthlySalaryPayload): Observable<Employee> {
    return this.employeeService.updateAdvance(
      payload.employeeId,
      payload.advanceDeductedThisTime
    ).pipe(
      tap(() => {
        const history = this.salaryHistorySubject.value;
        this.salaryHistorySubject.next([...history, payload]);
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
}

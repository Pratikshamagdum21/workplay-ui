import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { BonusOption, Employee, FabricType } from '../app/landing-page/employee-details/model/employee.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly baseUrl = `${environment.apiUrl}/emp`;

  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  public employees$: Observable<Employee[]> = this.employeesSubject.asObservable();

  private readonly fabricTypes: FabricType[] = [
    { id: '1', name: 'Cotton' },
    { id: '2', name: 'Rayon' },
    { id: '3', name: 'Denim' },
    { id: '4', name: 'Poplin' },
    { id: '5', name: 'Voile' }
  ];

  private readonly bonusOptions: BonusOption[] = [
    { label: 'With Bonus', value: true },
    { label: 'Without Bonus', value: false }
  ];

  constructor(private http: HttpClient) {
    this.loadEmployees();
  }

  private loadEmployees(): void {
    this.http.get<Employee[]>(`${this.baseUrl}/getAllEmployees`).subscribe({
      next: (employees) => this.employeesSubject.next(employees),
      error: () => {}
    });
  }

  getFabricTypes(): FabricType[] {
    return [...this.fabricTypes];
  }

  getBonusOptions(): BonusOption[] {
    return [...this.bonusOptions];
  }

  getEmployees(): Observable<Employee[]> {
    return this.employees$;
  }

  getEmployeeById(id: number): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, null);
  }

  addEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    const id = Math.floor(Date.now() / 1000) % 2000000000;
    const params = this.buildEmployeeParams({ id, ...employee } as Employee);
    return this.http.post<Employee>(`${this.baseUrl}/saveEmp`, null, { params }).pipe(
      tap((saved) => {
        if (saved) {
          this.employeesSubject.next([saved, ...this.employeesSubject.value]);
        }
      })
    );
  }

  updateEmployee(id: number, updates: Partial<Employee>): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/updateEmp/${id}`, updates).pipe(
      tap((updated) => {
        const employees = this.employeesSubject.value.map(e => e.id === id ? updated : e);
        this.employeesSubject.next(employees);
      })
    );
  }

  deleteEmployee(id: number): Observable<void> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete<void>(`${this.baseUrl}/deleteEmp`, { params }).pipe(
      tap(() => {
        this.employeesSubject.next(this.employeesSubject.value.filter(e => e.id !== id));
      })
    );
  }

  updateAdvance(id: number, advancePaid: number): Observable<Employee> {
    const params = new HttpParams()
      .set('id', id.toString())
      .set('advancePaid', advancePaid.toString());
    return this.http.patch<Employee>(`${this.baseUrl}/advancePaid`, null, { params }).pipe(
      tap((updated) => {
        const employees = this.employeesSubject.value.map(e => e.id === id ? updated : e);
        this.employeesSubject.next(employees);
      })
    );
  }

  refreshEmployees(): void {
    this.loadEmployees();
  }

  private buildEmployeeParams(employee: Employee): HttpParams {
    let params = new HttpParams()
      .set('id', employee.id.toString())
      .set('name', employee.name)
      .set('isBonused', employee.isBonused.toString())
      .set('fabricType', employee.fabricType)
      .set('salary', employee.salary.toString())
      .set('bonusAmount', employee.bonusAmount.toString())
      .set('advanceAmount', employee.advanceAmount.toString())
      .set('advanceRemaining', employee.advanceRemaining.toString())
      .set('salaryType', employee.salaryType)
      .set('rate', employee.rate.toString())
      .set('clothDoneInMeter', employee.clothDoneInMeter.toString());
    return params;
  }
}

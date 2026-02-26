import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface ExpenditureId {
  date: string;
  expenseType: string;
}

export interface Expenditure {
  id: ExpenditureId;
  amount: number;
  note: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenditureService {
  private readonly baseUrl = `${environment.apiUrl}/expenditure`;

  private expendituresSubject = new BehaviorSubject<Expenditure[]>([]);
  public expenditures$: Observable<Expenditure[]> = this.expendituresSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadExpenditures();
  }

  loadExpenditures(): void {
    this.http.get<Expenditure[]>(`${this.baseUrl}/getAllExpenditure`).subscribe({
      next: (expenditures) => this.expendituresSubject.next(expenditures),
      error: () => {}
    });
  }

  saveExpenditure(expenditure: Expenditure): Observable<Expenditure> {
    return this.http.post<Expenditure>(`${this.baseUrl}/save`, expenditure).pipe(
      tap((saved) => {
        if (saved) {
          this.expendituresSubject.next([...this.expendituresSubject.value, saved]);
        } else {
          this.loadExpenditures();
        }
      })
    );
  }

  deleteExpenditure(date: string, expenseType: string): Observable<void> {
    const params = new HttpParams()
      .set('date', date)
      .set('expenseType', expenseType);
    return this.http.delete<void>(`${this.baseUrl}/delete`, { params }).pipe(
      tap(() => {
        this.expendituresSubject.next(
          this.expendituresSubject.value.filter(
            e => !(e.id.date === date && e.id.expenseType === expenseType)
          )
        );
      })
    );
  }

  getAllExpenditures(): Observable<Expenditure[]> {
    return this.expenditures$;
  }
}

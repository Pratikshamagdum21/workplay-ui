import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  saveExpenditure(expenditure: Expenditure): Observable<Expenditure> {
    return this.http.post<Expenditure>(`${this.baseUrl}/save`, expenditure);
  }

  getAllExpenditures(): Observable<Expenditure[]> {
    return this.http.get<Expenditure[]>(`${this.baseUrl}/getAllExpenditure`);
  }
}

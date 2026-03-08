import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { BranchService } from './branch.service';

export interface ExpenditureId {
  date: string;
  expenseType: string;
}

export interface Expenditure {
  date: string;
  expenseType: string;
  amount: number;
  id?:string;
  branchId?:number;
  note: string;
  receiptIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ExpenditureService {
  private readonly baseUrl = `${environment.apiUrl}/expenditure`;

  private expendituresSubject = new BehaviorSubject<Expenditure[]>([]);
  public expenditures$: Observable<Expenditure[]> = this.expendituresSubject.asObservable();

  constructor(private http: HttpClient,private branchService: BranchService,) {
     this.branchService.getSelectedBranch().subscribe(branch => {
      this.loadExpenditures(branch.id);
    });
  }

  loadExpenditures(branchId?: number): void {
    let params = new HttpParams();
        if (branchId != null) {
          params = params.set('branchId', branchId.toString());
        }
    this.http.get<Expenditure[]>(`${this.baseUrl}/getAllExpenditure`, { params }).subscribe({
      next: (expenditures) => this.expendituresSubject.next(expenditures),
      error: () => {}
    });
  }

  saveExpenditure(expenditure: Expenditure, images?: File[] | null): Observable<Expenditure> {
    if (images && images.length > 0) {
      const formData = new FormData();
      formData.append('expenditure', new Blob([JSON.stringify(expenditure)], { type: 'application/json' }));
      for (const file of images) {
        formData.append('image', file, file.name);
      }
      return this.http.post<Expenditure>(`${this.baseUrl}/save`, formData).pipe(
        tap((saved) => {
          if (saved) {
            this.expendituresSubject.next([...this.expendituresSubject.value, saved]);
          } else {
            this.loadExpenditures();
          }
        })
      );
    }

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

  updateExpenditure(id: string, expenditure: Expenditure, images?: File[] | null, existingReceiptIds?: string[]): Observable<Expenditure> {
    const hasNewImages = images && images.length > 0;
    const hasExistingReceipts = existingReceiptIds && existingReceiptIds.length > 0;

    if (hasNewImages || hasExistingReceipts) {
      const formData = new FormData();
      formData.append('expenditure', new Blob([JSON.stringify(expenditure)], { type: 'application/json' }));
      if (hasNewImages) {
        for (const file of images) {
          formData.append('image', file, file.name);
        }
      }
      if (hasExistingReceipts) {
        for (const receiptId of existingReceiptIds) {
          formData.append('existingReceiptIds', receiptId);
        }
      }
      return this.http.put<Expenditure>(`${this.baseUrl}/update/${id}`, formData).pipe(
        tap((updated) => {
          const list = this.expendituresSubject.value.map(e => e.id === id ? updated : e);
          this.expendituresSubject.next(list);
        })
      );
    }

    return this.http.put<Expenditure>(`${this.baseUrl}/update/${id}`, expenditure).pipe(
      tap((updated) => {
        const list = this.expendituresSubject.value.map(e => e.id === id ? updated : e);
        this.expendituresSubject.next(list);
      })
    );
  }

 deleteExpenditure(id: string, expenseType: string): Observable<string> {
  const params = new HttpParams()
    .set('id', id)
    .set('expenseType', expenseType);

  return this.http.delete<string>(`${this.baseUrl}/delete`, {
    params,
    responseType: 'text' as 'json' 
  }).pipe(
    tap(() => {
      this.expendituresSubject.next(
        this.expendituresSubject.value.filter(
          e => !(e.id === id && e.expenseType === expenseType)
        )
      );
    })
  );
}

  getReceiptImageUrl(receiptId: string): string {
    return `${this.baseUrl}/receipt/${receiptId}`;
  }

  getAllExpenditures(): Observable<Expenditure[]> {
    return this.expenditures$;
  }
}

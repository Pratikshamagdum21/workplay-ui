import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Invoice } from '../app/landing-page/invoice/model/invoice.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly baseUrl = `${environment.apiUrl}/invoices`;

  private invoicesSubject = new BehaviorSubject<Invoice[]>([]);
  public invoices$: Observable<Invoice[]> = this.invoicesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInvoices();
  }

  private loadInvoices(): void {
    this.http.get<Invoice[]>(this.baseUrl).subscribe({
      next: (invoices) => this.invoicesSubject.next(invoices),
      error: () => {}
    });
  }

  getInvoices(): Observable<Invoice[]> {
    return this.invoices$;
  }

  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Observable<Invoice> {
    return this.http.post<Invoice>(this.baseUrl, invoice).pipe(
      tap((saved) => {
        if (saved) {
          this.invoicesSubject.next([saved, ...this.invoicesSubject.value]);
        }
      })
    );
  }

  deleteInvoice(invoiceId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${invoiceId}`).pipe(
      tap(() => {
        this.invoicesSubject.next(
          this.invoicesSubject.value.filter(inv => inv.id !== invoiceId)
        );
      })
    );
  }

  downloadInvoice(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${invoiceId}/download`, {
      responseType: 'blob'
    });
  }

  downloadBulkInvoices(invoiceIds: number[]): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/download-bulk`, { invoiceIds }, {
      responseType: 'blob'
    });
  }

  refreshInvoices(): void {
    this.loadInvoices();
  }
}

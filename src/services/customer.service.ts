import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Customer } from '../app/landing-page/invoice/model/invoice.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly baseUrl = `${environment.apiUrl}/customers`;

  private customersSubject = new BehaviorSubject<Customer[]>([]);
  public customers$: Observable<Customer[]> = this.customersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.http.get<Customer[]>(this.baseUrl).subscribe({
      next: (customers) => this.customersSubject.next(customers),
      error: () => {}
    });
  }

  getCustomers(): Observable<Customer[]> {
    return this.customers$;
  }

  addCustomer(customer: Omit<Customer, 'id'>): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, customer).pipe(
      tap((saved) => {
        if (saved) {
          this.customersSubject.next([...this.customersSubject.value, saved]);
        }
      })
    );
  }

  refreshCustomers(): void {
    this.loadCustomers();
  }
}

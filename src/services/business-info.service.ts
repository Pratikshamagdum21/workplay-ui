import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { BusinessInfo } from '../app/landing-page/invoice/model/invoice.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessInfoService {
  private readonly baseUrl = `${environment.apiUrl}/business-info`;

  private businessInfoSubject = new BehaviorSubject<BusinessInfo | null>(null);
  public businessInfo$: Observable<BusinessInfo | null> = this.businessInfoSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadBusinessInfo();
  }

  private loadBusinessInfo(): void {
    this.http.get<BusinessInfo>(this.baseUrl).subscribe({
      next: (info) => this.businessInfoSubject.next(info),
      error: () => {}
    });
  }

  getBusinessInfo(): Observable<BusinessInfo | null> {
    return this.businessInfo$;
  }

  getBusinessInfoSnapshot(): BusinessInfo | null {
    return this.businessInfoSubject.value;
  }

  saveBusinessInfo(info: BusinessInfo): Observable<BusinessInfo> {
    return this.http.post<BusinessInfo>(this.baseUrl, info).pipe(
      tap((saved) => this.businessInfoSubject.next(saved))
    );
  }

  updateBusinessInfo(info: BusinessInfo): Observable<BusinessInfo> {
    return this.http.put<BusinessInfo>(`${this.baseUrl}/${info.id}`, info).pipe(
      tap((updated) => this.businessInfoSubject.next(updated))
    );
  }

  refreshBusinessInfo(): void {
    this.loadBusinessInfo();
  }
}

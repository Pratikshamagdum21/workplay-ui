import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { FabricQuality } from '../app/landing-page/invoice/model/invoice.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FabricQualityService {
  private readonly baseUrl = `${environment.apiUrl}/fabric-qualities`;

  private qualitiesSubject = new BehaviorSubject<FabricQuality[]>([]);
  public qualities$: Observable<FabricQuality[]> = this.qualitiesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadQualities();
  }

  private loadQualities(): void {
    this.http.get<FabricQuality[]>(this.baseUrl).subscribe({
      next: (qualities) => this.qualitiesSubject.next(qualities),
      error: () => {}
    });
  }

  getQualities(): Observable<FabricQuality[]> {
    return this.qualities$;
  }

  addQuality(quality: Omit<FabricQuality, 'id'>): Observable<FabricQuality> {
    return this.http.post<FabricQuality>(this.baseUrl, quality).pipe(
      tap((saved) => {
        if (saved) {
          this.qualitiesSubject.next([...this.qualitiesSubject.value, saved]);
        }
      })
    );
  }

  refreshQualities(): void {
    this.loadQualities();
  }
}

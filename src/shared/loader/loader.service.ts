import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private activeRequests = 0;
  private loading$ = new BehaviorSubject<boolean>(false);

  readonly isLoading$ = this.loading$.asObservable();

  show(): void {
    this.activeRequests++;
    this.loading$.next(true);
  }

  hide(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      this.loading$.next(false);
    }
  }
}

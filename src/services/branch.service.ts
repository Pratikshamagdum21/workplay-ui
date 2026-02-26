import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface Branch {
  id: number;
  name: string;
  code: string;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private readonly baseUrl = `${environment.apiUrl}/branch`;

  private readonly fallbackBranches: Branch[] = [
    { id: 1, name: 'Main Branch', code: 'MB-001', location: 'Main' },
    { id: 2, name: 'North Branch', code: 'NB-002', location: 'North' },
    { id: 3, name: 'South Branch', code: 'SB-003', location: 'South' },
    { id: 4, name: 'West Branch', code: 'WB-004', location: 'West' },
    { id: 5, name: 'East Branch', code: 'EB-005', location: 'East' }
  ];

  private branchesSubject = new BehaviorSubject<Branch[]>(this.fallbackBranches);
  public branches$: Observable<Branch[]> = this.branchesSubject.asObservable();

  private selectedBranchSubject = new BehaviorSubject<Branch>(this.fallbackBranches[0]);
  public selectedBranch$: Observable<Branch> = this.selectedBranchSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadBranches();
  }

  private loadBranches(): void {
    this.http.get<Branch[]>(`${this.baseUrl}/getAllBranches`).subscribe({
      next: (branches) => {
        if (branches && branches.length > 0) {
          this.branchesSubject.next(branches);
          // Keep the first branch as default if no branch was already selected
          const current = this.selectedBranchSubject.value;
          const stillExists = branches.find(b => b.id === current.id);
          if (!stillExists) {
            this.selectedBranchSubject.next(branches[0]);
          }
        }
      },
      error: () => {
        // Use fallback branches — already set in BehaviorSubject constructor
      }
    });
  }

  getBranches(): Observable<Branch[]> {
    return this.branches$;
  }

  getSelectedBranch(): Observable<Branch> {
    return this.selectedBranch$;
  }

  getSelectedBranchSnapshot(): Branch {
    return this.selectedBranchSubject.value;
  }

  setSelectedBranch(branch: Branch): void {
    this.selectedBranchSubject.next(branch);
  }
}

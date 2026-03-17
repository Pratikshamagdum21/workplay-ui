import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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
    { id: 1, name: 'Unit 1', code: 'MB-001', location: 'Main' },
    { id: 2, name: 'Unit 2', code: 'NB-002', location: 'North' },
    { id: 3, name: 'Unit 3', code: 'SB-003', location: 'South' },
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
          // Update selected branch reference to match the new branch list
          const current = this.selectedBranchSubject.value;
          const stillExists = branches.find(b => b.id === current.id);
          this.selectedBranchSubject.next(stillExists || branches[0]);
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

  clearAllData(): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/clearAllData`);
  }
}

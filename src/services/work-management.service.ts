import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { WorkEntry, WorkType, Shift } from '../app/landing-page/daily-work-mangement/model/work-entry.model';
import { environment } from '../environments/environment';
import { BranchService } from './branch.service';
import { EmployeeService } from './employee.service';

@Injectable({
  providedIn: 'root'
})
export class WorkManagementService {
  private readonly baseUrl = `${environment.apiUrl}/work`;

  private workEntriesSubject = new BehaviorSubject<WorkEntry[]>([]);
  public workEntries$: Observable<WorkEntry[]> = this.workEntriesSubject.asObservable();

  private readonly workTypes: WorkType[] = [
    { id: '1', name: 'Stitching' },
    { id: '2', name: 'Cutting' },
    { id: '3', name: 'Packing' },
    { id: '4', name: 'Finishing' },
    { id: '5', name: 'Checking' }
  ];

  private readonly shifts: Shift[] = [
    { id: '1', name: 'Morning', timeRange: '6:00 AM - 2:00 PM' },
    { id: '2', name: 'Afternoon', timeRange: '2:00 PM - 10:00 PM' },
    { id: '3', name: 'Night', timeRange: '10:00 PM - 6:00 AM' }
  ];

  constructor(
    private http: HttpClient,
    private branchService: BranchService,
    private employeeService: EmployeeService
  ) {
    // Reload work entries whenever selected branch changes
    this.branchService.getSelectedBranch().subscribe(branch => {
      this.loadEntries(branch.id);
    });
  }

  private loadEntries(branchId?: number): void {
    let params = new HttpParams();
    if (branchId != null) {
      params = params.set('branchId', branchId.toString());
    }
    this.http.get<WorkEntry[]>(`${this.baseUrl}/getAllWork`, { params }).subscribe({
      next: (entries) => {
        const sorted = this.sortByDateDesc(entries.map(e => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt)
        })));
        this.workEntriesSubject.next(sorted);
      },
      error: () => {
        // Keep the current entries on error
      }
    });
  }

  // Expose employee list from EmployeeService so AddWorkForm doesn't need hardcoded names
  getEmployeeNames(): Observable<{ id: string; name: string }[]> {
    return new Observable(observer => {
      this.employeeService.getEmployees().subscribe(employees => {
        observer.next(employees.map(e => ({ id: e.id.toString(), name: e.name })));
      });
    });
  }

  getWorkTypes(): WorkType[] {
    return [...this.workTypes];
  }

  getShifts(): Shift[] {
    return [...this.shifts];
  }

  addEntry(entry: Omit<WorkEntry, 'id' | 'createdAt'>): Observable<WorkEntry> {
    const branchId = this.branchService.getSelectedBranchSnapshot().id;
    const payload = { ...entry, branchId, date: entry.date };
    return this.http.post<WorkEntry>(`${this.baseUrl}/saveWork`, payload).pipe(
      tap((saved) => {
        if (saved) {
          const newEntry: WorkEntry = {
            ...saved,
            date: new Date(saved.date),
            createdAt: new Date(saved.createdAt)
          };
          const current = this.workEntriesSubject.value;
          this.workEntriesSubject.next(this.sortByDateDesc([newEntry, ...current]));
        }
      })
    );
  }

  getEntries(): Observable<WorkEntry[]> {
    return this.workEntries$;
  }

  getAllEntries(): WorkEntry[] {
    return this.workEntriesSubject.value;
  }

  refreshEntries(): void {
    const branch = this.branchService.getSelectedBranchSnapshot();
    this.loadEntries(branch.id);
  }

  filterEntries(fromDate: Date | null, toDate: Date | null): WorkEntry[] {
    const allEntries = this.workEntriesSubject.value;

    if (!fromDate && !toDate) {
      return allEntries;
    }

    return allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      if (fromDate && toDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        return entryDate >= from && entryDate <= to;
      } else if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        return entryDate >= from;
      } else if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        return entryDate <= to;
      }

      return true;
    });
  }

  private sortByDateDesc(entries: WorkEntry[]): WorkEntry[] {
    return entries.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}

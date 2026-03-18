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
    { id: '1', name: 'Diwanji' },
    { id: '2', name: 'Weaver' },
    { id: '3', name: 'Jober' },
    { id: '4', name: 'Kandi' },
    { id: '5', name: 'Mending' }
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
          endDate: e.endDate ? new Date(e.endDate) : undefined,
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

   getEmployees(): Observable<any[]> {
      return this.employeeService.getEmployees();
    }
  

  getWorkTypes(): WorkType[] {
    return [...this.workTypes];
  }

  getShifts(): Shift[] {
    return [...this.shifts];
  }

  addEntry(entry: Omit<WorkEntry, 'id' | 'createdAt'>): Observable<WorkEntry> {
    const branchId = this.branchService.getSelectedBranchSnapshot().id;
    const date = entry.date instanceof Date
      ? entry.date.toLocaleDateString('en-CA')
      : entry.date;
    const endDate = entry.endDate
      ? (entry.endDate instanceof Date ? entry.endDate.toLocaleDateString('en-CA') : entry.endDate)
      : undefined;
    const payload = { ...entry, branchId, date, ...(endDate && { endDate }) };
    return this.http.post<WorkEntry>(`${this.baseUrl}/saveWork`, payload).pipe(
      tap((saved) => {
        if (saved) {
          const newEntry: WorkEntry = {
            ...saved,
            date: new Date(saved.date),
            endDate: saved.endDate ? new Date(saved.endDate) : undefined,
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

  updateEntry(id: string, entry: Omit<WorkEntry, 'id' | 'createdAt'>): Observable<WorkEntry> {
    const branchId = this.branchService.getSelectedBranchSnapshot().id;
    const date = entry.date instanceof Date
      ? entry.date.toLocaleDateString('en-CA')
      : entry.date;
    const endDate = entry.endDate
      ? (entry.endDate instanceof Date ? entry.endDate.toLocaleDateString('en-CA') : entry.endDate)
      : undefined;
    const payload = { ...entry, branchId, date, ...(endDate && { endDate }) };
    return this.http.put<WorkEntry>(`${this.baseUrl}/updateWork/${id}`, payload).pipe(
      tap((saved) => {
        if (saved) {
          const updatedEntry: WorkEntry = {
            ...saved,
            date: new Date(saved.date),
            endDate: saved.endDate ? new Date(saved.endDate) : undefined,
            createdAt: new Date(saved.createdAt)
          };
          const current = this.workEntriesSubject.value.map(e =>
            e.id === id ? updatedEntry : e
          );
          this.workEntriesSubject.next(this.sortByDateDesc(current));
        }
      })
    );
  }

  deleteEntry(id: string): Observable<string> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete<string>(`${this.baseUrl}/deleteWork`, { 
      params,
      responseType: 'text' as 'json'
    }).pipe(
      tap(() => {
        this.workEntriesSubject.next(this.workEntriesSubject.value.filter(e => e.id !== id));
      })
    );
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
      const entryStart = new Date(entry.date);
      entryStart.setHours(0, 0, 0, 0);
      const entryEnd = entry.endDate ? new Date(entry.endDate) : new Date(entry.date);
      entryEnd.setHours(23, 59, 59, 999);

      if (fromDate && toDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        // Two ranges overlap iff start1 <= end2 AND end1 >= start2
        return entryStart <= to && entryEnd >= from;
      } else if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        return entryEnd >= from;
      } else if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        return entryStart <= to;
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

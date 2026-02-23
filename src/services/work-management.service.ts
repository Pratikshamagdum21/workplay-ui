import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkEntry, Employee, WorkType, Shift } from '../app/landing-page/daily-work-mangement/model/work-entry.model';

@Injectable({
    providedIn: 'root'
})
export class WorkManagementService {
    private workEntriesSubject = new BehaviorSubject<WorkEntry[]>([]);
    public workEntries$: Observable<WorkEntry[]> = this.workEntriesSubject.asObservable();

    // Dummy master data
    private employees: Employee[] = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' },
        { id: '3', name: 'Mike Johnson' },
        { id: '4', name: 'Sarah Williams' },
        { id: '5', name: 'David Brown' },
        { id: '6', name: 'Emily Davis' },
        { id: '7', name: 'Robert Miller' },
        { id: '8', name: 'Lisa Anderson' },
        { id: '9', name: 'James Wilson' },
        { id: '10', name: 'Maria Garcia' }
    ];

    private workTypes: WorkType[] = [
        { id: '1', name: 'Stitching' },
        { id: '2', name: 'Cutting' },
        { id: '3', name: 'Packing' },
        { id: '4', name: 'Finishing' },
        { id: '5', name: 'Checking' }
    ];

    private shifts: Shift[] = [
        { id: '1', name: 'Morning', timeRange: '6:00 AM - 2:00 PM' },
        { id: '2', name: 'Afternoon', timeRange: '2:00 PM - 10:00 PM' },
        { id: '3', name: 'Night', timeRange: '10:00 PM - 6:00 AM' }
    ];

    constructor() {
        this.initializeDummyData();
    }

    private initializeDummyData(): void {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const dummyEntries: WorkEntry[] = [
            {
                id: this.generateId(),
                employeeName: 'John Doe',
                employeeType: 'Stitching',
                shift: 'Morning',
                fabricMeters: 150,
                date: today,
                createdAt: today
            },
            {
                id: this.generateId(),
                employeeName: 'Jane Smith',
                employeeType: 'Cutting',
                shift: 'Afternoon',
                fabricMeters: 200,
                date: yesterday,
                createdAt: yesterday
            },
            {
                id: this.generateId(),
                employeeName: 'Mike Johnson',
                employeeType: 'Packing',
                shift: 'Night',
                fabricMeters: 180,
                date: twoDaysAgo,
                createdAt: twoDaysAgo
            },
            {
                id: this.generateId(),
                employeeName: 'Sarah Williams',
                employeeType: 'Finishing',
                shift: 'Morning',
                fabricMeters: 165,
                date: today,
                createdAt: today
            }
        ];

        this.workEntriesSubject.next(this.sortByDateDesc(dummyEntries));
    }

    // Master data getters
    getEmployees(): Employee[] {
        return [...this.employees];
    }

    getWorkTypes(): WorkType[] {
        return [...this.workTypes];
    }

    getShifts(): Shift[] {
        return [...this.shifts];
    }

    // CRUD operations
    addEntry(entry: Omit<WorkEntry, 'id' | 'createdAt'>): void {
        const newEntry: WorkEntry = {
            ...entry,
            id: this.generateId(),
            createdAt: new Date()
        };

        const currentEntries = this.workEntriesSubject.value;
        const updatedEntries = [newEntry, ...currentEntries];
        this.workEntriesSubject.next(this.sortByDateDesc(updatedEntries));
    }

    getEntries(): Observable<WorkEntry[]> {
        return this.workEntries$;
    }

    getAllEntries(): WorkEntry[] {
        return this.workEntriesSubject.value;
    }

    // Filter methods
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

    // Utility methods
    private sortByDateDesc(entries: WorkEntry[]): WorkEntry[] {
        return entries.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

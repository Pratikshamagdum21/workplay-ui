export interface WorkEntry {
    id: string;
    employeeName: string;
    employeeType: string;
    fabricMeters: number;
    date: Date;
    createdAt: Date;
}

export interface Employee {
    id: string;
    name: string;
}

export interface WorkType {
    id: string;
    name: string;
}

export interface Shift {
    id: string;
    name: string;
    timeRange: string;
}

export interface DateFilter {
    fromDate: Date | null;
    toDate: Date | null;
}

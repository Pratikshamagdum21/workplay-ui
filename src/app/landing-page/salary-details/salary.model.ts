
export interface DailyMeter {
  date: string;
  meter: number;
  isLeave: boolean;
  leaveDeduction: number;
  note?: string;
}

export interface WeeklySalaryPayload {
  id?: number;
  employeeId: number;
  employeeName?: string;
  type: 'weekly';
  meterDetails: DailyMeter[];
  ratePerMeter: number;
  totalMeters: number;
  baseSalary: number;
  bonus: number;
  leaveDeductionTotal: number;
  advanceTakenTotal: number;
  advanceDeductedThisTime: number;
  advanceRemaining: number;
  finalPay: number;
  createdAt: Date;
}

export interface MonthlySalaryPayload {
  id?: number;
  employeeId: number;
  employeeName?: string;
  type: 'monthly';
  salary: number;
  leaveDays: number;
  leaveDeductionPerDay: number;
  leaveDeductionTotal: number;
  bonus: number;
  advanceTakenTotal: number;
  advanceDeductedThisTime: number;
  advanceRemaining: number;
  finalPay: number;
  createdAt: Date;
}

export type SalaryPayload = WeeklySalaryPayload | MonthlySalaryPayload;

export interface WeekRange {
  startDate: Date;
  endDate: Date;
}

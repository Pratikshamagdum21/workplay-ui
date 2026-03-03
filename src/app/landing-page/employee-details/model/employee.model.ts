export interface Employee {
  id: number;
  name: string;
  isBonused: boolean;
  fabricType: string;
  salary: number;
  bonusAmount: number;
  advanceAmount: number;
  advanceRemaining: number;
  salaryType: 'WEEKLY' | 'MONTHLY' | 'WEEKLY_F';
  rate: number;
  workType:string;
  advanceTaken: number;
  bonusEligible: boolean;
  clothDoneInMeter: number;
  branchId?: number;
}

export interface FabricType {
  id: string;
  name: string;
}

export interface BonusOption {
  label: string;
  value: boolean;
}

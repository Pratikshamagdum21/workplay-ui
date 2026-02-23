export interface Employee {
  id: number;
  name: string;
  isBonused: boolean;
  fabricType: string;
  salary: number;
  bonusAmount: number;
  advanceAmount: number;
  advanceRemaining: number;
  salaryType: 'WEEKLY' | 'MONTHLY';
  rate: number;
  advanceTaken: number;
  bonusEligible: boolean;
  clothDoneInMeter: number;
}

export interface FabricType {
  id: string;
  name: string;
}

export interface BonusOption {
  label: string;
  value: boolean;
}

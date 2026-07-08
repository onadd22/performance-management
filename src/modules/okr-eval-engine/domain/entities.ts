export type OkrType = "committed" | "aspirational";

export type KrStatus = "High Performance" | "Performance" | "Target" | "Under Performance";

export type ObjectiveStatus = "High Performance" | "Performance" | "Under Performance";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface Quarter {
  id: string; // e.g., "Q1 2026"
  startDate: string; // e.g., "2026-01-01"
  endDate: string; // e.g., "2026-03-31"
}

export interface KeyResultEntity {
  id: string;
  objectiveId: string;
  title: string;
  okrType: OkrType;
  score: number; // decimal between 0.00 and 1.00
  status: KrStatus;
}

export interface ObjectiveEntity {
  id: string;
  employeeId?: string;
  quarterId: string;
  title: string;
  keyResults: KeyResultEntity[];
  score: number; // calculated as (Count of High Performance KRs) / (Total KRs)
  status: ObjectiveStatus;
  highPerformanceCount: number;
  totalKRsCount: number;
}

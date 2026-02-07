// Grade types
export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D+' | 'D' | 'F' | 'S' | 'U' | 'P' | 'Pass' | 'Fail' | 'EX' | 'TC' | 'IP' | 'LOA' | null;

export type ModuleType = 'Core' | 'BDE' | 'ICC-Core' | 'ICC-Professional Series' | 'ICC-CSL' | 'FYP' | 'Mathematics PE' | 'Physics PE' | 'UE' | 'Other';

export type ModuleStatus = 'Not Started' | 'In Progress' | 'Completed';

// Module interface
export interface Module {
  id: string;
  code: string;
  name: string;
  au: number;
  grade: Grade;
  type: ModuleType;
  status: ModuleStatus;
  year: number; // 1 to 4
  semester: number; // 1 or 2
  prerequisiteCodes: string[];
  // Extended fields
  expectedGrade?: Grade; // For predictions
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Legacy app state (for migration)
export interface LegacyAppState {
  modules: Module[];
  schemaVersion: number;
}

// Goal Setting Types
export interface GoalSettings {
  targetCGPA: number;
  semesterGoals: Record<string, number>; // "Y1S1" -> 4.5
  graduationTarget?: number;
  notifications: boolean;
  warningThreshold?: number; // Alert when X% behind goal
}

export interface GoalProgress {
  current: number;
  target: number;
  difference: number;
  status: 'on-track' | 'at-risk' | 'critical' | 'achieved';
  projectedFinal: number;
  requiredGPA: number; // GPA needed in remaining semesters
}

// Analytics Types
export interface AnalyticsSnapshot {
  id: string;
  timestamp: string;
  cgpa: number;
  totalAU: number;
  moduleCount: number;
  gradeDistribution: Record<string, number>;
}

export interface SemesterStats {
  year: number;
  semester: number;
  gpa: number;
  projectedGpa: number;
  totalAU: number;
  moduleCount: number;
  gradeDistribution: Record<string, number>;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  projected?: number;
}

// Prediction Types
export interface WhatIfScenario {
  id: string;
  name: string;
  moduleChanges: Array<{
    moduleId: string;
    newGrade: Grade;
  }>;
  resultingGPA: number;
}

export interface GradeRequirement {
  moduleId: string;
  moduleCode: string;
  requiredGrade: Grade;
  currentGrade: Grade | null;
  impact: number; // GPA impact
}

// Timetable Types
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type ClassType = 'Lecture' | 'Tutorial' | 'Lab' | 'Seminar' | 'Other';

export interface TimetableEntry {
  id: string;
  moduleCode: string;
  moduleName: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM" format
  endTime: string;   // "HH:MM" format
  venue: string;
  classType: ClassType;
  color?: string;
  notes?: string;
}

export interface Timetable {
  year: number;
  semester: number;
  entries: TimetableEntry[];
}

// Course Planner Types
export interface PlannedModule {
  id: string;
  code: string;
  name: string;
  au: number;
  type: ModuleType;
  year: number;
  semester: number;
  prerequisiteCodes: string[];
}

// Export/Import Types
export interface ExportData {
  version: number;
  exportDate: string;
  modules: Module[];
  goals: GoalSettings;
  timetables: Timetable[];
  plannedModules: PlannedModule[];
  targetAU: number;
  snapshots: AnalyticsSnapshot[];
}

// View/Navigation Types
export type ViewType = 'dashboard' | 'modules' | 'analytics' | 'goals' | 'predictions' | 'planner' | 'timetable' | 'settings';

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

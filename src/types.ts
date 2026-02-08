// Grade types
export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D+' | 'D' | 'F' | 'S' | 'U' | 'P' | 'Fail' | 'EX' | 'TC' | 'IP' | 'LOA' | null;

export type ModuleType = 'Core' | 'BDE' | 'ICC-Core' | 'ICC-Professional Series' | 'ICC-CSL' | 'FYP' | 'Mathematics PE' | 'Physics PE' | 'UE' | 'Other';

export const MODULE_TYPES: ModuleType[] = [
  'Core', 'BDE', 'ICC-Core', 'ICC-Professional Series', 'ICC-CSL',
  'FYP', 'Mathematics PE', 'Physics PE', 'UE', 'Other',
];

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
  projectedGrade?: Grade | null; // For projected GPA (non-completed modules)
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
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type ClassType = 'Lecture' | 'Tutorial' | 'Lab' | 'Seminar' | 'Other';
export type ExamType = 'Midterm' | 'Final' | 'Quiz' | 'Other';
export type WeekType = 'teaching' | 'recess' | 'exam';

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
  // Recurrence fields
  recurring: boolean;            // true = weekly recurring, false = one-off event
  weeks?: number[];              // which teaching weeks (1–13) this recurs on; undefined = all 13
  includeRecessWeek?: boolean;   // whether to also occur during recess week (default false)
  specificDate?: string;         // ISO date for one-off events (only used when recurring = false)
}

export interface Examination {
  id: string;
  moduleCode: string;
  moduleName: string;
  examType: ExamType;
  date: string;        // ISO date "YYYY-MM-DD"
  startTime: string;   // "HH:MM" format
  endTime: string;     // "HH:MM" format
  duration: number;    // duration in minutes
  venue: string;
  notes?: string;
  color?: string;
}

export interface AcademicCalendar {
  year: number;        // 1–4
  semester: number;    // 1–2
  startDate: string;   // ISO date of Week 1 Monday
  endDate?: string;    // ISO date of last day of exam period (auto-calculated if unset)
}

export interface AcademicWeek {
  weekNumber: number;    // 1–18 sequentially
  displayLabel: string;  // "Week 1", "Recess Week", "Exam Week 1", etc.
  weekType: WeekType;
  startDate: Date;
  endDate: Date;         // Sunday of that week
}

export interface Timetable {
  year: number;
  semester: number;
  entries: TimetableEntry[];
  examinations: Examination[];
  calendar?: AcademicCalendar;   // per-semester override; if absent, use defaults
}

// Workload Thresholds (customizable AU zones for analytics)
export interface WorkloadThresholds {
  idealMin: number;   // default 15
  idealMax: number;   // default 18
  warningMax: number; // default 21 — above this is "overload/red"
}

// Module type AU requirements for graduation readiness
export type ModuleTypeRequirements = Partial<Record<ModuleType, number>>;

// Dean's List manual overrides per year (true = confirmed, false = denied, absent = auto-detect)
export type DeanListOverrides = Record<number, boolean>;

// User profile for sidebar display
export interface UserProfile {
  visible: boolean;
  name: string;
  subtitle: string;
  avatarInitial: string;
  avatarColor: string; // gradient classes e.g. "from-primary-400 to-primary-600"
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
  workloadThresholds?: WorkloadThresholds;
  moduleTypeRequirements?: ModuleTypeRequirements;
  deanListOverrides?: DeanListOverrides;
  userProfile?: UserProfile;
}

// View/Navigation Types
export type ViewType = 'dashboard' | 'modules' | 'analytics' | 'goals' | 'predictions' | 'planner' | 'timetable' | 'settings';

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

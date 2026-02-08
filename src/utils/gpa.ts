import type { Module } from '../types';

export const GRADE_POINTS: Record<string, number> = {
  'A+': 5.0,
  'A': 5.0,
  'A-': 4.5,
  'B+': 4.0,
  'B': 3.5,
  'B-': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0,
};

export const EXCLUDED_GRADES = ['S', 'U', 'P', 'Pass', 'Fail', 'EX', 'TC', 'IP', 'LOA'];

// Get the effective grade for projected GPA: actual grade for completed, projectedGrade for others
export const getProjectedGrade = (m: Module): string | null => {
  if (m.status === 'Completed') return m.grade;
  return m.projectedGrade ?? null;
};

// Calculate Points and AU for a given set of modules
const calculateRawStats = (modules: Module[], gradeResolver?: (m: Module) => string | null) => {
  let points = 0;
  let au = 0;

  modules.forEach(m => {
    const grade = gradeResolver ? gradeResolver(m) : m.grade;
    if (grade && grade !== '' && !EXCLUDED_GRADES.includes(grade) && GRADE_POINTS[grade] !== undefined) {
      points += GRADE_POINTS[grade] * m.au;
      au += m.au;
    }
  });

  return { points, au };
};

// Public composite calculator
export const calculateCompositeStats = (modules: Module[], filterYear?: number, filterSem?: number) => {
  // 1. Filter Scope (All, Year, or Semester)
  let scopeModules = modules;
  if (filterYear) {
    scopeModules = scopeModules.filter(m => m.year === filterYear);
    if (filterSem) {
      scopeModules = scopeModules.filter(m => m.semester === filterSem);
    }
  }

  // 2. Derive Sets
  // Official: Status 'Completed'
  const officialModules = scopeModules.filter(m => m.status === 'Completed');
  
  // Projected:
  // - Completed (uses actual grade)
  // - OR In Progress / Not Started (with projectedGrade)
  const projectedModules = scopeModules.filter(m =>
    m.status === 'Completed' ||
    ((m.status === 'In Progress' || m.status === 'Not Started') && m.projectedGrade)
  );

  // Taken Load: Completed + In Progress
  const takenModules = scopeModules.filter(m => 
    m.status === 'Completed' || m.status === 'In Progress'
  );

  // 3. Calculate GPAs
  const officialRaw = calculateRawStats(officialModules);
  const projectedRaw = calculateRawStats(projectedModules, getProjectedGrade);

  // 4. Calculate AU Totals
  const takenAU = takenModules.reduce((sum, m) => sum + m.au, 0);
  const totalExistingAU = scopeModules.reduce((sum, m) => sum + m.au, 0);

  return {
    official: {
      gpa: officialRaw.au === 0 ? 0 : parseFloat((officialRaw.points / officialRaw.au).toFixed(2)),
      au: officialRaw.au
    },
    projected: {
      gpa: projectedRaw.au === 0 ? 0 : parseFloat((projectedRaw.points / projectedRaw.au).toFixed(2)),
      au: projectedRaw.au
    },
    takenAU,
    totalExistingAU
  };
};

export const getClassification = (gpa: number) => {
  if (gpa >= 4.5) return 'First Class Honours';
  if (gpa >= 4.0) return 'Second Class Upper';
  if (gpa >= 3.5) return 'Second Class Lower';
  if (gpa >= 3.0) return 'Third Class';
  if (gpa >= 2.0) return 'Pass';
  return 'Academic Warning/Termination';
};

// Legacy support
export const calculateGPA = (modules: Module[], includeProjected: boolean = false) => {
  const stats = calculateCompositeStats(modules);
  return includeProjected ? { gpa: stats.projected.gpa, totalAU: stats.projected.au } : { gpa: stats.official.gpa, totalAU: stats.official.au };
};

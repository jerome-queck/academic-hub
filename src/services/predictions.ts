import type { Module, Grade, WhatIfScenario, GradeRequirement } from '../types';
import { calculateCompositeStats, GRADE_POINTS, EXCLUDED_GRADES } from '../utils/gpa';
import { generateId } from '../lib/utils';

/**
 * Calculate what grade is needed in a specific module to reach target GPA
 */
export function calculateRequiredGrade(
  modules: Module[],
  moduleId: string,
  targetGPA: number
): GradeRequirement | null {
  const module = modules.find(m => m.id === moduleId);
  if (!module) return null;

  // Get stats without this module
  const otherModules = modules.filter(
    m => m.id !== moduleId && m.status === 'Completed'
  );
  const stats = calculateCompositeStats(otherModules);

  const currentPoints = stats.official.gpa * stats.official.au;
  const totalAU = stats.official.au + module.au;
  const targetPoints = targetGPA * totalAU;
  const neededPoints = targetPoints - currentPoints;
  const neededGPA = neededPoints / module.au;

  // Find minimum grade that meets or exceeds needed GPA
  const gradeOrder = ['F', 'D', 'D+', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'] as const;
  let requiredGrade: Grade = 'A+';

  for (const grade of gradeOrder) {
    if (GRADE_POINTS[grade] >= neededGPA) {
      requiredGrade = grade;
      break;
    }
  }

  // Calculate impact
  const currentGradePoints = module.grade && GRADE_POINTS[module.grade] !== undefined
    ? GRADE_POINTS[module.grade]
    : 0;
  const requiredGradePoints = GRADE_POINTS[requiredGrade] ?? 5.0;
  const impact = (requiredGradePoints - currentGradePoints) * module.au;

  return {
    moduleId,
    moduleCode: module.code,
    requiredGrade,
    currentGrade: module.grade,
    impact: parseFloat(impact.toFixed(2)),
  };
}

/**
 * Calculate the average grade needed in remaining modules to reach target
 */
export function calculateRequiredAverageGrade(
  modules: Module[],
  targetGPA: number,
  remainingAU: number = 0
): { averageGPA: number; closestGrade: string; achievable: boolean } {
  const stats = calculateCompositeStats(modules);

  // If no remaining AU specified, estimate based on typical 130 total
  const TYPICAL_TOTAL_AU = 130;
  const actualRemainingAU = remainingAU || Math.max(0, TYPICAL_TOTAL_AU - stats.official.au);

  if (actualRemainingAU <= 0) {
    return {
      averageGPA: 0,
      closestGrade: '-',
      achievable: stats.official.gpa >= targetGPA,
    };
  }

  const currentPoints = stats.official.gpa * stats.official.au;
  const totalAU = stats.official.au + actualRemainingAU;
  const targetPoints = targetGPA * totalAU;
  const neededPoints = targetPoints - currentPoints;
  const neededGPA = neededPoints / actualRemainingAU;

  // Find closest grade
  const grades: Array<[string, number]> = Object.entries(GRADE_POINTS)
    .filter(([g]) => !EXCLUDED_GRADES.includes(g))
    .sort((a, b) => a[1] - b[1]);

  let closestGrade = 'A+';
  for (const [grade, points] of grades) {
    if (points >= neededGPA) {
      closestGrade = grade;
      break;
    }
  }

  return {
    averageGPA: parseFloat(neededGPA.toFixed(2)),
    closestGrade,
    achievable: neededGPA <= 5.0,
  };
}

/**
 * Calculate what-if scenario with grade changes
 */
export function calculateWhatIfScenario(
  modules: Module[],
  changes: Array<{ moduleId: string; newGrade: Grade }>
): WhatIfScenario {
  // Create a copy of modules with the grade changes
  const modifiedModules = modules.map(m => {
    const change = changes.find(c => c.moduleId === m.id);
    if (change) {
      return { ...m, grade: change.newGrade, status: 'Completed' as const };
    }
    return m;
  });

  const stats = calculateCompositeStats(modifiedModules);

  return {
    id: generateId(),
    name: `Scenario with ${changes.length} changes`,
    moduleChanges: changes,
    resultingGPA: stats.projected.gpa,
  };
}

/**
 * Project graduation GPA based on different scenarios
 */
export function projectGraduationGPA(
  modules: Module[],
  targetGPA: number
): {
  current: number;
  projected: number;
  best: number;
  worst: number;
  toTarget: { averageNeeded: number; achievable: boolean };
} {
  const stats = calculateCompositeStats(modules);
  const TYPICAL_TOTAL_AU = 130;

  const remainingAU = Math.max(0, TYPICAL_TOTAL_AU - stats.official.au);

  // Best case: All remaining modules get A+
  const bestPoints = stats.official.gpa * stats.official.au + 5.0 * remainingAU;
  const bestGPA = TYPICAL_TOTAL_AU > 0 ? bestPoints / TYPICAL_TOTAL_AU : 0;

  // Worst case: All remaining modules get F
  const worstPoints = stats.official.gpa * stats.official.au + 0 * remainingAU;
  const worstGPA = TYPICAL_TOTAL_AU > 0 ? worstPoints / TYPICAL_TOTAL_AU : 0;

  // Calculate what's needed for target
  const toTarget = calculateRequiredAverageGrade(modules, targetGPA, remainingAU);

  return {
    current: stats.official.gpa,
    projected: stats.projected.gpa,
    best: parseFloat(bestGPA.toFixed(2)),
    worst: parseFloat(worstGPA.toFixed(2)),
    toTarget: {
      averageNeeded: toTarget.averageGPA,
      achievable: toTarget.achievable,
    },
  };
}

/**
 * Get modules that can be improved (not completed or with grades that could be better)
 */
export function getImprovableModules(modules: Module[]): Module[] {
  return modules.filter(m => {
    // In progress modules
    if (m.status === 'In Progress') return true;
    // Not started with planned grade
    if (m.status === 'Not Started') return true;
    // Completed but not A+
    if (m.status === 'Completed' && m.grade && GRADE_POINTS[m.grade] < 5.0) {
      return true;
    }
    return false;
  });
}

/**
 * Calculate the GPA impact of changing a module's grade
 */
export function calculateGradeImpact(
  modules: Module[],
  moduleId: string,
  newGrade: Grade
): { oldGPA: number; newGPA: number; impact: number } {
  const module = modules.find(m => m.id === moduleId);
  if (!module) {
    return { oldGPA: 0, newGPA: 0, impact: 0 };
  }

  const currentStats = calculateCompositeStats(modules);
  const scenario = calculateWhatIfScenario(modules, [{ moduleId, newGrade }]);

  return {
    oldGPA: currentStats.projected.gpa,
    newGPA: scenario.resultingGPA,
    impact: parseFloat((scenario.resultingGPA - currentStats.projected.gpa).toFixed(3)),
  };
}

/**
 * Suggest optimal grades to reach target GPA
 */
export function suggestOptimalGrades(
  modules: Module[],
  targetGPA: number
): Array<{
  moduleId: string;
  moduleCode: string;
  currentGrade: Grade | null;
  suggestedGrade: Grade;
  impact: number;
}> {
  const improvable = getImprovableModules(modules);
  const suggestions: Array<{
    moduleId: string;
    moduleCode: string;
    currentGrade: Grade | null;
    suggestedGrade: Grade;
    impact: number;
  }> = [];

  // Sort by AU (higher AU = more impact)
  const sorted = [...improvable].sort((a, b) => b.au - a.au);

  for (const module of sorted) {
    const requirement = calculateRequiredGrade(modules, module.id, targetGPA);
    if (requirement) {
      suggestions.push({
        moduleId: module.id,
        moduleCode: module.code,
        currentGrade: module.grade,
        suggestedGrade: requirement.requiredGrade,
        impact: requirement.impact,
      });
    }
  }

  return suggestions;
}

import type { Module, GoalSettings, GoalProgress } from '../types';
import { calculateCompositeStats, GRADE_POINTS } from '../utils/gpa';

/**
 * Determine goal status based on current vs target GPA
 */
export function getGoalStatus(current: number, target: number): GoalProgress['status'] {
  if (current >= target) return 'achieved';
  if (current >= target * 0.95) return 'on-track';
  if (current >= target * 0.85) return 'at-risk';
  return 'critical';
}

/**
 * Calculate the GPA required in remaining modules to achieve target
 */
export function calculateRequiredGPA(
  currentGPA: number,
  currentAU: number,
  targetGPA: number,
  remainingAU: number
): number {
  if (remainingAU <= 0) return 0;

  const totalAU = currentAU + remainingAU;
  const totalPointsNeeded = targetGPA * totalAU;
  const currentPoints = currentGPA * currentAU;
  const remainingPointsNeeded = totalPointsNeeded - currentPoints;

  return remainingPointsNeeded / remainingAU;
}

/**
 * Calculate overall goal progress for CGPA target
 */
export function calculateGoalProgress(
  modules: Module[],
  goals: GoalSettings
): GoalProgress {
  const stats = calculateCompositeStats(modules);
  const current = stats.official.gpa;
  const target = goals.targetCGPA;

  // Calculate projected final based on current trajectory
  const projectedFinal = stats.projected.gpa;

  // Estimate remaining AU (assuming 130 total for typical NTU degree)
  const TYPICAL_TOTAL_AU = 130;
  const remainingAU = Math.max(0, TYPICAL_TOTAL_AU - stats.official.au);

  // Calculate required GPA for remaining modules
  const requiredGPA = calculateRequiredGPA(
    current,
    stats.official.au,
    target,
    remainingAU
  );

  return {
    current,
    target,
    difference: target - current,
    status: getGoalStatus(current, target),
    projectedFinal,
    requiredGPA: Math.min(5.0, Math.max(0, requiredGPA)), // Clamp to valid range
  };
}

/**
 * Calculate goal progress for a specific semester
 */
export function getSemesterGoalProgress(
  modules: Module[],
  goals: GoalSettings,
  year: number,
  semester: number
): GoalProgress {
  const semKey = `Y${year}S${semester}`;
  const semesterTarget = goals.semesterGoals[semKey] ?? goals.targetCGPA;

  const semesterModules = modules.filter(
    m => m.year === year && m.semester === semester
  );

  const stats = calculateCompositeStats(semesterModules);
  const current = stats.official.gpa;

  // For semester, calculate based on typical 15-20 AU per semester
  const TYPICAL_SEM_AU = 18;
  const remainingAU = Math.max(0, TYPICAL_SEM_AU - stats.official.au);

  const requiredGPA = calculateRequiredGPA(
    current,
    stats.official.au,
    semesterTarget,
    remainingAU
  );

  return {
    current,
    target: semesterTarget,
    difference: semesterTarget - current,
    status: getGoalStatus(current, semesterTarget),
    projectedFinal: stats.projected.gpa,
    requiredGPA: Math.min(5.0, Math.max(0, requiredGPA)),
  };
}

/**
 * Get all semester progress data for display
 */
export function getAllSemesterProgress(
  modules: Module[],
  goals: GoalSettings
): Array<{
  year: number;
  semester: number;
  label: string;
  progress: GoalProgress;
  moduleCount: number;
  totalAU: number;
}> {
  const results = [];

  for (let year = 1; year <= 4; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      const semModules = modules.filter(
        m => m.year === year && m.semester === semester
      );

      if (semModules.length > 0) {
        const stats = calculateCompositeStats(semModules);
        results.push({
          year,
          semester,
          label: `Y${year}S${semester}`,
          progress: getSemesterGoalProgress(modules, goals, year, semester),
          moduleCount: semModules.length,
          totalAU: stats.totalExistingAU,
        });
      }
    }
  }

  return results;
}

/**
 * Get the minimum grade needed in a specific module to reach target GPA
 */
export function getMinimumGradeForTarget(
  modules: Module[],
  moduleId: string,
  targetGPA: number
): { grade: string; achievable: boolean } | null {
  const module = modules.find(m => m.id === moduleId);
  if (!module) return null;

  // Get stats without this module
  const otherModules = modules.filter(m => m.id !== moduleId && m.status === 'Completed');
  const stats = calculateCompositeStats(otherModules);

  const currentPoints = stats.official.gpa * stats.official.au;
  const totalAU = stats.official.au + module.au;
  const targetPoints = targetGPA * totalAU;
  const neededPoints = targetPoints - currentPoints;
  const neededGPA = neededPoints / module.au;

  // Find minimum grade that meets or exceeds needed GPA
  const grades = Object.entries(GRADE_POINTS)
    .sort((a, b) => a[1] - b[1]); // Sort by points ascending

  for (const [grade, points] of grades) {
    if (points >= neededGPA) {
      return { grade, achievable: true };
    }
  }

  // If even A+ isn't enough
  return { grade: 'A+', achievable: false };
}

/**
 * Calculate how far behind/ahead of goal trajectory
 */
export function getGoalTrajectory(
  modules: Module[],
  goals: GoalSettings
): {
  currentPosition: number;
  expectedPosition: number;
  variance: number;
  trend: 'improving' | 'declining' | 'stable';
} {
  const stats = calculateCompositeStats(modules);
  const currentGPA = stats.official.gpa;

  // Expected position based on target
  const expectedPosition = goals.targetCGPA;

  // Calculate recent trend (compare last 2 semesters if available)
  const allSemesters = getAllSemesterProgress(modules, goals);
  let trend: 'improving' | 'declining' | 'stable' = 'stable';

  if (allSemesters.length >= 2) {
    const recent = allSemesters.slice(-2);
    const diff = recent[1].progress.current - recent[0].progress.current;
    if (diff > 0.1) trend = 'improving';
    else if (diff < -0.1) trend = 'declining';
  }

  return {
    currentPosition: currentGPA,
    expectedPosition,
    variance: currentGPA - expectedPosition,
    trend,
  };
}

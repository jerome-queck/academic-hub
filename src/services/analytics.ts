import type { Module, SemesterStats, ChartDataPoint } from '../types';
import { calculateCompositeStats, GRADE_POINTS, EXCLUDED_GRADES } from '../utils/gpa';

/**
 * Get semester-by-semester statistics
 */
export function getSemesterHistory(modules: Module[]): SemesterStats[] {
  const results: SemesterStats[] = [];

  for (let year = 1; year <= 4; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      const semModules = modules.filter(
        m => m.year === year && m.semester === semester
      );

      if (semModules.length > 0) {
        const stats = calculateCompositeStats(semModules);
        const gradeDistribution = getGradeDistributionForModules(semModules);

        results.push({
          year,
          semester,
          gpa: stats.official.gpa,
          projectedGpa: stats.projected.gpa,
          totalAU: stats.totalExistingAU,
          moduleCount: semModules.length,
          gradeDistribution,
        });
      }
    }
  }

  return results;
}

/**
 * Get GPA trend data for charting
 */
export function getGPATrendData(modules: Module[]): ChartDataPoint[] {
  const semesterHistory = getSemesterHistory(modules);
  const results: ChartDataPoint[] = [];

  let cumulativeModules: Module[] = [];

  for (const sem of semesterHistory) {
    // Add this semester's modules to cumulative
    const semModules = modules.filter(
      m => m.year === sem.year && m.semester === sem.semester
    );
    cumulativeModules = [...cumulativeModules, ...semModules];

    const cumulativeStats = calculateCompositeStats(cumulativeModules);

    results.push({
      label: `Y${sem.year}S${sem.semester}`,
      value: cumulativeStats.official.gpa,
      projected: cumulativeStats.projected.gpa,
    });
  }

  return results;
}

/**
 * Get grade distribution across all modules
 */
export function getGradeDistribution(modules: Module[]): Record<string, number> {
  return getGradeDistributionForModules(modules);
}

/**
 * Helper to get grade distribution for a set of modules
 */
function getGradeDistributionForModules(modules: Module[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  modules.forEach(m => {
    if (m.grade && !EXCLUDED_GRADES.includes(m.grade)) {
      distribution[m.grade] = (distribution[m.grade] || 0) + 1;
    }
  });

  return distribution;
}

/**
 * Get AU completion progress
 */
export function getAUProgressData(modules: Module[], targetAU: number = 130): {
  completed: number;
  inProgress: number;
  planned: number;
  total: number;
  targetTotal: number;
} {
  let completed = 0;
  let inProgress = 0;
  let planned = 0;

  modules.forEach(m => {
    if (m.status === 'Completed') {
      completed += m.au;
    } else if (m.status === 'In Progress') {
      inProgress += m.au;
    } else {
      planned += m.au;
    }
  });

  return {
    completed,
    inProgress,
    planned,
    total: completed + inProgress + planned,
    targetTotal: targetAU,
  };
}

/**
 * Get semester workload data (AU per semester)
 */
export function getSemesterWorkloadData(modules: Module[]): ChartDataPoint[] {
  const results: ChartDataPoint[] = [];

  for (let year = 1; year <= 4; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      const semModules = modules.filter(
        m => m.year === year && m.semester === semester
      );
      if (semModules.length > 0) {
        results.push({
          label: `Y${year}S${semester}`,
          value: semModules.reduce((sum, m) => sum + m.au, 0),
        });
      }
    }
  }

  return results;
}

/**
 * Get cumulative vs semester GPA data
 */
export function getCumulativeVsSemesterData(modules: Module[]): Array<{
  label: string;
  semesterGPA: number;
  cumulativeGPA: number;
}> {
  const results: Array<{ label: string; semesterGPA: number; cumulativeGPA: number }> = [];
  let cumulativeModules: Module[] = [];

  for (let year = 1; year <= 4; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      const semModules = modules.filter(
        m => m.year === year && m.semester === semester
      );
      if (semModules.length === 0) continue;

      const semStats = calculateCompositeStats(semModules);
      cumulativeModules = [...cumulativeModules, ...semModules];
      const cumStats = calculateCompositeStats(cumulativeModules);

      results.push({
        label: `Y${year}S${semester}`,
        semesterGPA: semStats.official.gpa,
        cumulativeGPA: cumStats.official.gpa,
      });
    }
  }

  return results;
}

/**
 * Check Dean's List eligibility per semester
 * NTU: Semester GPA >= 4.5 with >= 15 AU graded
 */
export function getDeanListData(modules: Module[]): Array<{
  label: string;
  gpa: number;
  gradedAU: number;
  eligible: boolean;
}> {
  const results: Array<{ label: string; gpa: number; gradedAU: number; eligible: boolean }> = [];

  for (let year = 1; year <= 4; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      const semModules = modules.filter(
        m => m.year === year && m.semester === semester
      );
      if (semModules.length === 0) continue;

      const stats = calculateCompositeStats(semModules);
      const gradedAU = stats.official.au;

      results.push({
        label: `Y${year}S${semester}`,
        gpa: stats.official.gpa,
        gradedAU,
        eligible: stats.official.gpa >= 4.5 && gradedAU >= 15,
      });
    }
  }

  return results;
}

/**
 * Get graduation readiness data
 */
export function getGraduationReadiness(modules: Module[], targetAU: number = 130): {
  completedAU: number;
  inProgressAU: number;
  plannedAU: number;
  remainingAU: number;
  targetAU: number;
  percentComplete: number;
  typeCoverage: Array<{ type: string; au: number; count: number }>;
} {
  let completedAU = 0;
  let inProgressAU = 0;
  let plannedAU = 0;

  const typeMap: Record<string, { au: number; count: number }> = {};

  modules.forEach(m => {
    if (m.status === 'Completed') completedAU += m.au;
    else if (m.status === 'In Progress') inProgressAU += m.au;
    else plannedAU += m.au;

    if (!typeMap[m.type]) typeMap[m.type] = { au: 0, count: 0 };
    typeMap[m.type].au += m.au;
    typeMap[m.type].count += 1;
  });

  const totalTracked = completedAU + inProgressAU + plannedAU;

  return {
    completedAU,
    inProgressAU,
    plannedAU,
    remainingAU: Math.max(0, targetAU - totalTracked),
    targetAU,
    percentComplete: targetAU > 0 ? (completedAU / targetAU) * 100 : 0,
    typeCoverage: Object.entries(typeMap).map(([type, data]) => ({
      type,
      ...data,
    })),
  };
}

/**
 * Get credit-weighted impact analysis — modules that impact GPA most
 */
export function getCreditWeightedImpact(modules: Module[]): Array<{
  code: string;
  name: string;
  au: number;
  grade: string;
  gradePoints: number;
  impact: 'positive' | 'negative' | 'neutral';
  weightedContribution: number;
}> {
  const completedModules = modules.filter(
    m => m.status === 'Completed' && m.grade && GRADE_POINTS[m.grade] !== undefined
  );

  if (completedModules.length === 0) return [];

  const totalWeightedPoints = completedModules.reduce(
    (sum, m) => sum + GRADE_POINTS[m.grade!] * m.au, 0
  );
  const totalAU = completedModules.reduce((sum, m) => sum + m.au, 0);
  const averageGPA = totalAU > 0 ? totalWeightedPoints / totalAU : 0;

  return completedModules
    .map(m => {
      const points = GRADE_POINTS[m.grade!];
      return {
        code: m.code,
        name: m.name,
        au: m.au,
        grade: m.grade!,
        gradePoints: points,
        impact: points > averageGPA ? 'positive' as const : points < averageGPA ? 'negative' as const : 'neutral' as const,
        weightedContribution: (points * m.au) / totalAU,
      };
    })
    .sort((a, b) => Math.abs(b.weightedContribution - averageGPA) - Math.abs(a.weightedContribution - averageGPA));
}

/**
 * Get module type breakdown
 */
export function getModuleTypeBreakdown(modules: Module[]): Array<{
  type: string;
  count: number;
  au: number;
  averageGPA: number;
}> {
  const typeGroups: Record<string, Module[]> = {};

  modules.forEach(m => {
    if (!typeGroups[m.type]) {
      typeGroups[m.type] = [];
    }
    typeGroups[m.type].push(m);
  });

  return Object.entries(typeGroups).map(([type, mods]) => {
    const stats = calculateCompositeStats(mods);
    return {
      type,
      count: mods.length,
      au: mods.reduce((sum, m) => sum + m.au, 0),
      averageGPA: stats.official.gpa,
    };
  });
}

/**
 * Get grade point distribution for chart
 */
export function getGradePointDistribution(modules: Module[]): ChartDataPoint[] {
  const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D+', 'D', 'F'];
  const distribution = getGradeDistribution(modules);

  return gradeOrder
    .filter(grade => distribution[grade] > 0)
    .map(grade => ({
      label: grade,
      value: distribution[grade],
    }));
}

/**
 * Calculate semester-over-semester change
 */
export function getSemesterChanges(modules: Module[]): Array<{
  label: string;
  change: number;
  improved: boolean;
}> {
  const trendData = getGPATrendData(modules);
  const changes: Array<{ label: string; change: number; improved: boolean }> = [];

  for (let i = 1; i < trendData.length; i++) {
    const change = trendData[i].value - trendData[i - 1].value;
    changes.push({
      label: trendData[i].label,
      change: parseFloat(change.toFixed(2)),
      improved: change > 0,
    });
  }

  return changes;
}

/**
 * Get performance insights
 */
export function getPerformanceInsights(modules: Module[]): {
  bestSemester: { label: string; gpa: number } | null;
  worstSemester: { label: string; gpa: number } | null;
  bestModule: { code: string; grade: string } | null;
  averageAUPerSemester: number;
  strongestType: string | null;
} {
  const semesterHistory = getSemesterHistory(modules);
  const typeBreakdown = getModuleTypeBreakdown(modules);

  // Best/worst semester
  let bestSemester: { label: string; gpa: number } | null = null;
  let worstSemester: { label: string; gpa: number } | null = null;

  semesterHistory.forEach(sem => {
    const label = `Y${sem.year}S${sem.semester}`;
    if (!bestSemester || sem.gpa > bestSemester.gpa) {
      bestSemester = { label, gpa: sem.gpa };
    }
    if (!worstSemester || sem.gpa < worstSemester.gpa) {
      worstSemester = { label, gpa: sem.gpa };
    }
  });

  // Best module (highest grade)
  const completedModules = modules.filter(
    m => m.status === 'Completed' && m.grade && GRADE_POINTS[m.grade] !== undefined
  );
  let bestModule: { code: string; grade: string } | null = null;
  let highestPoints = -1;

  completedModules.forEach(m => {
    const points = GRADE_POINTS[m.grade!];
    if (points > highestPoints) {
      highestPoints = points;
      bestModule = { code: m.code, grade: m.grade! };
    }
  });

  // Average AU per semester
  const avgAU = semesterHistory.length > 0
    ? semesterHistory.reduce((sum, s) => sum + s.totalAU, 0) / semesterHistory.length
    : 0;

  // Strongest module type
  const strongestType = typeBreakdown.length > 0
    ? typeBreakdown.reduce((best, curr) =>
        curr.averageGPA > best.averageGPA ? curr : best
      ).type
    : null;

  return {
    bestSemester,
    worstSemester,
    bestModule,
    averageAUPerSemester: parseFloat(avgAU.toFixed(1)),
    strongestType,
  };
}

import { useStore } from '../../store';
import { GRADE_POINTS } from '../../utils/gpa';
import { Card } from '../ui';
import { cn } from '../../lib/utils';

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-500',
  'A': 'bg-emerald-400',
  'A-': 'bg-green-400',
  'B+': 'bg-blue-500',
  'B': 'bg-blue-400',
  'B-': 'bg-blue-300',
  'C+': 'bg-yellow-500',
  'C': 'bg-yellow-400',
  'D+': 'bg-orange-400',
  'D': 'bg-orange-500',
  'F': 'bg-red-500',
};

export function GradeDistributionWidget() {
  const { modules, selectedYear, selectedSem } = useStore();

  const semModules = modules.filter(
    (m) => m.year === selectedYear && m.semester === selectedSem && m.grade
  );

  // Count grades
  const gradeCounts: Record<string, number> = {};
  semModules.forEach((m) => {
    if (m.grade && GRADE_POINTS[m.grade] !== undefined) {
      gradeCounts[m.grade] = (gradeCounts[m.grade] || 0) + 1;
    }
  });

  const entries = Object.entries(gradeCounts).sort(
    (a, b) => (GRADE_POINTS[b[0]] ?? 0) - (GRADE_POINTS[a[0]] ?? 0)
  );
  const total = entries.reduce((s, [, c]) => s + c, 0);

  if (total === 0) return null;

  return (
    <Card hover>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Y{selectedYear}S{selectedSem} Grade Distribution
      </p>

      {/* Stacked bar */}
      <div className="h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700 mb-3">
        {entries.map(([grade, count]) => (
          <div
            key={grade}
            className={cn('h-full transition-all', GRADE_COLORS[grade] || 'bg-gray-400')}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${grade}: ${count}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([grade, count]) => (
          <div key={grade} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', GRADE_COLORS[grade] || 'bg-gray-400')} />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {grade}: {count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

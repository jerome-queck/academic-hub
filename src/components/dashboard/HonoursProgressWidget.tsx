import { useStore } from '../../store';
import { calculateCompositeStats, getClassification } from '../../utils/gpa';
import { Card } from '../ui';
import { cn } from '../../lib/utils';

const TIERS = [
  { label: 'First Class', min: 4.5, color: 'bg-primary-500' },
  { label: '2nd Upper', min: 4.0, color: 'bg-blue-500' },
  { label: '2nd Lower', min: 3.5, color: 'bg-teal-500' },
  { label: 'Third Class', min: 3.0, color: 'bg-yellow-500' },
  { label: 'Pass', min: 2.0, color: 'bg-orange-500' },
];

export function HonoursProgressWidget() {
  const { modules } = useStore();
  const cumulativeStats = calculateCompositeStats(modules);
  const gpa = cumulativeStats.official.gpa;
  const classification = getClassification(gpa);

  // Find the next tier above current GPA
  const currentTierIndex = TIERS.findIndex((t) => gpa >= t.min);
  const nextTier = currentTierIndex > 0 ? TIERS[currentTierIndex - 1] : null;
  const gap = nextTier ? (nextTier.min - gpa).toFixed(2) : null;

  // Scale: 0.0 to 5.0, but show 2.0 to 5.0 range for better visibility
  const scaleMin = 2.0;
  const scaleMax = 5.0;
  const clampedGpa = Math.max(scaleMin, Math.min(scaleMax, gpa));
  const position = ((clampedGpa - scaleMin) / (scaleMax - scaleMin)) * 100;

  return (
    <Card hover>
      <div className="h-[120px] flex flex-col justify-center">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Honours Classification
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {classification}
          {gap && nextTier && (
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-2">
              {gap} to {nextTier.label}
            </span>
          )}
        </p>

        {/* Visual scale */}
        <div className="relative">
          {/* Track */}
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex">
            {TIERS.slice().reverse().map((tier, i) => {
              const prevMin = i > 0 ? TIERS.slice().reverse()[i - 1].min : scaleMin;
              const width = ((tier.min - prevMin) / (scaleMax - scaleMin)) * 100;
              return (
                <div
                  key={tier.label}
                  className={cn('h-full', tier.color, 'opacity-60')}
                  style={{ width: `${width}%` }}
                />
              );
            })}
          </div>

          {/* GPA marker */}
          <div
            className="absolute -top-0.5 w-3 h-3 rounded-full bg-gray-900 dark:bg-white border-2 border-white dark:border-gray-900 shadow-md transition-all duration-700"
            style={{ left: `calc(${position}% - 6px)` }}
          />

          {/* Tier labels */}
          <div className="flex justify-between mt-1.5">
            {[2.0, 3.0, 3.5, 4.0, 4.5, 5.0].map((v) => (
              <span
                key={v}
                className={cn(
                  'text-[10px]',
                  gpa >= v - 0.05 && gpa <= v + 0.05
                    ? 'text-primary-600 dark:text-primary-400 font-semibold'
                    : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {v.toFixed(1)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

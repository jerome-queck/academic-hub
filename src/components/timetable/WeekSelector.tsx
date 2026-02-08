import { cn } from '../../lib/utils';
import { TOTAL_TEACHING_WEEKS } from '../../utils/academic-calendar';

interface WeekSelectorProps {
  selectedWeeks: number[];         // teaching weeks 1–13
  includeRecessWeek: boolean;
  onChange: (weeks: number[], includeRecess: boolean) => void;
}

export function WeekSelector({ selectedWeeks, includeRecessWeek, onChange }: WeekSelectorProps) {
  const allWeeks = Array.from({ length: TOTAL_TEACHING_WEEKS }, (_, i) => i + 1);
  const allSelected = selectedWeeks.length === TOTAL_TEACHING_WEEKS;
  const noneSelected = selectedWeeks.length === 0;

  const toggleWeek = (week: number) => {
    const newWeeks = selectedWeeks.includes(week)
      ? selectedWeeks.filter(w => w !== week)
      : [...selectedWeeks, week].sort((a, b) => a - b);
    onChange(newWeeks, includeRecessWeek);
  };

  const selectAll = () => {
    onChange(allWeeks, includeRecessWeek);
  };

  const selectNone = () => {
    onChange([], includeRecessWeek);
  };

  const toggleRecess = () => {
    onChange(selectedWeeks, !includeRecessWeek);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Active Weeks
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected}
            className={cn(
              'text-xs px-2 py-0.5 rounded transition-colors',
              allSelected
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={selectNone}
            disabled={noneSelected}
            className={cn(
              'text-xs px-2 py-0.5 rounded transition-colors',
              noneSelected
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            None
          </button>
        </div>
      </div>

      {/* Teaching week buttons */}
      <div className="flex flex-wrap gap-1.5">
        {allWeeks.map(week => (
          <button
            key={week}
            type="button"
            onClick={() => toggleWeek(week)}
            className={cn(
              'w-9 h-9 rounded-lg text-sm font-medium transition-all',
              selectedWeeks.includes(week)
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {week}
          </button>
        ))}
      </div>

      {/* Recess week toggle */}
      <div className="flex items-center gap-3 pt-1 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={toggleRecess}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
            includeRecessWeek
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          <span className={cn(
            'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
            includeRecessWeek
              ? 'border-amber-500 bg-amber-500'
              : 'border-gray-300 dark:border-gray-600'
          )}>
            {includeRecessWeek && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          Recess Week
        </button>
        {includeRecessWeek && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Class will also occur during recess
          </span>
        )}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { cn } from '../../lib/utils';
import { formatDateRange, getCurrentAcademicWeek } from '../../utils/academic-calendar';
import type { AcademicWeek } from '../../types';

interface WeekNavigatorProps {
  academicWeeks: AcademicWeek[];
  currentWeekIndex: number;
  onWeekChange: (index: number) => void;
}

export function WeekNavigator({ academicWeeks, currentWeekIndex, onWeekChange }: WeekNavigatorProps) {
  const currentWeek = academicWeeks[currentWeekIndex];

  const todayWeek = useMemo(() => getCurrentAcademicWeek(academicWeeks), [academicWeeks]);
  const todayWeekIndex = todayWeek
    ? academicWeeks.findIndex(w => w.weekNumber === todayWeek.weekNumber)
    : -1;

  const canGoBack = currentWeekIndex > 0;
  const canGoForward = currentWeekIndex < academicWeeks.length - 1;

  if (!currentWeek) return null;

  const dateRange = formatDateRange(currentWeek.startDate, currentWeek.endDate);

  return (
    <div className="space-y-2">
      {/* Main navigation bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => canGoBack && onWeekChange(currentWeekIndex - 1)}
          disabled={!canGoBack}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canGoBack
              ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className={cn(
              'text-lg font-semibold',
              currentWeek.weekType === 'teaching' && 'text-gray-900 dark:text-white',
              currentWeek.weekType === 'recess' && 'text-amber-600 dark:text-amber-400',
              currentWeek.weekType === 'exam' && 'text-red-600 dark:text-red-400',
            )}>
              {currentWeek.displayLabel}
            </span>
            {currentWeek.weekType === 'recess' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                Break
              </span>
            )}
            {currentWeek.weekType === 'exam' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                Exams
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{dateRange}</p>
        </div>

        <button
          onClick={() => canGoForward && onWeekChange(currentWeekIndex + 1)}
          disabled={!canGoForward}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canGoForward
              ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Pill strip */}
      <div className="flex items-center gap-1">
        {/* Today button */}
        {todayWeekIndex >= 0 && todayWeekIndex !== currentWeekIndex && (
          <button
            onClick={() => onWeekChange(todayWeekIndex)}
            className="mr-2 px-3 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors whitespace-nowrap"
          >
            Today
          </button>
        )}

        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 min-w-max">
            {academicWeeks.map((week, index) => {
              const isActive = index === currentWeekIndex;
              const isToday = index === todayWeekIndex;

              return (
                <button
                  key={week.weekNumber}
                  onClick={() => onWeekChange(index)}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium transition-all relative',
                    isActive && week.weekType === 'teaching' && 'bg-primary-600 text-white shadow-sm',
                    isActive && week.weekType === 'recess' && 'bg-amber-500 text-white shadow-sm',
                    isActive && week.weekType === 'exam' && 'bg-red-500 text-white shadow-sm',
                    !isActive && week.weekType === 'teaching' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40',
                    !isActive && week.weekType === 'recess' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40',
                    !isActive && week.weekType === 'exam' && 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40',
                  )}
                  title={week.displayLabel}
                >
                  {week.weekType === 'recess' ? 'R' : week.weekType === 'exam' ? `E${week.weekNumber - academicWeeks.filter(w => w.weekType !== 'exam').length}` : week.displayLabel.replace('Week ', '')}
                  {isToday && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

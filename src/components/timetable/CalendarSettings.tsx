import { useState, useEffect } from 'react';
import { Button } from '../ui';
import { getDefaultStartDate, generateAcademicWeeks, formatSingleDate } from '../../utils/academic-calendar';
import type { AcademicCalendar } from '../../types';

interface CalendarSettingsProps {
  calendar: AcademicCalendar | null;
  year: number;
  semester: number;
  onSave: (calendar: AcademicCalendar) => void;
  onClose: () => void;
}

export function CalendarSettings({ calendar, year, semester, onSave, onClose }: CalendarSettingsProps) {
  const defaultStart = getDefaultStartDate(year, semester);
  const [startDate, setStartDate] = useState(calendar?.startDate || defaultStart);
  const [endDate, setEndDate] = useState(calendar?.endDate || '');
  const [useCustomEnd, setUseCustomEnd] = useState(!!calendar?.endDate);

  useEffect(() => {
    setStartDate(calendar?.startDate || defaultStart);
    setEndDate(calendar?.endDate || '');
    setUseCustomEnd(!!calendar?.endDate);
  }, [calendar, defaultStart]);

  // Compute the default end date (end of 4 exam weeks)
  const weeks = generateAcademicWeeks(startDate);
  const lastWeek = weeks[weeks.length - 1];
  const computedEndDate = lastWeek ? lastWeek.endDate : new Date();

  const handleSave = () => {
    onSave({
      year,
      semester,
      startDate,
      endDate: useCustomEnd ? endDate : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setStartDate(defaultStart);
    setEndDate('');
    setUseCustomEnd(false);
  };

  const isModified = startDate !== defaultStart || useCustomEnd;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Semester Calendar
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Week 1 Start (Monday)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {startDate !== defaultStart && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Default: {defaultStart}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              End Date
            </label>
            <button
              type="button"
              onClick={() => setUseCustomEnd(!useCustomEnd)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              {useCustomEnd ? 'Use default' : 'Customize'}
            </button>
          </div>
          {useCustomEnd ? (
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {formatSingleDate(computedEndDate)}
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(auto)</span>
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {weeks.filter(w => w.weekType === 'teaching').length} teaching weeks
            {' + '}1 recess week
            {' + '}{weeks.filter(w => w.weekType === 'exam').length} exam weeks
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        {isModified ? (
          <button
            onClick={handleReset}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Reset to default
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

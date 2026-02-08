import { useMemo } from 'react';
import { useStore } from '../../store';
import { Card, CardHeader, Badge } from '../ui';
import { getCurrentSemester, getAcademicWeeksForSemester, getCurrentAcademicWeek, getEntriesForWeek, formatDateRange } from '../../utils/academic-calendar';
import type { DayOfWeek } from '../../types';

const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri',
};

const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
];

export function WeekTimetableWidget() {
  const { timetables, setCurrentView, setView } = useStore();

  const currentSem = useMemo(() => getCurrentSemester(timetables), [timetables]);

  const timetable = useMemo(() => {
    if (!currentSem) return null;
    return timetables.find(t => t.year === currentSem.year && t.semester === currentSem.semester) || null;
  }, [timetables, currentSem]);

  const academicWeeks = useMemo(() => {
    if (!currentSem) return [];
    return getAcademicWeeksForSemester(currentSem.year, currentSem.semester, timetable?.calendar);
  }, [currentSem, timetable]);

  const currentWeek = useMemo(() => getCurrentAcademicWeek(academicWeeks), [academicWeeks]);

  const weekEntries = useMemo(() => {
    if (!currentWeek || !timetable) return [];
    return getEntriesForWeek(timetable.entries, currentWeek);
  }, [timetable, currentWeek]);

  const colorMap = useMemo(() => {
    if (!timetable) return {};
    const map: Record<string, string> = {};
    const codes = [...new Set(timetable.entries.map(e => e.moduleCode))];
    codes.forEach((code, i) => { map[code] = COLOR_PALETTE[i % COLOR_PALETTE.length]; });
    return map;
  }, [timetable]);

  // Group entries by day
  const entriesByDay = useMemo(() => {
    const map: Record<string, typeof weekEntries> = {};
    WEEKDAYS.forEach(d => { map[d] = []; });
    weekEntries.forEach(e => {
      if (map[e.day]) map[e.day].push(e);
    });
    // Sort by start time
    Object.values(map).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [weekEntries]);

  const handleNavigate = () => {
    if (currentSem) {
      setView(currentSem.year, currentSem.semester);
    }
    setCurrentView('timetable');
  };

  if (!currentSem || !currentWeek) {
    return (
      <Card>
        <CardHeader title="This Week" subtitle="No active semester" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No semester is currently in session.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={currentWeek.displayLabel}
        subtitle={
          <span className="flex items-center gap-2">
            <span>{formatDateRange(currentWeek.startDate, currentWeek.endDate)}</span>
            {currentWeek.weekType !== 'teaching' && (
              <Badge
                size="sm"
                variant={currentWeek.weekType === 'recess' ? 'warning' : 'danger'}
              >
                {currentWeek.weekType === 'recess' ? 'Break' : 'Exams'}
              </Badge>
            )}
          </span>
        }
        action={
          <button
            onClick={handleNavigate}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            View Full
          </button>
        }
      />

      {weekEntries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
          {currentWeek.weekType === 'teaching' ? 'No classes this week' : currentWeek.weekType === 'recess' ? 'Recess week - enjoy your break!' : 'Exam period'}
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="min-h-[60px]">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                {DAY_SHORT[day]}
              </p>
              <div className="space-y-1">
                {entriesByDay[day].length === 0 ? (
                  <div className="h-8 rounded bg-gray-50 dark:bg-gray-800/50" />
                ) : (
                  entriesByDay[day].map(entry => {
                    const color = entry.color || colorMap[entry.moduleCode] || COLOR_PALETTE[0];
                    return (
                      <div
                        key={entry.id}
                        className="rounded-md px-1.5 py-1 border-l-2"
                        style={{
                          backgroundColor: `${color}15`,
                          borderLeftColor: color,
                        }}
                      >
                        <p className="text-[10px] font-bold truncate" style={{ color }}>
                          {entry.moduleCode}
                        </p>
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                          {entry.startTime}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

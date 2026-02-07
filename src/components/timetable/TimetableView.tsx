import { useState, useMemo, useCallback, Fragment } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { PageHeader } from '../layout';
import { Button, Card, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { TimetableEntry, DayOfWeek } from '../../types';
import { AddTimetableEntryModal } from './AddTimetableEntryModal';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
};

// Time range: 08:00 to 22:00 in 30-minute increments
const TIME_SLOTS: string[] = [];
for (let h = 8; h < 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const SLOT_HEIGHT = 40; // px per 30-min slot

const COLOR_PALETTE = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getSlotIndex(time: string): number {
  const mins = timeToMinutes(time);
  const startMins = 8 * 60; // 08:00
  return (mins - startMins) / 30;
}

function hasConflict(entry: TimetableEntry, allEntries: TimetableEntry[]): boolean {
  const entryStart = timeToMinutes(entry.startTime);
  const entryEnd = timeToMinutes(entry.endTime);

  return allEntries.some((other) => {
    if (other.id === entry.id || other.day !== entry.day) return false;
    const otherStart = timeToMinutes(other.startTime);
    const otherEnd = timeToMinutes(other.endTime);
    return entryStart < otherEnd && entryEnd > otherStart;
  });
}

export function TimetableView() {
  const {
    timetables,
    modules,
    selectedYear,
    selectedSem,
    setView,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
  } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [prefillDay, setPrefillDay] = useState<DayOfWeek | null>(null);
  const [prefillTime, setPrefillTime] = useState<string | null>(null);

  const timetable = useMemo(() => {
    return (
      timetables.find(
        (t) => t.year === selectedYear && t.semester === selectedSem
      ) || { year: selectedYear, semester: selectedSem, entries: [] }
    );
  }, [timetables, selectedYear, selectedSem]);

  const semModules = useMemo(() => {
    return modules.filter(
      (m) => m.year === selectedYear && m.semester === selectedSem
    );
  }, [modules, selectedYear, selectedSem]);

  // Assign colors per moduleCode
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const codes = [...new Set(timetable.entries.map((e) => e.moduleCode))];
    codes.forEach((code, i) => {
      map[code] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    });
    return map;
  }, [timetable.entries]);

  const handleSlotClick = useCallback(
    (day: DayOfWeek, time: string) => {
      setEditingEntry(null);
      setPrefillDay(day);
      setPrefillTime(time);
      setModalOpen(true);
    },
    []
  );

  const handleEntryClick = useCallback((entry: TimetableEntry) => {
    setEditingEntry(entry);
    setPrefillDay(null);
    setPrefillTime(null);
    setModalOpen(true);
  }, []);

  const handleAddClick = useCallback(() => {
    setEditingEntry(null);
    setPrefillDay(null);
    setPrefillTime(null);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    (entry: TimetableEntry) => {
      if (editingEntry) {
        updateTimetableEntry(selectedYear, selectedSem, editingEntry.id, entry);
      } else {
        addTimetableEntry(selectedYear, selectedSem, entry);
      }
      setModalOpen(false);
      setEditingEntry(null);
    },
    [editingEntry, selectedYear, selectedSem, addTimetableEntry, updateTimetableEntry]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteTimetableEntry(selectedYear, selectedSem, id);
      setModalOpen(false);
      setEditingEntry(null);
    },
    [selectedYear, selectedSem, deleteTimetableEntry]
  );

  // Year/Semester selector buttons
  const yearSemOptions = useMemo(() => {
    const options: { year: number; sem: number; label: string }[] = [];
    for (let y = 1; y <= 4; y++) {
      for (let s = 1; s <= 2; s++) {
        options.push({ year: y, sem: s, label: `Y${y}S${s}` });
      }
    }
    return options;
  }, []);

  // Get entries for a specific day
  const entriesByDay = useMemo(() => {
    const map: Record<DayOfWeek, TimetableEntry[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };
    timetable.entries.forEach((e) => {
      if (map[e.day]) map[e.day].push(e);
    });
    return map;
  }, [timetable.entries]);

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Plan your weekly class schedule"
        action={
          <Button
            variant="primary"
            size="md"
            onClick={handleAddClick}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Class
          </Button>
        }
      />

      {/* Year/Semester Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {yearSemOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setView(opt.year, opt.sem)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              selectedYear === opt.year && selectedSem === opt.sem
                ? 'bg-primary-600 text-white dark:bg-primary-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto scrollbar-thin">
          <div
            className="min-w-[800px]"
            style={{ display: 'grid', gridTemplateColumns: '64px repeat(6, 1fr)' }}
          >
            {/* Header Row */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 h-12 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Time</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/80 border-b border-l border-gray-200 dark:border-gray-700 h-12 flex items-center justify-center"
              >
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">
                  {day}
                </span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 sm:hidden">
                  {DAY_SHORT[day]}
                </span>
              </div>
            ))}

            {/* Time Slot Rows */}
            {TIME_SLOTS.map((time, slotIdx) => (
              <Fragment key={`slot-${time}`}>
                {/* Time label */}
                <div
                  className={cn(
                    'flex items-start justify-center pt-1 border-b border-gray-100 dark:border-gray-700/50',
                    slotIdx % 2 === 0
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-gray-50/50 dark:bg-gray-800/50'
                  )}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {slotIdx % 2 === 0 && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">
                      {time}
                    </span>
                  )}
                </div>

                {/* Day columns for this time slot */}
                {DAYS.map((day) => (
                  <div
                    key={`${day}-${time}`}
                    className={cn(
                      'relative border-l border-b border-gray-100 dark:border-gray-700/50 cursor-pointer',
                      'hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors',
                      slotIdx % 2 === 0
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-gray-50/50 dark:bg-gray-800/50'
                    )}
                    style={{ height: SLOT_HEIGHT }}
                    onClick={() => handleSlotClick(day, time)}
                  >
                    {/* Render entries that START at this time slot */}
                    {slotIdx === 0 &&
                      entriesByDay[day].map((entry) => {
                        const startIdx = getSlotIndex(entry.startTime);
                        const endIdx = getSlotIndex(entry.endTime);
                        const spanSlots = endIdx - startIdx;
                        const entryColor = entry.color || colorMap[entry.moduleCode] || COLOR_PALETTE[0];
                        const conflict = hasConflict(entry, timetable.entries);

                        // We render all entries from slotIdx=0 with absolute positioning
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              'absolute left-0.5 right-0.5 z-20 rounded-lg overflow-hidden cursor-pointer',
                              'border-l-[3px] px-1.5 py-1',
                              conflict && 'ring-2 ring-red-500 ring-offset-1 dark:ring-offset-gray-800'
                            )}
                            style={{
                              top: startIdx * SLOT_HEIGHT,
                              height: spanSlots * SLOT_HEIGHT - 2,
                              backgroundColor: `${entryColor}18`,
                              borderLeftColor: entryColor,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEntryClick(entry);
                            }}
                          >
                            <div className="flex flex-col h-full overflow-hidden">
                              <span
                                className="text-[11px] font-bold leading-tight truncate"
                                style={{ color: entryColor }}
                              >
                                {entry.moduleCode}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {entry.classType}
                              </span>
                              {spanSlots >= 2 && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                                  {entry.venue}
                                </span>
                              )}
                            </div>
                            {conflict && (
                              <div className="absolute top-0.5 right-0.5">
                                <svg
                                  className="w-3 h-3 text-red-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </Card>

      {/* Summary Bar */}
      {timetable.entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-wrap gap-2"
        >
          {Object.entries(colorMap).map(([code, color]) => {
            const count = timetable.entries.filter((e) => e.moduleCode === code).length;
            return (
              <Badge key={code} className="gap-1.5" size="lg">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {code}
                </span>
                <span className="text-gray-400 dark:text-gray-500">
                  ({count})
                </span>
              </Badge>
            );
          })}
        </motion.div>
      )}

      {/* Empty State */}
      {timetable.entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            No classes yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4">
            Add your classes to build your weekly timetable for Y{selectedYear}S{selectedSem}.
          </p>
          <Button variant="primary" onClick={handleAddClick}>
            Add Your First Class
          </Button>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <AddTimetableEntryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSave}
        onDelete={editingEntry ? () => handleDelete(editingEntry.id) : undefined}
        entry={editingEntry}
        prefillDay={prefillDay}
        prefillTime={prefillTime}
        semModules={semModules}
        colorMap={colorMap}
      />
    </div>
  );
}

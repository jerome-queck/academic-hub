import { useState, useMemo, useCallback, Fragment, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useStore } from '../../store';
import { PageHeader } from '../layout';
import { Button, Card, Badge } from '../ui';
import { cn } from '../../lib/utils';
import { generateId } from '../../lib/utils';
import { getAcademicWeeksForSemester, getEntriesForWeek, getExamsForWeek, getCurrentAcademicWeek, getDayOfWeek, weeksOverlap } from '../../utils/academic-calendar';

import { WeekNavigator } from './WeekNavigator';
import { CalendarSettings } from './CalendarSettings';
import { ModulePanel } from './ModulePanel';
import { DraggableTimetableEntry } from './DraggableTimetableEntry';
import { DroppableTimeSlot } from './DroppableTimeSlot';
import { AddTimetableEntryModal } from './AddTimetableEntryModal';
import { AddExaminationModal } from './AddExaminationModal';
import type { TimetableEntry, DayOfWeek, Examination, Module } from '../../types';

const ALL_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

// Time range: 08:00 to 22:00 in 30-minute increments
const TIME_SLOTS: string[] = [];
for (let h = 8; h < 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const SLOT_HEIGHT = 40;

const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getSlotIndex(time: string): number {
  const mins = timeToMinutes(time);
  return (mins - 8 * 60) / 30;
}

// Week-aware conflict detection
function hasConflict(entry: TimetableEntry, allEntries: TimetableEntry[]): boolean {
  const entryStart = timeToMinutes(entry.startTime);
  const entryEnd = timeToMinutes(entry.endTime);

  return allEntries.some((other) => {
    if (other.id === entry.id || other.day !== entry.day) return false;
    const otherStart = timeToMinutes(other.startTime);
    const otherEnd = timeToMinutes(other.endTime);
    if (!(entryStart < otherEnd && entryEnd > otherStart)) return false;

    // Time overlaps — now check week overlap
    if (!entry.recurring || !other.recurring) {
      // One-off events: only conflict if same specificDate
      if (!entry.recurring && !other.recurring) {
        return entry.specificDate === other.specificDate;
      }
      return true; // One recurring + one non-recurring: conservative conflict
    }

    return weeksOverlap(entry.weeks, entry.includeRecessWeek, other.weeks, other.includeRecessWeek);
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
    addExamination,
    updateExamination,
    deleteExamination,
    setAcademicCalendar,
  } = useStore();

  // Modal state
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);
  const [prefillDay, setPrefillDay] = useState<DayOfWeek | null>(null);
  const [prefillTime, setPrefillTime] = useState<string | null>(null);
  const [prefillModule, setPrefillModule] = useState<Module | null>(null);
  const [examModule, setExamModule] = useState<{ code: string; name: string; color?: string } | null>(null);

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);

  // DnD sensors — require 5px movement to start dragging (prevents accidental drags on click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Calendar settings popover
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const calendarSettingsRef = useRef<HTMLDivElement>(null);

  // Get timetable and calendar
  const timetable = useMemo(() => {
    return timetables.find(t => t.year === selectedYear && t.semester === selectedSem)
      || { year: selectedYear, semester: selectedSem, entries: [], examinations: [] };
  }, [timetables, selectedYear, selectedSem]);

  const calendar = timetable.calendar || null;

  const academicWeeks = useMemo(() => {
    return getAcademicWeeksForSemester(selectedYear, selectedSem, calendar);
  }, [selectedYear, selectedSem, calendar]);

  // Week navigation
  const initialWeekIndex = useMemo(() => {
    const current = getCurrentAcademicWeek(academicWeeks);
    if (current) {
      return academicWeeks.findIndex(w => w.weekNumber === current.weekNumber);
    }
    return 0;
  }, [academicWeeks]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(initialWeekIndex);

  // Reset week index when switching semester
  useEffect(() => {
    const current = getCurrentAcademicWeek(academicWeeks);
    if (current) {
      setSelectedWeekIndex(academicWeeks.findIndex(w => w.weekNumber === current.weekNumber));
    } else {
      setSelectedWeekIndex(0);
    }
  }, [selectedYear, selectedSem, academicWeeks]);

  const currentWeek = academicWeeks[selectedWeekIndex] || academicWeeks[0];

  // Get filtered entries and exams for current week
  const weekEntries = useMemo(() => {
    if (!currentWeek) return [];
    return getEntriesForWeek(timetable.entries, currentWeek);
  }, [timetable.entries, currentWeek]);

  const weekExams = useMemo(() => {
    if (!currentWeek) return [];
    return getExamsForWeek(timetable.examinations || [], currentWeek);
  }, [timetable.examinations, currentWeek]);

  // Semester modules
  const semModules = useMemo(() => {
    return modules.filter(m => m.year === selectedYear && m.semester === selectedSem);
  }, [modules, selectedYear, selectedSem]);

  // Color map: assign colors per moduleCode
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const allCodes = new Set([
      ...timetable.entries.map(e => e.moduleCode),
      ...(timetable.examinations || []).map(e => e.moduleCode),
    ]);
    [...allCodes].forEach((code, i) => {
      map[code] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    });
    return map;
  }, [timetable.entries, timetable.examinations]);

  // Smart day columns: show Sat/Sun only if entries exist
  const visibleDays = useMemo(() => {
    const hasSat = weekEntries.some(e => e.day === 'Saturday') || weekExams.some(e => getDayOfWeek(new Date(e.date + 'T00:00:00')) === 'Saturday');
    const hasSun = weekEntries.some(e => e.day === 'Sunday') || weekExams.some(e => getDayOfWeek(new Date(e.date + 'T00:00:00')) === 'Sunday');
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (hasSat) days.push('Saturday');
    if (hasSun) days.push('Sunday');
    return days;
  }, [weekEntries, weekExams]);

  // Entries + exams grouped by day for rendering
  const entriesByDay = useMemo(() => {
    const map: Record<string, TimetableEntry[]> = {};
    ALL_DAYS.forEach(d => { map[d] = []; });
    weekEntries.forEach(e => { map[e.day].push(e); });
    return map;
  }, [weekEntries]);

  const examsByDay = useMemo(() => {
    const map: Record<string, Examination[]> = {};
    ALL_DAYS.forEach(d => { map[d] = []; });
    weekExams.forEach(exam => {
      const dayName = getDayOfWeek(new Date(exam.date + 'T00:00:00'));
      if (map[dayName]) map[dayName].push(exam);
    });
    return map;
  }, [weekExams]);

  // Handlers
  const handleSlotClick = useCallback((day: DayOfWeek, time: string) => {
    setEditingEntry(null);
    setPrefillDay(day);
    setPrefillTime(time);
    setPrefillModule(null);
    setClassModalOpen(true);
  }, []);

  const handleEntryClick = useCallback((entry: TimetableEntry) => {
    setEditingEntry(entry);
    setPrefillDay(null);
    setPrefillTime(null);
    setPrefillModule(null);
    setClassModalOpen(true);
  }, []);

  const handleExamClick = useCallback((exam: Examination) => {
    setEditingExam(exam);
    setExamModule({ code: exam.moduleCode, name: exam.moduleName, color: exam.color });
    setExamModalOpen(true);
  }, []);

  const handleAddClass = useCallback((module?: Module | null) => {
    setEditingEntry(null);
    setPrefillDay(null);
    setPrefillTime(null);
    setPrefillModule(module || null);
    setClassModalOpen(true);
  }, []);

  const handleAddExam = useCallback((module: Module) => {
    setEditingExam(null);
    setExamModule({ code: module.code, name: module.name, color: colorMap[module.code] });
    setExamModalOpen(true);
  }, [colorMap]);

  const handleSaveEntry = useCallback((entry: TimetableEntry) => {
    if (editingEntry) {
      updateTimetableEntry(selectedYear, selectedSem, editingEntry.id, entry);
    } else {
      addTimetableEntry(selectedYear, selectedSem, entry);
    }
    setClassModalOpen(false);
    setEditingEntry(null);
    setPrefillModule(null);
  }, [editingEntry, selectedYear, selectedSem, addTimetableEntry, updateTimetableEntry]);

  const handleDeleteEntry = useCallback((id: string) => {
    deleteTimetableEntry(selectedYear, selectedSem, id);
    setClassModalOpen(false);
    setEditingEntry(null);
  }, [selectedYear, selectedSem, deleteTimetableEntry]);

  const handleSaveExam = useCallback((exam: Examination) => {
    if (editingExam) {
      updateExamination(selectedYear, selectedSem, editingExam.id, exam);
    } else {
      addExamination(selectedYear, selectedSem, exam);
    }
    setExamModalOpen(false);
    setEditingExam(null);
    setExamModule(null);
  }, [editingExam, selectedYear, selectedSem, addExamination, updateExamination]);

  const handleDeleteExam = useCallback((id: string) => {
    deleteExamination(selectedYear, selectedSem, id);
    setExamModalOpen(false);
    setEditingExam(null);
    setExamModule(null);
  }, [selectedYear, selectedSem, deleteExamination]);

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const overData = over.data.current;
    if (!overData || overData.type !== 'time-slot') return;

    const targetDay = overData.day as DayOfWeek;
    const targetTime = overData.time as string;

    const activeData = active.data.current;
    if (!activeData) return;

    if (activeData.type === 'move-entry') {
      // Moving an existing entry
      const entry = activeData.entry as TimetableEntry;
      const startMins = parseInt(entry.startTime.split(':')[0]) * 60 + parseInt(entry.startTime.split(':')[1]);
      const endMins = parseInt(entry.endTime.split(':')[0]) * 60 + parseInt(entry.endTime.split(':')[1]);
      const duration = endMins - startMins;

      const targetMins = parseInt(targetTime.split(':')[0]) * 60 + parseInt(targetTime.split(':')[1]);
      const newEndMins = Math.min(targetMins + duration, 22 * 60);
      const newEndH = Math.floor(newEndMins / 60);
      const newEndM = newEndMins % 60;
      const newEndTime = `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`;

      updateTimetableEntry(selectedYear, selectedSem, entry.id, {
        day: targetDay,
        startTime: targetTime,
        endTime: newEndTime,
      });
    } else if (activeData.type === 'new-entry') {
      // Dragging from module panel to create a new entry
      const moduleCode = activeData.moduleCode as string;
      const moduleName = activeData.moduleName as string;
      const moduleColor = activeData.color as string | undefined;

      // Default 1-hour duration
      const startMins = parseInt(targetTime.split(':')[0]) * 60 + parseInt(targetTime.split(':')[1]);
      const endMins = Math.min(startMins + 60, 22 * 60);
      const endH = Math.floor(endMins / 60);
      const endM = endMins % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      addTimetableEntry(selectedYear, selectedSem, {
        id: generateId(),
        moduleCode,
        moduleName,
        day: targetDay,
        startTime: targetTime,
        endTime,
        venue: '',
        classType: 'Lecture',
        color: moduleColor,
        recurring: true,
      });
    }
  }, [selectedYear, selectedSem, updateTimetableEntry, addTimetableEntry]);

  // Year/Semester selector
  const yearSemOptions = useMemo(() => {
    const options: { year: number; sem: number; label: string }[] = [];
    for (let y = 1; y <= 4; y++) {
      for (let s = 1; s <= 2; s++) {
        options.push({ year: y, sem: s, label: `Y${y}S${s}` });
      }
    }
    return options;
  }, []);

  // Close calendar settings on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarSettingsRef.current && !calendarSettingsRef.current.contains(e.target as Node)) {
        setShowCalendarSettings(false);
      }
    };
    if (showCalendarSettings) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendarSettings]);

  const totalEntries = timetable.entries.length + (timetable.examinations?.length || 0);
  const dayCount = visibleDays.length;

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Plan your weekly class schedule"
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => handleAddClass()}
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

      {/* Year/Semester Selector + Calendar Settings */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2">
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

        {/* Calendar Settings Gear */}
        <div className="relative" ref={calendarSettingsRef}>
          <button
            onClick={() => setShowCalendarSettings(!showCalendarSettings)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showCalendarSettings
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
            )}
            title="Semester calendar settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {showCalendarSettings && (
            <div className="absolute right-0 top-12 z-50">
              <CalendarSettings
                calendar={calendar}
                year={selectedYear}
                semester={selectedSem}
                onSave={(cal) => setAcademicCalendar(selectedYear, selectedSem, cal)}
                onClose={() => setShowCalendarSettings(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Week Navigator */}
      <div className="mb-4">
        <WeekNavigator
          academicWeeks={academicWeeks}
          currentWeekIndex={selectedWeekIndex}
          onWeekChange={setSelectedWeekIndex}
        />
      </div>

      {/* Timetable Grid */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto scrollbar-thin">
            <div
              className="min-w-[700px]"
              style={{ display: 'grid', gridTemplateColumns: `64px repeat(${dayCount}, 1fr)` }}
            >
              {/* Header Row */}
              <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 h-12 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Time</span>
              </div>
              {visibleDays.map((day) => (
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
                  <div
                    className={cn(
                      'flex items-start justify-center pt-1 border-b border-gray-100 dark:border-gray-700/50',
                      slotIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                    )}
                    style={{ height: SLOT_HEIGHT }}
                  >
                    {slotIdx % 2 === 0 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">{time}</span>
                    )}
                  </div>

                  {visibleDays.map((day) => (
                    <DroppableTimeSlot
                      key={`${day}-${time}`}
                      day={day}
                      time={time}
                      slotIdx={slotIdx}
                      slotHeight={SLOT_HEIGHT}
                      onClick={() => handleSlotClick(day, time)}
                    >
                      {/* Render entries with absolute positioning from slot 0 */}
                      {slotIdx === 0 && (
                        <>
                          {/* Regular class entries — draggable */}
                          {entriesByDay[day]?.map((entry) => {
                            const startIdx = getSlotIndex(entry.startTime);
                            const endIdx = getSlotIndex(entry.endTime);
                            const spanSlots = endIdx - startIdx;
                            const entryColor = entry.color || colorMap[entry.moduleCode] || COLOR_PALETTE[0];
                            const conflict = hasConflict(entry, weekEntries);

                            return (
                              <DraggableTimetableEntry
                                key={entry.id}
                                entry={entry}
                                color={entryColor}
                                conflict={conflict}
                                slotHeight={SLOT_HEIGHT}
                                startIdx={startIdx}
                                spanSlots={spanSlots}
                                onClick={(e) => { e.stopPropagation(); handleEntryClick(entry); }}
                              />
                            );
                          })}

                          {/* Exam entries - distinct styling (not draggable) */}
                          {examsByDay[day]?.map((exam) => {
                            const startIdx = getSlotIndex(exam.startTime);
                            const endIdx = getSlotIndex(exam.endTime);
                            const spanSlots = Math.max(endIdx - startIdx, 1);
                            const examColor = exam.color || colorMap[exam.moduleCode] || '#F59E0B';

                            return (
                              <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="absolute left-0.5 right-0.5 z-20 rounded-lg overflow-hidden cursor-pointer border-2 border-dashed px-1.5 py-1"
                                style={{
                                  top: startIdx * SLOT_HEIGHT,
                                  height: spanSlots * SLOT_HEIGHT - 2,
                                  backgroundColor: `${examColor}15`,
                                  borderColor: `${examColor}80`,
                                }}
                                onClick={(e) => { e.stopPropagation(); handleExamClick(exam); }}
                              >
                                <div className="flex flex-col h-full overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 flex-shrink-0" style={{ color: examColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-[11px] font-bold leading-tight truncate" style={{ color: examColor }}>
                                      {exam.moduleCode}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                                    {exam.examType}
                                  </span>
                                  {spanSlots >= 2 && (
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                                      {exam.venue}
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </>
                      )}
                    </DroppableTimeSlot>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </Card>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && (() => {
            // Find the active entry for the overlay
            const activeData = activeId.startsWith('entry-')
              ? weekEntries.find(e => e.id === activeId.replace('entry-', ''))
              : null;
            if (activeData) {
              const entryColor = activeData.color || colorMap[activeData.moduleCode] || COLOR_PALETTE[0];
              return (
                <div
                  className="rounded-lg border-l-[3px] px-2 py-1.5 shadow-xl opacity-90"
                  style={{
                    backgroundColor: `${entryColor}30`,
                    borderLeftColor: entryColor,
                    width: 150,
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: entryColor }}>
                    {activeData.moduleCode}
                  </span>
                  <p className="text-[10px] text-gray-500">{activeData.classType}</p>
                </div>
              );
            }

            // Module panel drag overlay
            if (activeId.startsWith('module-panel-')) {
              const code = activeId.replace('module-panel-', '');
              const color = colorMap[code] || '#6B7280';
              return (
                <div
                  className="rounded-lg border-l-[3px] px-2 py-1.5 shadow-xl opacity-90 bg-white dark:bg-gray-800"
                  style={{ borderLeftColor: color, width: 140 }}
                >
                  <span className="text-xs font-bold" style={{ color }}>{code}</span>
                  <p className="text-[10px] text-gray-500">New class</p>
                </div>
              );
            }

            return null;
          })()}
        </DragOverlay>
      </DndContext>

      {/* Module Panel (bottom) */}
      <div className="mt-4">
        <ModulePanel
          modules={semModules}
          timetableEntries={timetable.entries}
          examinations={timetable.examinations || []}
          colorMap={colorMap}
          onAddClass={handleAddClass}
          onAddExam={handleAddExam}
          onAddManualEvent={() => handleAddClass(null)}
        />
      </div>

      {/* Summary Bar */}
      {totalEntries > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-wrap gap-2"
        >
          {Object.entries(colorMap).map(([code, color]) => {
            const classCount = timetable.entries.filter(e => e.moduleCode === code).length;
            const examCount = (timetable.examinations || []).filter(e => e.moduleCode === code).length;
            return (
              <Badge key={code} className="gap-1.5" size="lg">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                <span className="text-gray-700 dark:text-gray-300">{code}</span>
                <span className="text-gray-400 dark:text-gray-500">
                  ({classCount}{examCount > 0 ? ` + ${examCount} exam${examCount > 1 ? 's' : ''}` : ''})
                </span>
              </Badge>
            );
          })}
        </motion.div>
      )}

      {/* Empty State */}
      {totalEntries === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No classes yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4">
            Add your classes to build your weekly timetable for Y{selectedYear}S{selectedSem}.
          </p>
          <Button variant="primary" onClick={() => handleAddClass()}>Add Your First Class</Button>
        </motion.div>
      )}

      {/* Add/Edit Class Modal */}
      <AddTimetableEntryModal
        isOpen={classModalOpen}
        onClose={() => { setClassModalOpen(false); setEditingEntry(null); setPrefillModule(null); }}
        onSave={handleSaveEntry}
        onDelete={editingEntry ? () => handleDeleteEntry(editingEntry.id) : undefined}
        entry={editingEntry}
        prefillDay={prefillDay}
        prefillTime={prefillTime}
        prefillModule={prefillModule}
        semModules={semModules}
        colorMap={colorMap}
        academicWeeks={academicWeeks}
      />

      {/* Add/Edit Exam Modal */}
      {examModule && (
        <AddExaminationModal
          isOpen={examModalOpen}
          onClose={() => { setExamModalOpen(false); setEditingExam(null); setExamModule(null); }}
          onSave={handleSaveExam}
          onDelete={editingExam ? () => handleDeleteExam(editingExam.id) : undefined}
          exam={editingExam}
          moduleCode={examModule.code}
          moduleName={examModule.name}
          moduleColor={examModule.color}
          academicWeeks={academicWeeks}
        />
      )}
    </div>
  );
}

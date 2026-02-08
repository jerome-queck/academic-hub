import type { TimetableEntry, DayOfWeek } from '../types';

/**
 * Snap minutes to nearest grid interval (default 30 min)
 */
export function snapToGrid(minutes: number, gridSize = 30): number {
  return Math.round(minutes / gridSize) * gridSize;
}

/**
 * Convert pixel offset to minutes based on slot height
 */
export function pixelsToMinutes(px: number, slotHeight: number): number {
  // Each slot is 30 minutes
  return (px / slotHeight) * 30;
}

/**
 * Convert minutes to pixels based on slot height
 */
export function minutesToPixels(minutes: number, slotHeight: number): number {
  return (minutes / 30) * slotHeight;
}

/**
 * Convert HH:MM string to total minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes from midnight to HH:MM string
 */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(8 * 60, Math.min(22 * 60, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculate new times after a drag move
 */
export function calculateNewTimes(
  entry: TimetableEntry,
  deltaY: number,
  newDay: DayOfWeek | null,
  slotHeight: number
): { day: DayOfWeek; startTime: string; endTime: string } {
  const startMins = timeToMinutes(entry.startTime);
  const endMins = timeToMinutes(entry.endTime);
  const duration = endMins - startMins;

  const deltaMinutes = snapToGrid(pixelsToMinutes(deltaY, slotHeight));
  let newStart = startMins + deltaMinutes;

  // Clamp to grid bounds (08:00 to 22:00)
  newStart = Math.max(8 * 60, Math.min(22 * 60 - duration, newStart));
  newStart = snapToGrid(newStart);

  return {
    day: newDay || entry.day,
    startTime: minutesToTime(newStart),
    endTime: minutesToTime(newStart + duration),
  };
}

/**
 * Calculate new times after a resize operation
 */
export function calculateResizeTimes(
  entry: TimetableEntry,
  edge: 'top' | 'bottom',
  deltaY: number,
  slotHeight: number
): { startTime: string; endTime: string } {
  const startMins = timeToMinutes(entry.startTime);
  const endMins = timeToMinutes(entry.endTime);
  const deltaMinutes = snapToGrid(pixelsToMinutes(deltaY, slotHeight));

  if (edge === 'top') {
    let newStart = startMins + deltaMinutes;
    newStart = Math.max(8 * 60, Math.min(endMins - 30, newStart));
    newStart = snapToGrid(newStart);
    return { startTime: minutesToTime(newStart), endTime: entry.endTime };
  } else {
    let newEnd = endMins + deltaMinutes;
    newEnd = Math.max(startMins + 30, Math.min(22 * 60, newEnd));
    newEnd = snapToGrid(newEnd);
    return { startTime: entry.startTime, endTime: minutesToTime(newEnd) };
  }
}

/**
 * Detect if an entry at a given position would conflict with existing entries
 */
export function detectDragConflicts(
  day: DayOfWeek,
  startTime: string,
  endTime: string,
  excludeId: string | null,
  allEntries: TimetableEntry[]
): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  return allEntries.some(other => {
    if (other.id === excludeId || other.day !== day) return false;
    const otherStart = timeToMinutes(other.startTime);
    const otherEnd = timeToMinutes(other.endTime);
    return start < otherEnd && end > otherStart;
  });
}

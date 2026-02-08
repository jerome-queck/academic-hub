import type { AcademicWeek, AcademicCalendar, TimetableEntry, Examination, Timetable, DayOfWeek } from '../types';

// Default semester start dates (Monday of Week 1)
const DEFAULT_START_DATES: Record<string, string> = {
  'Y1S1': '2025-08-11',
  'Y1S2': '2026-01-12',
  'Y2S1': '2026-08-10',
  'Y2S2': '2027-01-11',
  'Y3S1': '2027-08-09',
  'Y3S2': '2028-01-10',
  'Y4S1': '2028-08-07',
  'Y4S2': '2029-01-08',
};

// Total structure: 7 teaching + 1 recess + 6 teaching + 4 exam = 18 weeks
const TEACHING_WEEKS_BEFORE_RECESS = 7;
const TEACHING_WEEKS_AFTER_RECESS = 6;
const DEFAULT_EXAM_WEEKS = 4;
const TOTAL_TEACHING_WEEKS = TEACHING_WEEKS_BEFORE_RECESS + TEACHING_WEEKS_AFTER_RECESS; // 13

const DAY_NAMES: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Get the default start date for a given year/semester.
 */
export function getDefaultStartDate(year: number, semester: number): string {
  const key = `Y${year}S${semester}`;
  return DEFAULT_START_DATES[key] || DEFAULT_START_DATES['Y1S1'];
}

/**
 * Parse an ISO date string to a Date at midnight local time.
 */
function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a Date as ISO date string (YYYY-MM-DD).
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Add a number of days to a date, returning a new Date.
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get the Monday of the week containing the given date.
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Generate the academic weeks for a semester.
 *
 * Structure:
 *   Weeks 1–7:  Teaching Week 1–7
 *   Week 8:     Recess Week
 *   Weeks 9–14: Teaching Week 8–13
 *   Weeks 15–18: Exam Week 1–4
 *
 * If endDate is provided and extends beyond the default exam period,
 * additional exam weeks are added. If it's shorter, fewer exam weeks are generated.
 */
export function generateAcademicWeeks(startDate: string, endDate?: string): AcademicWeek[] {
  const start = parseDate(startDate);
  const monday = getMonday(start); // Ensure we start on a Monday
  const weeks: AcademicWeek[] = [];

  let currentMonday = new Date(monday);
  let weekNumber = 1;
  let teachingWeek = 1;

  // Teaching weeks 1–7
  for (let i = 0; i < TEACHING_WEEKS_BEFORE_RECESS; i++) {
    weeks.push({
      weekNumber: weekNumber++,
      displayLabel: `Week ${teachingWeek}`,
      weekType: 'teaching',
      startDate: new Date(currentMonday),
      endDate: addDays(currentMonday, 6), // Sunday
    });
    teachingWeek++;
    currentMonday = addDays(currentMonday, 7);
  }

  // Recess week
  weeks.push({
    weekNumber: weekNumber++,
    displayLabel: 'Recess Week',
    weekType: 'recess',
    startDate: new Date(currentMonday),
    endDate: addDays(currentMonday, 6),
  });
  currentMonday = addDays(currentMonday, 7);

  // Teaching weeks 8–13
  for (let i = 0; i < TEACHING_WEEKS_AFTER_RECESS; i++) {
    weeks.push({
      weekNumber: weekNumber++,
      displayLabel: `Week ${teachingWeek}`,
      weekType: 'teaching',
      startDate: new Date(currentMonday),
      endDate: addDays(currentMonday, 6),
    });
    teachingWeek++;
    currentMonday = addDays(currentMonday, 7);
  }

  // Exam weeks
  if (endDate) {
    const end = parseDate(endDate);
    let examWeek = 1;
    while (currentMonday <= end) {
      weeks.push({
        weekNumber: weekNumber++,
        displayLabel: `Exam Week ${examWeek}`,
        weekType: 'exam',
        startDate: new Date(currentMonday),
        endDate: addDays(currentMonday, 6),
      });
      examWeek++;
      currentMonday = addDays(currentMonday, 7);
    }
  } else {
    // Default: 4 exam weeks
    for (let i = 0; i < DEFAULT_EXAM_WEEKS; i++) {
      weeks.push({
        weekNumber: weekNumber++,
        displayLabel: `Exam Week ${i + 1}`,
        weekType: 'exam',
        startDate: new Date(currentMonday),
        endDate: addDays(currentMonday, 6),
      });
      currentMonday = addDays(currentMonday, 7);
    }
  }

  return weeks;
}

/**
 * Get the academic week that contains a given date.
 */
export function getWeekForDate(date: Date, academicWeeks: AcademicWeek[]): AcademicWeek | null {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  for (const week of academicWeeks) {
    const start = new Date(week.startDate.getFullYear(), week.startDate.getMonth(), week.startDate.getDate());
    const end = new Date(week.endDate.getFullYear(), week.endDate.getMonth(), week.endDate.getDate());
    if (target >= start && target <= end) {
      return week;
    }
  }
  return null;
}

/**
 * Get the current academic week based on today's date.
 */
export function getCurrentAcademicWeek(academicWeeks: AcademicWeek[]): AcademicWeek | null {
  return getWeekForDate(new Date(), academicWeeks);
}

/**
 * Convert an AcademicWeek to its teaching week number (1–13).
 * Returns null for recess and exam weeks.
 */
export function getTeachingWeekNumber(academicWeek: AcademicWeek): number | null {
  if (academicWeek.weekType !== 'teaching') return null;
  // Weeks 1–7 map to teaching weeks 1–7
  if (academicWeek.weekNumber <= TEACHING_WEEKS_BEFORE_RECESS) {
    return academicWeek.weekNumber;
  }
  // Weeks 9–14 map to teaching weeks 8–13 (week 8 is recess)
  return academicWeek.weekNumber - 1; // subtract 1 for the recess week
}

/**
 * Check if a timetable entry is active during a given academic week.
 */
export function isEntryActiveInWeek(entry: TimetableEntry, academicWeek: AcademicWeek): boolean {
  if (!entry.recurring) {
    // One-off event: check if its specificDate falls within this week
    if (!entry.specificDate) return false;
    const eventDate = parseDate(entry.specificDate);
    const start = new Date(academicWeek.startDate.getFullYear(), academicWeek.startDate.getMonth(), academicWeek.startDate.getDate());
    const end = new Date(academicWeek.endDate.getFullYear(), academicWeek.endDate.getMonth(), academicWeek.endDate.getDate());
    if (eventDate < start || eventDate > end) return false;
    // Also check that the day of the week matches
    const dayIndex = eventDate.getDay(); // 0=Sun, 1=Mon, ...
    const dayName = DAY_NAMES[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert to our DayOfWeek
    return dayName === entry.day;
  }

  // Recurring event
  if (academicWeek.weekType === 'recess') {
    return entry.includeRecessWeek === true;
  }

  if (academicWeek.weekType === 'exam') {
    // Regular recurring classes don't occur during exam weeks
    return false;
  }

  // Teaching week: check if this teaching week is in the entry's weeks array
  const teachingWeek = getTeachingWeekNumber(academicWeek);
  if (teachingWeek === null) return false;

  // If weeks is undefined, the entry occurs on all 13 teaching weeks
  if (!entry.weeks) return true;

  return entry.weeks.includes(teachingWeek);
}

/**
 * Get all timetable entries that are active during a given academic week.
 */
export function getEntriesForWeek(entries: TimetableEntry[], academicWeek: AcademicWeek): TimetableEntry[] {
  return entries.filter(entry => isEntryActiveInWeek(entry, academicWeek));
}

/**
 * Get all examinations that fall within a given academic week.
 */
export function getExamsForWeek(examinations: Examination[], academicWeek: AcademicWeek): Examination[] {
  return examinations.filter(exam => {
    const examDate = parseDate(exam.date);
    const start = new Date(academicWeek.startDate.getFullYear(), academicWeek.startDate.getMonth(), academicWeek.startDate.getDate());
    const end = new Date(academicWeek.endDate.getFullYear(), academicWeek.endDate.getMonth(), academicWeek.endDate.getDate());
    return examDate >= start && examDate <= end;
  });
}

/**
 * Get upcoming exams from a list, sorted by date.
 */
export function getUpcomingExams(examinations: Examination[], fromDate?: Date, limit?: number): Examination[] {
  const from = fromDate || new Date();
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  const upcoming = examinations
    .filter(exam => parseDate(exam.date) >= today)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  return limit ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Get upcoming exams across all semesters/timetables.
 */
export function getAllUpcomingExams(timetables: Timetable[], limit?: number): Examination[] {
  const allExams = timetables.flatMap(tt => tt.examinations || []);
  return getUpcomingExams(allExams, undefined, limit);
}

/**
 * Auto-detect the current semester based on today's date and stored timetables.
 * Falls back to checking default start dates if no calendars are stored.
 */
export function getCurrentSemester(timetables: Timetable[]): { year: number; semester: number } | null {
  const today = new Date();

  // First try stored calendars
  for (const tt of timetables) {
    const startDate = tt.calendar?.startDate || getDefaultStartDate(tt.year, tt.semester);
    const weeks = generateAcademicWeeks(startDate, tt.calendar?.endDate);
    const currentWeek = getWeekForDate(today, weeks);
    if (currentWeek) {
      return { year: tt.year, semester: tt.semester };
    }
  }

  // Fall back to default dates for all possible year/semester combos
  for (let year = 1; year <= 4; year++) {
    for (let sem = 1; sem <= 2; sem++) {
      const startDate = getDefaultStartDate(year, sem);
      const weeks = generateAcademicWeeks(startDate);
      const currentWeek = getWeekForDate(today, weeks);
      if (currentWeek) {
        return { year, semester: sem };
      }
    }
  }

  return null;
}

/**
 * Get the academic weeks for a semester, using stored calendar or defaults.
 */
export function getAcademicWeeksForSemester(
  year: number,
  semester: number,
  calendar?: AcademicCalendar | null
): AcademicWeek[] {
  const startDate = calendar?.startDate || getDefaultStartDate(year, semester);
  return generateAcademicWeeks(startDate, calendar?.endDate);
}

/**
 * Get the day name for a Date object.
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const dayIndex = date.getDay(); // 0=Sun, 1=Mon, ...
  return DAY_NAMES[dayIndex === 0 ? 6 : dayIndex - 1];
}

/**
 * Format a date range for display (e.g., "11 Aug – 17 Aug 2025").
 */
export function formatDateRange(start: Date, end: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sDay = start.getDate();
  const sMonth = months[start.getMonth()];
  const eDay = end.getDate();
  const eMonth = months[end.getMonth()];
  const eYear = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${sDay} – ${eDay} ${sMonth} ${eYear}`;
  }
  return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${eYear}`;
}

/**
 * Format a single date for display (e.g., "11 Aug 2025").
 */
export function formatSingleDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Get the number of days between two dates.
 */
export function daysBetween(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format an ISO date string to "YYYY-MM-DD" for input[type="date"].
 */
export function toDateInputValue(iso: string): string {
  return iso; // Already in the right format
}

/**
 * Parse a date input value to ISO date string.
 */
export function fromDateInputValue(value: string): string {
  return value; // Already in ISO format
}

/**
 * Check if two week sets overlap (for conflict detection).
 * undefined means "all weeks".
 */
export function weeksOverlap(
  weeksA: number[] | undefined,
  includeRecessA: boolean | undefined,
  weeksB: number[] | undefined,
  includeRecessB: boolean | undefined
): boolean {
  // Check recess week overlap
  if (includeRecessA && includeRecessB) return true;

  // Check teaching week overlap
  if (!weeksA && !weeksB) return true; // Both are all weeks
  if (!weeksA) return true; // A is all weeks, B has some
  if (!weeksB) return true; // B is all weeks, A has some

  // Both have explicit week lists — check intersection
  return weeksA.some(w => weeksB.includes(w));
}

export { parseDate, formatDate, addDays, TOTAL_TEACHING_WEEKS, DEFAULT_EXAM_WEEKS };

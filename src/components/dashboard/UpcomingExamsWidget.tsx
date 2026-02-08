import { useMemo } from 'react';
import { useStore } from '../../store';
import { Card, CardHeader, Badge } from '../ui';
import { cn } from '../../lib/utils';
import { getAllUpcomingExams, daysBetween } from '../../utils/academic-calendar';

const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
];

export function UpcomingExamsWidget() {
  const { timetables, setCurrentView } = useStore();

  const upcomingExams = useMemo(() => getAllUpcomingExams(timetables, 5), [timetables]);

  // Build color map from all timetable entries
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let idx = 0;
    for (const tt of timetables) {
      const codes = new Set([
        ...tt.entries.map(e => e.moduleCode),
        ...(tt.examinations || []).map(e => e.moduleCode),
      ]);
      for (const code of codes) {
        if (!map[code]) {
          map[code] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          idx++;
        }
      }
    }
    return map;
  }, [timetables]);

  const formatExamDate = (dateStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayNames[date.getDay()]}, ${d} ${months[m - 1]}`;
  };

  const getCountdown = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const examDate = new Date(y, m - 1, d);
    const days = daysBetween(new Date(), examDate);
    if (days === 0) return { text: 'Today', urgency: 'critical' as const };
    if (days === 1) return { text: 'Tomorrow', urgency: 'critical' as const };
    if (days < 3) return { text: `in ${days} days`, urgency: 'critical' as const };
    if (days < 7) return { text: `in ${days} days`, urgency: 'warning' as const };
    if (days < 14) return { text: `in ${Math.floor(days / 7)} week${days >= 14 ? 's' : ''}`, urgency: 'normal' as const };
    return { text: `in ${Math.floor(days / 7)} weeks`, urgency: 'normal' as const };
  };

  const handleNavigate = () => {
    setCurrentView('timetable');
  };

  return (
    <Card>
      <CardHeader
        title="Upcoming Exams"
        subtitle={upcomingExams.length > 0 ? `${upcomingExams.length} upcoming` : undefined}
        action={
          upcomingExams.length > 0 ? (
            <button
              onClick={handleNavigate}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              View Timetable
            </button>
          ) : undefined
        }
      />

      {upcomingExams.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
          No upcoming exams
        </p>
      ) : (
        <div className="space-y-2">
          {upcomingExams.map((exam) => {
            const color = exam.color || colorMap[exam.moduleCode] || '#6B7280';
            const countdown = getCountdown(exam.date);

            return (
              <div
                key={exam.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {exam.moduleCode}
                    </span>
                    <Badge
                      size="sm"
                      variant={exam.examType === 'Final' ? 'danger' : exam.examType === 'Midterm' ? 'warning' : 'default'}
                    >
                      {exam.examType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatExamDate(exam.date)}</span>
                    <span>{exam.startTime}–{exam.endTime}</span>
                    {exam.venue && <span>{exam.venue}</span>}
                  </div>
                </div>
                <span className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  countdown.urgency === 'critical' && 'text-red-600 dark:text-red-400',
                  countdown.urgency === 'warning' && 'text-amber-600 dark:text-amber-400',
                  countdown.urgency === 'normal' && 'text-gray-500 dark:text-gray-400',
                )}>
                  {countdown.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

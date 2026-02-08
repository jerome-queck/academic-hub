import { useMemo } from 'react';
import { useStore } from '../../store';
import { Badge, Button } from '../ui';

interface ModuleTimetableSectionProps {
  moduleCode: string;
  year: number;
  semester: number;
  onAddClass?: () => void;
  onAddExam?: () => void;
}

export function ModuleTimetableSection({ moduleCode, year, semester, onAddClass, onAddExam }: ModuleTimetableSectionProps) {
  const timetables = useStore(state => state.timetables);

  const timetable = useMemo(() => {
    return timetables.find(t => t.year === year && t.semester === semester);
  }, [timetables, year, semester]);

  const entries = useMemo(() => {
    return (timetable?.entries || []).filter(e => e.moduleCode === moduleCode);
  }, [timetable, moduleCode]);

  const exams = useMemo(() => {
    return (timetable?.examinations || []).filter(e => e.moduleCode === moduleCode);
  }, [timetable, moduleCode]);

  if (entries.length === 0 && exams.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
        No timetable entries or exams.
        {(onAddClass || onAddExam) && (
          <div className="flex gap-2 mt-2">
            {onAddClass && <Button variant="ghost" size="sm" onClick={onAddClass}>Add Class</Button>}
            {onAddExam && <Button variant="ghost" size="sm" onClick={onAddExam}>Add Exam</Button>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Classes */}
      {entries.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Classes</p>
          <div className="space-y-1">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 text-sm py-1 px-2 rounded bg-gray-50 dark:bg-gray-800/50">
                <Badge size="sm" variant="default">{entry.classType}</Badge>
                <span className="text-gray-700 dark:text-gray-300">{entry.day}</span>
                <span className="text-gray-500 dark:text-gray-400">{entry.startTime}–{entry.endTime}</span>
                <span className="text-gray-400 dark:text-gray-500">{entry.venue}</span>
                {entry.recurring && entry.weeks && (
                  <span className="text-xs text-gray-400">Wk {entry.weeks.join(',')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exams */}
      {exams.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Exams</p>
          <div className="space-y-1">
            {exams.map(exam => (
              <div key={exam.id} className="flex items-center gap-3 text-sm py-1 px-2 rounded bg-amber-50 dark:bg-amber-900/20">
                <Badge size="sm" variant="warning">{exam.examType}</Badge>
                <span className="text-gray-700 dark:text-gray-300">{exam.date}</span>
                <span className="text-gray-500 dark:text-gray-400">{exam.startTime}–{exam.endTime}</span>
                <span className="text-gray-400 dark:text-gray-500">{exam.venue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(onAddClass || onAddExam) && (
        <div className="flex gap-2 pt-1">
          {onAddClass && <Button variant="ghost" size="sm" onClick={onAddClass}>Add Class</Button>}
          {onAddExam && <Button variant="ghost" size="sm" onClick={onAddExam}>Add Exam</Button>}
        </div>
      )}
    </div>
  );
}

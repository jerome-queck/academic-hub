import { useStore } from '../../store';
import { Card } from '../ui';
import { cn } from '../../lib/utils';

export function SemesterProgressWidget() {
  const { modules, selectedYear, selectedSem } = useStore();

  const semModules = modules.filter(
    (m) => m.year === selectedYear && m.semester === selectedSem
  );

  const completed = semModules.filter((m) => m.status === 'Completed').length;
  const inProgress = semModules.filter((m) => m.status === 'In Progress').length;
  const total = semModules.length;
  const percent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Card hover>
      <div className="h-[120px] flex flex-col justify-center">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Y{selectedYear}S{selectedSem} Progress
        </p>
        {total === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No modules in this semester</p>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{completed}</span>
              <span className="text-lg text-gray-400 dark:text-gray-500">/ {total}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">completed</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="flex h-full">
                <div
                  className={cn(
                    'h-full rounded-l-full transition-all duration-500',
                    percent >= 100 ? 'bg-success-500 rounded-r-full' : 'bg-primary-500'
                  )}
                  style={{ width: `${percent}%` }}
                />
                {inProgress > 0 && (
                  <div
                    className="h-full bg-warning-400 transition-all duration-500"
                    style={{ width: `${(inProgress / total) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span>{completed} done</span>
              {inProgress > 0 && <span>{inProgress} in progress</span>}
              {total - completed - inProgress > 0 && (
                <span>{total - completed - inProgress} planned</span>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

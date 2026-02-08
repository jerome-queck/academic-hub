import { useStore } from '../../store';
import type { ViewType } from '../../types';
import { cn } from '../../lib/utils';

const actions: Array<{ label: string; view: ViewType; icon: string }> = [
  { label: 'Add Module', view: 'modules', icon: 'M12 4v16m8-8H4' },
  { label: 'Timetable', view: 'timetable', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Analytics', view: 'analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Goals', view: 'goals', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { label: 'Planner', view: 'planner', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Predictions', view: 'predictions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

export function QuickActionsWidget() {
  const { setCurrentView } = useStore();

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.view}
          onClick={() => setCurrentView(action.view)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
            'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400',
            'hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400',
            'border border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800'
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
          </svg>
          {action.label}
        </button>
      ))}
    </div>
  );
}

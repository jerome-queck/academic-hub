import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore, useDeanListOverrides } from '../../store';
import { getDeanListData } from '../../services/analytics';
import { Card, CardHeader, Badge } from '../ui';
import { cn } from '../../lib/utils';

export function DeanListTracker() {
  const { modules, setDeanListOverride } = useStore();
  const overrides = useDeanListOverrides();
  const data = getDeanListData(modules);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Dean's List Tracker"
          subtitle="Eligibility per academic year"
        />
        <div className="py-8 text-center text-gray-400 dark:text-gray-500">
          No completed year data available
        </div>
      </Card>
    );
  }

  const confirmedCount = data.filter(d => {
    const override = overrides[d.year];
    return override === true || (override === undefined && d.eligible);
  }).length;

  return (
    <Card>
      <CardHeader
        title="Dean's List Tracker"
        subtitle={`${confirmedCount} of ${data.length} year${data.length !== 1 ? 's' : ''} on Dean's List`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((yearData, index) => {
          const override = overrides[yearData.year];
          const isOnList = override !== undefined ? override : yearData.eligible;
          const isExpanded = expandedYear === yearData.year;

          return (
            <motion.div
              key={yearData.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={cn(
                'rounded-xl border-2 p-4 transition-colors',
                isOnList
                  ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
              )}
            >
              {/* Year Header */}
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900 dark:text-white text-base">
                  {yearData.label}
                </p>
                <div className="flex items-center gap-1.5">
                  {isOnList ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-success-500">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <Badge variant="success" size="sm">
                        {override === true ? 'Confirmed' : 'Eligible'}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                      <Badge variant={override === false ? 'danger' : 'default'} size="sm">
                        {override === false ? 'Not Received' : 'Not Eligible'}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Year Stats */}
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{yearData.gpa.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Year GPA</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{yearData.gradedAU}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Graded AU</p>
                </div>
              </div>

              {/* Manual Override Toggle */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Override:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDeanListOverride(yearData.year, override === true ? undefined : true)}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-md transition-colors',
                      override === true
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400 font-medium'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeanListOverride(yearData.year, override === false ? undefined : false)}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-md transition-colors',
                      override === false
                        ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-400 font-medium'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    No
                  </button>
                  {override !== undefined && (
                    <button
                      onClick={() => setDeanListOverride(yearData.year, undefined)}
                      className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Auto
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Semester Breakdown */}
              {yearData.semesters.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpandedYear(isExpanded ? null : yearData.year)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {isExpanded ? 'Hide' : 'Show'} semester breakdown
                  </button>
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5">
                      {yearData.semesters.map(sem => (
                        <div key={sem.label} className="flex items-center justify-between text-sm px-2 py-1 rounded-lg bg-white/50 dark:bg-gray-900/30">
                          <span className="text-gray-600 dark:text-gray-400">{sem.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 dark:text-white">{sem.gpa.toFixed(2)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{sem.gradedAU} AU</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Eligibility criteria: Year GPA &ge; 4.50 and &ge; 15 graded AU
      </p>
    </Card>
  );
}

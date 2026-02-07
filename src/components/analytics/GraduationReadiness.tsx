import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getGraduationReadiness } from '../../services/analytics';
import { Card, CardHeader, Badge } from '../ui';
import { cn } from '../../lib/utils';

export function GraduationReadiness() {
  const { modules, targetAU } = useStore();
  const data = getGraduationReadiness(modules, targetAU);

  const isOnTrack = data.remainingAU <= data.plannedAU + data.inProgressAU;
  const circumference = 2 * Math.PI * 54; // radius=54
  const strokeDashoffset = circumference - (data.percentComplete / 100) * circumference;

  const stats = [
    { label: 'Completed', value: data.completedAU, color: 'text-success-600 dark:text-success-400' },
    { label: 'In Progress', value: data.inProgressAU, color: 'text-warning-600 dark:text-warning-400' },
    { label: 'Planned', value: data.plannedAU, color: 'text-gray-600 dark:text-gray-300' },
    { label: 'Remaining', value: data.remainingAU, color: 'text-danger-600 dark:text-danger-400' },
  ];

  return (
    <Card>
      <CardHeader
        title="Graduation Readiness"
        subtitle={`Target: ${data.targetAU} AU`}
      />

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke={isOnTrack ? '#22c55e' : '#f59e0b'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              transform="rotate(-90 64 64)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(data.percentComplete)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">complete</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-center"
              >
                <p className={cn('text-xl font-bold', stat.color)}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label} AU</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-center">
            <Badge variant={isOnTrack ? 'success' : 'warning'} size="sm">
              {isOnTrack ? 'On Track' : 'Needs Attention'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Module type coverage */}
      {data.typeCoverage.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Module Type Coverage
          </p>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    AU
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.typeCoverage.map((tc) => (
                  <tr
                    key={tc.type}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-2 text-gray-700 dark:text-gray-300">
                      {tc.type}
                    </td>
                    <td className="px-6 py-2 text-center text-gray-600 dark:text-gray-400">
                      {tc.count}
                    </td>
                    <td className="px-6 py-2 text-center text-gray-600 dark:text-gray-400">
                      {tc.au}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

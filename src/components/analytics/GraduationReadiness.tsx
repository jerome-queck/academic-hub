import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore, useModuleTypeRequirements } from '../../store';
import { getGraduationReadiness } from '../../services/analytics';
import { Card, CardHeader, Badge } from '../ui';
import { cn } from '../../lib/utils';
import { MODULE_TYPES } from '../../types';
import type { ModuleType } from '../../types';

export function GraduationReadiness() {
  const { modules, targetAU, setModuleTypeRequirements } = useStore();
  const requirements = useModuleTypeRequirements();
  const data = getGraduationReadiness(modules, targetAU, requirements);
  const [showEditReqs, setShowEditReqs] = useState(false);
  const [editReqs, setEditReqs] = useState<Record<string, string>>({});

  const isOnTrack = data.remainingAU <= data.plannedAU + data.inProgressAU;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (data.percentComplete / 100) * circumference;

  const stats = [
    { label: 'Completed', value: data.completedAU, color: 'text-success-600 dark:text-success-400' },
    { label: 'In Progress', value: data.inProgressAU, color: 'text-warning-600 dark:text-warning-400' },
    { label: 'Planned', value: data.plannedAU, color: 'text-gray-600 dark:text-gray-300' },
    { label: 'Remaining', value: data.remainingAU, color: 'text-danger-600 dark:text-danger-400' },
  ];

  const hasRequirements = Object.keys(requirements).length > 0;

  const handleOpenEditReqs = () => {
    // Initialize edit state from current requirements
    const initial: Record<string, string> = {};
    MODULE_TYPES.forEach(t => {
      initial[t] = requirements[t]?.toString() || '';
    });
    setEditReqs(initial);
    setShowEditReqs(true);
  };

  const handleSaveReqs = () => {
    const newReqs: Partial<Record<ModuleType, number>> = {};
    MODULE_TYPES.forEach(t => {
      const val = parseInt(editReqs[t] || '');
      if (!isNaN(val) && val > 0) {
        newReqs[t] = val;
      }
    });
    setModuleTypeRequirements(newReqs);
    setShowEditReqs(false);
  };

  return (
    <Card>
      <CardHeader
        title="Graduation Readiness"
        subtitle={`Target: ${data.targetAU} AU`}
        action={
          <button
            onClick={handleOpenEditReqs}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            {hasRequirements ? 'Edit' : 'Set'} AU Requirements
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700" />
            <motion.circle
              cx="64" cy="64" r="54" fill="none"
              stroke={isOnTrack ? '#22c55e' : '#f59e0b'}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              transform="rotate(-90 64 64)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(data.percentComplete)}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">complete</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
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

      {/* Edit Requirements Panel */}
      {showEditReqs && (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Set AU Requirements per Module Type</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditReqs(false)}
                className="px-3 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReqs}
                className="px-3 py-1 text-xs rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODULE_TYPES.map(type => (
              <div key={type} className="flex items-center gap-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 w-24 truncate" title={type}>{type}</label>
                <input
                  type="number"
                  min={0}
                  max={130}
                  placeholder="—"
                  value={editReqs[type] || ''}
                  onChange={(e) => setEditReqs(prev => ({ ...prev, [type]: e.target.value }))}
                  className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-center"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module type coverage */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Module Type Coverage (Completed Only)
        </p>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">AU</th>
                  {hasRequirements && (
                    <th className="px-6 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Required</th>
                  )}
                  {hasRequirements && (
                    <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">Progress</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.typeCoverage.map((tc) => (
                  <tr key={tc.type} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-2 text-gray-700 dark:text-gray-300">{tc.type}</td>
                    <td className="px-6 py-2 text-center text-gray-600 dark:text-gray-400">{tc.count}</td>
                    <td className="px-6 py-2 text-center text-gray-600 dark:text-gray-400">{tc.au}</td>
                    {hasRequirements && (
                      <td className="px-6 py-2 text-center text-gray-600 dark:text-gray-400">
                        {tc.requiredAU !== null ? `${tc.requiredAU}` : '—'}
                      </td>
                    )}
                    {hasRequirements && (
                      <td className="px-6 py-2">
                        {tc.requiredAU !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  tc.percentComplete >= 100 ? 'bg-success-500' :
                                  tc.percentComplete >= 50 ? 'bg-warning-500' : 'bg-danger-500'
                                )}
                                style={{ width: `${Math.min(100, tc.percentComplete)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                              {Math.round(tc.percentComplete)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </Card>
  );
}

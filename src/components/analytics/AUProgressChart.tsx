import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getAUProgressData } from '../../services/analytics';
import { Card, CardHeader } from '../ui';
import { cn } from '../../lib/utils';

export function AUProgressChart() {
  const { modules, targetAU, setTargetAU } = useStore();
  const auData = getAUProgressData(modules, targetAU);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(targetAU));

  const percentComplete = (auData.completed / auData.targetTotal) * 100;
  const percentInProgress = (auData.inProgress / auData.targetTotal) * 100;
  const percentPlanned = (auData.planned / auData.targetTotal) * 100;

  const segments = [
    {
      label: 'Completed',
      value: auData.completed,
      percent: percentComplete,
      color: 'bg-success-500',
    },
    {
      label: 'In Progress',
      value: auData.inProgress,
      percent: percentInProgress,
      color: 'bg-warning-500',
    },
    {
      label: 'Planned',
      value: auData.planned,
      percent: percentPlanned,
      color: 'bg-gray-300 dark:bg-gray-600',
    },
  ];

  const handleEditStart = () => {
    setEditValue(String(targetAU));
    setIsEditing(true);
  };

  const handleEditConfirm = () => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 300) {
      setTargetAU(parsed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditConfirm();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const subtitleContent = (
    <span className="inline-flex items-center gap-1.5">
      {isEditing ? (
        <>
          <span>{auData.completed} / </span>
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={handleKeyDown}
            min={1}
            max={300}
            autoFocus
            className="w-16 px-1.5 py-0.5 text-sm rounded border border-primary-400 dark:border-primary-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span> AU completed</span>
        </>
      ) : (
        <>
          <span>{auData.completed} / {auData.targetTotal} AU completed</span>
          <button
            onClick={handleEditStart}
            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Edit target AU"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
        </>
      )}
    </span>
  );

  return (
    <Card>
      <CardHeader
        title="AU Progress"
        subtitle={subtitleContent}
      />

      {/* Progress bar */}
      <div className="h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex">
        {segments.map((segment, index) => (
          <motion.div
            key={segment.label}
            initial={{ width: 0 }}
            animate={{ width: `${segment.percent}%` }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
            className={cn('h-full', segment.color)}
            title={`${segment.label}: ${segment.value} AU`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', segment.color)} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {segment.label}: <span className="font-semibold">{segment.value} AU</span>
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-success-600 dark:text-success-400">
            {Math.round(percentComplete)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {auData.targetTotal - auData.total}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">AU Remaining</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {auData.total}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Tracked</p>
        </div>
      </div>
    </Card>
  );
}

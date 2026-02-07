import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { Card, CardHeader, Badge, Button, CircularProgress, LinearProgress } from '../ui';
import { PageHeader } from '../layout';
import { cn } from '../../lib/utils';
import {
  calculateGoalProgress,
  getAllSemesterProgress,
  getGoalTrajectory,
} from '../../services/goals';
import { GoalSettingsModal } from './GoalSettingsModal';

export function GoalDashboard() {
  const { modules, goals } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  const progress = calculateGoalProgress(modules, goals);
  const semesterProgress = getAllSemesterProgress(modules, goals);
  const trajectory = getGoalTrajectory(modules, goals);

  const statusColors = {
    achieved: 'success',
    'on-track': 'primary',
    'at-risk': 'warning',
    critical: 'danger',
  } as const;

  const statusLabels = {
    achieved: 'Goal Achieved!',
    'on-track': 'On Track',
    'at-risk': 'At Risk',
    critical: 'Needs Attention',
  };

  const trendIcons = {
    improving: (
      <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    declining: (
      <svg className="w-5 h-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    stable: (
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
  };

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Track your progress towards your GPA targets"
        action={
          <Button onClick={() => setShowSettings(true)} variant="primary">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Set Goals
          </Button>
        }
      />

      {/* Main Progress Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Primary Goal Progress */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col md:flex-row items-center gap-8 p-4">
            <CircularProgress
              value={progress.current}
              max={5}
              target={progress.target}
              size={180}
              strokeWidth={12}
              formatValue={(v) => v.toFixed(2)}
              label="CGPA"
            />

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Target: {progress.target.toFixed(2)}
                </h2>
                <Badge variant={statusColors[progress.status]} size="lg">
                  {statusLabels[progress.status]}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Current CGPA</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {progress.current.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Projected Final</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {progress.projectedFinal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Gap to Target</span>
                  <span className={cn(
                    'font-semibold',
                    progress.difference > 0 ? 'text-danger-500' : 'text-success-500'
                  )}>
                    {progress.difference > 0 ? '-' : '+'}{Math.abs(progress.difference).toFixed(2)}
                  </span>
                </div>

                {progress.requiredGPA > 0 && progress.status !== 'achieved' && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You need an average of{' '}
                      <span className={cn(
                        'font-bold',
                        progress.requiredGPA > 5 ? 'text-danger-500' : 'text-primary-600'
                      )}>
                        {progress.requiredGPA > 5 ? '5.00+' : progress.requiredGPA.toFixed(2)}
                      </span>{' '}
                      in remaining modules to reach your target.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Trend Card */}
        <Card>
          <CardHeader title="Trend Analysis" />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {trendIcons[trajectory.trend]}
              <div>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {trajectory.trend}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Based on recent semesters
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Variance from Target
                </span>
                <span className={cn(
                  'font-semibold text-sm',
                  trajectory.variance >= 0 ? 'text-success-500' : 'text-danger-500'
                )}>
                  {trajectory.variance >= 0 ? '+' : ''}{trajectory.variance.toFixed(2)}
                </span>
              </div>
              <LinearProgress
                value={Math.min(progress.current, 5)}
                max={5}
                variant={
                  trajectory.variance >= 0 ? 'success' :
                  trajectory.variance >= -0.3 ? 'warning' : 'danger'
                }
                size="md"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Semester Breakdown */}
      <Card>
        <CardHeader
          title="Semester Progress"
          subtitle="Track your performance across semesters"
        />

        {semesterProgress.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No completed semesters yet</p>
            <p className="text-sm mt-1">Add modules to start tracking your progress</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {semesterProgress.map((sem, index) => (
              <motion.div
                key={sem.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  sem.progress.status === 'achieved' && 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20',
                  sem.progress.status === 'on-track' && 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20',
                  sem.progress.status === 'at-risk' && 'border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/20',
                  sem.progress.status === 'critical' && 'border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {sem.label}
                  </span>
                  <Badge variant={statusColors[sem.progress.status]} size="sm">
                    {sem.progress.current.toFixed(2)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{sem.moduleCount} modules</span>
                    <span>{sem.totalAU} AU</span>
                  </div>

                  <LinearProgress
                    value={sem.progress.current}
                    max={5}
                    variant={
                      sem.progress.status === 'on-track' ? 'default' :
                      sem.progress.status === 'achieved' ? 'success' :
                      sem.progress.status === 'at-risk' ? 'warning' : 'danger'
                    }
                    size="sm"
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Target: {sem.progress.target.toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Goal Settings Modal */}
      <GoalSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

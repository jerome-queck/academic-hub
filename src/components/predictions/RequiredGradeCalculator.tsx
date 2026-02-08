import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { Card, CardHeader, Slider, Badge } from '../ui';
import { cn } from '../../lib/utils';
import { projectGraduationGPA } from '../../services/predictions';

export function RequiredGradeCalculator() {
  const { modules, goals } = useStore();
  const [targetGPA, setTargetGPA] = useState(goals.targetCGPA);

  const projection = useMemo(
    () => projectGraduationGPA(modules, targetGPA),
    [modules, targetGPA]
  );

  const classificationForGPA = (gpa: number) => {
    if (gpa >= 4.5) return { label: 'First Class Honours', color: 'text-success-600' };
    if (gpa >= 4.0) return { label: 'Second Class Upper', color: 'text-primary-600' };
    if (gpa >= 3.5) return { label: 'Second Class Lower', color: 'text-blue-600' };
    if (gpa >= 3.0) return { label: 'Third Class', color: 'text-warning-600' };
    if (gpa >= 2.0) return { label: 'Pass', color: 'text-gray-600' };
    return { label: 'Below Pass', color: 'text-danger-600' };
  };

  const targetClass = classificationForGPA(targetGPA);

  return (
    <Card>
      <CardHeader
        title="Required Grade Calculator"
        subtitle="Find out what you need to reach your target"
      />

      {/* Target GPA Slider */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <Slider
          label="Target GPA"
          value={targetGPA}
          onChange={setTargetGPA}
          min={0}
          max={5}
          step={0.1}
          formatValue={(v) => v.toFixed(2)}
          marks={[
            { value: 3.0, label: '3.0' },
            { value: 3.5, label: '3.5' },
            { value: 4.0, label: '4.0' },
            { value: 4.5, label: '4.5' },
            { value: 5, label: '5.0' },
          ]}
        />
        <p className={cn('text-sm font-medium mt-4', targetClass.color)}>
          {targetClass.label}
        </p>
      </div>

      {/* Projection Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {projection.current.toFixed(2)}
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projected</p>
          <p className="text-2xl font-bold text-primary-600">
            {projection.projected.toFixed(2)}
          </p>
        </div>

        <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
          <p className="text-xs text-success-600 dark:text-success-400 mb-1">Best Case</p>
          <p className="text-2xl font-bold text-success-600">
            {projection.best.toFixed(2)}
          </p>
        </div>

        <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
          <p className="text-xs text-danger-600 dark:text-danger-400 mb-1">Worst Case</p>
          <p className="text-2xl font-bold text-danger-600">
            {projection.worst.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Required Average */}
      <div
        className={cn(
          'p-4 rounded-xl mb-6',
          projection.toTarget.achievable
            ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
            : 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Required Average in Remaining Modules
            </p>
            <p
              className={cn(
                'text-3xl font-bold mt-1',
                projection.toTarget.achievable
                  ? 'text-primary-600'
                  : 'text-danger-600'
              )}
            >
              {projection.toTarget.averageNeeded > 5
                ? '5.00+'
                : projection.toTarget.averageNeeded.toFixed(2)}
            </p>
          </div>

          <Badge
            variant={projection.toTarget.achievable ? 'success' : 'danger'}
            size="lg"
          >
            {projection.toTarget.achievable ? 'Achievable' : 'Not Achievable'}
          </Badge>
        </div>

        {!projection.toTarget.achievable && (
          <p className="text-sm text-danger-600 mt-2">
            Even with straight A+ grades, this target is not achievable with your current GPA.
          </p>
        )}
      </div>

    </Card>
  );
}

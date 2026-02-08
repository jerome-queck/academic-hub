import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { PageHeader } from '../layout';
import { Card, CardHeader, Badge } from '../ui';
import { GPATrendChart } from './GPATrendChart';
import { GradeDistributionChart } from './GradeDistributionChart';
import { AUProgressChart } from './AUProgressChart';
import { WorkloadChart } from './WorkloadChart';
import { CumulativeVsSemesterChart } from './CumulativeVsSemesterChart';
import { DeanListTracker } from './DeanListTracker';
import { GraduationReadiness } from './GraduationReadiness';
import {
  getPerformanceInsights,
  getSemesterChanges,
  getModuleTypeBreakdown,
} from '../../services/analytics';
import { cn } from '../../lib/utils';

export function AnalyticsDashboard() {
  const { modules } = useStore();
  const insights = getPerformanceInsights(modules);
  const semesterChanges = getSemesterChanges(modules);
  const completedModules = modules.filter(m => m.status === 'Completed');
  const typeBreakdown = getModuleTypeBreakdown(completedModules);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Visualize your academic performance"
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <GPATrendChart />
        <GradeDistributionChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <AUProgressChart />
        </div>

        {/* Performance Insights */}
        <Card>
          <CardHeader title="Insights" subtitle="Key performance metrics" />
          <div className="space-y-4">
            {insights.bestSemester && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Best Semester
                </span>
                <div className="text-right">
                  <span className="font-semibold text-success-600 dark:text-success-400">
                    {insights.bestSemester.label}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({insights.bestSemester.gpa.toFixed(2)})
                  </span>
                </div>
              </div>
            )}

            {insights.worstSemester && insights.bestSemester?.label !== insights.worstSemester.label && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Needs Improvement
                </span>
                <div className="text-right">
                  <span className="font-semibold text-warning-600 dark:text-warning-400">
                    {insights.worstSemester.label}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({insights.worstSemester.gpa.toFixed(2)})
                  </span>
                </div>
              </div>
            )}

            {insights.bestModule && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Top Module
                </span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {insights.bestModule.code}
                  </span>
                  <Badge variant="success" size="sm" className="ml-2">
                    {insights.bestModule.grade}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Avg AU/Semester
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {insights.averageAUPerSemester}
              </span>
            </div>

            {insights.strongestType && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Strongest Area
                </span>
                <Badge variant="primary" size="sm">
                  {insights.strongestType}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* New Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <WorkloadChart />
        <CumulativeVsSemesterChart />
      </div>

      {/* Dean's List Tracker */}
      <div className="mb-6">
        <DeanListTracker />
      </div>

      {/* Graduation Readiness */}
      <div className="mb-6">
        <GraduationReadiness />
      </div>

      {/* Semester Changes */}
      {semesterChanges.length > 0 && (
        <Card className="mb-6">
          <CardHeader
            title="Semester Performance"
            subtitle="GPA changes between semesters"
          />
          <div className="flex flex-wrap gap-3">
            {semesterChanges.map((change, index) => (
              <motion.div
                key={change.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'px-4 py-2 rounded-xl border-2',
                  change.improved
                    ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20'
                    : 'border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20'
                )}
              >
                <p className="font-semibold text-gray-900 dark:text-white">
                  {change.label}
                </p>
                <p
                  className={cn(
                    'text-sm font-medium',
                    change.improved ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {change.improved ? '+' : ''}
                  {change.change.toFixed(2)}
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Module Type Breakdown */}
      {typeBreakdown.length > 0 && (
        <Card>
          <CardHeader
            title="Module Categories"
            subtitle="Performance by module type"
          />
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Modules
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    AU
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg GPA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {typeBreakdown.map((type) => (
                  <tr
                    key={type.type}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Badge variant="default">{type.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                      {type.count}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                      {type.au}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          'font-semibold',
                          type.averageGPA >= 4.5
                            ? 'text-success-600'
                            : type.averageGPA >= 4.0
                            ? 'text-primary-600'
                            : type.averageGPA >= 3.5
                            ? 'text-blue-600'
                            : 'text-warning-600'
                        )}
                      >
                        {type.averageGPA.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

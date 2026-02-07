import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getDeanListData } from '../../services/analytics';
import { Card, CardHeader, Badge } from '../ui';
import { cn } from '../../lib/utils';

export function DeanListTracker() {
  const { modules } = useStore();
  const data = getDeanListData(modules);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Dean's List Tracker"
          subtitle="Eligibility per semester"
        />
        <div className="py-8 text-center text-gray-400 dark:text-gray-500">
          No semester data available
        </div>
      </Card>
    );
  }

  const eligibleCount = data.filter((d) => d.eligible).length;

  return (
    <Card>
      <CardHeader
        title="Dean's List Tracker"
        subtitle={`${eligibleCount} of ${data.length} semester${data.length !== 1 ? 's' : ''} eligible`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {data.map((semester, index) => (
          <motion.div
            key={semester.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={cn(
              'rounded-xl border-2 p-3 text-center transition-colors',
              semester.eligible
                ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
            )}
          >
            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
              {semester.label}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {semester.gpa.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {semester.gradedAU} graded AU
            </p>
            <div className="flex items-center justify-center gap-1">
              {semester.eligible ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-success-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Badge variant="success" size="sm">
                    Eligible
                  </Badge>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-gray-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Badge variant="default" size="sm">
                    Not Eligible
                  </Badge>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Requirements: Semester GPA &ge; 4.50 and &ge; 15 graded AU
      </p>
    </Card>
  );
}

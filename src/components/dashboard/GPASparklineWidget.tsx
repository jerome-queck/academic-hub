import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { calculateCompositeStats } from '../../utils/gpa';
import { getGPATrendData } from '../../services/analytics';
import { Card } from '../ui';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts';

export function GPASparklineWidget() {
  const { modules } = useStore();
  const cumulativeStats = calculateCompositeStats(modules);
  const trendData = getGPATrendData(modules);

  const gpa = cumulativeStats.official.gpa;
  const projected = cumulativeStats.projected.gpa;

  return (
    <Card hover>
      <div className="relative h-[120px]">
        {/* Sparkline background */}
        {trendData.length >= 2 && (
          <div className="absolute inset-0 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <YAxis domain={['dataMin - 0.3', 'dataMax + 0.3']} hide />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* GPA overlay */}
        <div className="relative z-10 flex flex-col justify-center h-full">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cumulative GPA</p>
          <motion.p
            className="text-4xl font-bold text-primary-600 dark:text-primary-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {gpa.toFixed(2)}
          </motion.p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Projected: {projected.toFixed(2)}
            {trendData.length >= 2 && (
              <span className="ml-2">
                {trendData[trendData.length - 1].value >= trendData[trendData.length - 2].value
                  ? '↑'
                  : '↓'
                }
              </span>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

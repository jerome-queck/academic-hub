import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getCumulativeVsSemesterData } from '../../services/analytics';
import { Card, CardHeader } from '../ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function CumulativeVsSemesterChart() {
  const { modules } = useStore();
  const data = getCumulativeVsSemesterData(modules);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader
          title="GPA Comparison"
          subtitle="Cumulative vs semester GPA"
        />
        <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
          No GPA data available
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card>
        <CardHeader
          title="GPA Comparison"
          subtitle="Cumulative vs semester GPA"
        />
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
                label={{
                  value: 'GPA',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#9ca3af',
                  fontSize: 12,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
                formatter={(value, name) => [
                  Number(value).toFixed(2),
                  name === 'cumulativeGPA' ? 'Cumulative GPA' : 'Semester GPA',
                ]}
              />
              <Legend
                formatter={(value: string) =>
                  value === 'cumulativeGPA' ? 'Cumulative GPA' : 'Semester GPA'
                }
                wrapperStyle={{ color: '#9ca3af' }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeGPA"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="semesterGPA"
                stroke="#82ca9d"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ fill: '#82ca9d', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}

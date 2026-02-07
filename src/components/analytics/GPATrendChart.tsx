import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useStore } from '../../store';
import { getGPATrendData } from '../../services/analytics';
import { Card, CardHeader } from '../ui';

export function GPATrendChart() {
  const { modules, goals } = useStore();
  const trendData = getGPATrendData(modules);

  if (trendData.length === 0) {
    return (
      <Card>
        <CardHeader title="GPA Trend" subtitle="Track your CGPA over time" />
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Add completed modules to see your GPA trend
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="GPA Trend" subtitle="Track your CGPA over time" />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400 text-xs"
            />
            <YAxis
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={{ fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400 text-xs"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                borderColor: 'var(--tooltip-border, #e5e7eb)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'var(--tooltip-text, #374151)' }}
            />
            <Legend />

            {/* Target reference line */}
            <ReferenceLine
              y={goals.targetCGPA}
              stroke="#22c55e"
              strokeDasharray="5 5"
              label={{
                value: `Target: ${goals.targetCGPA}`,
                position: 'insideTopRight',
                fill: '#22c55e',
                fontSize: 12,
              }}
            />

            {/* Official GPA line */}
            <Line
              type="monotone"
              dataKey="value"
              name="CGPA"
              stroke="#0c87eb"
              strokeWidth={3}
              dot={{ fill: '#0c87eb', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />

            {/* Projected GPA line */}
            <Line
              type="monotone"
              dataKey="projected"
              name="Projected"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

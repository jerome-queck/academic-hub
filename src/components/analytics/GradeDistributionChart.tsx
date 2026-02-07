import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useStore } from '../../store';
import { getGradePointDistribution } from '../../services/analytics';
import { Card, CardHeader } from '../ui';

// Colors for each grade
const GRADE_COLORS: Record<string, string> = {
  'A+': '#22c55e',
  'A': '#4ade80',
  'A-': '#86efac',
  'B+': '#0ea5e9',
  'B': '#38bdf8',
  'B-': '#7dd3fc',
  'C+': '#f59e0b',
  'C': '#fbbf24',
  'D+': '#f97316',
  'D': '#fb923c',
  'F': '#ef4444',
};

export function GradeDistributionChart() {
  const { modules } = useStore();
  const distribution = getGradePointDistribution(modules);

  if (distribution.length === 0) {
    return (
      <Card>
        <CardHeader title="Grade Distribution" subtitle="Your grades at a glance" />
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No graded modules yet
        </div>
      </Card>
    );
  }

  const data = distribution.map(d => ({
    name: d.label,
    value: d.value,
    color: GRADE_COLORS[d.label] || '#9ca3af',
  }));

  return (
    <Card>
      <CardHeader title="Grade Distribution" subtitle="Your grades at a glance" />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
              }
              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                borderColor: 'var(--tooltip-border, #e5e7eb)',
                borderRadius: '8px',
              }}
              formatter={(value?: number | string, name?: string) => {
                const numValue = typeof value === 'number' ? value : 0;
                return [
                  `${numValue} module${numValue > 1 ? 's' : ''}`,
                  name ?? '',
                ];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

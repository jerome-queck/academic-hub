import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getSemesterWorkloadData } from '../../services/analytics';
import { Card, CardHeader } from '../ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

function getBarColor(value: number): string {
  if (value > 21) return '#ef4444'; // red
  if (value < 12 || value > 18) return '#eab308'; // yellow
  return '#22c55e'; // green
}

export function WorkloadChart() {
  const { modules } = useStore();
  const data = getSemesterWorkloadData(modules);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Semester Workload"
          subtitle="AU per semester"
        />
        <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
          No semester data available
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader
          title="Semester Workload"
          subtitle="AU per semester"
        />
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
                label={{
                  value: 'AU',
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
                formatter={(value) => [`${value} AU`, 'Workload']}
              />
              <ReferenceLine
                y={12}
                stroke="#eab308"
                strokeDasharray="5 5"
                label={{ value: 'Min (12)', fill: '#eab308', fontSize: 11, position: 'right' }}
              />
              <ReferenceLine
                y={21}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: 'Max (21)', fill: '#ef4444', fontSize: 11, position: 'right' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>15-18 AU (ideal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>{'<12 or >18 AU'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>{'>21 AU (overload)'}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

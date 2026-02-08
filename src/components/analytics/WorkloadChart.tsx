import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore, useWorkloadThresholds } from '../../store';
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

export function WorkloadChart() {
  const { modules, setWorkloadThresholds } = useStore();
  const thresholds = useWorkloadThresholds();
  const data = getSemesterWorkloadData(modules);
  const [showSettings, setShowSettings] = useState(false);

  function getBarColor(value: number): string {
    if (value > thresholds.warningMax) return '#ef4444'; // red
    if (value < thresholds.idealMin || value > thresholds.idealMax) return '#eab308'; // yellow
    return '#22c55e'; // green
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Semester Workload"
          subtitle="AU per semester"
        />
        <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
          No completed semester data available
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
          action={
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Configure thresholds"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          }
        />

        {/* Inline threshold settings */}
        {showSettings && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Workload Thresholds</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Ideal Min AU</label>
                <input
                  type="number"
                  min={1}
                  max={thresholds.idealMax - 1}
                  value={thresholds.idealMin}
                  onChange={(e) => setWorkloadThresholds({ idealMin: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Ideal Max AU</label>
                <input
                  type="number"
                  min={thresholds.idealMin + 1}
                  max={thresholds.warningMax - 1}
                  value={thresholds.idealMax}
                  onChange={(e) => setWorkloadThresholds({ idealMax: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Overload AU</label>
                <input
                  type="number"
                  min={thresholds.idealMax + 1}
                  max={40}
                  value={thresholds.warningMax}
                  onChange={(e) => setWorkloadThresholds({ warningMax: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        )}

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
                y={thresholds.idealMin}
                stroke="#eab308"
                strokeDasharray="5 5"
                label={{ value: `Min (${thresholds.idealMin})`, fill: '#eab308', fontSize: 11, position: 'right' }}
              />
              <ReferenceLine
                y={thresholds.warningMax}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: `Max (${thresholds.warningMax})`, fill: '#ef4444', fontSize: 11, position: 'right' }}
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
            <span>{thresholds.idealMin}-{thresholds.idealMax} AU (ideal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>{`<${thresholds.idealMin} or >${thresholds.idealMax} AU`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>{`>${thresholds.warningMax} AU (overload)`}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

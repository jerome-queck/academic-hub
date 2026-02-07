import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CircularProgressProps {
  value: number;
  max?: number;
  target?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  label?: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function CircularProgress({
  value,
  max = 100,
  target,
  size = 120,
  strokeWidth = 8,
  showValue = true,
  formatValue = (v) => v.toFixed(2),
  label,
  className,
  variant = 'default',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  // Target marker position
  const targetPercentage = target ? Math.min((target / max) * 100, 100) : null;

  const variantColors = {
    default: 'text-primary-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    danger: 'text-danger-500',
  };

  // Determine color based on progress toward target
  let progressColor = variantColors[variant];
  if (target !== undefined && variant === 'default') {
    if (value >= target) {
      progressColor = 'text-success-500';
    } else if (value >= target * 0.8) {
      progressColor = 'text-primary-500';
    } else if (value >= target * 0.6) {
      progressColor = 'text-warning-500';
    } else {
      progressColor = 'text-danger-500';
    }
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={progressColor}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />

        {/* Target marker */}
        {targetPercentage !== null && (
          <>
            {/* Target line */}
            <line
              x1={size / 2}
              y1={strokeWidth / 2}
              x2={size / 2}
              y2={strokeWidth * 1.5}
              stroke="currentColor"
              strokeWidth={2}
              className="text-gray-600 dark:text-gray-400"
              transform={`rotate(${(targetPercentage / 100) * 360} ${size / 2} ${size / 2})`}
            />
          </>
        )}
      </svg>

      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className={cn(
              'font-bold',
              size >= 100 ? 'text-2xl' : 'text-lg',
              progressColor.replace('text-', 'text-').replace('-500', '-600')
            )}
          >
            {formatValue(value)}
          </motion.span>
          {label && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {label}
            </span>
          )}
          {target !== undefined && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              / {formatValue(target)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Linear progress bar variant
export interface LinearProgressProps {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  animated?: boolean;
}

export function LinearProgress({
  value,
  max = 100,
  showValue = false,
  size = 'md',
  variant = 'default',
  className,
  animated = true,
}: LinearProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantColors = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizes[size]
        )}
      >
        <motion.div
          className={cn('h-full rounded-full', variantColors[variant])}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

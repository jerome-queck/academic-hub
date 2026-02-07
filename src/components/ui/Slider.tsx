import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  marks?: Array<{ value: number; label: string }>;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      label,
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      showValue = true,
      formatValue = (v) => v.toString(),
      marks,
      disabled,
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={cn('w-full', className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-2">
            {label && (
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                {formatValue(value)}
              </span>
            )}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            disabled={disabled}
            className={cn(
              'w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-5',
              '[&::-webkit-slider-thumb]:h-5',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:bg-primary-600',
              '[&::-webkit-slider-thumb]:border-2',
              '[&::-webkit-slider-thumb]:border-white',
              '[&::-webkit-slider-thumb]:shadow-md',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:transition-transform',
              '[&::-webkit-slider-thumb]:hover:scale-110',
              '[&::-moz-range-thumb]:w-5',
              '[&::-moz-range-thumb]:h-5',
              '[&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:bg-primary-600',
              '[&::-moz-range-thumb]:border-2',
              '[&::-moz-range-thumb]:border-white',
              '[&::-moz-range-thumb]:shadow-md',
              '[&::-moz-range-thumb]:cursor-pointer'
            )}
            style={{
              background: `linear-gradient(to right, rgb(var(--color-primary-600, 37 99 235)) ${percentage}%, rgb(var(--color-gray-200, 229 231 235)) ${percentage}%)`,
            }}
            {...props}
          />
          {/* Track fill */}
          <div
            className="absolute top-0 left-0 h-2 bg-primary-600 rounded-full pointer-events-none"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Marks */}
        {marks && marks.length > 0 && (
          <div className="relative mt-2">
            {marks.map((mark) => {
              const position = ((mark.value - min) / (max - min)) * 100;
              return (
                <span
                  key={mark.value}
                  className="absolute text-xs text-gray-500 dark:text-gray-400 -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  {mark.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };

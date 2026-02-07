import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      options,
      placeholder,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const inputId = props.id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'block w-full rounded-xl appearance-none',
              'border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-white',
              'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              'px-4 py-2.5 pr-10 text-sm',
              error && 'border-danger-500 focus:ring-danger-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };

// Inline select for table use
export interface InlineSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

const InlineSelect = forwardRef<HTMLSelectElement, InlineSelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'rounded-lg appearance-none cursor-pointer',
          'border border-transparent',
          'bg-gray-50 dark:bg-gray-700',
          'text-gray-900 dark:text-white',
          'hover:border-gray-300 dark:hover:border-gray-600',
          'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-colors duration-200',
          'px-2 py-1 pr-6 text-sm',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

InlineSelect.displayName = 'InlineSelect';

export { InlineSelect };

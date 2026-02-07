import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  className,
  onClick,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        rounded ? 'rounded-full' : 'rounded-md',
        variants[variant],
        sizes[size],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </span>
  );
}

// Status badge with dot indicator
export interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'success' | 'warning' | 'danger';
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const dotColors = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    busy: 'bg-danger-500',
    away: 'bg-warning-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  const textColors = {
    online: 'text-success-700 dark:text-success-400',
    offline: 'text-gray-600 dark:text-gray-400',
    busy: 'text-danger-700 dark:text-danger-400',
    away: 'text-warning-700 dark:text-warning-400',
    success: 'text-success-700 dark:text-success-400',
    warning: 'text-warning-700 dark:text-warning-400',
    danger: 'text-danger-700 dark:text-danger-400',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        textColors[status],
        className
      )}
    >
      <span
        className={cn(
          'rounded-full animate-pulse',
          dotColors[status],
          dotSizes[size]
        )}
      />
      {label && (
        <span className={cn('font-medium', textSizes[size])}>
          {label}
        </span>
      )}
    </span>
  );
}

// Removable badge/tag
export interface TagProps {
  children: ReactNode;
  onRemove?: () => void;
  variant?: 'default' | 'primary';
  className?: string;
}

export function Tag({
  children,
  onRemove,
  variant = 'default',
  className,
}: TagProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm',
        variants[variant],
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Remove"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
    );

    const variants = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700',
        'focus:ring-primary-500',
        'dark:bg-primary-500 dark:hover:bg-primary-600'
      ),
      secondary: cn(
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
        'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
      ),
      ghost: cn(
        'bg-transparent text-gray-600',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
        'dark:text-gray-300 dark:hover:bg-gray-800'
      ),
      danger: cn(
        'bg-danger-500 text-white',
        'hover:bg-danger-600',
        'focus:ring-danger-500'
      ),
      success: cn(
        'bg-success-500 text-white',
        'hover:bg-success-600',
        'focus:ring-success-500'
      ),
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        type={props.type || 'button'}
        onClick={props.onClick}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        name={props.name}
        id={props.id}
        aria-label={props['aria-label']}
        aria-disabled={props['aria-disabled']}
        title={props.title}
        form={props.form}
        tabIndex={props.tabIndex}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'glass';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      children,
      variant = 'default',
      hover = false,
      padding = 'md',
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'rounded-2xl',
      'bg-white dark:bg-gray-800',
      'transition-all duration-200'
    );

    const variants = {
      default: 'shadow-soft',
      bordered: 'border border-gray-200 dark:border-gray-700',
      elevated: 'shadow-medium',
      glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white/20',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hover
      ? 'hover:-translate-y-0.5 hover:shadow-medium cursor-pointer'
      : '';

    return (
      <motion.div
        ref={ref}
        initial={hover ? { y: 0 } : undefined}
        whileHover={hover ? { y: -2 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(baseStyles, variants[variant], paddings[padding], hoverStyles, className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-start justify-between mb-4', className)}
      {...props}
    >
      {(title || subtitle) ? (
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      ) : (
        children
      )}
      {action && <div>{action}</div>}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };

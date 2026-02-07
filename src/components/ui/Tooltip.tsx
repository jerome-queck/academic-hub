import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positions = {
    top: {
      tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      arrow: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700 border-x-transparent border-b-transparent',
      initial: { opacity: 0, y: 5 },
      animate: { opacity: 1, y: 0 },
    },
    bottom: {
      tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
      arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700 border-x-transparent border-t-transparent',
      initial: { opacity: 0, y: -5 },
      animate: { opacity: 1, y: 0 },
    },
    left: {
      tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
      arrow: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700 border-y-transparent border-r-transparent',
      initial: { opacity: 0, x: 5 },
      animate: { opacity: 1, x: 0 },
    },
    right: {
      tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
      arrow: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-y-transparent border-l-transparent',
      initial: { opacity: 0, x: -5 },
      animate: { opacity: 1, x: 0 },
    },
  };

  const positionConfig = positions[position];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={positionConfig.initial}
            animate={positionConfig.animate}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 pointer-events-none',
              positionConfig.tooltip
            )}
          >
            <div
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium',
                'bg-gray-900 dark:bg-gray-700 text-white',
                'shadow-lg whitespace-nowrap',
                className
              )}
            >
              {content}
              {/* Arrow */}
              <div
                className={cn(
                  'absolute w-0 h-0 border-4',
                  positionConfig.arrow
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Info tooltip with icon
export interface InfoTooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function InfoTooltip({ content, position = 'top', className }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position={position} className={className}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs cursor-help">
        ?
      </span>
    </Tooltip>
  );
}

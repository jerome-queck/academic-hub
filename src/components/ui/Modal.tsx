import { Fragment, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'w-full',
                sizes[size],
                'bg-white dark:bg-gray-800',
                'rounded-2xl shadow-strong',
                'max-h-[90vh] overflow-hidden flex flex-col'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between p-6 pb-0">
                  <div>
                    {title && (
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className={cn(
                        'p-2 -m-2 rounded-lg',
                        'text-gray-400 hover:text-gray-600',
                        'dark:text-gray-500 dark:hover:text-gray-300',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'transition-colors'
                      )}
                      aria-label="Close modal"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {children}
              </div>
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

// Confirm dialog variant
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: 'bg-danger-500 hover:bg-danger-600',
    warning: 'bg-warning-500 hover:bg-warning-600',
    info: 'bg-primary-500 hover:bg-primary-600',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-xl font-medium',
              'bg-gray-100 text-gray-700 hover:bg-gray-200',
              'dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
              'transition-colors'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-xl font-medium text-white',
              variantStyles[variant],
              'transition-colors',
              'disabled:opacity-50'
            )}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

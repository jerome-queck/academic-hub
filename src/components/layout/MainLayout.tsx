import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  onAddModule?: () => void;
}

export function MainLayout({ children, onAddModule }: MainLayoutProps) {
  const { sidebarOpen } = useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <Header
        onMenuClick={() => setMobileNavOpen(true)}
        onAddModule={onAddModule}
      />

      <div className="flex">
        {/* Desktop Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="hidden lg:block fixed left-0 top-16 bottom-0 overflow-hidden z-30"
            >
              <Sidebar />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileNavOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              {/* Sidebar */}
              <motion.aside
                initial={{ x: -256 }}
                animate={{ x: 0 }}
                exit={{ x: -256 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 z-50"
              >
                <Sidebar onClose={() => setMobileNavOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.main
          layout
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)] transition-all duration-200',
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          )}
        >
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={useStore.getState().currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

// Page header component for consistent page titles
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-1 text-gray-500 dark:text-gray-400"
          >
            {description}
          </motion.p>
        )}
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </motion.div>
  );
}

import { useState, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { cn } from '../lib/utils';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'modules' | 'theme';
  icon?: ReactElement;
}

interface CommandPaletteProps {
  onAddModule?: () => void;
  onToggleTheme?: () => void;
}

export function CommandPalette({ onAddModule, onToggleTheme }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { modules, setCurrentView } = useStore();

  // Listen for keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setQuery('');
        setSelectedIndex(0);
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Build commands list
  const commands: Command[] = useMemo(() => {
    const navigateCommands: Command[] = [
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        shortcut: 'D',
        action: () => { setCurrentView('dashboard'); setIsOpen(false); },
        category: 'navigation',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>,
      },
      {
        id: 'nav-modules',
        label: 'Go to Modules',
        shortcut: 'M',
        action: () => { setCurrentView('modules'); setIsOpen(false); },
        category: 'navigation',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>,
      },
      {
        id: 'nav-analytics',
        label: 'Go to Analytics',
        shortcut: 'A',
        action: () => { setCurrentView('analytics'); setIsOpen(false); },
        category: 'navigation',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" /></svg>,
      },
      {
        id: 'nav-goals',
        label: 'Go to Goals',
        shortcut: 'G',
        action: () => { setCurrentView('goals'); setIsOpen(false); },
        category: 'navigation',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" /></svg>,
      },
      {
        id: 'nav-predictions',
        label: 'Go to Predictions',
        shortcut: 'P',
        action: () => { setCurrentView('predictions'); setIsOpen(false); },
        category: 'navigation',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      },
      {
        id: 'nav-planner',
        label: 'Go to Course Planner',
        action: () => { setCurrentView('planner'); setIsOpen(false); },
        category: 'navigation',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      },
    ];

    const actionCommands: Command[] = [
      {
        id: 'action-add-module',
        label: 'Add New Module',
        shortcut: 'N',
        action: () => { onAddModule?.(); setIsOpen(false); },
        category: 'actions',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
      },
      {
        id: 'action-toggle-theme',
        label: 'Toggle Theme',
        shortcut: 'T',
        action: () => { onToggleTheme?.(); setIsOpen(false); },
        category: 'theme',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
      },
    ];

    const moduleCommands: Command[] = modules.slice(0, 10).map((m) => ({
      id: `module-${m.id}`,
      label: `${m.code}: ${m.name}`,
      action: () => {
        // TODO: Open edit modal for this module
        setIsOpen(false);
      },
      category: 'modules',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    }));

    return [...navigateCommands, ...actionCommands, ...moduleCommands];
  }, [modules, setCurrentView, onAddModule, onToggleTheme]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(lowerQuery) ||
        c.category.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    modules: 'Modules',
    theme: 'Appearance',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', damping: 30, stiffness: 500 }}
              className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-strong overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base"
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-80 overflow-y-auto scrollbar-thin p-2"
              >
                {filteredCommands.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No results found for "{query}"
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, cmds]) => (
                    <div key={category} className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {categoryLabels[category] || category}
                      </div>
                      {cmds.map((command) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <button
                            key={command.id}
                            data-index={globalIndex}
                            onClick={() => command.action()}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                              isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/20'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  'flex-shrink-0',
                                  isSelected
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-400 dark:text-gray-500'
                                )}
                              >
                                {command.icon}
                              </span>
                              <span
                                className={cn(
                                  'text-sm',
                                  isSelected
                                    ? 'text-primary-600 dark:text-primary-400 font-medium'
                                    : 'text-gray-700 dark:text-gray-300'
                                )}
                              >
                                {command.label}
                              </span>
                            </div>
                            {command.shortcut && (
                              <kbd
                                className={cn(
                                  'text-xs px-1.5 py-0.5 rounded',
                                  isSelected
                                    ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-600 dark:text-primary-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                )}
                              >
                                {command.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
                  <span>Select</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

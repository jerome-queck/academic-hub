import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { generateId } from '../../lib/utils';
import { AddPlannedModuleModal } from './AddPlannedModuleModal';
import type { PlannedModule, ModuleType } from '../../types';

// Color map for module types
const MODULE_TYPE_COLORS: Record<ModuleType, { bg: string; text: string; badge: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'default' }> = {
  'Core': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', badge: 'info' },
  'BDE': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', badge: 'primary' },
  'ICC-Core': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', badge: 'primary' },
  'ICC-Professional Series': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', badge: 'primary' },
  'ICC-CSL': { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-400', badge: 'success' },
  'FYP': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', badge: 'warning' },
  'Mathematics PE': { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-400', badge: 'info' },
  'Physics PE': { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-400', badge: 'info' },
  'UE': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', badge: 'success' },
  'Other': { bg: 'bg-gray-50 dark:bg-gray-700/30', text: 'text-gray-600 dark:text-gray-400', badge: 'default' },
};

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];

export function CoursePlanner() {
  const { plannedModules, modules, deletePlannedModule, batchAddPlannedToModules } = useStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalYear, setAddModalYear] = useState(1);
  const [addModalSem, setAddModalSem] = useState(1);
  const [editModule, setEditModule] = useState<PlannedModule | null>(null);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);

  // Group planned modules by year and semester
  const groupedModules = useMemo(() => {
    const map: Record<string, PlannedModule[]> = {};
    for (const y of YEARS) {
      for (const s of SEMESTERS) {
        map[`${y}-${s}`] = [];
      }
    }
    for (const pm of plannedModules) {
      const key = `${pm.year}-${pm.semester}`;
      if (map[key]) {
        map[key].push(pm);
      }
    }
    return map;
  }, [plannedModules]);

  // Build a set of all module codes placed before a given (year, semester) for prereq checking
  const codesBeforeSemester = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const y of YEARS) {
      for (const s of SEMESTERS) {
        const codes = new Set<string>();
        // Collect all codes from earlier semesters
        for (const py of YEARS) {
          for (const ps of SEMESTERS) {
            if (py < y || (py === y && ps < s)) {
              const key = `${py}-${ps}`;
              for (const pm of groupedModules[key] || []) {
                codes.add(pm.code);
              }
            }
          }
        }
        // Also include codes from tracked modules in earlier semesters
        for (const m of modules) {
          if (m.year < y || (m.year === y && m.semester < s)) {
            codes.add(m.code);
          }
        }
        map[`${y}-${s}`] = codes;
      }
    }
    return map;
  }, [groupedModules, modules]);

  // Summary stats
  const totalPlannedAU = useMemo(
    () => plannedModules.reduce((sum, m) => sum + m.au, 0),
    [plannedModules]
  );

  const handleOpenAdd = (year: number, semester: number) => {
    setEditModule(null);
    setAddModalYear(year);
    setAddModalSem(semester);
    setAddModalOpen(true);
  };

  const handleEdit = (mod: PlannedModule) => {
    setEditModule(mod);
    setAddModalYear(mod.year);
    setAddModalSem(mod.semester);
    setAddModalOpen(true);
  };

  const handleAddToModules = () => {
    const allIds = plannedModules.map((m) => m.id);
    if (allIds.length > 0) {
      batchAddPlannedToModules(allIds);
    }
    setConfirmAddOpen(false);
  };

  const handleImportFromModules = () => {
    const { addPlannedModule } = useStore.getState();
    const existingCodes = new Set(plannedModules.map((pm) => pm.code));
    for (const mod of modules) {
      if (!existingCodes.has(mod.code)) {
        addPlannedModule({
          id: generateId(),
          code: mod.code,
          name: mod.name,
          au: mod.au,
          type: mod.type,
          year: mod.year,
          semester: mod.semester,
          prerequisiteCodes: mod.prerequisiteCodes,
        });
      }
    }
    setConfirmImportOpen(false);
  };

  const hasPrereqWarning = (mod: PlannedModule, year: number, semester: number): boolean => {
    if (mod.prerequisiteCodes.length === 0) return false;
    const available = codesBeforeSemester[`${year}-${semester}`];
    if (!available) return false;
    return mod.prerequisiteCodes.some((code) => !available.has(code));
  };

  const getMissingPrereqs = (mod: PlannedModule, year: number, semester: number): string[] => {
    if (mod.prerequisiteCodes.length === 0) return [];
    const available = codesBeforeSemester[`${year}-${semester}`];
    if (!available) return mod.prerequisiteCodes;
    return mod.prerequisiteCodes.filter((code) => !available.has(code));
  };

  return (
    <div>
      <PageHeader
        title="Course Planner"
        description="Plan your modules across all 4 years"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmImportOpen(true)}
              disabled={modules.length === 0}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import from Modules
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setConfirmAddOpen(true)}
              disabled={plannedModules.length === 0}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add to Modules
            </Button>
          </div>
        }
      />

      {/* Summary bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4 mb-6"
      >
        <Badge variant="primary" size="lg" rounded>
          {plannedModules.length} planned module{plannedModules.length !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="info" size="lg" rounded>
          {totalPlannedAU} total AU
        </Badge>
      </motion.div>

      {/* Year x Semester grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {YEARS.map((year) =>
          SEMESTERS.map((sem) => {
            const key = `${year}-${sem}`;
            const semModules = groupedModules[key] || [];
            const semAU = semModules.reduce((s, m) => s + m.au, 0);
            const auWarning = semAU > 21 ? 'high' : semAU > 0 && semAU < 12 ? 'low' : null;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (year - 1) * 0.05 + (sem - 1) * 0.025 }}
              >
                <Card
                  variant="bordered"
                  padding="none"
                  className={cn(
                    'overflow-hidden',
                    auWarning === 'high' && 'ring-2 ring-danger-400/50',
                    auWarning === 'low' && 'ring-2 ring-warning-400/50'
                  )}
                >
                  {/* Semester header */}
                  <div className={cn(
                    'px-4 py-3 flex items-center justify-between',
                    'bg-gray-50 dark:bg-gray-800/50',
                    'border-b border-gray-200 dark:border-gray-700'
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        Y{year}S{sem}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {semModules.length} mod{semModules.length !== 1 ? 's' : ''}
                      </span>
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        auWarning === 'high'
                          ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                          : auWarning === 'low'
                          ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      )}>
                        {semAU} AU
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenAdd(year, sem)}
                      className={cn(
                        'w-7 h-7 flex items-center justify-center rounded-lg',
                        'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'transition-colors'
                      )}
                      aria-label={`Add module to Y${year}S${sem}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  {/* AU warnings */}
                  {auWarning === 'high' && (
                    <div className="px-4 py-1.5 text-xs text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/10 border-b border-danger-100 dark:border-danger-800/30">
                      Warning: exceeds 21 AU
                    </div>
                  )}
                  {auWarning === 'low' && (
                    <div className="px-4 py-1.5 text-xs text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/10 border-b border-warning-100 dark:border-warning-800/30">
                      Below minimum 12 AU
                    </div>
                  )}

                  {/* Module list */}
                  <div className="p-2 space-y-1.5 min-h-[80px]">
                    <AnimatePresence mode="popLayout">
                      {semModules.length === 0 && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-gray-400 dark:text-gray-500 text-center py-6"
                        >
                          No modules planned
                        </motion.p>
                      )}
                      {semModules.map((mod) => {
                        const colors = MODULE_TYPE_COLORS[mod.type] || MODULE_TYPE_COLORS['Other'];
                        const prereqWarn = hasPrereqWarning(mod, year, sem);
                        const missing = prereqWarn ? getMissingPrereqs(mod, year, sem) : [];

                        return (
                          <motion.div
                            key={mod.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={cn(
                              'group relative rounded-xl p-2.5',
                              'border border-gray-100 dark:border-gray-700',
                              'hover:border-gray-200 dark:hover:border-gray-600',
                              'transition-colors cursor-pointer',
                              colors.bg
                            )}
                            onClick={() => handleEdit(mod)}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {prereqWarn && (
                                    <span
                                      className="flex-shrink-0"
                                      title={`Missing prerequisites: ${missing.join(', ')}`}
                                    >
                                      <svg className="w-3.5 h-3.5 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                  <span className={cn('text-xs font-bold', colors.text)}>
                                    {mod.code}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 truncate mt-0.5">
                                  {mod.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Badge variant={colors.badge} size="sm" rounded>
                                    {mod.type}
                                  </Badge>
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                    {mod.au} AU
                                  </span>
                                </div>
                                {prereqWarn && (
                                  <p className="text-[10px] text-warning-600 dark:text-warning-400 mt-1">
                                    Missing: {missing.join(', ')}
                                  </p>
                                )}
                              </div>
                              {/* Delete button (visible on hover) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePlannedModule(mod.id);
                                }}
                                className={cn(
                                  'opacity-0 group-hover:opacity-100',
                                  'p-1 rounded-lg',
                                  'text-gray-400 hover:text-danger-500',
                                  'hover:bg-danger-50 dark:hover:bg-danger-900/20',
                                  'transition-all'
                                )}
                                aria-label={`Delete ${mod.code}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddPlannedModuleModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditModule(null);
        }}
        year={addModalYear}
        semester={addModalSem}
        editModule={editModule}
      />

      {/* Confirm: Add all planned to tracked modules */}
      <ConfirmDialog
        isOpen={confirmAddOpen}
        onClose={() => setConfirmAddOpen(false)}
        onConfirm={handleAddToModules}
        title="Add Planned Modules"
        message={`This will add ${plannedModules.length} planned module${plannedModules.length !== 1 ? 's' : ''} to your tracked modules list. Modules with duplicate codes will be skipped.`}
        confirmText="Add All"
        variant="info"
      />

      {/* Confirm: Import from tracked modules */}
      <ConfirmDialog
        isOpen={confirmImportOpen}
        onClose={() => setConfirmImportOpen(false)}
        onConfirm={handleImportFromModules}
        title="Import from Modules"
        message={`This will copy ${modules.length} tracked module${modules.length !== 1 ? 's' : ''} into the planner. Existing planned modules with the same code will not be duplicated.`}
        confirmText="Import"
        variant="info"
      />
    </div>
  );
}

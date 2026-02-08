import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { Module, TimetableEntry, Examination } from '../../types';

/** Draggable module chip for creating new entries by dropping on the timetable grid */
function DraggableModuleChip({
  mod,
  color,
  classCount,
  examCount,
  onClick,
}: {
  mod: Module;
  color: string;
  classCount: number;
  examCount: number;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `module-panel-${mod.code}`,
    data: {
      type: 'new-entry',
      moduleCode: mod.code,
      moduleName: mod.name,
      color,
    },
  });

  const style: React.CSSProperties = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : {};

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm cursor-grab',
        isDragging && 'opacity-50 shadow-lg cursor-grabbing'
      )}
      style={style}
      {...listeners}
      {...attributes}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="font-medium text-gray-700 dark:text-gray-300">{mod.code}</span>
      <span className="text-gray-400 dark:text-gray-500 text-xs">
        {classCount + examCount > 0 ? `(${classCount}${examCount > 0 ? `+${examCount}` : ''})` : ''}
      </span>
    </button>
  );
}

interface ModulePanelProps {
  modules: Module[];
  timetableEntries: TimetableEntry[];
  examinations: Examination[];
  colorMap: Record<string, string>;
  onAddClass: (module: Module) => void;
  onAddExam: (module: Module) => void;
  onAddManualEvent: () => void;
}

export function ModulePanel({
  modules,
  timetableEntries,
  examinations,
  colorMap,
  onAddClass,
  onAddExam,
  onAddManualEvent,
}: ModulePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const getClassCount = (code: string) => timetableEntries.filter(e => e.moduleCode === code).length;
  const getExamCount = (code: string) => examinations.filter(e => e.moduleCode === code).length;

  if (modules.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          No modules in this semester. Add modules first, then add classes and exams here.
        </p>
        <div className="flex justify-center mt-2">
          <Button variant="ghost" size="sm" onClick={onAddManualEvent}>
            Add Manual Event
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Fixed summary strip — always visible */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {modules.map((mod) => {
              const color = colorMap[mod.code] || '#6B7280';
              const classes = getClassCount(mod.code);
              const exams = getExamCount(mod.code);
              return (
                <DraggableModuleChip
                  key={mod.id}
                  mod={mod}
                  color={color}
                  classCount={classes}
                  examCount={exams}
                  onClick={() => {
                    setIsExpanded(true);
                    setExpandedModuleId(mod.id);
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onAddManualEvent}>
            Manual
          </Button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map((mod) => {
                  const color = colorMap[mod.code] || '#6B7280';
                  const classes = getClassCount(mod.code);
                  const exams = getExamCount(mod.code);
                  const isModExpanded = expandedModuleId === mod.id;

                  // Get entries and exams for this module
                  const modEntries = timetableEntries.filter(e => e.moduleCode === mod.code);
                  const modExams = examinations.filter(e => e.moduleCode === mod.code);

                  return (
                    <div
                      key={mod.id}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        isModExpanded
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <button
                          onClick={() => setExpandedModuleId(isModExpanded ? null : mod.id)}
                          className="flex items-center gap-2 text-left"
                        >
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <div>
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                              {mod.code}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                              {mod.name}
                            </p>
                          </div>
                        </button>
                        <div className="flex gap-1">
                          {classes > 0 && (
                            <Badge size="sm" variant="default">{classes} class{classes !== 1 ? 'es' : ''}</Badge>
                          )}
                          {exams > 0 && (
                            <Badge size="sm" variant="warning">{exams} exam{exams !== 1 ? 's' : ''}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onAddClass(mod)}
                          className="flex-1"
                          leftIcon={
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          }
                        >
                          Class
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onAddExam(mod)}
                          className="flex-1"
                          leftIcon={
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          }
                        >
                          Exam
                        </Button>
                      </div>

                      {/* Expanded mini-list of existing entries */}
                      {isModExpanded && (modEntries.length > 0 || modExams.length > 0) && (
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-600 space-y-1">
                          {modEntries.map(entry => (
                            <div key={entry.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <span className="font-medium">{entry.classType}</span>
                              <span>{entry.day} {entry.startTime}–{entry.endTime}</span>
                              <span className="text-gray-400">{entry.venue}</span>
                            </div>
                          ))}
                          {modExams.map(exam => (
                            <div key={exam.id} className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium">{exam.examType}</span>
                              <span>{exam.date} {exam.startTime}</span>
                              <span className="text-gray-400">{exam.venue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Manual Event Card */}
                <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 flex items-center justify-center">
                  <Button variant="ghost" size="sm" onClick={onAddManualEvent}>
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Manual Event
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

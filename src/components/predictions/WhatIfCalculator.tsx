import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { Card, CardHeader, Button, Badge, Select } from '../ui';
import { cn } from '../../lib/utils';
import {
  calculateWhatIfScenario,
  calculateGradeImpact,
  getImprovableModules,
} from '../../services/predictions';
import { calculateCompositeStats, GRADE_POINTS } from '../../utils/gpa';
import type { Module } from '../../types';

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D+', 'D', 'F'] as const;
type NonNullGrade = typeof GRADE_OPTIONS[number];

interface GradeChange {
  moduleId: string;
  newGrade: NonNullGrade;
}

export function WhatIfCalculator() {
  const { modules } = useStore();
  const [changes, setChanges] = useState<GradeChange[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');

  const improvableModules = useMemo(() => getImprovableModules(modules), [modules]);
  const currentStats = useMemo(() => calculateCompositeStats(modules), [modules]);

  const scenario = useMemo(() => {
    if (changes.length === 0) return null;
    return calculateWhatIfScenario(modules, changes);
  }, [modules, changes]);

  const gpaDifference = scenario
    ? scenario.resultingGPA - currentStats.projected.gpa
    : 0;

  const handleAddChange = () => {
    if (!selectedModule) return;

    const module = modules.find(m => m.id === selectedModule);
    if (!module) return;

    // Default to one grade higher or A+
    const currentPoints = module.grade && GRADE_POINTS[module.grade] !== undefined
      ? GRADE_POINTS[module.grade]
      : 0;
    let defaultGrade: NonNullGrade = 'A+';

    for (const grade of GRADE_OPTIONS) {
      if (grade && GRADE_POINTS[grade] > currentPoints) {
        defaultGrade = grade;
        break;
      }
    }

    setChanges(prev => {
      // Remove existing change for this module
      const filtered = prev.filter(c => c.moduleId !== selectedModule);
      return [...filtered, { moduleId: selectedModule, newGrade: defaultGrade }];
    });
    setSelectedModule('');
  };

  const handleUpdateGrade = (moduleId: string, newGrade: NonNullGrade) => {
    setChanges(prev =>
      prev.map(c => (c.moduleId === moduleId ? { ...c, newGrade } : c))
    );
  };

  const handleRemoveChange = (moduleId: string) => {
    setChanges(prev => prev.filter(c => c.moduleId !== moduleId));
  };

  const getModuleInfo = (moduleId: string): Module | undefined => {
    return modules.find(m => m.id === moduleId);
  };

  const availableModules = improvableModules.filter(
    m => !changes.some(c => c.moduleId === m.id)
  );

  return (
    <Card>
      <CardHeader
        title="What-If Calculator"
        subtitle="Simulate grade changes and see the impact"
      />

      {/* Current vs Scenario GPA */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Current GPA</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentStats.projected.gpa.toFixed(2)}
            </p>
          </div>

          {scenario && (
            <>
              <div className="flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Projected GPA
                </p>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    gpaDifference > 0
                      ? 'text-success-600'
                      : gpaDifference < 0
                      ? 'text-danger-600'
                      : 'text-gray-900 dark:text-white'
                  )}
                >
                  {scenario.resultingGPA.toFixed(2)}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Change</p>
                <p
                  className={cn(
                    'text-xl font-semibold',
                    gpaDifference > 0
                      ? 'text-success-600'
                      : gpaDifference < 0
                      ? 'text-danger-600'
                      : 'text-gray-600'
                  )}
                >
                  {gpaDifference > 0 ? '+' : ''}
                  {gpaDifference.toFixed(3)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Module Selector */}
      {availableModules.length > 0 && (
        <div className="mb-6 flex gap-3">
          <Select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="flex-1"
          >
            <option value="">Select a module to modify...</option>
            {availableModules.map(m => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name} ({m.grade || 'No grade'})
              </option>
            ))}
          </Select>
          <Button onClick={handleAddChange} disabled={!selectedModule}>
            Add
          </Button>
        </div>
      )}

      {/* Changes List */}
      <AnimatePresence>
        {changes.length > 0 && (
          <div className="space-y-3">
            {changes.map(change => {
              const module = getModuleInfo(change.moduleId);
              if (!module) return null;

              const impact = calculateGradeImpact(modules, change.moduleId, change.newGrade);

              return (
                <motion.div
                  key={change.moduleId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {module.code}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {module.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm">
                      {module.grade || '-'}
                    </Badge>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <Select
                      value={change.newGrade ?? ''}
                      onChange={(e) =>
                        handleUpdateGrade(change.moduleId, e.target.value as NonNullGrade)
                      }
                      className="w-20"
                    >
                      {GRADE_OPTIONS.map(grade => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="text-right w-16">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        impact.impact > 0
                          ? 'text-success-600'
                          : impact.impact < 0
                          ? 'text-danger-600'
                          : 'text-gray-500'
                      )}
                    >
                      {impact.impact > 0 ? '+' : ''}
                      {impact.impact.toFixed(3)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveChange(change.moduleId)}
                    className="p-1 text-gray-400 hover:text-danger-500 transition-colors"
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
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {changes.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setChanges([])}>
            Clear All
          </Button>
        </div>
      )}

      {changes.length === 0 && availableModules.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>No modules available for what-if analysis</p>
          <p className="text-sm mt-1">Add modules to start simulating scenarios</p>
        </div>
      )}
    </Card>
  );
}

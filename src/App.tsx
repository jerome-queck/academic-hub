import { useState, useRef } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useStore } from './store';
import { MainLayout, PageHeader, EmptyState } from './components/layout';
import { CommandPalette } from './components/CommandPalette';
import { Card, CardHeader, Badge, Button } from './components/ui';
import { GoalDashboard } from './components/goals';
import { AnalyticsDashboard } from './components/analytics';
import { PredictionsDashboard } from './components/predictions';
import { OnboardingFlow } from './components/onboarding';
import { ModuleManagement } from './components/modules';
import { CoursePlanner } from './components/planner';
import { TimetableView } from './components/timetable';
import { calculateCompositeStats, getClassification } from './utils/gpa';
import { cn } from './lib/utils';
import type { ExportData, Module } from './types';
import './index.css';

import AddEditModuleModal from './components/AddEditModuleModal';

// Dashboard view component
function DashboardView() {
  const { modules, selectedYear, selectedSem, setView } = useStore();

  const cumulativeStats = calculateCompositeStats(modules);
  const yearStats = calculateCompositeStats(modules, selectedYear);
  const semStats = calculateCompositeStats(modules, selectedYear, selectedSem);
  const classification = getClassification(cumulativeStats.official.gpa);

  const currentViewModules = modules.filter(
    (m) => m.year === selectedYear && m.semester === selectedSem
  );

  const stats = [
    {
      label: 'Cumulative GPA',
      value: cumulativeStats.official.gpa.toFixed(2),
      subValue: `Projected: ${cumulativeStats.projected.gpa.toFixed(2)}`,
      color: 'primary' as const,
      large: true,
    },
    {
      label: `Year ${selectedYear} GPA`,
      value: yearStats.official.gpa.toFixed(2),
      subValue: `Projected: ${yearStats.projected.gpa.toFixed(2)}`,
      color: 'info' as const,
    },
    {
      label: `Semester ${selectedSem} GPA`,
      value: semStats.official.gpa.toFixed(2),
      subValue: `Projected: ${semStats.projected.gpa.toFixed(2)}`,
      color: 'success' as const,
    },
    {
      label: 'Total AU Completed',
      value: cumulativeStats.takenAU.toString(),
      subValue: `${cumulativeStats.totalExistingAU} AU planned`,
      color: 'secondary' as const,
    },
    {
      label: 'Classification',
      value: classification.split(' ')[0],
      subValue: classification,
      color: 'primary' as const,
    },
    {
      label: 'Modules',
      value: modules.length.toString(),
      subValue: `${currentViewModules.length} in current semester`,
      color: 'info' as const,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Track your academic progress at a glance"
      />

      {/* Period Selector */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Viewing:
        </span>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((year) =>
            [1, 2].map((sem) => (
              <button
                key={`${year}-${sem}`}
                onClick={() => setView(year, sem)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  selectedYear === year && selectedSem === sem
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                Y{year}S{sem}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card
            key={index}
            hover
            className={cn(
              stat.large && 'md:col-span-2 lg:col-span-1'
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {stat.label}
                </p>
                <p className={cn(
                  'font-bold',
                  stat.large ? 'text-4xl' : 'text-3xl',
                  stat.color === 'primary' && 'text-primary-600 dark:text-primary-400',
                  stat.color === 'success' && 'text-success-600 dark:text-success-400',
                  stat.color === 'info' && 'text-blue-600 dark:text-blue-400',
                  stat.color === 'secondary' && 'text-gray-700 dark:text-gray-300'
                )}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {stat.subValue}
                </p>
              </div>
              <Badge
                variant={
                  stat.color === 'primary' ? 'primary' :
                  stat.color === 'success' ? 'success' :
                  stat.color === 'info' ? 'info' : 'default'
                }
                rounded
              >
                {stat.label.split(' ')[0]}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Current Semester Modules */}
      <Card>
        <CardHeader
          title={`Year ${selectedYear} Semester ${selectedSem} Modules`}
          subtitle={`${currentViewModules.length} modules, ${currentViewModules.reduce((sum, m) => sum + m.au, 0)} AU`}
        />
        {currentViewModules.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="No modules yet"
            description="Add your first module to start tracking your GPA"
          />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    AU
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {currentViewModules.map((module) => (
                  <tr
                    key={module.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {module.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-300">
                        {module.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        {module.au}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={
                          module.status === 'Completed' ? 'success' :
                          module.status === 'In Progress' ? 'warning' : 'default'
                        }
                        size="sm"
                      >
                        {module.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        'font-semibold',
                        module.grade ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                      )}>
                        {module.grade || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// Settings view with export/import, target AU, and theme
function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { targetAU, setTargetAU, exportData, importData, resetData, modules, timetables, plannedModules } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [auInput, setAuInput] = useState(targetAU.toString());

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpa-calculator-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData;

        if (!data.version || !data.modules || !Array.isArray(data.modules)) {
          setImportStatus('Invalid file format. Please select a valid GPA Calculator backup file.');
          return;
        }

        const summary = [
          `${data.modules.length} modules`,
          data.timetables?.length ? `${data.timetables.length} timetables` : null,
          data.plannedModules?.length ? `${data.plannedModules.length} planned modules` : null,
        ].filter(Boolean).join(', ');

        if (window.confirm(`Import ${summary}? This will replace your current data.`)) {
          importData(data);
          setImportStatus(`Successfully imported ${summary}.`);
        }
      } catch {
        setImportStatus('Failed to parse file. Please ensure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAuSave = () => {
    const val = parseInt(auInput);
    if (!isNaN(val) && val > 0 && val <= 300) {
      setTargetAU(val);
    }
  };

  const handleReset = () => {
    resetData();
    setShowResetConfirm(false);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Customize your experience and manage your data"
      />

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
          <div className="flex gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'px-4 py-2 rounded-xl font-medium transition-all capitalize',
                  theme === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>

        {/* Academic Settings */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Academic Settings</h3>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Total AU (Degree Requirement)
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={auInput}
                onChange={e => setAuInput(e.target.value)}
                onBlur={handleAuSave}
                onKeyDown={e => { if (e.key === 'Enter') handleAuSave(); }}
                className="w-32 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 pb-2">
              Default: 130 AU for most NTU degrees
            </p>
          </div>
        </Card>

        {/* Data Management */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Management</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your data is stored locally in this browser. Export to create a backup you can import later.
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            <Button variant="primary" size="sm" onClick={handleExport}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Data
            </Button>

            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            <Button variant="danger" size="sm" onClick={() => setShowResetConfirm(true)}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset All Data
            </Button>
          </div>

          {importStatus && (
            <p className={cn(
              'text-sm mt-2',
              importStatus.startsWith('Successfully') ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
            )}>
              {importStatus}
            </p>
          )}

          {/* Data Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Data</h4>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{modules.length} modules</span>
              <span>{timetables.length} timetables</span>
              <span>{plannedModules.length} planned modules</span>
              <span>Target: {targetAU} AU</span>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            NTU GPA Calculator v2.0 — Track your academic progress, plan courses, and manage your timetable.
          </p>
        </Card>
      </div>

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reset all data?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This will permanently delete all your modules, timetables, planned courses, and goals. This cannot be undone. Consider exporting your data first.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleReset}>
                Reset Everything
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Main App content with routing based on current view
function AppContent() {
  const { currentView, selectedYear, selectedSem, addModule, modules } = useStore();
  const { setTheme, theme } = useTheme();

  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const handleAddModule = () => {
    setEditingModule(null);
    setShowModal(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setShowModal(true);
  };

  const handleSaveModule = (module: Module) => {
    if (editingModule) {
      useStore.getState().updateModule(module.id, module);
    } else {
      addModule(module);
    }
    setShowModal(false);
    setEditingModule(null);
  };

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'modules':
        return <ModuleManagement onEditModule={handleEditModule} onAddModule={handleAddModule} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'goals':
        return <GoalDashboard />;
      case 'predictions':
        return <PredictionsDashboard />;
      case 'planner':
        return <CoursePlanner />;
      case 'timetable':
        return <TimetableView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <MainLayout onAddModule={handleAddModule}>
        {renderView()}
      </MainLayout>

      <CommandPalette
        onAddModule={handleAddModule}
        onToggleTheme={toggleTheme}
      />

      <AddEditModuleModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingModule(null);
        }}
        onSave={handleSaveModule}
        existingModules={modules}
        moduleToEdit={editingModule}
        defaultYear={selectedYear}
        defaultSem={selectedSem}
      />
    </>
  );
}

// Root App component with providers
function App() {
  const onboardingComplete = useStore((s) => s.onboardingComplete);

  return (
    <ThemeProvider>
      {!onboardingComplete ? <OnboardingFlow /> : <AppContent />}
    </ThemeProvider>
  );
}

export default App;

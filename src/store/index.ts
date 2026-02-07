import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Module, GoalSettings, AnalyticsSnapshot, ViewType, LegacyAppState, Timetable, TimetableEntry, PlannedModule, ExportData } from '../types';
import { generateId } from '../lib/utils';

interface AppState {
  // Module Data
  modules: Module[];

  // Goals
  goals: GoalSettings;

  // Analytics History
  snapshots: AnalyticsSnapshot[];

  // Academic Settings
  targetAU: number;

  // Timetable
  timetables: Timetable[];

  // Course Planner
  plannedModules: PlannedModule[];

  // UI State
  selectedYear: number;
  selectedSem: number;
  sidebarOpen: boolean;
  currentView: ViewType;

  // Onboarding
  onboardingComplete: boolean;

  // Actions - Modules
  addModule: (module: Module) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  deleteModules: (ids: string[]) => void;
  setModules: (modules: Module[]) => void;
  moveModules: (ids: string[], year: number, semester: number) => void;

  // Actions - Goals
  setGoals: (goals: Partial<GoalSettings>) => void;

  // Actions - Analytics
  addSnapshot: (snapshot: AnalyticsSnapshot) => void;

  // Actions - Academic Settings
  setTargetAU: (au: number) => void;

  // Actions - Timetable
  getTimetable: (year: number, semester: number) => Timetable;
  addTimetableEntry: (year: number, semester: number, entry: TimetableEntry) => void;
  updateTimetableEntry: (year: number, semester: number, entryId: string, updates: Partial<TimetableEntry>) => void;
  deleteTimetableEntry: (year: number, semester: number, entryId: string) => void;

  // Actions - Course Planner
  addPlannedModule: (module: PlannedModule) => void;
  updatePlannedModule: (id: string, updates: Partial<PlannedModule>) => void;
  deletePlannedModule: (id: string) => void;
  setPlannedModules: (modules: PlannedModule[]) => void;
  batchAddPlannedToModules: (ids: string[]) => void;

  // Actions - Data Management
  exportData: () => ExportData;
  importData: (data: ExportData) => void;
  resetData: () => void;

  // Actions - UI
  setView: (year: number, sem: number) => void;
  setCurrentView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Actions - Onboarding
  completeOnboarding: () => void;
}

// Default state values
const defaultGoals: GoalSettings = {
  targetCGPA: 4.5,
  semesterGoals: {},
  notifications: true,
  warningThreshold: 10,
};

// Migrate from old localStorage format
function migrateFromLegacy(): Module[] | null {
  try {
    const oldData = localStorage.getItem('ntu_gpa_data');
    if (oldData) {
      const parsed: LegacyAppState = JSON.parse(oldData);
      if (parsed.modules && Array.isArray(parsed.modules)) {
        return parsed.modules.map(m => ({
          ...m,
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString(),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to migrate legacy data:', e);
  }
  return null;
}

export const useStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      modules: [],
      goals: defaultGoals,
      snapshots: [],
      targetAU: 130,
      timetables: [],
      plannedModules: [],
      selectedYear: 1,
      selectedSem: 1,
      sidebarOpen: true,
      currentView: 'dashboard',
      onboardingComplete: false,

      // Module actions
      addModule: (module) => set((state) => {
        state.modules.push({
          ...module,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }),

      updateModule: (id, updates) => set((state) => {
        const index = state.modules.findIndex(m => m.id === id);
        if (index !== -1) {
          Object.assign(state.modules[index], {
            ...updates,
            updatedAt: new Date().toISOString(),
          });
        }
      }),

      deleteModule: (id) => set((state) => {
        state.modules = state.modules.filter(m => m.id !== id);
      }),

      deleteModules: (ids) => set((state) => {
        const idSet = new Set(ids);
        state.modules = state.modules.filter(m => !idSet.has(m.id));
      }),

      setModules: (modules) => set((state) => {
        state.modules = modules;
      }),

      moveModules: (ids, year, semester) => set((state) => {
        const idSet = new Set(ids);
        state.modules.forEach(m => {
          if (idSet.has(m.id)) {
            m.year = year;
            m.semester = semester;
            m.updatedAt = new Date().toISOString();
          }
        });
      }),

      // Goal actions
      setGoals: (goals) => set((state) => {
        Object.assign(state.goals, goals);
      }),

      // Analytics actions
      addSnapshot: (snapshot) => set((state) => {
        state.snapshots.push(snapshot);
        if (state.snapshots.length > 50) {
          state.snapshots = state.snapshots.slice(-50);
        }
      }),

      // Academic settings
      setTargetAU: (au) => set((state) => {
        state.targetAU = au;
      }),

      // Timetable actions
      getTimetable: (year, semester) => {
        const state = get();
        const existing = state.timetables.find(t => t.year === year && t.semester === semester);
        return existing || { year, semester, entries: [] };
      },

      addTimetableEntry: (year, semester, entry) => set((state) => {
        let timetable = state.timetables.find(t => t.year === year && t.semester === semester);
        if (!timetable) {
          state.timetables.push({ year, semester, entries: [] });
          timetable = state.timetables[state.timetables.length - 1];
        }
        timetable.entries.push(entry);
      }),

      updateTimetableEntry: (year, semester, entryId, updates) => set((state) => {
        const timetable = state.timetables.find(t => t.year === year && t.semester === semester);
        if (timetable) {
          const idx = timetable.entries.findIndex(e => e.id === entryId);
          if (idx !== -1) {
            Object.assign(timetable.entries[idx], updates);
          }
        }
      }),

      deleteTimetableEntry: (year, semester, entryId) => set((state) => {
        const timetable = state.timetables.find(t => t.year === year && t.semester === semester);
        if (timetable) {
          timetable.entries = timetable.entries.filter(e => e.id !== entryId);
        }
      }),

      // Course planner actions
      addPlannedModule: (module) => set((state) => {
        state.plannedModules.push(module);
      }),

      updatePlannedModule: (id, updates) => set((state) => {
        const idx = state.plannedModules.findIndex(m => m.id === id);
        if (idx !== -1) {
          Object.assign(state.plannedModules[idx], updates);
        }
      }),

      deletePlannedModule: (id) => set((state) => {
        state.plannedModules = state.plannedModules.filter(m => m.id !== id);
      }),

      setPlannedModules: (modules) => set((state) => {
        state.plannedModules = modules;
      }),

      batchAddPlannedToModules: (ids) => set((state) => {
        const idSet = new Set(ids);
        const toAdd = state.plannedModules.filter(pm => idSet.has(pm.id));
        const now = new Date().toISOString();
        toAdd.forEach(pm => {
          // Check if module with same code already exists
          const exists = state.modules.some(m => m.code === pm.code);
          if (!exists) {
            state.modules.push({
              id: generateId(),
              code: pm.code,
              name: pm.name,
              au: pm.au,
              type: pm.type,
              year: pm.year,
              semester: pm.semester,
              prerequisiteCodes: pm.prerequisiteCodes,
              grade: null,
              status: 'Not Started',
              createdAt: now,
              updatedAt: now,
            });
          }
        });
        // Remove added items from planned
        state.plannedModules = state.plannedModules.filter(pm => !idSet.has(pm.id));
      }),

      // Data management
      exportData: () => {
        const state = get();
        return {
          version: 3,
          exportDate: new Date().toISOString(),
          modules: state.modules,
          goals: state.goals,
          timetables: state.timetables,
          plannedModules: state.plannedModules,
          targetAU: state.targetAU,
          snapshots: state.snapshots,
        };
      },

      importData: (data) => set((state) => {
        if (data.modules) state.modules = data.modules;
        if (data.goals) Object.assign(state.goals, data.goals);
        if (data.timetables) state.timetables = data.timetables;
        if (data.plannedModules) state.plannedModules = data.plannedModules;
        if (data.targetAU) state.targetAU = data.targetAU;
        if (data.snapshots) state.snapshots = data.snapshots;
      }),

      resetData: () => set((state) => {
        state.modules = [];
        state.goals = defaultGoals;
        state.snapshots = [];
        state.targetAU = 130;
        state.timetables = [];
        state.plannedModules = [];
        state.selectedYear = 1;
        state.selectedSem = 1;
        state.currentView = 'dashboard';
      }),

      // UI actions
      setView: (year, sem) => set((state) => {
        state.selectedYear = year;
        state.selectedSem = sem;
      }),

      setCurrentView: (view) => set((state) => {
        state.currentView = view;
      }),

      toggleSidebar: () => set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),

      setSidebarOpen: (open) => set((state) => {
        state.sidebarOpen = open;
      }),

      // Onboarding actions
      completeOnboarding: () => set((state) => {
        state.onboardingComplete = true;
      }),
    })),
    {
      name: 'ntu-gpa-storage',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        if (version === 0 || version === 1 || !persisted) {
          const legacyModules = migrateFromLegacy();
          const currentState = (persisted || {}) as Partial<AppState>;

          return {
            modules: legacyModules || currentState.modules || [],
            goals: currentState.goals || defaultGoals,
            snapshots: currentState.snapshots || [],
            targetAU: 130,
            timetables: [],
            plannedModules: [],
            selectedYear: currentState.selectedYear || 1,
            selectedSem: currentState.selectedSem || 1,
            sidebarOpen: currentState.sidebarOpen ?? true,
            currentView: currentState.currentView || 'dashboard',
            onboardingComplete: currentState.onboardingComplete ?? (legacyModules ? true : false),
          } as unknown as AppState;
        }
        if (version === 2) {
          const currentState = persisted as Partial<AppState>;
          return {
            ...currentState,
            targetAU: 130,
            timetables: [],
            plannedModules: [],
          } as unknown as AppState;
        }
        return persisted as unknown as AppState;
      },
      partialize: (state) => ({
        modules: state.modules,
        goals: state.goals,
        snapshots: state.snapshots,
        targetAU: state.targetAU,
        timetables: state.timetables,
        plannedModules: state.plannedModules,
        selectedYear: state.selectedYear,
        selectedSem: state.selectedSem,
        sidebarOpen: state.sidebarOpen,
        currentView: state.currentView,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);

// Selectors for common queries
export const useModules = () => useStore((state) => state.modules);
export const useGoals = () => useStore((state) => state.goals);
export const useCurrentView = () => useStore((state) => state.currentView);

export const useModulesByPeriod = (year: number, semester: number) =>
  useStore((state) => state.modules.filter(m => m.year === year && m.semester === semester));

export const useCompletedModules = () =>
  useStore((state) => state.modules.filter(m => m.status === 'Completed'));

export const useIncompleteModules = () =>
  useStore((state) => state.modules.filter(m => m.status !== 'Completed'));

export const useTimetable = (year: number, semester: number) =>
  useStore((state) => {
    const tt = state.timetables.find(t => t.year === year && t.semester === semester);
    return tt || { year, semester, entries: [] };
  });

export const usePlannedModules = () => useStore((state) => state.plannedModules);

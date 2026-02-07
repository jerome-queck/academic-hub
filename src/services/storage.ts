import type { LegacyAppState } from '../types';

const STORAGE_KEY = 'ntu_gpa_data';
const CURRENT_VERSION = 1;

const DEFAULT_STATE: LegacyAppState = {
  modules: [],
  schemaVersion: CURRENT_VERSION,
};

export const loadState = (): LegacyAppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return DEFAULT_STATE;

    const parsed = JSON.parse(serialized);
    
    // Migration Logic
    if (parsed.schemaVersion < CURRENT_VERSION) {
      return migrateState(parsed);
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load state', e);
    return DEFAULT_STATE;
  }
};

export const saveState = (state: LegacyAppState) => {
  try {
    const toSave = { ...state, schemaVersion: CURRENT_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save state', e);
  }
};

const migrateState = (oldState: LegacyAppState): LegacyAppState => {
  // Placeholder for future migrations
  return { ...DEFAULT_STATE, ...oldState, schemaVersion: CURRENT_VERSION };
};
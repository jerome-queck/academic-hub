import type { Module } from '../types';

export const getUnmetPrerequisites = (module: Module, allModules: Module[]): string[] => {
  if (!module.prerequisiteCodes || module.prerequisiteCodes.length === 0) return [];

  return module.prerequisiteCodes.filter(reqCode => {
    const reqModule = allModules.find(m => m.code === reqCode);
    // Unmet if:
    // 1. Module doesn't exist in our DB
    // 2. OR Module exists but status is NOT 'Completed'
    return !reqModule || reqModule.status !== 'Completed';
  });
};

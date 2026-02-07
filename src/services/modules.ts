import { v4 as uuidv4 } from 'uuid';
import type { Module, ModuleType } from '../types';

export const createModule = (
  code: string,
  name: string,
  au: number,
  type: ModuleType,
  year: number,
  semester: number,
  status: 'Not Started' | 'In Progress' | 'Completed' = 'Not Started'
): Module => {
  return {
    id: uuidv4(),
    code: code.toUpperCase(),
    name,
    au,
    grade: null,
    type,
    status,
    year,
    semester,
    prerequisiteCodes: [],
  };
};

export const createStubModule = (code: string): Module => {
  return {
    id: uuidv4(),
    code: code.toUpperCase(),
    name: 'Unknown Module (Prerequisite)',
    au: 0,
    grade: null,
    type: 'Core', // Default
    status: 'Not Started',
    year: 0, // 0 indicates unassigned
    semester: 0,
    prerequisiteCodes: [],
  };
};

export const resolvePrerequisites = (
  targetModule: Module,
  prereqCode: string,
  existingModules: Module[]
): { updatedModules: Module[]; message?: string } => {
  const code = prereqCode.toUpperCase();
  const existingPrereq = existingModules.find((m) => m.code === code);
  
  let newModules = [...existingModules];
  let message = '';

  if (existingPrereq) {
    // Prerequisite exists, just link it?
    // In our schema, we store codes, so we just need to ensure the code is in the list.
    if (!targetModule.prerequisiteCodes.includes(code)) {
      const updatedTarget = {
        ...targetModule,
        prerequisiteCodes: [...targetModule.prerequisiteCodes, code],
      };
      newModules = newModules.map(m => m.id === targetModule.id ? updatedTarget : m);
    }
  } else {
    // Prerequisite does not exist, create stub
    const stub = createStubModule(code);
    newModules.push(stub);
    
    const updatedTarget = {
      ...targetModule,
      prerequisiteCodes: [...targetModule.prerequisiteCodes, code],
    };
    newModules = newModules.map(m => m.id === targetModule.id ? updatedTarget : m);
    message = `Created placeholder for missing prerequisite ${code}.`;
  }

  return { updatedModules: newModules, message };
};

import { describe, it, expect } from 'vitest';
import { calculateCompositeStats } from './gpa';
import type { Module } from '../types';

// Mock Modules
const mockModules: Module[] = [
  {
    id: '1',
    code: 'MOD1',
    name: 'Module 1',
    au: 3,
    grade: 'A', // 5.0
    type: 'Core',
    status: 'Completed',
    year: 1,
    semester: 1,
    prerequisiteCodes: []
  },
  {
    id: '2',
    code: 'MOD2',
    name: 'Module 2',
    au: 3,
    grade: 'B', // 3.5
    type: 'Core',
    status: 'Completed',
    year: 1,
    semester: 1,
    prerequisiteCodes: []
  },
  {
    id: '3',
    code: 'MOD3',
    name: 'Module 3',
    au: 4,
    grade: 'F', // 0.0
    type: 'Core',
    status: 'Completed',
    year: 1,
    semester: 2,
    prerequisiteCodes: []
  },
  {
    id: '4',
    code: 'MOD4',
    name: 'Module 4',
    au: 3,
    grade: 'S', // Excluded
    type: 'Core',
    status: 'Completed',
    year: 1,
    semester: 2,
    prerequisiteCodes: []
  },
  {
    id: '5',
    code: 'MOD5',
    name: 'Module 5',
    au: 3,
    grade: 'A', // Target Grade
    type: 'Core',
    status: 'In Progress', // Should affect Projected but not Official
    year: 2,
    semester: 1,
    prerequisiteCodes: []
  },
  {
    id: '6',
    code: 'MOD6',
    name: 'Module 6',
    au: 2,
    grade: null,
    type: 'Core',
    status: 'Not Started',
    year: 2,
    semester: 2,
    prerequisiteCodes: []
  },
  {
    id: '7',
    code: 'MOD7',
    name: 'Module 7',
    au: 3,
    grade: 'A', // Target Grade for Not Started
    type: 'Core',
    status: 'Not Started',
    year: 2,
    semester: 2,
    prerequisiteCodes: []
  }
];

describe('GPA Calculation Logic', () => {
  
  it('calculates Official GPA correctly (ignoring In Progress & Excluded)', () => {
    const stats = calculateCompositeStats(mockModules);
    expect(stats.official.gpa).toBe(2.55);
    expect(stats.official.au).toBe(10);
  });

  it('calculates Projected GPA correctly (including In Progress AND Not Started with grade)', () => {
    const stats = calculateCompositeStats(mockModules);
    
    // Official Points: 25.5 (10 AU)
    // + MOD5 (3 AU * 5.0 = 15) -> In Progress
    // + MOD7 (3 AU * 5.0 = 15) -> Not Started w/ Grade
    // Total Points: 55.5
    // Total AU: 10 + 3 + 3 = 16
    // GPA: 55.5 / 16 = 3.468... -> 3.47
    
    expect(stats.projected.gpa).toBe(3.47);
    expect(stats.projected.au).toBe(16);
  });

  it('calculates Academic Load correctly', () => {
    const stats = calculateCompositeStats(mockModules);
    
    // Taken Load = Completed + In Progress
    // Completed: 3+3+4+3 = 13
    // In Progress: 3
    // Total Taken: 16
    expect(stats.takenAU).toBe(16);

    // Total Existing AU = Sum of all AUs
    // 13 (Completed) + 3 (IP) + 2 (NS) + 3 (NS) = 21
    expect(stats.totalExistingAU).toBe(21);
  });

  it('filters by Year correctly', () => {
    const stats = calculateCompositeStats(mockModules, 1); // Year 1 only
    expect(stats.official.gpa).toBe(2.55);
    expect(stats.official.au).toBe(10);
  });

  it('filters by Semester correctly', () => {
    const stats = calculateCompositeStats(mockModules, 1, 1); // Year 1 Sem 1
    expect(stats.official.gpa).toBe(4.25);
  });
});
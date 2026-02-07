import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence handling
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to a fixed decimal places
 */
export function formatGPA(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if we're running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' &&
    typeof (window as Window & { process?: { type?: string } }).process === 'object' &&
    (window as Window & { process?: { type?: string } }).process?.type === 'renderer';
}

import { useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

/**
 * Hook for registering keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 'n', ctrl: true, action: () => console.log('New'), description: 'Create new item' },
 *   { key: 'Escape', action: () => closeModal() },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape to work even in inputs
        if (e.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = shortcut.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const metaMatches = !!shortcut.meta === e.metaKey;
        const shiftMatches = !!shortcut.shift === e.shiftKey;
        const altMatches = !!shortcut.alt === e.altKey;

        // For shortcuts that specify ctrl, accept either ctrl or meta (cmd on Mac)
        const modifierMatches = shortcut.ctrl
          ? ctrlMatches
          : shortcut.meta
          ? metaMatches
          : !e.ctrlKey && !e.metaKey;

        if (
          keyMatches &&
          modifierMatches &&
          shiftMatches &&
          altMatches
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook for a single keyboard shortcut
 */
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useKeyboardShortcuts([
    {
      key,
      ...options,
      action,
    },
  ]);
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: Partial<Shortcut>): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.key) {
    parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  }

  return parts.join(isMac ? '' : '+');
}

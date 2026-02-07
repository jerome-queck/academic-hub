import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store';
import type { Module } from '../types';

interface HistoryEntry {
  modules: Module[];
  description: string;
  timestamp: number;
}

const MAX_HISTORY = 30;
const GROUP_THRESHOLD_MS = 2000; // Group edits within 2s as one undo step

/**
 * Hook that provides undo/redo functionality for module changes.
 * Tracks snapshots of the modules array and allows reverting.
 */
export function useUndoRedo() {
  const modules = useStore(s => s.modules);
  const setModules = useStore(s => s.setModules);

  const pastRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const lastSnapshotRef = useRef<string>(JSON.stringify(modules));
  const lastSnapshotTimeRef = useRef<number>(0);
  const skipNextRef = useRef(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Detect module changes and push to history
  useEffect(() => {
    const serialized = JSON.stringify(modules);
    if (serialized === lastSnapshotRef.current) return;

    // If we triggered this change via undo/redo, skip recording
    if (skipNextRef.current) {
      skipNextRef.current = false;
      lastSnapshotRef.current = serialized;
      return;
    }

    const now = Date.now();
    const prevModules: Module[] = JSON.parse(lastSnapshotRef.current);

    // Determine description
    const description = describeChange(prevModules, modules);

    // Group rapid edits
    if (
      pastRef.current.length > 0 &&
      now - lastSnapshotTimeRef.current < GROUP_THRESHOLD_MS
    ) {
      // Update the latest entry instead of adding a new one
      pastRef.current[pastRef.current.length - 1] = {
        ...pastRef.current[pastRef.current.length - 1],
        // Keep the original modules snapshot (before the group started)
      };
    } else {
      // Push previous state to history
      pastRef.current.push({
        modules: prevModules,
        description,
        timestamp: now,
      });

      if (pastRef.current.length > MAX_HISTORY) {
        pastRef.current = pastRef.current.slice(-MAX_HISTORY);
      }
    }

    // Clear future on new change
    futureRef.current = [];

    lastSnapshotRef.current = serialized;
    lastSnapshotTimeRef.current = now;

    setCanUndo(pastRef.current.length > 0);
    setCanRedo(false);
    setLastAction(null);
  }, [modules]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const entry = pastRef.current.pop()!;

    // Save current state to future
    futureRef.current.push({
      modules: JSON.parse(lastSnapshotRef.current),
      description: entry.description,
      timestamp: Date.now(),
    });

    skipNextRef.current = true;
    setModules(entry.modules);
    lastSnapshotRef.current = JSON.stringify(entry.modules);

    setCanUndo(pastRef.current.length > 0);
    setCanRedo(true);
    setLastAction(`Undone: ${entry.description}`);

    // Clear message after 3s
    setTimeout(() => setLastAction(null), 3000);
  }, [setModules]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const entry = futureRef.current.pop()!;

    // Save current state to past
    pastRef.current.push({
      modules: JSON.parse(lastSnapshotRef.current),
      description: entry.description,
      timestamp: Date.now(),
    });

    skipNextRef.current = true;
    setModules(entry.modules);
    lastSnapshotRef.current = JSON.stringify(entry.modules);

    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    setLastAction(`Redone: ${entry.description}`);

    setTimeout(() => setLastAction(null), 3000);
  }, [setModules]);

  // Global keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return { undo, redo, canUndo, canRedo, lastAction };
}

function describeChange(prev: Module[], next: Module[]): string {
  if (next.length > prev.length) {
    const newMods = next.filter(n => !prev.some(p => p.id === n.id));
    if (newMods.length === 1) return `Added ${newMods[0].code}`;
    return `Added ${newMods.length} modules`;
  }
  if (next.length < prev.length) {
    const deleted = prev.filter(p => !next.some(n => n.id === p.id));
    if (deleted.length === 1) return `Deleted ${deleted[0].code}`;
    return `Deleted ${deleted.length} modules`;
  }
  // Same count — must be an update
  const changed = next.filter(n => {
    const p = prev.find(p => p.id === n.id);
    return p && JSON.stringify(p) !== JSON.stringify(n);
  });
  if (changed.length === 1) return `Updated ${changed[0].code}`;
  if (changed.length > 1) return `Updated ${changed.length} modules`;
  return 'Changed modules';
}

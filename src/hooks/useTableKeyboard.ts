import { useEffect, useCallback, useState } from 'react';

interface TableKeyboardConfig {
  rowCount: number;
  columnCount: number;
  onEditCell: (row: number, col: number) => void;
  onToggleSelect: (row: number) => void;
  onDeleteSelected: () => void;
  onDuplicate: (row: number) => void;
  enabled?: boolean;
}

interface FocusedCell {
  row: number;
  col: number;
}

/**
 * Hook that provides keyboard navigation for a table.
 * Arrow keys navigate, Enter edits, Space toggles selection,
 * Delete triggers delete, Cmd+D duplicates.
 */
export function useTableKeyboard({
  rowCount,
  columnCount,
  onEditCell,
  onToggleSelect,
  onDeleteSelected,
  onDuplicate,
  enabled = true,
}: TableKeyboardConfig) {
  const [focusedCell, setFocusedCell] = useState<FocusedCell | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !focusedCell) return;
    // Don't capture if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;

    const { row, col } = focusedCell;
    const isMod = e.metaKey || e.ctrlKey;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setFocusedCell({ row: Math.max(0, row - 1), col });
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedCell({ row: Math.min(rowCount - 1, row + 1), col });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedCell({ row, col: Math.max(0, col - 1) });
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedCell({ row, col: Math.min(columnCount - 1, col + 1) });
        break;
      case 'Enter':
        e.preventDefault();
        onEditCell(row, col);
        break;
      case ' ':
        e.preventDefault();
        onToggleSelect(row);
        break;
      case 'Delete':
      case 'Backspace':
        if (!isMod) {
          e.preventDefault();
          onDeleteSelected();
        }
        break;
      case 'd':
        if (isMod) {
          e.preventDefault();
          onDuplicate(row);
        }
        break;
      case 'Escape':
        setFocusedCell(null);
        break;
    }
  }, [enabled, focusedCell, rowCount, columnCount, onEditCell, onToggleSelect, onDeleteSelected, onDuplicate]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    focusedCell,
    setFocusedCell,
    clearFocus: () => setFocusedCell(null),
  };
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { InlineSelect } from '../ui';
import type { SelectOption } from '../ui';
import { cn } from '../../lib/utils';

export type EditableCellType = 'text' | 'number' | 'select';

interface EditableCellProps {
  moduleId: string;
  field: string;
  value: string | number | null;
  type: EditableCellType;
  options?: SelectOption[];
  onSave: (moduleId: string, field: string, value: string | number | null) => void;
  editingCell: string | null;
  onStartEdit: (cellId: string) => void;
  onStopEdit: () => void;
  className?: string;
  displayClassName?: string;
  renderDisplay?: (value: string | number | null) => React.ReactNode;
  numberMin?: number;
  numberMax?: number;
  autoUppercase?: boolean;
}

export function EditableCell({
  moduleId,
  field,
  value,
  type,
  options,
  onSave,
  editingCell,
  onStartEdit,
  onStopEdit,
  className,
  displayClassName,
  renderDisplay,
  numberMin,
  numberMax,
  autoUppercase,
}: EditableCellProps) {
  const cellId = `${moduleId}:${field}`;
  const isEditing = editingCell === cellId;
  const [editValue, setEditValue] = useState<string | number | null>(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(value);
      // Small delay to ensure DOM element is rendered
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        if (inputRef.current instanceof HTMLInputElement) {
          inputRef.current.select();
        }
      });
    }
  }, [isEditing, value]);

  const save = useCallback(() => {
    if (editValue !== value) {
      onSave(moduleId, field, editValue);
    }
    onStopEdit();
  }, [editValue, value, moduleId, field, onSave, onStopEdit]);

  const cancel = useCallback(() => {
    setEditValue(value);
    onStopEdit();
  }, [value, onStopEdit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Tab') {
      save();
      // Let Tab propagate to move to next element naturally
    }
  };

  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <td className={cn('px-4 py-2', className)}>
          <InlineSelect
            ref={inputRef as React.Ref<HTMLSelectElement>}
            value={editValue === null ? '' : String(editValue)}
            onChange={(e) => {
              const val = e.target.value === '' ? null : e.target.value;
              // Save immediately for selects
              onSave(moduleId, field, val);
              onStopEdit();
            }}
            onBlur={cancel}
            onKeyDown={handleKeyDown}
            options={options}
            className="w-full"
          />
        </td>
      );
    }

    if (type === 'number') {
      return (
        <td className={cn('px-4 py-2', className)}>
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type="number"
            value={editValue === null ? '' : editValue}
            min={numberMin}
            max={numberMax}
            onChange={(e) => setEditValue(e.target.value === '' ? 0 : Number(e.target.value))}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </td>
      );
    }

    // text
    return (
      <td className={cn('px-4 py-2', className)}>
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="text"
          value={editValue === null ? '' : String(editValue)}
          onChange={(e) => setEditValue(autoUppercase ? e.target.value.toUpperCase() : e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </td>
    );
  }

  // Display mode
  return (
    <td
      className={cn(
        'px-4 py-3 cursor-pointer group/cell',
        className
      )}
      onClick={() => onStartEdit(cellId)}
    >
      <div className={cn(
        'rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors',
        'group-hover/cell:bg-gray-100 dark:group-hover/cell:bg-gray-700/50',
        displayClassName
      )}>
        {renderDisplay ? renderDisplay(value) : (
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            {value === null || value === '' ? '—' : String(value)}
          </span>
        )}
      </div>
    </td>
  );
}

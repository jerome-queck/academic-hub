import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import type { TimetableEntry } from '../../types';

interface DraggableTimetableEntryProps {
  entry: TimetableEntry;
  color: string;
  conflict: boolean;
  slotHeight: number;
  startIdx: number;
  spanSlots: number;
  onClick: (e: React.MouseEvent) => void;
}

export function DraggableTimetableEntry({
  entry,
  color,
  conflict,
  slotHeight,
  startIdx,
  spanSlots,
  onClick,
}: DraggableTimetableEntryProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `entry-${entry.id}`,
    data: {
      type: 'move-entry',
      entry,
    },
  });

  const style: React.CSSProperties = {
    top: startIdx * slotHeight,
    height: spanSlots * slotHeight - 2,
    backgroundColor: `${color}18`,
    borderLeftColor: color,
    ...(transform ? {
      transform: CSS.Translate.toString(transform),
      zIndex: 50,
    } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-0.5 right-0.5 z-20 rounded-lg overflow-hidden cursor-grab',
        'border-l-[3px] px-1.5 py-1',
        conflict && 'ring-2 ring-red-500 ring-offset-1 dark:ring-offset-gray-800',
        isDragging && 'opacity-50 shadow-lg cursor-grabbing'
      )}
      style={style}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      {/* Resize handle - top */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-black/10 dark:hover:bg-white/10 rounded-t-lg"
        onMouseDown={(e) => e.stopPropagation()}
      />

      <div className="flex flex-col h-full overflow-hidden">
        {/* Drag grip indicator */}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0 text-gray-400 dark:text-gray-500" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="4" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="8" cy="4" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
          </svg>
          <span className="text-[11px] font-bold leading-tight truncate" style={{ color }}>
            {entry.moduleCode}
          </span>
        </div>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
          {entry.classType}
        </span>
        {spanSlots >= 2 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
            {entry.venue}
          </span>
        )}
      </div>

      {conflict && (
        <div className="absolute top-0.5 right-0.5">
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Resize handle - bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-black/10 dark:hover:bg-white/10 rounded-b-lg"
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

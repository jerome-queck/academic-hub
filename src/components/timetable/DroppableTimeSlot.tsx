import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import type { DayOfWeek } from '../../types';

interface DroppableTimeSlotProps {
  day: DayOfWeek;
  time: string;
  slotIdx: number;
  slotHeight: number;
  onClick: () => void;
  children?: React.ReactNode;
}

export function DroppableTimeSlot({
  day,
  time,
  slotIdx,
  slotHeight,
  onClick,
  children,
}: DroppableTimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${day}-${time}`,
    data: {
      type: 'time-slot',
      day,
      time,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative border-l border-b border-gray-100 dark:border-gray-700/50 cursor-pointer',
        'transition-colors',
        isOver
          ? 'bg-primary-100/50 dark:bg-primary-900/20'
          : slotIdx % 2 === 0
            ? 'bg-white dark:bg-gray-800 hover:bg-primary-50/30 dark:hover:bg-primary-900/10'
            : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10'
      )}
      style={{ height: slotHeight }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

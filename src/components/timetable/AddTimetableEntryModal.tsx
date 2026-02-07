import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input, Select } from '../ui';
import { cn, generateId } from '../../lib/utils';
import type { TimetableEntry, DayOfWeek, ClassType, Module } from '../../types';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_TYPES: ClassType[] = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Other'];

const NTU_PRESETS = [
  '08:30 - 09:30',
  '09:30 - 10:30',
  '10:30 - 11:30',
  '11:30 - 12:30',
  '12:30 - 13:30',
  '13:30 - 14:30',
  '14:30 - 15:30',
  '15:30 - 16:30',
  '16:30 - 17:30',
  '17:30 - 18:30',
  '18:30 - 19:30',
  '19:30 - 20:30',
  '20:30 - 21:30',
];

interface AddTimetableEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: TimetableEntry) => void;
  onDelete?: () => void;
  entry: TimetableEntry | null;
  prefillDay: DayOfWeek | null;
  prefillTime: string | null;
  semModules: Module[];
  colorMap: Record<string, string>;
}

export function AddTimetableEntryModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  entry,
  prefillDay,
  prefillTime,
  semModules,
  colorMap,
}: AddTimetableEntryModalProps) {
  const isEditing = !!entry;

  // Form state
  const [moduleSelection, setModuleSelection] = useState<string>('custom');
  const [moduleCode, setModuleCode] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [day, setDay] = useState<DayOfWeek>('Monday');
  const [usePreset, setUsePreset] = useState(true);
  const [presetSlot, setPresetSlot] = useState(NTU_PRESETS[0]);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('09:30');
  const [classType, setClassType] = useState<ClassType>('Lecture');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Module options for the select dropdown
  const moduleOptions = useMemo(() => {
    const opts = semModules.map((m) => ({
      value: m.code,
      label: `${m.code} - ${m.name}`,
    }));
    opts.push({ value: 'custom', label: 'Custom (type manually)' });
    return opts;
  }, [semModules]);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (entry) {
      // Editing mode: populate form with entry data
      const matchingModule = semModules.find((m) => m.code === entry.moduleCode);
      setModuleSelection(matchingModule ? entry.moduleCode : 'custom');
      setModuleCode(entry.moduleCode);
      setModuleName(entry.moduleName);
      setDay(entry.day);
      setClassType(entry.classType);
      setVenue(entry.venue);
      setNotes(entry.notes || '');

      // Check if entry time matches a preset
      const timeStr = `${entry.startTime} - ${entry.endTime}`;
      if (NTU_PRESETS.includes(timeStr)) {
        setUsePreset(true);
        setPresetSlot(timeStr);
      } else {
        setUsePreset(false);
      }
      setStartTime(entry.startTime);
      setEndTime(entry.endTime);
    } else {
      // New entry mode
      setModuleSelection(semModules.length > 0 ? semModules[0].code : 'custom');
      if (semModules.length > 0) {
        setModuleCode(semModules[0].code);
        setModuleName(semModules[0].name);
      } else {
        setModuleCode('');
        setModuleName('');
      }
      setDay(prefillDay || 'Monday');
      setClassType('Lecture');
      setVenue('');
      setNotes('');
      setUsePreset(true);

      // If prefillTime provided, try to match a preset
      if (prefillTime) {
        const matchedPreset = NTU_PRESETS.find((p) => p.startsWith(prefillTime));
        if (matchedPreset) {
          setPresetSlot(matchedPreset);
          const [s, e] = matchedPreset.split(' - ');
          setStartTime(s);
          setEndTime(e);
        } else {
          setUsePreset(false);
          setStartTime(prefillTime);
          // Default end time: 1 hour after start
          const [h, m] = prefillTime.split(':').map(Number);
          const endH = h + 1;
          setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
      } else {
        setPresetSlot(NTU_PRESETS[0]);
        setStartTime('08:30');
        setEndTime('09:30');
      }
    }
    setErrors({});
  }, [isOpen, entry, prefillDay, prefillTime, semModules]);

  // When module selection changes from dropdown
  const handleModuleChange = (value: string) => {
    setModuleSelection(value);
    if (value === 'custom') {
      if (!isEditing) {
        setModuleCode('');
        setModuleName('');
      }
    } else {
      const mod = semModules.find((m) => m.code === value);
      if (mod) {
        setModuleCode(mod.code);
        setModuleName(mod.name);
      }
    }
  };

  // When preset slot changes
  const handlePresetChange = (value: string) => {
    setPresetSlot(value);
    const [s, e] = value.split(' - ');
    setStartTime(s);
    setEndTime(e);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!moduleCode.trim()) {
      newErrors.moduleCode = 'Module code is required';
    }
    if (!moduleName.trim()) {
      newErrors.moduleName = 'Module name is required';
    }
    if (!venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    // Validate times
    if (!usePreset) {
      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);
      if (startMins >= endMins) {
        newErrors.time = 'End time must be after start time';
      }
      if (startMins < 8 * 60 || endMins > 22 * 60) {
        newErrors.time = 'Times must be between 08:00 and 22:00';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const finalStartTime = usePreset ? presetSlot.split(' - ')[0] : startTime;
    const finalEndTime = usePreset ? presetSlot.split(' - ')[1] : endTime;

    const newEntry: TimetableEntry = {
      id: entry?.id || generateId(),
      moduleCode: moduleCode.trim(),
      moduleName: moduleName.trim(),
      day,
      startTime: finalStartTime,
      endTime: finalEndTime,
      venue: venue.trim(),
      classType,
      color: entry?.color || colorMap[moduleCode.trim()],
      notes: notes.trim() || undefined,
    };

    onSave(newEntry);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Class' : 'Add Class'}
      description={isEditing ? 'Update class details' : 'Add a new class to your timetable'}
      size="lg"
    >
      <div className="space-y-4">
        {/* Module Selection */}
        <Select
          label="Module"
          value={moduleSelection}
          onChange={(e) => handleModuleChange(e.target.value)}
          options={moduleOptions}
        />

        {/* Custom module fields */}
        {moduleSelection === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Module Code"
              placeholder="e.g. SC1003"
              value={moduleCode}
              onChange={(e) => setModuleCode(e.target.value)}
              error={errors.moduleCode}
            />
            <Input
              label="Module Name"
              placeholder="e.g. Introduction to Programming"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              error={errors.moduleName}
            />
          </div>
        )}

        {/* Day */}
        <Select
          label="Day"
          value={day}
          onChange={(e) => setDay(e.target.value as DayOfWeek)}
          options={DAYS.map((d) => ({ value: d, label: d }))}
        />

        {/* Time Mode Toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time
            </label>
            <button
              type="button"
              onClick={() => setUsePreset(!usePreset)}
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-lg transition-colors',
                'text-primary-600 dark:text-primary-400',
                'hover:bg-primary-50 dark:hover:bg-primary-900/20'
              )}
            >
              {usePreset ? 'Custom time' : 'Use preset'}
            </button>
          </div>

          {usePreset ? (
            <Select
              value={presetSlot}
              onChange={(e) => handlePresetChange(e.target.value)}
              options={NTU_PRESETS.map((p) => ({ value: p, label: p }))}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min="08:00"
                max="21:30"
                step="1800"
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min="08:30"
                max="22:00"
                step="1800"
              />
            </div>
          )}
          {errors.time && (
            <p className="mt-1.5 text-sm text-danger-500">{errors.time}</p>
          )}
        </div>

        {/* Class Type */}
        <Select
          label="Class Type"
          value={classType}
          onChange={(e) => setClassType(e.target.value as ClassType)}
          options={CLASS_TYPES.map((ct) => ({ value: ct, label: ct }))}
        />

        {/* Venue */}
        <Input
          label="Venue"
          placeholder="e.g. LT1A, TR+17"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          error={errors.venue}
        />

        {/* Notes */}
        <Input
          label="Notes (optional)"
          placeholder="Any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            {isEditing && onDelete && (
              <Button variant="danger" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {isEditing ? 'Update' : 'Add Class'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

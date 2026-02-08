import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../ui';
import { generateId } from '../../lib/utils';
import type { Examination, ExamType, AcademicWeek } from '../../types';

const EXAM_TYPES: ExamType[] = ['Midterm', 'Final', 'Quiz', 'Other'];

const DURATION_PRESETS = [
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: '150', label: '2.5 hours' },
  { value: '180', label: '3 hours' },
  { value: 'custom', label: 'Custom' },
];

interface AddExaminationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: Examination) => void;
  onDelete?: () => void;
  exam: Examination | null;
  moduleCode: string;
  moduleName: string;
  moduleColor?: string;
  academicWeeks: AcademicWeek[];
}

export function AddExaminationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  exam,
  moduleCode,
  moduleName,
  moduleColor,
  academicWeeks,
}: AddExaminationModalProps) {
  const isEditing = !!exam;

  const [examType, setExamType] = useState<ExamType>('Final');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationPreset, setDurationPreset] = useState('120');
  const [customDuration, setCustomDuration] = useState('120');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Compute date ranges for exam weeks and full semester
  const examWeeks = academicWeeks.filter(w => w.weekType === 'exam');
  const firstWeek = academicWeeks[0];
  const lastWeek = academicWeeks[academicWeeks.length - 1];

  const semesterStart = firstWeek ? formatDateForInput(firstWeek.startDate) : '';
  const semesterEnd = lastWeek ? formatDateForInput(lastWeek.endDate) : '';
  const examStart = examWeeks[0] ? formatDateForInput(examWeeks[0].startDate) : '';
  const examEnd = examWeeks[examWeeks.length - 1] ? formatDateForInput(examWeeks[examWeeks.length - 1].endDate) : '';

  useEffect(() => {
    if (!isOpen) return;

    if (exam) {
      setExamType(exam.examType);
      setDate(exam.date);
      setStartTime(exam.startTime);
      const durStr = String(exam.duration);
      if (DURATION_PRESETS.some(p => p.value === durStr)) {
        setDurationPreset(durStr);
      } else {
        setDurationPreset('custom');
        setCustomDuration(durStr);
      }
      setVenue(exam.venue);
      setNotes(exam.notes || '');
    } else {
      setExamType('Final');
      setDate(examStart || '');
      setStartTime('09:00');
      setDurationPreset('120');
      setCustomDuration('120');
      setVenue('');
      setNotes('');
    }
    setErrors({});
  }, [isOpen, exam, examStart]);

  const getDuration = (): number => {
    if (durationPreset === 'custom') {
      return parseInt(customDuration) || 120;
    }
    return parseInt(durationPreset);
  };

  const computeEndTime = (start: string, durationMins: number): string => {
    const [h, m] = start.split(':').map(Number);
    const totalMins = h * 60 + m + durationMins;
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!date) newErrors.date = 'Date is required';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!venue.trim()) newErrors.venue = 'Venue is required';
    const dur = getDuration();
    if (dur <= 0 || dur > 600) newErrors.duration = 'Duration must be between 1 and 600 minutes';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const duration = getDuration();
    const endTime = computeEndTime(startTime, duration);

    const newExam: Examination = {
      id: exam?.id || generateId(),
      moduleCode,
      moduleName,
      examType,
      date,
      startTime,
      endTime,
      duration,
      venue: venue.trim(),
      notes: notes.trim() || undefined,
      color: exam?.color || moduleColor,
    };

    onSave(newExam);
  };

  // All exam types can be scheduled anywhere during the semester
  const dateMin = semesterStart;
  const dateMax = semesterEnd;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Examination' : 'Add Examination'}
      description={`${moduleCode} - ${moduleName}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Exam Type */}
        <Select
          label="Exam Type"
          value={examType}
          onChange={(e) => setExamType(e.target.value as ExamType)}
          options={EXAM_TYPES.map(t => ({ value: t, label: t }))}
        />

        {examType === 'Final' && examStart && (
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            Final exams are typically during the exam period ({examStart} to {examEnd})
          </p>
        )}

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={dateMin}
          max={dateMax}
          error={errors.date}
        />

        {/* Start Time */}
        <Input
          label="Start Time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          error={errors.startTime}
        />

        {/* Duration */}
        <div>
          <Select
            label="Duration"
            value={durationPreset}
            onChange={(e) => setDurationPreset(e.target.value)}
            options={DURATION_PRESETS}
          />
          {durationPreset === 'custom' && (
            <div className="mt-2">
              <Input
                label="Duration (minutes)"
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                min="15"
                max="600"
                step="15"
                error={errors.duration}
              />
            </div>
          )}
          {startTime && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ends at {computeEndTime(startTime, getDuration())}
            </p>
          )}
        </div>

        {/* Venue */}
        <Input
          label="Venue"
          placeholder="e.g. Sports Hall 1, SPMS-LT1"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          error={errors.venue}
        />

        {/* Notes */}
        <Input
          label="Notes (optional)"
          placeholder="e.g. Open book, calculator allowed"
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
              {isEditing ? 'Update' : 'Add Exam'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

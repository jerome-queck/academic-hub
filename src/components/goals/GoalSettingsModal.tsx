import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Modal, Button, Slider, Input } from '../ui';
import { cn } from '../../lib/utils';

interface GoalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalSettingsModal({ isOpen, onClose }: GoalSettingsModalProps) {
  const { goals, setGoals } = useStore();

  // Local state for form
  const [targetCGPA, setTargetCGPA] = useState(goals.targetCGPA);
  const [graduationTarget, setGraduationTarget] = useState(goals.graduationTarget ?? goals.targetCGPA);
  const [notifications, setNotifications] = useState(goals.notifications);
  const [warningThreshold, setWarningThreshold] = useState(goals.warningThreshold ?? 10);
  const [semesterGoals, setSemesterGoals] = useState<Record<string, number>>(goals.semesterGoals);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetCGPA(goals.targetCGPA);
      setGraduationTarget(goals.graduationTarget ?? goals.targetCGPA);
      setNotifications(goals.notifications);
      setWarningThreshold(goals.warningThreshold ?? 10);
      setSemesterGoals(goals.semesterGoals);
    }
  }, [isOpen, goals]);

  const handleSave = () => {
    setGoals({
      targetCGPA,
      graduationTarget,
      notifications,
      warningThreshold,
      semesterGoals,
    });
    onClose();
  };

  const gpaMarks = [
    { value: 0, label: '0.0' },
    { value: 2.5, label: '2.5' },
    { value: 3.5, label: '3.5' },
    { value: 4.0, label: '4.0' },
    { value: 4.5, label: '4.5' },
    { value: 5, label: '5.0' },
  ];

  const classificationForGPA = (gpa: number) => {
    if (gpa >= 4.5) return { label: 'First Class Honours', color: 'text-success-600' };
    if (gpa >= 4.0) return { label: 'Second Class Upper', color: 'text-primary-600' };
    if (gpa >= 3.5) return { label: 'Second Class Lower', color: 'text-blue-600' };
    if (gpa >= 3.0) return { label: 'Third Class', color: 'text-warning-600' };
    if (gpa >= 2.0) return { label: 'Pass', color: 'text-gray-600' };
    return { label: 'Below Pass', color: 'text-danger-600' };
  };

  const targetClass = classificationForGPA(targetCGPA);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Goal Settings"
      size="lg"
    >
      <div className="space-y-6">
        {/* Target CGPA Section */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Target CGPA
          </h3>

          <Slider
            value={targetCGPA}
            onChange={setTargetCGPA}
            min={0}
            max={5}
            step={0.1}
            formatValue={(v) => v.toFixed(2)}
            marks={gpaMarks}
          />

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Classification:
            </span>
            <span className={cn('font-semibold', targetClass.color)}>
              {targetClass.label}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Quick Presets
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 4.5, label: 'First Class (4.5)' },
              { value: 4.0, label: 'Second Upper (4.0)' },
              { value: 3.5, label: 'Second Lower (3.5)' },
              { value: 3.0, label: 'Third Class (3.0)' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => setTargetCGPA(preset.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  targetCGPA === preset.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Graduation Target */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Graduation Target (Optional)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Set a different target for your final graduation GPA
          </p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={graduationTarget}
              onChange={(e) => setGraduationTarget(parseFloat(e.target.value) || 0)}
              min={0}
              max={5}
              step={0.1}
              className="w-32"
            />
            <button
              onClick={() => setGraduationTarget(targetCGPA)}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Same as target
            </button>
          </div>
        </div>

        {/* Semester Goals */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Semester-Specific Goals (Optional)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Set different targets for individual semesters
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((year) =>
              [1, 2].map((sem) => {
                const key = `Y${year}S${sem}`;
                const value = semesterGoals[key] ?? '';
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {key}
                    </label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        const newValue = e.target.value ? parseFloat(e.target.value) : undefined;
                        setSemesterGoals((prev) => {
                          const updated = { ...prev };
                          if (newValue !== undefined) {
                            updated[key] = newValue;
                          } else {
                            delete updated[key];
                          }
                          return updated;
                        });
                      }}
                      placeholder={targetCGPA.toFixed(1)}
                      min={0}
                      max={5}
                      step={0.1}
                      className="text-center"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Goal Alerts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get notified when you're falling behind
            </p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                notifications ? 'left-7' : 'left-1'
              )}
            />
          </button>
        </div>

        {/* Warning Threshold */}
        {notifications && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Warning Threshold
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Alert when GPA falls this % behind target
            </p>
            <Slider
              value={warningThreshold}
              onChange={setWarningThreshold}
              min={5}
              max={25}
              step={5}
              formatValue={(v) => `${v}%`}
              marks={[
                { value: 5, label: '5%' },
                { value: 10, label: '10%' },
                { value: 15, label: '15%' },
                { value: 20, label: '20%' },
                { value: 25, label: '25%' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Goals
        </Button>
      </div>
    </Modal>
  );
}

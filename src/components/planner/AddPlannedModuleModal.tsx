import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../store';
import { generateId } from '../../lib/utils';
import type { PlannedModule, ModuleType } from '../../types';

const MODULE_TYPE_OPTIONS = [
  { value: 'Core', label: 'Core' },
  { value: 'BDE', label: 'BDE' },
  { value: 'ICC-Core', label: 'ICC-Core' },
  { value: 'ICC-Professional Series', label: 'ICC-Professional Series' },
  { value: 'ICC-CSL', label: 'ICC-CSL' },
  { value: 'FYP', label: 'FYP' },
  { value: 'Mathematics PE', label: 'Mathematics PE' },
  { value: 'Physics PE', label: 'Physics PE' },
  { value: 'UE', label: 'UE' },
  { value: 'Other', label: 'Other' },
];

interface AddPlannedModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  semester: number;
  editModule?: PlannedModule | null;
}

export function AddPlannedModuleModal({
  isOpen,
  onClose,
  year,
  semester,
  editModule,
}: AddPlannedModuleModalProps) {
  const { addPlannedModule, updatePlannedModule } = useStore();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [au, setAu] = useState(3);
  const [type, setType] = useState<ModuleType>('Core');
  const [prereqText, setPrereqText] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editModule) {
      setCode(editModule.code);
      setName(editModule.name);
      setAu(editModule.au);
      setType(editModule.type);
      setPrereqText(editModule.prerequisiteCodes.join(', '));
    } else {
      setCode('');
      setName('');
      setAu(3);
      setType('Core');
      setPrereqText('');
    }
  }, [editModule, isOpen]);

  const handleSave = () => {
    if (!code.trim() || !name.trim()) return;

    const prerequisiteCodes = prereqText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editModule) {
      updatePlannedModule(editModule.id, {
        code: code.trim(),
        name: name.trim(),
        au,
        type,
        prerequisiteCodes,
      });
    } else {
      const newModule: PlannedModule = {
        id: generateId(),
        code: code.trim(),
        name: name.trim(),
        au,
        type,
        year,
        semester,
        prerequisiteCodes,
      };
      addPlannedModule(newModule);
    }

    onClose();
  };

  const isEditing = !!editModule;
  const title = isEditing ? 'Edit Planned Module' : `Add Module to Y${year}S${semester}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <Input
          label="Module Code"
          placeholder="e.g. SC1003"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <Input
          label="Module Name"
          placeholder="e.g. Introduction to Computational Thinking"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Academic Units (AU)"
          type="number"
          min={1}
          max={12}
          value={au}
          onChange={(e) => setAu(Number(e.target.value) || 1)}
        />

        <Select
          label="Module Type"
          options={MODULE_TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value as ModuleType)}
        />

        <Input
          label="Prerequisite Codes"
          placeholder="e.g. SC1003, SC1005"
          hint="Comma-separated module codes"
          value={prereqText}
          onChange={(e) => setPrereqText(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!code.trim() || !name.trim()}
          >
            {isEditing ? 'Save Changes' : 'Add Module'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import type { Module, ModuleType, ModuleStatus, Grade } from '../types';
import { createModule, resolvePrerequisites } from '../services/modules';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  show: boolean;
  onHide: () => void;
  onSave: (module: Module, relatedUpdates?: Module[]) => void;
  existingModules: Module[];
  moduleToEdit?: Module | null;
  defaultYear?: number;
  defaultSem?: number;
}

const MODULE_TYPES: ModuleType[] = ['Core', 'BDE', 'ICC-Core', 'ICC-Professional Series', 'ICC-CSL', 'FYP', 'Mathematics PE', 'Physics PE'];
const GRADES: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D+', 'D', 'F', 'S', 'U', 'P', 'Fail', 'EX', 'TC', 'IP', 'LOA'];

const AddEditModuleModal: React.FC<Props> = ({
  show,
  onHide,
  onSave,
  existingModules,
  moduleToEdit,
  defaultYear = 1,
  defaultSem = 1
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [au, setAu] = useState(3);
  const [type, setType] = useState<ModuleType>('Core');
  const [status, setStatus] = useState<ModuleStatus>('Not Started');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [prereqInput, setPrereqInput] = useState('');
  const [currentPrereqs, setCurrentPrereqs] = useState<string[]>([]);

  useEffect(() => {
    if (moduleToEdit) {
      setCode(moduleToEdit.code);
      setName(moduleToEdit.name);
      setAu(moduleToEdit.au);
      setType(moduleToEdit.type);
      setStatus(moduleToEdit.status);
      setGrade(moduleToEdit.grade || '');
      setYear(moduleToEdit.year || 1);
      setSemester(moduleToEdit.semester || 1);
      setCurrentPrereqs(moduleToEdit.prerequisiteCodes || []);
    } else {
      resetForm();
    }
  }, [moduleToEdit, show, defaultYear, defaultSem]);

  const resetForm = () => {
    setCode('');
    setName('');
    setAu(3);
    setType('Core');
    setStatus('Not Started');
    setGrade('');
    setYear(defaultYear);
    setSemester(defaultSem);
    setCurrentPrereqs([]);
    setPrereqInput('');
  };

  const handleAddPrereq = () => {
    if (prereqInput && !currentPrereqs.includes(prereqInput.toUpperCase())) {
      setCurrentPrereqs([...currentPrereqs, prereqInput.toUpperCase()]);
      setPrereqInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalModule: Module;

    if (moduleToEdit) {
      finalModule = {
        ...moduleToEdit,
        code: code.toUpperCase(),
        name,
        au: Number(au),
        type,
        status,
        grade: grade === '' ? null : (grade as Grade),
        year: Number(year),
        semester: Number(semester),
        prerequisiteCodes: currentPrereqs
      };
    } else {
      finalModule = createModule(code, name, Number(au), type, Number(year), Number(semester), status);
      finalModule.grade = grade === '' ? null : (grade as Grade);
      finalModule.prerequisiteCodes = currentPrereqs;
    }

    const relatedUpdates: Module[] = [];
    currentPrereqs.forEach(pCode => {
       resolvePrerequisites(finalModule, pCode, existingModules);

       if (!existingModules.find(m => m.code === pCode)) {
           const stub: Module = {
             id: uuidv4(),
             code: pCode,
             name: 'Unknown Prerequisite',
             au: 0,
             grade: null,
             type: 'Core',
             status: 'Not Started',
             year: 0,
             semester: 0,
             prerequisiteCodes: []
           };
           relatedUpdates.push(stub);
       }
    });

    onSave(finalModule, relatedUpdates);
    onHide();
  };

  return (
    <Modal
      isOpen={show}
      onClose={onHide}
      title={moduleToEdit ? 'Edit Module' : 'Add Module'}
      description={moduleToEdit ? 'Update module details' : 'Add a new module to your plan'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Code + Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Module Code"
            required
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="e.g. SC1003"
          />
          <Input
            label="Module Name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Intro to Comp Thinking"
          />
        </div>

        {/* Row 2: AUs + Type + Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="AUs"
            type="number"
            required
            value={au}
            onChange={e => setAu(Number(e.target.value))}
            min={0}
            max={12}
          />
          <Select
            label="Type"
            value={type}
            onChange={e => setType(e.target.value as ModuleType)}
            options={MODULE_TYPES.map(t => ({ value: t, label: t }))}
          />
          <Select
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value as ModuleStatus)}
            options={[
              { value: 'Not Started', label: 'Not Started' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
            ]}
          />
        </div>

        {/* Row 3: Grade + Year + Semester */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Grade (Optional)"
            value={grade || ''}
            onChange={e => setGrade(e.target.value as Grade)}
          >
            <option value="">— None —</option>
            {GRADES.map(g => (
              <option key={g || 'null'} value={g || ''}>{g}</option>
            ))}
          </Select>
          <Select
            label="Year"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {[1, 2, 3, 4].map(y => (
              <option key={y} value={y}>Year {y}</option>
            ))}
            <option value={0}>Unassigned</option>
          </Select>
          <Select
            label="Semester"
            value={semester}
            onChange={e => setSemester(Number(e.target.value))}
          >
            <option value={1}>Sem 1</option>
            <option value={2}>Sem 2</option>
            <option value={0}>Unassigned</option>
          </Select>
        </div>

        {/* Prerequisites */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Prerequisites
          </label>
          <div className="flex gap-2">
            <Input
              value={prereqInput}
              onChange={e => setPrereqInput(e.target.value)}
              placeholder="Enter prerequisite code (e.g. SC1000)"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPrereq();
                }
              }}
            />
            <Button
              variant="secondary"
              onClick={handleAddPrereq}
              className="shrink-0"
            >
              Add
            </Button>
          </div>
          {currentPrereqs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {currentPrereqs.map(p => (
                <Badge
                  key={p}
                  variant="info"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setCurrentPrereqs(currentPrereqs.filter(x => x !== p))}
                >
                  {p} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {moduleToEdit ? 'Save Changes' : 'Add Module'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditModuleModal;

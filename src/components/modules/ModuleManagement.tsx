import { useState, useMemo, useRef, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { PageHeader } from '../layout';
import { Card, Badge, Button, InlineSelect, Modal } from '../ui';
import { calculateCompositeStats } from '../../utils/gpa';
import { cn, generateId } from '../../lib/utils';
import { EditableCell } from './EditableCell';
import { ModuleTimetableSection } from '../timetable/ModuleTimetableSection';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { useTableKeyboard } from '../../hooks/useTableKeyboard';
import { MODULE_TYPES } from '../../types';
import type { Module, ModuleType, ModuleStatus, Grade } from '../../types';
import type { SelectOption } from '../ui';

type SortField = 'code' | 'name' | 'au' | 'type' | 'year' | 'status' | 'grade';
type SortDir = 'asc' | 'desc';
type ViewMode = 'flat' | 'grouped';

interface ModuleManagementProps {
  onEditModule: (module: Module) => void;
  onAddModule: () => void;
}

// Grade options for select dropdowns — display 'P' as 'Pass'
const GRADE_DISPLAY: Record<string, string> = { P: 'Pass' };
const GRADE_OPTIONS: SelectOption[] = [
  { value: '', label: '—' },
  ...['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D+', 'D', 'F', 'S', 'U', 'P', 'Fail', 'EX', 'TC', 'IP', 'LOA']
    .map(g => ({ value: g, label: GRADE_DISPLAY[g] ?? g })),
];
const MODULE_STATUSES: ModuleStatus[] = ['Not Started', 'In Progress', 'Completed'];

const TYPE_OPTIONS: SelectOption[] = MODULE_TYPES.map(t => ({ value: t, label: t }));
const STATUS_OPTIONS: SelectOption[] = MODULE_STATUSES.map(s => ({ value: s, label: s }));
const YEAR_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Unassigned' },
  { value: '1', label: 'Year 1' },
  { value: '2', label: 'Year 2' },
  { value: '3', label: 'Year 3' },
  { value: '4', label: 'Year 4' },
];
const SEM_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Unassigned' },
  { value: '1', label: 'Sem 1' },
  { value: '2', label: 'Sem 2' },
];

// Quick filter definitions
const QUICK_FILTERS = [
  { id: 'in-progress', label: 'In Progress', test: (m: Module) => m.status === 'In Progress' },
  { id: 'needs-grade', label: 'Needs Grade', test: (m: Module) => m.status === 'Completed' && !m.grade },
  { id: 'failed', label: 'Failed/D', test: (m: Module) => m.grade === 'F' || m.grade === 'D' || m.grade === 'D+' },
  { id: 'high-au', label: 'AU ≥ 4', test: (m: Module) => m.au >= 4 },
] as const;

// All possible columns
type ColumnId = 'code' | 'name' | 'au' | 'type' | 'year' | 'status' | 'grade' | 'projectedGrade' | 'notes' | 'tags';
const ALL_COLUMNS: { id: ColumnId; label: string; sortField?: SortField; align?: string; defaultVisible: boolean }[] = [
  { id: 'code', label: 'Code', sortField: 'code', defaultVisible: true },
  { id: 'name', label: 'Name', sortField: 'name', defaultVisible: true },
  { id: 'au', label: 'AU', sortField: 'au', align: 'center', defaultVisible: true },
  { id: 'type', label: 'Type', sortField: 'type', defaultVisible: true },
  { id: 'year', label: 'Period', sortField: 'year', defaultVisible: true },
  { id: 'status', label: 'Status', sortField: 'status', defaultVisible: true },
  { id: 'grade', label: 'Grade', sortField: 'grade', align: 'center', defaultVisible: true },
  { id: 'projectedGrade', label: 'Proj. Grade', align: 'center', defaultVisible: true },
  { id: 'notes', label: 'Notes', defaultVisible: false },
  { id: 'tags', label: 'Tags', defaultVisible: false },
];

const DEFAULT_VISIBLE = new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id));

// Row color coding rules
function getRowAccent(mod: Module): string | null {
  if (mod.grade === 'F' || mod.grade === 'D' || mod.grade === 'D+') return 'border-l-4 border-l-danger-400';
  if (mod.grade === 'A+' || mod.grade === 'A') return 'border-l-4 border-l-success-400';
  if (mod.status === 'In Progress') return 'border-l-4 border-l-primary-400';
  if (mod.status === 'Completed' && !mod.grade) return 'border-l-4 border-l-warning-400';
  return null;
}

// Quick add row default state
function emptyQuickAdd(year?: number, sem?: number): Record<string, string | number> {
  return {
    code: '',
    name: '',
    au: 3,
    type: 'Core',
    status: 'Not Started',
    grade: '',
    projectedGrade: '',
    year: year || 1,
    semester: sem || 1,
  };
}

export function ModuleManagement({ onEditModule, onAddModule }: ModuleManagementProps) {
  const { modules, addModule, updateModule, deleteModule, deleteModules, moveModules } = useStore();
  const { canUndo, canRedo, undo, redo, lastAction } = useUndoRedo();

  // Filters
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterSem, setFilterSem] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<ModuleType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ModuleStatus | ''>('');
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());

  // Sort & view
  const [sortField, setSortField] = useState<SortField>('year');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveYear, setMoveYear] = useState(1);
  const [moveSem, setMoveSem] = useState(1);
  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [batchUpdateField, setBatchUpdateField] = useState<'grade' | 'status' | 'type'>('grade');
  const [batchUpdateValue, setBatchUpdateValue] = useState('');
  const [batchAlsoComplete, setBatchAlsoComplete] = useState(false);

  // Inline editing
  const [editingCell, setEditingCell] = useState<string | null>(null);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(DEFAULT_VISIBLE);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Quick add row
  const [quickAdd, setQuickAdd] = useState(() => emptyQuickAdd());
  const [quickAddError, setQuickAddError] = useState('');
  const quickAddCodeRef = useRef<HTMLInputElement>(null);

  // Batch add state
  const [batchText, setBatchText] = useState('');
  const [batchParsed, setBatchParsed] = useState<Record<string, string>[]>([]);
  const [batchErrors, setBatchErrors] = useState<Record<number, string>>({});
  const [batchTab, setBatchTab] = useState<'paste' | 'form'>('paste');
  const [batchRows, setBatchRows] = useState<Record<string, string | number>[]>([
    emptyQuickAdd(),
    emptyQuickAdd(),
    emptyQuickAdd(),
  ]);
  const [batchDefaults, setBatchDefaults] = useState({ type: 'Core' as string, year: '1', semester: '1' });

  // Expandable timetable section
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // ---------- Filtering & Sorting ----------

  const filtered = useMemo(() => {
    let result = [...modules];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        m => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
      );
    }
    if (filterYear !== '') result = result.filter(m => m.year === filterYear);
    if (filterSem !== '') result = result.filter(m => m.semester === filterSem);
    if (filterType !== '') result = result.filter(m => m.type === filterType);
    if (filterStatus !== '') result = result.filter(m => m.status === filterStatus);

    // Quick filters (OR within active quick filters)
    if (activeQuickFilters.size > 0) {
      const activeTests = QUICK_FILTERS.filter(f => activeQuickFilters.has(f.id));
      result = result.filter(m => activeTests.some(f => f.test(m)));
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'code': cmp = a.code.localeCompare(b.code); break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'au': cmp = a.au - b.au; break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'year': cmp = (a.year * 10 + a.semester) - (b.year * 10 + b.semester); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'grade': cmp = (a.grade || '').localeCompare(b.grade || ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [modules, search, filterYear, filterSem, filterType, filterStatus, sortField, sortDir, activeQuickFilters]);

  const grouped = useMemo(() => {
    const groups: Record<string, Module[]> = {};
    filtered.forEach(m => {
      const key = `Y${m.year}S${m.semester}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    const s = calculateCompositeStats(modules);
    return {
      totalModules: modules.length,
      totalAU: modules.reduce((sum, m) => sum + m.au, 0),
      avgGPA: s.official.gpa,
      completed: modules.filter(m => m.status === 'Completed').length,
      inProgress: modules.filter(m => m.status === 'In Progress').length,
    };
  }, [modules]);

  // ---------- Handlers ----------

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(m => m.id)));
  };

  const handleBatchDelete = () => {
    deleteModules(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  const handleBatchMove = () => {
    moveModules(Array.from(selectedIds), moveYear, moveSem);
    setSelectedIds(new Set());
    setShowMoveModal(false);
  };

  const handleCellSave = useCallback((moduleId: string, field: string, value: string | number | null) => {
    const updates: Partial<Module> = {};
    if (field === 'year' || field === 'semester' || field === 'au') {
      (updates as Record<string, number>)[field] = Number(value) || 0;
    } else if (field === 'grade' || field === 'projectedGrade') {
      (updates as Record<string, Grade>)[field] = (value === '' || value === null ? null : value) as Grade;
    } else {
      (updates as Record<string, string>)[field] = String(value || '');
    }
    updateModule(moduleId, updates);
  }, [updateModule]);

  const handleDuplicate = useCallback((mod: Module) => {
    const newModule: Module = {
      ...mod,
      id: generateId(),
      code: mod.code + '-COPY',
      grade: null,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addModule(newModule);
    // Start editing the code cell of the new module
    setTimeout(() => setEditingCell(`${newModule.id}:code`), 100);
  }, [addModule]);

  // Quick add
  const handleQuickAdd = () => {
    const code = String(quickAdd.code).trim().toUpperCase();
    const name = String(quickAdd.name).trim();
    if (!code || !name) {
      setQuickAddError('Code and Name are required');
      return;
    }
    if (modules.some(m => m.code === code)) {
      setQuickAddError(`Module ${code} already exists`);
      return;
    }
    setQuickAddError('');
    const newModule: Module = {
      id: generateId(),
      code,
      name,
      au: Number(quickAdd.au) || 3,
      type: (quickAdd.type || 'Core') as ModuleType,
      status: (quickAdd.status || 'Not Started') as ModuleStatus,
      grade: quickAdd.grade ? (quickAdd.grade as Grade) : null,
      projectedGrade: quickAdd.projectedGrade ? (quickAdd.projectedGrade as Grade) : null,
      year: Number(quickAdd.year) || 1,
      semester: Number(quickAdd.semester) || 1,
      prerequisiteCodes: [],
    };
    addModule(newModule);
    setQuickAdd(emptyQuickAdd(Number(quickAdd.year), Number(quickAdd.semester)));
    quickAddCodeRef.current?.focus();
  };

  // Batch update
  const handleBatchUpdate = () => {
    const ids = Array.from(selectedIds);
    ids.forEach(id => {
      const updates: Partial<Module> = {};
      if (batchUpdateField === 'grade') {
        updates.grade = (batchUpdateValue === '' ? null : batchUpdateValue) as Grade;
        if (batchAlsoComplete) updates.status = 'Completed';
      } else if (batchUpdateField === 'status') {
        updates.status = batchUpdateValue as ModuleStatus;
      } else if (batchUpdateField === 'type') {
        updates.type = batchUpdateValue as ModuleType;
      }
      updateModule(id, updates);
    });
    setSelectedIds(new Set());
    setShowBatchUpdate(false);
    setBatchUpdateValue('');
    setBatchAlsoComplete(false);
  };

  // Batch add - parse CSV
  const parseBatchText = () => {
    const lines = batchText.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) { setBatchParsed([]); setBatchErrors({}); return; }

    // Detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

    const parsed: Record<string, string>[] = [];
    const errors: Record<number, string> = {};

    lines.forEach((line, i) => {
      const parts = line.split(delimiter).map(p => p.trim());
      if (parts.length < 2) {
        errors[i] = 'Need at least Code and Name';
        parsed.push({ code: parts[0] || '', name: '', error: 'true' });
        return;
      }
      const code = parts[0].toUpperCase();
      if (modules.some(m => m.code === code)) {
        errors[i] = `${code} already exists`;
      }
      parsed.push({
        code,
        name: parts[1] || '',
        au: parts[2] || '3',
        type: parts[3] || 'Core',
        grade: parts[4] || '',
        year: parts[5] || '1',
        semester: parts[6] || '1',
      });
    });

    setBatchParsed(parsed);
    setBatchErrors(errors);
  };

  const commitBatchPaste = () => {
    const validRows = batchParsed.filter((_, i) => !batchErrors[i]);
    validRows.forEach(row => {
      addModule({
        id: generateId(),
        code: row.code.toUpperCase(),
        name: row.name,
        au: Number(row.au) || 3,
        type: (MODULE_TYPES.includes(row.type as ModuleType) ? row.type : 'Core') as ModuleType,
        status: 'Not Started' as ModuleStatus,
        grade: row.grade ? (row.grade as Grade) : null,
        year: Number(row.year) || 1,
        semester: Number(row.semester) || 1,
        prerequisiteCodes: [],
      });
    });
    setShowBatchAdd(false);
    setBatchText('');
    setBatchParsed([]);
    setBatchErrors({});
  };

  const commitBatchForm = () => {
    const validRows = batchRows.filter(r => String(r.code).trim() && String(r.name).trim());
    validRows.forEach(row => {
      const code = String(row.code).trim().toUpperCase();
      if (modules.some(m => m.code === code)) return; // skip duplicates
      addModule({
        id: generateId(),
        code,
        name: String(row.name).trim(),
        au: Number(row.au) || 3,
        type: (String(row.type) || batchDefaults.type) as ModuleType,
        status: 'Not Started' as ModuleStatus,
        grade: row.grade ? (String(row.grade) as Grade) : null,
        year: Number(row.year) || Number(batchDefaults.year) || 1,
        semester: Number(row.semester) || Number(batchDefaults.semester) || 1,
        prerequisiteCodes: [],
      });
    });
    setShowBatchAdd(false);
    setBatchRows([emptyQuickAdd(), emptyQuickAdd(), emptyQuickAdd()]);
  };

  // Export selected as CSV
  const exportSelectedCSV = () => {
    const selected = modules.filter(m => selectedIds.has(m.id));
    const header = 'Code,Name,AU,Type,Status,Grade,Year,Semester';
    const rows = selected.map(m => `${m.code},${m.name},${m.au},${m.type},${m.status},${m.grade || ''},${m.year},${m.semester}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modules.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleQuickFilter = (id: string) => {
    setActiveQuickFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleColumnVisibility = (colId: ColumnId) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId); else next.add(colId);
      return next;
    });
  };

  // ---------- Sub-components ----------

  const gradeColor = (grade: Grade) => {
    if (!grade) return 'text-gray-400';
    if (['A+', 'A', 'A-'].includes(grade)) return 'text-success-600 dark:text-success-400';
    if (['B+', 'B', 'B-'].includes(grade)) return 'text-primary-600 dark:text-primary-400';
    return 'text-warning-600 dark:text-warning-400';
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none">
      <span className={sortField === field && sortDir === 'asc' ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'}>▲</span>
      <span className={sortField === field && sortDir === 'desc' ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'}>▼</span>
    </span>
  );

  const visibleCols = ALL_COLUMNS.filter(c => visibleColumns.has(c.id));
  const keyboardColumns = useMemo(() => visibleCols.map(c => c.id), [visibleCols]);

  // Keyboard navigation
  const { focusedCell } = useTableKeyboard({
    rowCount: filtered.length,
    columnCount: visibleCols.length,
    onEditCell: (row, col) => {
      const mod = filtered[row];
      if (mod) {
        const colId = keyboardColumns[col];
        if (colId) setEditingCell(`${mod.id}:${colId}`);
      }
    },
    onToggleSelect: (row) => {
      const mod = filtered[row];
      if (mod) toggleSelect(mod.id);
    },
    onDeleteSelected: () => {
      if (selectedIds.size > 0) setShowDeleteConfirm(true);
    },
    onDuplicate: (row) => {
      const mod = filtered[row];
      if (mod) handleDuplicate(mod);
    },
    enabled: editingCell === null, // Disable when editing a cell
  });

  // ---------- Render table ----------

  const renderTable = (mods: Module[], showQuickAdd = false) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-3 text-left w-10">
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
            </th>
            {visibleCols.map(col => (
              <th
                key={col.id}
                onClick={() => col.sortField && toggleSort(col.sortField)}
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors',
                  col.sortField && 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200',
                  col.align === 'center' ? 'text-center' : 'text-left'
                )}
              >
                {col.label}
                {col.sortField && <SortIcon field={col.sortField} />}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          <AnimatePresence>
            {mods.map((mod) => {
              const accent = getRowAccent(mod);
              const globalRowIdx = filtered.indexOf(mod);
              const isRowFocused = focusedCell?.row === globalRowIdx;
              return (
                <Fragment key={mod.id}>
                <motion.tr
                  key={mod.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                    selectedIds.has(mod.id) && 'bg-primary-50/50 dark:bg-primary-900/10',
                    isRowFocused && 'ring-2 ring-inset ring-primary-400/50',
                    accent
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(mod.id)}
                      onChange={() => toggleSelect(mod.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                  </td>

                  {/* Editable cells */}
                  {visibleCols.map(col => {
                    switch (col.id) {
                      case 'code':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="code"
                            value={mod.code}
                            type="text"
                            autoUppercase
                            onSave={handleCellSave}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            renderDisplay={(v) => (
                              <span className="font-medium text-gray-900 dark:text-white">{v}</span>
                            )}
                          />
                        );
                      case 'name':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="name"
                            value={mod.name}
                            type="text"
                            onSave={handleCellSave}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                          />
                        );
                      case 'au':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="au"
                            value={mod.au}
                            type="number"
                            numberMin={0}
                            numberMax={12}
                            onSave={handleCellSave}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            className="text-center"
                          />
                        );
                      case 'type':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="type"
                            value={mod.type}
                            type="select"
                            options={TYPE_OPTIONS}
                            onSave={handleCellSave}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            renderDisplay={(v) => <Badge variant="default" size="sm">{v}</Badge>}
                          />
                        );
                      case 'year':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="year"
                            value={mod.year}
                            type="select"
                            options={[
                              { value: `${mod.year}-${mod.semester}`, label: `Y${mod.year}S${mod.semester}` },
                              ...([1,2,3,4].flatMap(y => [1,2].map(s => ({ value: `${y}-${s}`, label: `Y${y}S${s}` })))),
                            ].filter((opt, i, arr) => arr.findIndex(o => o.value === opt.value) === i)}
                            onSave={(moduleId, _field, value) => {
                              const [y, s] = String(value).split('-').map(Number);
                              updateModule(moduleId, { year: y, semester: s });
                            }}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            renderDisplay={() => (
                              <span className="text-sm text-gray-500 dark:text-gray-400">Y{mod.year}S{mod.semester}</span>
                            )}
                          />
                        );
                      case 'status':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="status"
                            value={mod.status}
                            type="select"
                            options={STATUS_OPTIONS}
                            onSave={handleCellSave}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            renderDisplay={(v) => (
                              <Badge
                                variant={v === 'Completed' ? 'success' : v === 'In Progress' ? 'warning' : 'default'}
                                size="sm"
                              >
                                {v}
                              </Badge>
                            )}
                          />
                        );
                      case 'grade':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="grade"
                            value={mod.grade}
                            type="select"
                            options={GRADE_OPTIONS}
                            onSave={handleCellSave}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            className="text-center"
                            renderDisplay={(v) => (
                              <span className={cn('font-semibold', gradeColor(v as Grade))}>
                                {v || '—'}
                              </span>
                            )}
                          />
                        );
                      case 'projectedGrade':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="projectedGrade"
                            value={mod.projectedGrade ?? null}
                            type="select"
                            options={GRADE_OPTIONS}
                            onSave={handleCellSave}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            className="text-center"
                            renderDisplay={(v) => (
                              <span className={cn('font-semibold italic', gradeColor(v as Grade))}>
                                {v || '—'}
                              </span>
                            )}
                          />
                        );
                      case 'notes':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="notes"
                            value={mod.notes || ''}
                            type="text"
                            onSave={handleCellSave}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            renderDisplay={(v) => (
                              <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[150px] block" title={String(v || '')}>
                                {v || '—'}
                              </span>
                            )}
                          />
                        );
                      case 'tags':
                        return (
                          <EditableCell
                            key={col.id}
                            moduleId={mod.id}
                            field="tags"
                            value={(mod.tags || []).join(', ')}
                            type="text"
                            onSave={(moduleId, _field, value) => {
                              const tags = String(value || '').split(',').map(t => t.trim()).filter(Boolean);
                              updateModule(moduleId, { tags });
                            }}
                            editingCell={editingCell}
                            onStartEdit={setEditingCell}
                            onStopEdit={() => setEditingCell(null)}
                            renderDisplay={() => (
                              <div className="flex gap-1 flex-wrap">
                                {(mod.tags || []).length > 0
                                  ? (mod.tags || []).map(t => <Badge key={t} variant="info" size="sm">{t}</Badge>)
                                  : <span className="text-xs text-gray-400">—</span>
                                }
                              </div>
                            )}
                          />
                        );
                      default:
                        return null;
                    }
                  })}

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Expand timetable */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedModuleId(prev => prev === mod.id ? null : mod.id); }}
                        className={cn(
                          'p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                          expandedModuleId === mod.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                        )}
                        title={expandedModuleId === mod.id ? 'Hide timetable' : 'Show timetable'}
                      >
                        <svg className={cn('w-4 h-4 transition-transform', expandedModuleId === mod.id && 'rotate-90')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(mod)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Duplicate"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      {/* Full edit (modal) */}
                      <button
                        onClick={() => onEditModule(mod)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Full Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${mod.code}?`)) {
                            deleteModule(mod.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </motion.tr>
                {/* Expandable timetable section */}
                {expandedModuleId === mod.id && (
                  <tr className="bg-gray-50/80 dark:bg-gray-800/40">
                    <td colSpan={visibleCols.length + 2} className="px-6 py-3">
                      <div className="max-w-2xl">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                          Timetable — {mod.code}
                        </p>
                        <ModuleTimetableSection
                          moduleCode={mod.code}
                          year={mod.year}
                          semester={mod.semester}
                        />
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </AnimatePresence>

          {/* Quick Add Row */}
          {showQuickAdd && (
            <tr className="border-t-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              <td className="px-4 py-2">
                <span className="text-gray-300 dark:text-gray-600 text-lg">+</span>
              </td>
              {visibleCols.map(col => {
                switch (col.id) {
                  case 'code':
                    return (
                      <td key={col.id} className="px-4 py-2">
                        <input
                          ref={quickAddCodeRef}
                          type="text"
                          placeholder="SC1003"
                          value={quickAdd.code}
                          onChange={e => setQuickAdd(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); if (e.key === 'Escape') setQuickAdd(emptyQuickAdd(Number(quickAdd.year), Number(quickAdd.semester))); }}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </td>
                    );
                  case 'name':
                    return (
                      <td key={col.id} className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Module Name"
                          value={quickAdd.name}
                          onChange={e => setQuickAdd(prev => ({ ...prev, name: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </td>
                    );
                  case 'au':
                    return (
                      <td key={col.id} className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          max={12}
                          value={quickAdd.au}
                          onChange={e => setQuickAdd(prev => ({ ...prev, au: Number(e.target.value) }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }}
                          className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </td>
                    );
                  case 'type':
                    return (
                      <td key={col.id} className="px-4 py-2">
                        <InlineSelect
                          value={String(quickAdd.type)}
                          onChange={e => setQuickAdd(prev => ({ ...prev, type: e.target.value }))}
                          options={TYPE_OPTIONS}
                        />
                      </td>
                    );
                  case 'year':
                    return (
                      <td key={col.id} className="px-4 py-2">
                        <div className="flex gap-1">
                          <InlineSelect
                            value={String(quickAdd.year)}
                            onChange={e => setQuickAdd(prev => ({ ...prev, year: Number(e.target.value) }))}
                            options={YEAR_OPTIONS}
                            className="w-20"
                          />
                          <InlineSelect
                            value={String(quickAdd.semester)}
                            onChange={e => setQuickAdd(prev => ({ ...prev, semester: Number(e.target.value) }))}
                            options={SEM_OPTIONS}
                            className="w-20"
                          />
                        </div>
                      </td>
                    );
                  case 'status':
                    return (
                      <td key={col.id} className="px-4 py-2">
                        <InlineSelect
                          value={String(quickAdd.status)}
                          onChange={e => setQuickAdd(prev => ({ ...prev, status: e.target.value }))}
                          options={STATUS_OPTIONS}
                        />
                      </td>
                    );
                  case 'grade':
                    return (
                      <td key={col.id} className="px-4 py-2">
                        <InlineSelect
                          value={String(quickAdd.grade)}
                          onChange={e => setQuickAdd(prev => ({ ...prev, grade: e.target.value }))}
                          options={GRADE_OPTIONS}
                        />
                      </td>
                    );
                  case 'projectedGrade':
                    return (
                      <td key={col.id} className="px-4 py-2">
                        <InlineSelect
                          value={String(quickAdd.projectedGrade)}
                          onChange={e => setQuickAdd(prev => ({ ...prev, projectedGrade: e.target.value }))}
                          options={GRADE_OPTIONS}
                        />
                      </td>
                    );
                  case 'notes':
                  case 'tags':
                    return <td key={col.id} className="px-4 py-2"><span className="text-gray-300">—</span></td>;
                  default:
                    return null;
                }
              })}
              <td className="px-4 py-2 text-right">
                <Button onClick={handleQuickAdd} variant="success" size="sm">
                  Add
                </Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {quickAddError && (
        <p className="text-sm text-danger-500 px-4 py-1">{quickAddError}</p>
      )}
    </div>
  );

  // ---------- Main render ----------

  return (
    <div>
      <PageHeader
        title="All Modules"
        description={`${modules.length} modules tracked across your degree`}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Modules', value: stats.totalModules, color: 'text-gray-900 dark:text-white' },
          { label: 'Total AU', value: stats.totalAU, color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Avg GPA', value: stats.avgGPA.toFixed(2), color: 'text-success-600 dark:text-success-400' },
          { label: 'Completed', value: stats.completed, color: 'text-success-600 dark:text-success-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-warning-600 dark:text-warning-400' },
        ].map(s => (
          <Card key={s.label} className="!p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="mb-4">
        <div className="flex flex-col gap-3">
          {/* Search, view toggle, and buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by code or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('flat')}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  viewMode === 'flat' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                Flat
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  viewMode === 'grouped' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                Grouped
              </button>
            </div>

            {/* Column visibility toggle */}
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Toggle columns"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
              {showColumnMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[180px]">
                    {ALL_COLUMNS.map(col => (
                      <label key={col.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col.id)}
                          onChange={() => toggleColumnVisibility(col.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                      </label>
                    ))}
                    <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1 px-3">
                      <button
                        onClick={() => setVisibleColumns(DEFAULT_VISIBLE)}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Reset to default
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  canUndo ? 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                )}
                title="Undo (Cmd+Z)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  canRedo ? 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                )}
                title="Redo (Cmd+Shift+Z)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
                </svg>
              </button>
            </div>

            <Button onClick={() => setShowBatchAdd(true)} variant="secondary" size="sm">
              Batch Add
            </Button>
            <Button onClick={onAddModule} variant="primary" size="sm">
              + Add Module
            </Button>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick:</span>
            {QUICK_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => toggleQuickFilter(f.id)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  activeQuickFilters.has(f.id)
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filters:</span>
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Years</option>
              {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <select
              value={filterSem}
              onChange={e => setFilterSem(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Sems</option>
              {[1, 2].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as ModuleType | '')}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              {MODULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ModuleStatus | '')}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              {MODULE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(filterYear !== '' || filterSem !== '' || filterType !== '' || filterStatus !== '' || search || activeQuickFilters.size > 0) && (
              <button
                onClick={() => {
                  setFilterYear('');
                  setFilterSem('');
                  setFilterType('');
                  setFilterStatus('');
                  setSearch('');
                  setActiveQuickFilters(new Set());
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Batch Actions */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => { setBatchUpdateField('grade'); setBatchUpdateValue(''); setShowBatchUpdate(true); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
              >
                Set Grade
              </button>
              <button
                onClick={() => { setBatchUpdateField('status'); setBatchUpdateValue(''); setShowBatchUpdate(true); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
              >
                Set Status
              </button>
              <button
                onClick={() => setShowMoveModal(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
              >
                Move
              </button>
              <button
                onClick={() => {
                  const selected = modules.filter(m => selectedIds.has(m.id));
                  selected.forEach(mod => handleDuplicate(mod));
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={exportSelectedCSV}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-auto"
              >
                Deselect All
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Module List */}
      {filtered.length === 0 && modules.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No modules found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add your first module to get started</p>
            <Button onClick={onAddModule} variant="primary" size="sm" className="mt-4">
              + Add Module
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No modules match your filters</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        </Card>
      ) : viewMode === 'flat' ? (
        <Card className="!p-0 overflow-hidden">
          {renderTable(filtered, true)}
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, mods], groupIndex, arr) => (
              <Card key={period} className="!p-0 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{period}</h3>
                    <Badge variant="default" size="sm">{mods.length} modules</Badge>
                    <Badge variant="info" size="sm">{mods.reduce((s, m) => s + m.au, 0)} AU</Badge>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    GPA: {calculateCompositeStats(mods).official.gpa.toFixed(2)}
                  </span>
                </div>
                {renderTable(mods, groupIndex === arr.length - 1)}
              </Card>
            ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete {selectedIds.size} modules?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleBatchDelete}>Delete</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Move {selectedIds.size} modules
            </h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <select value={moveYear} onChange={e => setMoveYear(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                <select value={moveSem} onChange={e => setMoveSem(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                  {[1, 2].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowMoveModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleBatchMove}>Move</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Batch Update Modal */}
      <Modal
        isOpen={showBatchUpdate}
        onClose={() => setShowBatchUpdate(false)}
        title={`Set ${batchUpdateField === 'grade' ? 'Grade' : batchUpdateField === 'status' ? 'Status' : 'Type'} for ${selectedIds.size} modules`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="max-h-32 overflow-y-auto text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
            {modules.filter(m => selectedIds.has(m.id)).map(m => (
              <div key={m.id}>{m.code} — {m.name}</div>
            ))}
          </div>

          {batchUpdateField === 'grade' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
                <select
                  value={batchUpdateValue}
                  onChange={e => setBatchUpdateValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                >
                  <option value="">— None —</option>
                  {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D+', 'D', 'F', 'S', 'U', 'P', 'Fail'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={batchAlsoComplete}
                  onChange={e => setBatchAlsoComplete(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                Also mark as Completed
              </label>
            </>
          )}

          {batchUpdateField === 'status' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={batchUpdateValue}
                onChange={e => setBatchUpdateValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
              >
                <option value="">— Select —</option>
                {MODULE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {batchUpdateField === 'type' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                value={batchUpdateValue}
                onChange={e => setBatchUpdateValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
              >
                <option value="">— Select —</option>
                {MODULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowBatchUpdate(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleBatchUpdate} disabled={!batchUpdateValue && batchUpdateField !== 'grade'}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>

      {/* Batch Add Modal */}
      <Modal
        isOpen={showBatchAdd}
        onClose={() => { setShowBatchAdd(false); setBatchText(''); setBatchParsed([]); setBatchErrors({}); }}
        title="Batch Add Modules"
        size="xl"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setBatchTab('paste')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                batchTab === 'paste'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              Paste CSV
            </button>
            <button
              onClick={() => setBatchTab('form')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                batchTab === 'form'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              Multi-Row Form
            </button>
          </div>

          {batchTab === 'paste' ? (
            <>
              <textarea
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                placeholder={"Code, Name, AU, Type, Grade, Year, Sem\nSC1003, Introduction to Computational Thinking, 3, Core, , 1, 1\nSC1005, Digital Logic, 3, Core, , 1, 1"}
                rows={8}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
              <Button onClick={parseBatchText} variant="secondary" size="sm">Parse</Button>

              {batchParsed.length > 0 && (
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-2 py-1 text-left text-xs text-gray-500">Code</th>
                        <th className="px-2 py-1 text-left text-xs text-gray-500">Name</th>
                        <th className="px-2 py-1 text-left text-xs text-gray-500">AU</th>
                        <th className="px-2 py-1 text-left text-xs text-gray-500">Type</th>
                        <th className="px-2 py-1 text-left text-xs text-gray-500">Grade</th>
                        <th className="px-2 py-1 text-left text-xs text-gray-500">Year</th>
                        <th className="px-2 py-1 text-left text-xs text-gray-500">Sem</th>
                        <th className="px-2 py-1 text-left text-xs text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchParsed.map((row, i) => (
                        <tr key={i} className={batchErrors[i] ? 'bg-danger-50 dark:bg-danger-900/20' : ''}>
                          <td className="px-2 py-1 font-medium">{row.code}</td>
                          <td className="px-2 py-1">{row.name}</td>
                          <td className="px-2 py-1">{row.au}</td>
                          <td className="px-2 py-1">{row.type}</td>
                          <td className="px-2 py-1">{row.grade || '—'}</td>
                          <td className="px-2 py-1">{row.year}</td>
                          <td className="px-2 py-1">{row.semester}</td>
                          <td className="px-2 py-1">
                            {batchErrors[i] ? (
                              <span className="text-danger-500 text-xs">{batchErrors[i]}</span>
                            ) : (
                              <span className="text-success-500 text-xs">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {batchParsed.length > 0 && (
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" size="sm" onClick={() => { setBatchParsed([]); setBatchErrors({}); }}>Clear</Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={commitBatchPaste}
                    disabled={batchParsed.filter((_, i) => !batchErrors[i]).length === 0}
                  >
                    Add {batchParsed.filter((_, i) => !batchErrors[i]).length} modules
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Shared defaults */}
              <div className="flex gap-3 items-end pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 self-center">Defaults:</span>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Type</label>
                  <select
                    value={batchDefaults.type}
                    onChange={e => setBatchDefaults(prev => ({ ...prev, type: e.target.value }))}
                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                  >
                    {MODULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Year</label>
                  <select
                    value={batchDefaults.year}
                    onChange={e => setBatchDefaults(prev => ({ ...prev, year: e.target.value }))}
                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                  >
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Sem</label>
                  <select
                    value={batchDefaults.semester}
                    onChange={e => setBatchDefaults(prev => ({ ...prev, semester: e.target.value }))}
                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                  >
                    {[1, 2].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>

              {/* Form rows */}
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-2 py-1 text-left text-xs text-gray-500">Code *</th>
                      <th className="px-2 py-1 text-left text-xs text-gray-500">Name *</th>
                      <th className="px-2 py-1 text-left text-xs text-gray-500">AU</th>
                      <th className="px-2 py-1 text-left text-xs text-gray-500">Type</th>
                      <th className="px-2 py-1 text-left text-xs text-gray-500">Grade</th>
                      <th className="px-2 py-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchRows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            placeholder="SC1003"
                            value={row.code}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[i] = { ...updated[i], code: e.target.value.toUpperCase() };
                              setBatchRows(updated);
                            }}
                            className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            placeholder="Module Name"
                            value={row.name}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setBatchRows(updated);
                            }}
                            className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            min={0}
                            max={12}
                            value={row.au}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[i] = { ...updated[i], au: Number(e.target.value) };
                              setBatchRows(updated);
                            }}
                            className="w-16 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-xs text-center focus:ring-1 focus:ring-primary-500 outline-none"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <select
                            value={String(row.type || batchDefaults.type)}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[i] = { ...updated[i], type: e.target.value };
                              setBatchRows(updated);
                            }}
                            className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-1 py-1 text-xs"
                          >
                            {MODULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1">
                          <select
                            value={String(row.grade || '')}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[i] = { ...updated[i], grade: e.target.value };
                              setBatchRows(updated);
                            }}
                            className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-1 py-1 text-xs"
                          >
                            <option value="">—</option>
                            {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D+', 'D', 'F'].map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-1 py-1">
                          <button
                            onClick={() => setBatchRows(batchRows.filter((_, j) => j !== i))}
                            className="p-1 text-gray-400 hover:text-danger-500 transition-colors"
                            title="Remove row"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBatchRows([...batchRows, emptyQuickAdd()])}
                >
                  + Add Row
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowBatchAdd(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={commitBatchForm}
                    disabled={batchRows.filter(r => String(r.code).trim() && String(r.name).trim()).length === 0}
                  >
                    Add {batchRows.filter(r => String(r.code).trim() && String(r.name).trim()).length} modules
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Undo/Redo Toast */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-xl shadow-lg text-sm font-medium"
          >
            {lastAction}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

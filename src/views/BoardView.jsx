import React, { useState, useMemo } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Filter, ArrowUpDown, Plus, Paperclip, MessageSquare, Clock,
  GripVertical, X, Check, ChevronDown, MoreHorizontal, Archive,
  Tag, Users, Calendar, ChevronLeft,
} from 'lucide-react';
import CardDetailModal from '../components/CardDetailModal';
import './BoardView.css';

// ─── helpers ────────────────────────────────────────────────────────────────
const STATUS_CLASS = { 'In Review': 'status-review', 'Drafts': 'status-draft', 'In Progress': 'status-progress', 'Todo': 'status-todo', 'Done': 'status-done' };
const PRIORITY_CLASS = { High: 'priority-high', Medium: 'priority-mid', Low: 'priority-low' };
const sc = (s) => STATUS_CLASS[s] || 'status-default';
const pc = (p) => PRIORITY_CLASS[p] || 'priority-default';

const STATUS_OPTIONS = ['Todo', 'In Progress', 'In Review', 'Drafts', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const dueDateInfo = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = d - now;
  const days = Math.ceil(diff / 86400000);
  const text = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  if (days < 0) return { text, cls: 'due-overdue' };
  if (days === 0) return { text, cls: 'due-today' };
  if (days <= 3) return { text, cls: 'due-soon' };
  return { text, cls: 'due-ok' };
};

// ─── New Task Form ────────────────────────────────────────────────────────────
const NewTaskForm = ({ onAdd, onCancel, authorName }) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('Medium');

  const handleAdd = () => {
    if (!title.trim()) return;
    const ts = Date.now();
    onAdd({
      id: `t${ts}`,
      title: title.trim(),
      description: '',
      category: 'Geral',
      status, priority,
      dueDate: '',
      labelIds: [], memberIds: [],
      checklists: [], comments: [],
      attachments: 0, progress: 0,
      archived: false,
      createdAt: new Date().toISOString(),
      activity: [{ id: `act-${ts}`, text: 'criou este card', author: authorName, timestamp: new Date().toISOString() }],
    });
    setTitle('');
  };

  return (
    <div className="new-task-form">
      <input
        autoFocus
        className="ntf-input ntf-title"
        placeholder="Título do card..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onCancel(); }}
      />
      <div className="ntf-row">
        <select className="ntf-select" value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="ntf-select" value={priority} onChange={e => setPriority(e.target.value)}>
          {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="ntf-actions">
        <button className="ntf-btn-add" onClick={handleAdd}><Check size={14} /> Adicionar</button>
        <button className="ntf-btn-cancel" onClick={onCancel}><X size={14} /></button>
      </div>
    </div>
  );
};

// ─── Kanban Card ──────────────────────────────────────────────────────────────
const KanbanCard = ({ task, board, onCardClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };

  const due = dueDateInfo(task.dueDate);
  const taskLabels = board.labels.filter(l => task.labelIds.includes(l.id));
  const taskMembers = board.members.filter(m => task.memberIds.includes(m.id));
  const totalCheckItems = task.checklists.reduce((s, cl) => s + cl.items.length, 0);
  const doneCheckItems = task.checklists.reduce((s, cl) => s + cl.items.filter(i => i.checked).length, 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${task.archived ? 'card-archived' : ''}`}
      {...attributes}
      onClick={() => onCardClick(task)}
    >
      {/* Labels strip */}
      {taskLabels.length > 0 && (
        <div className="card-labels">
          {taskLabels.map(lbl => (
            <span key={lbl.id} className="card-label-dot" style={{ background: lbl.color }} title={lbl.name} />
          ))}
        </div>
      )}

      <div className="task-card-header">
        <div className="task-badges">
          <span className={`badge-pill ${sc(task.status)}`}>{task.status}</span>
          <span className={`badge-pill ${pc(task.priority)}`}>{task.priority}</span>
        </div>
        <button
          className="drag-handle"
          {...listeners}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
      </div>

      <div className="task-info">
        <h4 className="task-title">{task.title}</h4>
        {task.category && <span className="task-category">{task.category}</span>}
      </div>

      {task.progress > 0 && (
        <div className="task-progress-inline">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${task.progress}%` }} />
          </div>
          <span className="progress-text">{task.progress}%</span>
        </div>
      )}

      <div className="task-card-footer">
        <div className="task-meta">
          {task.comments.length > 0 && (
            <div className="meta-item"><MessageSquare size={13} /> {task.comments.length}</div>
          )}
          {totalCheckItems > 0 && (
            <div className={`meta-item ${doneCheckItems === totalCheckItems ? 'meta-done' : ''}`}>
              <Check size={13} /> {doneCheckItems}/{totalCheckItems}
            </div>
          )}
          {due && (
            <div className={`meta-item due-meta ${due.cls}`}>
              <Clock size={13} /> {due.text}
            </div>
          )}
        </div>
        {taskMembers.length > 0 && (
          <div className="card-members">
            {taskMembers.slice(0, 3).map(m => (
              <div key={m.id} className="card-member-avatar" style={{ background: m.color }} title={m.name}>
                {m.initials}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Ghost shown during drag
const GhostCard = ({ task }) => (
  <div className="task-card ghost-card">
    <span className={`badge-pill ${sc(task.status)}`}>{task.status}</span>
    <h4 className="task-title">{task.title}</h4>
  </div>
);

// ─── Kanban Column ────────────────────────────────────────────────────────────
const KanbanColumn = ({ column, board, onAddTask, onDeleteColumn, onRenameColumn, onCardClick, filters, authorName }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(column.title);

  const visibleTasks = column.tasks.filter(t => {
    if (!filters.showArchived && t.archived) return false;
    if (filters.showArchived && !t.archived) return false;
    if (filters.query && !t.title.toLowerCase().includes(filters.query.toLowerCase()) && !t.description.toLowerCase().includes(filters.query.toLowerCase())) return false;
    if (filters.labelIds.length > 0 && !filters.labelIds.some(id => t.labelIds.includes(id))) return false;
    if (filters.memberIds.length > 0 && !filters.memberIds.some(id => t.memberIds.includes(id))) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.dueFilter === 'overdue') {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate + 'T00:00:00'); const now = new Date(); now.setHours(0,0,0,0);
      if (d >= now) return false;
    }
    if (filters.dueFilter === 'due-soon') {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate + 'T00:00:00'); const now = new Date(); now.setHours(0,0,0,0);
      const diff = d - now;
      if (diff < 0 || diff > 3 * 86400000) return false;
    }
    return true;
  });

  const saveTitle = () => {
    if (titleVal.trim()) onRenameColumn(column.id, titleVal.trim().toUpperCase());
    setEditingTitle(false);
  };

  return (
    <div className="kanban-column">
      <div className="kanban-col-header">
        {editingTitle ? (
          <input
            autoFocus
            className="col-title-input"
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
          />
        ) : (
          <h3 className="kanban-title" onClick={() => setEditingTitle(true)}>
            {column.title}
            <span className="kanban-count">{visibleTasks.length}</span>
          </h3>
        )}
        <button className="col-delete-btn" title="Excluir coluna" onClick={() => onDeleteColumn(column.id)}>
          <X size={14} />
        </button>
      </div>

      <SortableContext items={visibleTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-cards">
          {visibleTasks.map(task => (
            <KanbanCard key={task.id} task={task} board={board} onCardClick={onCardClick} />
          ))}
        </div>
      </SortableContext>

      {!filters.showArchived && (showForm
        ? <NewTaskForm onAdd={(t) => { onAddTask(column.id, t); setShowForm(false); }} onCancel={() => setShowForm(false)} authorName={authorName} />
        : <button className="add-task-kanban" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Adicionar card
          </button>
      )}
    </div>
  );
};

// ─── List Row ─────────────────────────────────────────────────────────────────
const TaskRow = ({ task, board, onCardClick }) => {
  const due = dueDateInfo(task.dueDate);
  const taskLabels = board.labels.filter(l => task.labelIds.includes(l.id));
  const taskMembers = board.members.filter(m => task.memberIds.includes(m.id));

  return (
    <div className={`task-row ${task.archived ? 'row-archived' : ''}`} onClick={() => onCardClick(task)}>
      <div className="task-info">
        <h4 className="task-title">{task.title}</h4>
        <div className="row-meta-line">
          {task.category && <span className="task-category">{task.category}</span>}
          {taskLabels.map(lbl => (
            <span key={lbl.id} className="row-label-dot" style={{ background: lbl.color, color: lbl.color }}>
              {lbl.name}
            </span>
          ))}
        </div>
      </div>
      <div className="task-meta">
        {task.comments.length > 0 && <div className="meta-item"><MessageSquare size={14} /> {task.comments.length}</div>}
      </div>
      <div className="task-badges">
        <span className={`badge-pill ${sc(task.status)}`}>{task.status}</span>
        <span className={`badge-pill ${pc(task.priority)}`}>{task.priority}</span>
      </div>
      <div className="task-members-col">
        {taskMembers.map(m => (
          <div key={m.id} className="card-member-avatar sm" style={{ background: m.color }} title={m.name}>{m.initials}</div>
        ))}
      </div>
      {due
        ? <div className={`task-time due-badge-row ${due.cls}`}><Clock size={14} /> {due.text}</div>
        : <div className="task-time" />
      }
      <div className="task-progress">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${task.progress}%` }} />
        </div>
        <span className="progress-text">{task.progress}%</span>
      </div>
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────
const FilterBar = ({ board, filters, setFilters }) => {
  const [open, setOpen] = useState(false);

  const hasActive = filters.labelIds.length > 0 || filters.memberIds.length > 0 || filters.priority || filters.dueFilter || filters.showArchived;

  const toggleLabel = (id) => setFilters(f => ({
    ...f, labelIds: f.labelIds.includes(id) ? f.labelIds.filter(x => x !== id) : [...f.labelIds, id],
  }));
  const toggleMember = (id) => setFilters(f => ({
    ...f, memberIds: f.memberIds.includes(id) ? f.memberIds.filter(x => x !== id) : [...f.memberIds, id],
  }));
  const clear = () => setFilters({ labelIds: [], memberIds: [], priority: '', dueFilter: '', showArchived: false, query: filters.query });

  return (
    <div className="filter-bar-wrap">
      <button className={`tool-btn ${hasActive ? 'filter-active' : ''}`} onClick={() => setOpen(o => !o)}>
        <Filter size={15} /> Filtrar {hasActive && <span className="filter-badge">{[filters.labelIds.length, filters.memberIds.length, filters.priority ? 1 : 0, filters.dueFilter ? 1 : 0, filters.showArchived ? 1 : 0].reduce((a, b) => a + b, 0)}</span>}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="filter-dropdown">
          <div className="filter-section">
            <p className="filter-section-title"><Tag size={13} /> Labels</p>
            <div className="filter-options">
              {board.labels.map(lbl => (
                <button
                  key={lbl.id}
                  className={`filter-tag ${filters.labelIds.includes(lbl.id) ? 'selected' : ''}`}
                  style={{ background: lbl.color + '22', color: lbl.color, borderColor: lbl.color + '55' }}
                  onClick={() => toggleLabel(lbl.id)}
                >
                  {filters.labelIds.includes(lbl.id) && <Check size={11} />} {lbl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <p className="filter-section-title"><Users size={13} /> Membros</p>
            <div className="filter-options">
              {board.members.map(mbr => (
                <button
                  key={mbr.id}
                  className={`filter-member ${filters.memberIds.includes(mbr.id) ? 'selected' : ''}`}
                  onClick={() => toggleMember(mbr.id)}
                >
                  <div className="filter-avatar" style={{ background: mbr.color }}>{mbr.initials}</div>
                  {mbr.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <p className="filter-section-title"><ArrowUpDown size={13} /> Prioridade</p>
            <div className="filter-options">
              {['High', 'Medium', 'Low'].map(p => (
                <button
                  key={p}
                  className={`filter-tag priority-filter-${p.toLowerCase()} ${filters.priority === p ? 'selected' : ''}`}
                  onClick={() => setFilters(f => ({ ...f, priority: f.priority === p ? '' : p }))}
                >
                  {filters.priority === p && <Check size={11} />} {p}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <p className="filter-section-title"><Calendar size={13} /> Vencimento</p>
            <div className="filter-options">
              {[['overdue', 'Atrasados'], ['due-soon', 'Vence em 3 dias']].map(([val, lbl]) => (
                <button
                  key={val}
                  className={`filter-tag ${filters.dueFilter === val ? 'selected' : ''}`}
                  onClick={() => setFilters(f => ({ ...f, dueFilter: f.dueFilter === val ? '' : val }))}
                >
                  {filters.dueFilter === val && <Check size={11} />} {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <button
              className={`filter-tag ${filters.showArchived ? 'selected' : ''}`}
              onClick={() => setFilters(f => ({ ...f, showArchived: !f.showArchived }))}
              style={{ width: '100%' }}
            >
              <Archive size={13} /> {filters.showArchived ? 'Mostrando arquivados' : 'Ver arquivados'}
            </button>
          </div>

          {hasActive && (
            <button className="filter-clear-btn" onClick={clear}><X size={13} /> Limpar filtros</button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main BoardView ───────────────────────────────────────────────────────────
const BoardView = ({ board, user, onBack, onUpdateBoard }) => {
  const [viewMode, setViewMode] = useState('kanban');
  const [activeTask, setActiveTask] = useState(null);
  const [newColName, setNewColName] = useState('');
  const [showNewColInput, setShowNewColInput] = useState(false);
  const [listFormSection, setListFormSection] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [filters, setFilters] = useState({ labelIds: [], memberIds: [], priority: '', dueFilter: '', showArchived: false, query: '' });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const findColumnByTaskId = (taskId) => board.columns.find(c => c.tasks.some(t => t.id === taskId));

  const handleDragStart = ({ active }) => {
    const col = findColumnByTaskId(active.id);
    if (col) setActiveTask(col.tasks.find(t => t.id === active.id));
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    onUpdateBoard(prev => {
      const cols = prev.columns;
      const activeCol = cols.find(c => c.tasks.some(t => t.id === active.id));
      const overCol = cols.find(c => c.tasks.some(t => t.id === over.id)) || cols.find(c => c.id === over.id);
      if (!activeCol || !overCol || activeCol.id === overCol.id) return prev;
      const task = activeCol.tasks.find(t => t.id === active.id);
      return {
        ...prev,
        columns: cols.map(c => {
          if (c.id === activeCol.id) return { ...c, tasks: c.tasks.filter(t => t.id !== active.id) };
          if (c.id === overCol.id) return { ...c, tasks: [...c.tasks, task] };
          return c;
        }),
      };
    });
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    onUpdateBoard(prev => {
      const cols = prev.columns;
      const activeCol = cols.find(c => c.tasks.some(t => t.id === active.id));
      const overCol = cols.find(c => c.tasks.some(t => t.id === over.id));
      if (!activeCol || !overCol || activeCol.id !== overCol.id) return prev;
      const oldIdx = activeCol.tasks.findIndex(t => t.id === active.id);
      const newIdx = activeCol.tasks.findIndex(t => t.id === over.id);
      if (oldIdx === newIdx) return prev;
      return {
        ...prev,
        columns: cols.map(c => c.id === activeCol.id ? { ...c, tasks: arrayMove(c.tasks, oldIdx, newIdx) } : c),
      };
    });
  };

  const addTaskToColumn = (colId, task) => {
    onUpdateBoard(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, task] } : c),
    }));
  };

  const deleteColumn = (colId) => {
    onUpdateBoard(prev => ({ ...prev, columns: prev.columns.filter(c => c.id !== colId) }));
  };

  const renameColumn = (colId, newTitle) => {
    onUpdateBoard(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === colId ? { ...c, title: newTitle } : c),
    }));
  };

  const addColumn = () => {
    const title = newColName.trim();
    if (!title) return;
    onUpdateBoard(prev => ({
      ...prev,
      columns: [...prev.columns, { id: `col-${Date.now()}`, title: title.toUpperCase(), tasks: [] }],
    }));
    setNewColName('');
    setShowNewColInput(false);
  };

  // Task update handler — also handles board-level updates (labels, members)
  const handleTaskUpdate = (taskId, patch, activityText) => {
    onUpdateBoard(prev => {
      let newBoard = { ...prev };

      // Board-level label operations
      if (patch._addBoardLabel) {
        newBoard = { ...newBoard, labels: [...newBoard.labels, patch._addBoardLabel] };
      }
      if (patch._renameBoardLabel) {
        newBoard = { ...newBoard, labels: newBoard.labels.map(l => l.id === patch._renameBoardLabel.id ? { ...l, name: patch._renameBoardLabel.name } : l) };
      }
      if (patch._deleteBoardLabel) {
        newBoard = { ...newBoard, labels: newBoard.labels.filter(l => l.id !== patch._deleteBoardLabel) };
      }
      if (patch._addBoardMember) {
        newBoard = { ...newBoard, members: [...newBoard.members, patch._addBoardMember] };
      }

      // Remove board-level keys before applying to task
      const { _addBoardLabel, _renameBoardLabel, _deleteBoardLabel, _addBoardMember, ...taskPatch } = patch;

      const activity = activityText
        ? [{ id: `act-${Date.now()}`, text: activityText, author: user.name, timestamp: new Date().toISOString() }]
        : [];

      newBoard = {
        ...newBoard,
        columns: newBoard.columns.map(col => ({
          ...col,
          tasks: col.tasks.map(task => {
            if (task.id !== taskId) return task;
            const updated = typeof taskPatch === 'function' ? taskPatch(task) : { ...task, ...taskPatch };
            if (activity.length) updated.activity = [...(updated.activity || []), ...activity];
            return updated;
          }),
        })),
      };

      return newBoard;
    });
  };

  const archiveTask = (taskId) => {
    const task = board.columns.flatMap(c => c.tasks).find(t => t.id === taskId);
    if (!task) return;
    handleTaskUpdate(taskId, { archived: !task.archived }, task.archived ? 'restaurou o card' : 'arquivou o card');
  };

  const deleteTask = (taskId) => {
    if (!window.confirm('Excluir este card permanentemente?')) return;
    onUpdateBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col => ({ ...col, tasks: col.tasks.filter(t => t.id !== taskId) })),
    }));
    setSelectedCardId(null);
  };

  const selectedTask = selectedCardId
    ? board.columns.flatMap(c => c.tasks).find(t => t.id === selectedCardId)
    : null;

  const selectedColumnTitle = selectedCardId
    ? (board.columns.find(c => c.tasks.some(t => t.id === selectedCardId))?.title || '')
    : '';

  // List view filtered tasks
  const listFiltered = useMemo(() => {
    return board.columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => {
        if (!filters.showArchived && t.archived) return false;
        if (filters.showArchived && !t.archived) return false;
        if (filters.query && !t.title.toLowerCase().includes(filters.query.toLowerCase())) return false;
        if (filters.labelIds.length > 0 && !filters.labelIds.some(id => t.labelIds.includes(id))) return false;
        if (filters.memberIds.length > 0 && !filters.memberIds.some(id => t.memberIds.includes(id))) return false;
        if (filters.priority && t.priority !== filters.priority) return false;
        if (filters.dueFilter === 'overdue') {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate + 'T00:00:00'); const now = new Date(); now.setHours(0,0,0,0);
          if (d >= now) return false;
        }
        if (filters.dueFilter === 'due-soon') {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate + 'T00:00:00'); const now = new Date(); now.setHours(0,0,0,0);
          const diff = d - now;
          if (diff < 0 || diff > 3 * 86400000) return false;
        }
        return true;
      }),
    })).filter(col => col.tasks.length > 0 || !filters.showArchived);
  }, [board.columns, filters]);

  return (
    <div className="board-view">
      {/* ── Toolbar ── */}
      <div className="tasks-toolbar">
        <div className="toolbar-left">
          <button className="back-btn" onClick={onBack}>
            <ChevronLeft size={16} /> Boards
          </button>
          <div className="board-title-display">
            <div className="board-bg-chip" style={{ background: board.background }} />
            <span>{board.title}</span>
          </div>
        </div>
        <div className="toolbar-right">
          <div className="search-inline">
            <input
              className="search-inline-input"
              placeholder="Buscar cards..."
              value={filters.query}
              onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
            />
            {filters.query && (
              <button className="search-clear" onClick={() => setFilters(f => ({ ...f, query: '' }))}><X size={13} /></button>
            )}
          </div>
          <FilterBar board={board} filters={filters} setFilters={setFilters} />
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>Lista</button>
            <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>Kanban</button>
          </div>
          {viewMode === 'list' && (
            <button className="primary-btn" onClick={() => setListFormSection(board.columns[0]?.id)}>
              <Plus size={16} /> Novo Card
            </button>
          )}
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="list-view">
          {listFiltered.map(col => (
            <section key={col.id} className="task-section">
              <div className="section-header">
                <h3>{col.title} <span className="section-count">{col.tasks.length}</span></h3>
                <button className="section-more"><MoreHorizontal size={16} /></button>
              </div>
              <div className="tasks-list">
                {col.tasks.map(task => (
                  <TaskRow key={task.id} task={task} board={board} onCardClick={(t) => setSelectedCardId(t.id)} />
                ))}
              </div>
              {listFormSection === col.id ? (
                <NewTaskForm
                  onAdd={(t) => { addTaskToColumn(col.id, t); setListFormSection(null); }}
                  onCancel={() => setListFormSection(null)}
                  authorName={user.name}
                />
              ) : (
                !filters.showArchived && (
                  <button className="add-project-btn" onClick={() => setListFormSection(col.id)}>
                    <Plus size={16} /> Adicionar card
                  </button>
                )
              )}
            </section>
          ))}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-view">
            {board.columns.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                board={board}
                onAddTask={addTaskToColumn}
                onDeleteColumn={deleteColumn}
                onRenameColumn={renameColumn}
                onCardClick={(t) => setSelectedCardId(t.id)}
                filters={filters}
                authorName={user.name}
              />
            ))}

            <div className="kanban-new-col">
              {showNewColInput ? (
                <div className="new-col-form">
                  <input
                    autoFocus
                    className="ntf-input"
                    placeholder="Nome da coluna..."
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') setShowNewColInput(false); }}
                  />
                  <div className="ntf-actions">
                    <button className="ntf-btn-add" onClick={addColumn}><Check size={14} /> Criar</button>
                    <button className="ntf-btn-cancel" onClick={() => setShowNewColInput(false)}><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <button className="add-col-btn" onClick={() => setShowNewColInput(true)}>
                  <Plus size={16} /> Nova Coluna
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <GhostCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Card Detail Modal ── */}
      {selectedTask && (
        <CardDetailModal
          task={selectedTask}
          board={board}
          columnTitle={selectedColumnTitle}
          authorName={user.name}
          onUpdate={(patch, activityText) => handleTaskUpdate(selectedTask.id, patch, activityText)}
          onArchive={() => archiveTask(selectedTask.id)}
          onDelete={() => deleteTask(selectedTask.id)}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
};

export default BoardView;

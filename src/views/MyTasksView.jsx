import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Filter, ArrowUpDown, EyeOff, MoreHorizontal,
  Plus, Paperclip, MessageSquare, Clock, GripVertical,
  X, Check, ChevronDown
} from 'lucide-react';
import './MyTasksView.css';

// ─── Status / Priority helpers ─────────────────────────────────────────
const STATUS_OPTIONS = ['Todo', 'In Progress', 'In Review', 'Drafts', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const STATUS_CLASS = {
  'In Review': 'status-review',
  'Drafts': 'status-draft',
  'In Progress': 'status-progress',
  'Todo': 'status-todo',
  'Done': 'status-done',
};
const PRIORITY_CLASS = {
  High: 'priority-high',
  Medium: 'priority-mid',
  Mid: 'priority-mid',
  Low: 'priority-low',
};

const sc = (s) => STATUS_CLASS[s] || 'status-default';
const pc = (p) => PRIORITY_CLASS[p] || 'priority-default';

// ─── Initial State ──────────────────────────────────────────────────────
const INITIAL_COLUMNS = [
  {
    id: 'col-todo',
    title: 'TODO',
    tasks: [
      { id: 't1', title: 'Schedule Me An Appointment With My Endocrine...', category: 'Appointment', attachments: 12, comments: 21, status: 'In Review', priority: 'High', time: '15 Days left', progress: 0 },
      { id: 't2', title: 'Track Medicine Delivery', category: 'Tracking', attachments: 4, comments: 32, status: 'Drafts', priority: 'Medium', time: '12 Days left', progress: 0 },
    ]
  },
  {
    id: 'col-active',
    title: 'ACTIVE PROJECTS',
    tasks: [
      { id: 't3', title: 'Plan An Event', category: 'Planning', attachments: 11, comments: 8, status: 'In Progress', priority: 'Medium', time: '32 Days left', progress: 26 },
      { id: 't4', title: 'Return A Package', category: 'Delivery', attachments: 7, comments: 12, status: 'In Progress', priority: 'Medium', time: '4 Days left', progress: 74 },
      { id: 't5', title: 'Get A Passport', category: 'Personal Help', attachments: 4, comments: 16, status: 'Drafts', priority: 'Low', time: '22 Days left', progress: 38 },
    ]
  },
];

// ─── New Task Form ──────────────────────────────────────────────────────
const NewTaskForm = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('Medium');
  const [time, setTime] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({
      id: `t${Date.now()}`,
      title: title.trim(),
      category: category.trim() || 'General',
      status,
      priority,
      time: time.trim() || '—',
      attachments: 0,
      comments: 0,
      progress: 0,
    });
  };

  return (
    <div className="new-task-form">
      <input
        autoFocus
        className="ntf-input ntf-title"
        placeholder="Título da tarefa..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onCancel(); }}
      />
      <input
        className="ntf-input"
        placeholder="Categoria (opcional)"
        value={category}
        onChange={e => setCategory(e.target.value)}
      />
      <div className="ntf-row">
        <select className="ntf-select" value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="ntf-select" value={priority} onChange={e => setPriority(e.target.value)}>
          {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
        </select>
        <input
          className="ntf-input ntf-time"
          placeholder="Prazo (ex: 7 dias restantes)"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>
      <div className="ntf-actions">
        <button className="ntf-btn-add" onClick={handleAdd}><Check size={14} /> Adicionar</button>
        <button className="ntf-btn-cancel" onClick={onCancel}><X size={14} /> Cancelar</button>
      </div>
    </div>
  );
};

// ─── Draggable Task Card (Kanban) ───────────────────────────────────────
const KanbanCard = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="task-card" {...attributes}>
      <div className="task-card-header">
        <div className="task-badges">
          <span className={`badge-pill ${sc(task.status)}`}>{task.status}</span>
          <span className={`badge-pill ${pc(task.priority)}`}>{task.priority}</span>
        </div>
        <button className="drag-handle" {...listeners}><GripVertical size={14} /></button>
      </div>
      <div className="task-info">
        <h4 className="task-title">{task.title}</h4>
        <span className="task-category">{task.category}</span>
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
          <div className="meta-item"><Paperclip size={13} /> {task.attachments}</div>
          <div className="meta-item"><MessageSquare size={13} /> {task.comments}</div>
        </div>
        <div className="task-time small"><Clock size={13} /> {task.time}</div>
      </div>
    </div>
  );
};

// Ghost card shown while dragging
const GhostCard = ({ task }) => (
  <div className="task-card ghost-card">
    <div className="task-badges">
      <span className={`badge-pill ${sc(task.status)}`}>{task.status}</span>
    </div>
    <h4 className="task-title">{task.title}</h4>
  </div>
);

// ─── Kanban Column ──────────────────────────────────────────────────────
const KanbanColumn = ({ column, onAddTask, onDeleteColumn }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="kanban-column">
      <div className="kanban-col-header">
        <h3 className="kanban-title">
          {column.title}
          <span className="kanban-count">{column.tasks.length}</span>
        </h3>
        <button className="col-delete-btn" title="Delete column" onClick={() => onDeleteColumn(column.id)}>
          <X size={14} />
        </button>
      </div>

      <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-cards">
          {column.tasks.map(task => <KanbanCard key={task.id} task={task} />)}
        </div>
      </SortableContext>

      {showForm
        ? <NewTaskForm
            onAdd={(task) => { onAddTask(column.id, task); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        : <button className="add-task-kanban" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Adicionar Tarefa
          </button>
      }
    </div>
  );
};

// ─── List Row ───────────────────────────────────────────────────────────
const TaskRow = ({ task }) => (
  <div className="task-row">
    <div className="task-info">
      <h4 className="task-title">{task.title}</h4>
      <span className="task-category">{task.category}</span>
    </div>
    <div className="task-meta">
      <div className="meta-item"><Paperclip size={14} /> {task.attachments}</div>
      <div className="meta-item"><MessageSquare size={14} /> {task.comments}</div>
    </div>
    <div className="task-badges">
      <span className={`badge-pill ${sc(task.status)}`}>{task.status}</span>
      <span className={`badge-pill ${pc(task.priority)}`}>{task.priority}</span>
    </div>
    <div className="task-time"><Clock size={14} /> {task.time}</div>
    <div className="task-progress">
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${task.progress}%` }} />
      </div>
      <span className="progress-text">{task.progress}%</span>
    </div>
    <button className="task-more"><MoreHorizontal size={16} /></button>
  </div>
);

// ─── Main View ──────────────────────────────────────────────────────────
const MyTasksView = () => {
  const [viewMode, setViewMode] = useState('list');
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [activeTask, setActiveTask] = useState(null);
  const [newColName, setNewColName] = useState('');
  const [showNewColInput, setShowNewColInput] = useState(false);
  // per-section list form
  const [listFormSection, setListFormSection] = useState(null); // column id

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Find which column a task belongs to
  const findColumnByTaskId = (taskId) => columns.find(c => c.tasks.some(t => t.id === taskId));

  const handleDragStart = ({ active }) => {
    const col = findColumnByTaskId(active.id);
    if (col) setActiveTask(col.tasks.find(t => t.id === active.id));
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    // Use functional update so we always read the LATEST state, avoiding stale closures
    setColumns(prev => {
      const activeCol = prev.find(c => c.tasks.some(t => t.id === active.id));
      const overCol   = prev.find(c => c.tasks.some(t => t.id === over.id)) ||
                        prev.find(c => c.id === over.id);
      if (!activeCol || !overCol || activeCol.id === overCol.id) return prev;

      const task = activeCol.tasks.find(t => t.id === active.id);
      return prev.map(c => {
        if (c.id === activeCol.id) return { ...c, tasks: c.tasks.filter(t => t.id !== active.id) };
        if (c.id === overCol.id)   return { ...c, tasks: [...c.tasks, task] };
        return c;
      });
    });
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    setColumns(prev => {
      const activeCol = prev.find(c => c.tasks.some(t => t.id === active.id));
      const overCol   = prev.find(c => c.tasks.some(t => t.id === over.id));
      if (!activeCol || !overCol || activeCol.id !== overCol.id) return prev;

      const oldIdx = activeCol.tasks.findIndex(t => t.id === active.id);
      const newIdx = activeCol.tasks.findIndex(t => t.id === over.id);
      if (oldIdx === newIdx) return prev;
      return prev.map(c =>
        c.id === activeCol.id ? { ...c, tasks: arrayMove(c.tasks, oldIdx, newIdx) } : c
      );
    });
  };

  const addTaskToColumn = (colId, task) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, task] } : c));
  };

  const deleteColumn = (colId) => {
    setColumns(prev => prev.filter(c => c.id !== colId));
  };

  const addColumn = () => {
    const title = newColName.trim();
    if (!title) return;
    setColumns(prev => [...prev, { id: `col-${Date.now()}`, title: title.toUpperCase(), tasks: [] }]);
    setNewColName('');
    setShowNewColInput(false);
  };

  // All tasks flattened for list view
  const allTasks = columns.flatMap(c => c.tasks);

  return (
    <div className="my-tasks-view">
      {/* ── Toolbar ── */}
      <div className="tasks-toolbar">
        <div className="toolbar-left">
          <button className="tool-btn"><Filter size={16} /> Filtrar <ChevronDown size={12} /></button>
          <button className="tool-btn"><ArrowUpDown size={16} /> Ordenar</button>
          <button className="tool-btn"><EyeOff size={16} /> Ocultar</button>
          <button className="tool-btn icon-only"><MoreHorizontal size={16} /></button>
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>Lista</button>
            <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>Kanban</button>
          </div>
          <button className="primary-btn" onClick={() => {
            if (viewMode === 'list') setListFormSection(columns[0]?.id);
            else setShowNewColInput(true);
          }}>
            <Plus size={16} /> {viewMode === 'list' ? 'Nova Tarefa' : 'Nova Coluna'}
          </button>
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="list-view">
          {columns.map(col => (
            <section key={col.id} className="task-section">
              <div className="section-header">
                <h3>{col.title}</h3>
                <button className="section-more"><MoreHorizontal size={16} /></button>
              </div>
              <div className="tasks-list">
                {col.tasks.map(task => <TaskRow key={task.id} task={task} />)}
              </div>

              {listFormSection === col.id
                ? <NewTaskForm
                    onAdd={(task) => { addTaskToColumn(col.id, task); setListFormSection(null); }}
                    onCancel={() => setListFormSection(null)}
                  />
                : <button className="add-project-btn" onClick={() => setListFormSection(col.id)}>
                    <Plus size={16} /> Adicionar Tarefa
                  </button>
              }
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
            {columns.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                onAddTask={addTaskToColumn}
                onDeleteColumn={deleteColumn}
              />
            ))}

            {/* Add new column */}
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
    </div>
  );
};

export default MyTasksView;

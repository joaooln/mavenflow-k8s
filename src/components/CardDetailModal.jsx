import React, { useState, useRef, useEffect } from 'react';
import {
  X, Tag, Users, Calendar, CheckSquare, MessageSquare,
  Plus, Check, Trash2, Pencil, Archive, ArchiveRestore,
  AlignLeft, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import './CardDetailModal.css';

// ─── helpers ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['Todo', 'In Progress', 'In Review', 'Drafts', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_CLASS = { 'In Review': 'status-review', 'Drafts': 'status-draft', 'In Progress': 'status-progress', 'Todo': 'status-todo', 'Done': 'status-done' };
const PRIORITY_CLASS = { High: 'priority-high', Medium: 'priority-mid', Low: 'priority-low' };
const LABEL_PALETTE = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'];

const formatTs = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const dueDateInfo = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = d - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const text = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  if (days < 0) return { text, cls: 'due-overdue', label: `Atrasado ${Math.abs(days)}d` };
  if (days === 0) return { text, cls: 'due-today', label: 'Hoje' };
  if (days <= 3) return { text, cls: 'due-soon', label: `${days}d restantes` };
  return { text, cls: 'due-ok', label: `${days}d restantes` };
};

const checklistProgress = (cl) => {
  if (!cl.items.length) return 0;
  return Math.round((cl.items.filter(i => i.checked).length / cl.items.length) * 100);
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const MemberAvatar = ({ member, size = 28, showTooltip = true }) => (
  <div
    className="member-avatar"
    style={{ width: size, height: size, fontSize: size * 0.38, background: member.color }}
    title={showTooltip ? member.name : undefined}
  >
    {member.initials}
  </div>
);

const LabelBadge = ({ label, onClick }) => (
  <button
    className="label-badge"
    style={{ background: label.color + '22', color: label.color, borderColor: label.color + '44' }}
    onClick={onClick}
    title={label.name}
  >
    <span className="label-dot" style={{ background: label.color }} />
    {label.name}
  </button>
);

// ─── Right panel popovers ────────────────────────────────────────────────────

const LabelsPopover = ({ board, task, onUpdate, onClose }) => {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_PALETTE[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const toggle = (labelId) => {
    const has = task.labelIds.includes(labelId);
    onUpdate({
      labelIds: has ? task.labelIds.filter(id => id !== labelId) : [...task.labelIds, labelId],
    });
  };

  const createLabel = () => {
    if (!newName.trim()) return;
    const label = { id: `lbl-${Date.now()}`, name: newName.trim(), color: newColor };
    onUpdate({ _addBoardLabel: label, labelIds: [...task.labelIds, label.id] });
    setNewName('');
    setCreating(false);
  };

  const renameLabel = (labelId) => {
    if (!editName.trim()) return;
    onUpdate({ _renameBoardLabel: { id: labelId, name: editName.trim() } });
    setEditingId(null);
  };

  const deleteLabel = (labelId) => {
    onUpdate({ _deleteBoardLabel: labelId, labelIds: task.labelIds.filter(id => id !== labelId) });
  };

  return (
    <div className="popover">
      <div className="popover-header">
        <span>Labels</span>
        <button onClick={onClose}><X size={14} /></button>
      </div>
      <div className="popover-list">
        {board.labels.map(lbl => (
          <div key={lbl.id} className="popover-label-row">
            <button
              className={`popover-label-btn ${task.labelIds.includes(lbl.id) ? 'active' : ''}`}
              style={{ background: lbl.color + '22', borderColor: lbl.color + '66' }}
              onClick={() => toggle(lbl.id)}
            >
              <span className="label-dot" style={{ background: lbl.color }} />
              {editingId === lbl.id ? (
                <input
                  autoFocus
                  className="popover-label-edit"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') renameLabel(lbl.id); if (e.key === 'Escape') setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span style={{ color: lbl.color, fontWeight: 600 }}>{lbl.name}</span>
              )}
              {task.labelIds.includes(lbl.id) && <Check size={12} className="label-check" style={{ color: lbl.color }} />}
            </button>
            <button className="popover-icon-btn" onClick={() => { setEditingId(lbl.id); setEditName(lbl.name); }}><Pencil size={12} /></button>
            <button className="popover-icon-btn danger" onClick={() => deleteLabel(lbl.id)}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
      {creating ? (
        <div className="popover-create">
          <input
            autoFocus
            className="popover-input"
            placeholder="Nome da label..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createLabel(); if (e.key === 'Escape') setCreating(false); }}
          />
          <div className="color-palette">
            {LABEL_PALETTE.map(c => (
              <button
                key={c}
                className={`color-swatch ${newColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
          <div className="popover-actions">
            <button className="pop-btn-confirm" onClick={createLabel}><Check size={13} /> Criar</button>
            <button className="pop-btn-cancel" onClick={() => setCreating(false)}><X size={13} /></button>
          </div>
        </div>
      ) : (
        <button className="popover-add-btn" onClick={() => setCreating(true)}><Plus size={13} /> Nova label</button>
      )}
    </div>
  );
};

const MembersPopover = ({ board, task, onUpdate, onClose }) => {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_PALETTE[0]);

  const toggle = (memberId) => {
    const has = task.memberIds.includes(memberId);
    onUpdate({
      memberIds: has ? task.memberIds.filter(id => id !== memberId) : [...task.memberIds, memberId],
    });
  };

  const createMember = () => {
    if (!newName.trim()) return;
    const words = newName.trim().split(' ');
    const initials = words.length >= 2 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
    const member = { id: `mbr-${Date.now()}`, name: newName.trim(), initials: initials.toUpperCase(), color: newColor };
    onUpdate({ _addBoardMember: member, memberIds: [...task.memberIds, member.id] });
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="popover">
      <div className="popover-header">
        <span>Membros</span>
        <button onClick={onClose}><X size={14} /></button>
      </div>
      <div className="popover-list">
        {board.members.map(mbr => (
          <button
            key={mbr.id}
            className={`popover-member-btn ${task.memberIds.includes(mbr.id) ? 'active' : ''}`}
            onClick={() => toggle(mbr.id)}
          >
            <MemberAvatar member={mbr} size={26} showTooltip={false} />
            <span>{mbr.name}</span>
            {task.memberIds.includes(mbr.id) && <Check size={14} className="member-check" />}
          </button>
        ))}
      </div>
      {creating ? (
        <div className="popover-create">
          <input
            autoFocus
            className="popover-input"
            placeholder="Nome do membro..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createMember(); if (e.key === 'Escape') setCreating(false); }}
          />
          <div className="color-palette">
            {LABEL_PALETTE.map(c => (
              <button
                key={c}
                className={`color-swatch ${newColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
          <div className="popover-actions">
            <button className="pop-btn-confirm" onClick={createMember}><Check size={13} /> Adicionar</button>
            <button className="pop-btn-cancel" onClick={() => setCreating(false)}><X size={13} /></button>
          </div>
        </div>
      ) : (
        <button className="popover-add-btn" onClick={() => setCreating(true)}><Plus size={13} /> Novo membro</button>
      )}
    </div>
  );
};

// ─── Checklist ──────────────────────────────────────────────────────────────
const ChecklistSection = ({ checklist, onUpdate, onDelete }) => {
  const [newItem, setNewItem] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(checklist.title);
  const [collapsed, setCollapsed] = useState(false);
  const progress = checklistProgress(checklist);

  const addItem = () => {
    if (!newItem.trim()) return;
    const item = { id: `cli-${Date.now()}`, text: newItem.trim(), checked: false };
    onUpdate({ ...checklist, items: [...checklist.items, item] });
    setNewItem('');
  };

  const toggleItem = (itemId) => {
    onUpdate({
      ...checklist,
      items: checklist.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i),
    });
  };

  const deleteItem = (itemId) => {
    onUpdate({ ...checklist, items: checklist.items.filter(i => i.id !== itemId) });
  };

  const saveTitle = () => {
    if (titleVal.trim()) onUpdate({ ...checklist, title: titleVal.trim() });
    setEditingTitle(false);
  };

  return (
    <div className="checklist-section">
      <div className="checklist-header">
        <CheckSquare size={16} className="section-icon" />
        {editingTitle ? (
          <input
            autoFocus
            className="checklist-title-input"
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
          />
        ) : (
          <h4 className="checklist-title" onClick={() => setEditingTitle(true)}>{checklist.title}</h4>
        )}
        <div className="checklist-header-actions">
          <button className="cl-btn" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button className="cl-btn danger" onClick={onDelete}><Trash2 size={13} /></button>
        </div>
      </div>

      <div className="checklist-progress-bar">
        <span className="cl-progress-pct">{progress}%</span>
        <div className="cl-bar-bg">
          <div className="cl-bar-fill" style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : 'var(--accent-blue)' }} />
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="checklist-items">
            {checklist.items.map(item => (
              <div key={item.id} className={`checklist-item ${item.checked ? 'checked' : ''}`}>
                <button className="cli-checkbox" onClick={() => toggleItem(item.id)}>
                  {item.checked ? <Check size={11} /> : null}
                </button>
                <span className="cli-text">{item.text}</span>
                <button className="cli-delete" onClick={() => deleteItem(item.id)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>

          {showAdd ? (
            <div className="cli-add-form">
              <input
                autoFocus
                className="cli-input"
                placeholder="Adicionar item..."
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setShowAdd(false); }}
              />
              <div className="cli-form-actions">
                <button className="pop-btn-confirm" onClick={addItem}><Check size={13} /> Adicionar</button>
                <button className="pop-btn-cancel" onClick={() => setShowAdd(false)}><X size={13} /></button>
              </div>
            </div>
          ) : (
            <button className="cli-add-trigger" onClick={() => setShowAdd(true)}>
              <Plus size={13} /> Adicionar item
            </button>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main Modal ──────────────────────────────────────────────────────────────
const CardDetailModal = ({ task, board, columnTitle, authorName = 'Você', onUpdate, onArchive, onDelete, onClose }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState(task.description || '');
  const [newComment, setNewComment] = useState('');
  const [openPopover, setOpenPopover] = useState(null); // 'labels' | 'members' | 'date' | 'checklist'
  const [newClTitle, setNewClTitle] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const overlayRef = useRef(null);

  // Sync local state when task changes externally
  useEffect(() => { setTitleVal(task.title); }, [task.title]);
  useEffect(() => { setDescVal(task.description || ''); }, [task.description]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { if (openPopover) setOpenPopover(null); else onClose(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openPopover, onClose]);

  const saveTitle = () => {
    if (titleVal.trim()) {
      onUpdate({ title: titleVal.trim() }, `renomeou para "${titleVal.trim()}"`);
    } else {
      setTitleVal(task.title);
    }
    setEditingTitle(false);
  };

  const saveDesc = () => {
    onUpdate({ description: descVal }, null);
    setEditingDesc(false);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = { id: `cm-${Date.now()}`, text: newComment.trim(), author: authorName, timestamp: new Date().toISOString() };
    onUpdate({ comments: [...task.comments, comment] }, null);
    setNewComment('');
  };

  const deleteComment = (cmId) => {
    onUpdate({ comments: task.comments.filter(c => c.id !== cmId) }, null);
  };

  const addChecklist = () => {
    if (!newClTitle.trim()) return;
    const cl = { id: `cl-${Date.now()}`, title: newClTitle.trim(), items: [] };
    onUpdate({ checklists: [...task.checklists, cl] }, `adicionou checklist "${cl.title}"`);
    setNewClTitle('');
    setShowAddChecklist(false);
    setOpenPopover(null);
  };

  const updateChecklist = (cl) => {
    onUpdate({ checklists: task.checklists.map(c => c.id === cl.id ? cl : c) }, null);
  };

  const deleteChecklist = (clId) => {
    onUpdate({ checklists: task.checklists.filter(c => c.id !== clId) }, null);
  };

  // Handles special board-level updates mixed in with task updates
  const handleUpdate = (patch, activityText) => {
    onUpdate(patch, activityText);
  };

  const togglePopover = (name) => setOpenPopover(p => p === name ? null : name);

  const taskLabels = board.labels.filter(l => task.labelIds.includes(l.id));
  const taskMembers = board.members.filter(m => task.memberIds.includes(m.id));
  const due = dueDateInfo(task.dueDate);

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="card-modal">
        {/* ── Close ── */}
        <button className="modal-close" onClick={onClose}><X size={18} /></button>

        {/* ── Layout ── */}
        <div className="modal-layout">
          {/* ── LEFT ── */}
          <div className="modal-left">
            {/* Title */}
            <div className="modal-title-area">
              {editingTitle ? (
                <textarea
                  autoFocus
                  className="modal-title-input"
                  value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle(); } }}
                  rows={2}
                />
              ) : (
                <h2 className="modal-title" onClick={() => setEditingTitle(true)}>{task.title}</h2>
              )}
              <p className="modal-list-info">
                na lista <strong>{columnTitle}</strong>
                {task.archived && <span className="archived-badge">Arquivado</span>}
              </p>
            </div>

            {/* Quick-view: labels, members, due date */}
            {(taskLabels.length > 0 || taskMembers.length > 0 || task.dueDate) && (
              <div className="modal-quick-row">
                {taskLabels.length > 0 && (
                  <div className="quick-group">
                    <span className="quick-label">Labels</span>
                    <div className="quick-value labels-row">
                      {taskLabels.map(lbl => <LabelBadge key={lbl.id} label={lbl} onClick={() => togglePopover('labels')} />)}
                    </div>
                  </div>
                )}
                {taskMembers.length > 0 && (
                  <div className="quick-group">
                    <span className="quick-label">Membros</span>
                    <div className="quick-value members-row">
                      {taskMembers.map(m => <MemberAvatar key={m.id} member={m} size={30} />)}
                    </div>
                  </div>
                )}
                {due && (
                  <div className="quick-group">
                    <span className="quick-label">Vencimento</span>
                    <div className={`quick-value due-badge ${due.cls}`}>
                      <Clock size={13} /> {due.text} · {due.label}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status & Priority */}
            <div className="modal-status-row">
              <div className="status-field">
                <span className="field-label">Status</span>
                <select
                  className={`field-select status-select ${STATUS_CLASS[task.status] || ''}`}
                  value={task.status}
                  onChange={e => handleUpdate({ status: e.target.value }, `alterou status para ${e.target.value}`)}
                >
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="status-field">
                <span className="field-label">Prioridade</span>
                <select
                  className={`field-select priority-select ${PRIORITY_CLASS[task.priority] || ''}`}
                  value={task.priority}
                  onChange={e => handleUpdate({ priority: e.target.value }, `alterou prioridade para ${e.target.value}`)}
                >
                  {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="status-field">
                <span className="field-label">Progresso</span>
                <div className="progress-edit-row">
                  <div className="progress-bar-bg" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${task.progress}%` }} />
                  </div>
                  <input
                    type="number"
                    className="progress-input"
                    min={0} max={100}
                    value={task.progress}
                    onChange={e => handleUpdate({ progress: Math.min(100, Math.max(0, Number(e.target.value))) }, null)}
                  />
                  <span className="pct-label">%</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="modal-section">
              <div className="section-head">
                <AlignLeft size={16} className="section-icon" />
                <h4>Descrição</h4>
                {!editingDesc && <button className="section-edit-btn" onClick={() => setEditingDesc(true)}><Pencil size={13} /></button>}
              </div>
              {editingDesc ? (
                <div className="desc-edit">
                  <textarea
                    autoFocus
                    className="desc-textarea"
                    value={descVal}
                    onChange={e => setDescVal(e.target.value)}
                    placeholder="Adicione uma descrição..."
                    rows={4}
                  />
                  <div className="desc-actions">
                    <button className="pop-btn-confirm" onClick={saveDesc}><Check size={13} /> Salvar</button>
                    <button className="pop-btn-cancel" onClick={() => { setDescVal(task.description || ''); setEditingDesc(false); }}><X size={13} /></button>
                  </div>
                </div>
              ) : (
                <p className="desc-text" onClick={() => setEditingDesc(true)}>
                  {task.description || <span className="desc-placeholder">Clique para adicionar uma descrição...</span>}
                </p>
              )}
            </div>

            {/* Checklists */}
            {task.checklists.map(cl => (
              <ChecklistSection
                key={cl.id}
                checklist={cl}
                onUpdate={updateChecklist}
                onDelete={() => deleteChecklist(cl.id)}
              />
            ))}

            {/* Comments + Activity */}
            <div className="modal-section">
              <div className="section-head">
                <MessageSquare size={16} className="section-icon" />
                <h4>Atividade</h4>
              </div>

              {/* Add comment */}
              <div className="comment-input-row">
                <div className="comment-avatar">Eu</div>
                <div className="comment-box">
                  <textarea
                    className="comment-textarea"
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                    rows={2}
                  />
                  {newComment.trim() && (
                    <button className="pop-btn-confirm comment-submit" onClick={addComment}>
                      <Check size={13} /> Comentar
                    </button>
                  )}
                </div>
              </div>

              {/* Comments list */}
              {[...task.comments].reverse().map(cm => (
                <div key={cm.id} className="comment-item">
                  <div className="comment-avatar">{cm.author.slice(0, 2).toUpperCase()}</div>
                  <div className="comment-content">
                    <div className="comment-meta">
                      <strong>{cm.author}</strong>
                      <span>{formatTs(cm.timestamp)}</span>
                    </div>
                    <p className="comment-text">{cm.text}</p>
                    <button className="comment-delete" onClick={() => deleteComment(cm.id)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}

              {/* Activity log */}
              {task.activity.length > 0 && (
                <div className="activity-log">
                  {[...task.activity].reverse().map(act => (
                    <div key={act.id} className="activity-item">
                      <div className="comment-avatar act">{act.author.slice(0, 2).toUpperCase()}</div>
                      <div className="activity-content">
                        <span><strong>{act.author}</strong> {act.text}</span>
                        <span className="activity-time">{formatTs(act.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="modal-right">
            <div className="right-group">
              <p className="right-group-label">Adicionar ao card</p>

              <div className="right-btn-wrap">
                <button className="right-action-btn" onClick={() => togglePopover('members')}>
                  <Users size={15} /> Membros
                </button>
                {openPopover === 'members' && (
                  <MembersPopover
                    board={board}
                    task={task}
                    onUpdate={(patch) => handleUpdate(patch, null)}
                    onClose={() => setOpenPopover(null)}
                  />
                )}
              </div>

              <div className="right-btn-wrap">
                <button className="right-action-btn" onClick={() => togglePopover('labels')}>
                  <Tag size={15} /> Labels
                </button>
                {openPopover === 'labels' && (
                  <LabelsPopover
                    board={board}
                    task={task}
                    onUpdate={(patch) => handleUpdate(patch, null)}
                    onClose={() => setOpenPopover(null)}
                  />
                )}
              </div>

              <div className="right-btn-wrap">
                <button className="right-action-btn" onClick={() => togglePopover('checklist')}>
                  <CheckSquare size={15} /> Checklist
                </button>
                {openPopover === 'checklist' && (
                  <div className="popover">
                    <div className="popover-header">
                      <span>Adicionar Checklist</span>
                      <button onClick={() => setOpenPopover(null)}><X size={14} /></button>
                    </div>
                    <div className="popover-create" style={{ padding: '12px' }}>
                      <input
                        autoFocus
                        className="popover-input"
                        placeholder="Título da checklist..."
                        value={newClTitle}
                        onChange={e => setNewClTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addChecklist(); if (e.key === 'Escape') setOpenPopover(null); }}
                      />
                      <div className="popover-actions" style={{ marginTop: 8 }}>
                        <button className="pop-btn-confirm" onClick={addChecklist}><Check size={13} /> Adicionar</button>
                        <button className="pop-btn-cancel" onClick={() => setOpenPopover(null)}><X size={13} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="right-btn-wrap">
                <button className="right-action-btn" onClick={() => togglePopover('date')}>
                  <Calendar size={15} /> Data de vencimento
                </button>
                {openPopover === 'date' && (
                  <div className="popover">
                    <div className="popover-header">
                      <span>Data de Vencimento</span>
                      <button onClick={() => setOpenPopover(null)}><X size={14} /></button>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <input
                        type="date"
                        className="popover-input"
                        value={task.dueDate || ''}
                        onChange={e => {
                          handleUpdate({ dueDate: e.target.value }, e.target.value ? `definiu vencimento para ${e.target.value}` : 'removeu a data de vencimento');
                          setOpenPopover(null);
                        }}
                      />
                      {task.dueDate && (
                        <button
                          className="pop-btn-cancel"
                          style={{ marginTop: 8, width: '100%' }}
                          onClick={() => { handleUpdate({ dueDate: '' }, 'removeu a data de vencimento'); setOpenPopover(null); }}
                        >
                          Remover data
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="right-group">
              <p className="right-group-label">Ações</p>
              <button
                className={`right-action-btn ${task.archived ? 'btn-restore' : 'btn-archive'}`}
                onClick={onArchive}
              >
                {task.archived ? <><ArchiveRestore size={15} /> Restaurar</> : <><Archive size={15} /> Arquivar</>}
              </button>
              <button className="right-action-btn btn-delete" onClick={onDelete}>
                <Trash2 size={15} /> Excluir card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;

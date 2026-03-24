import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Layout } from 'lucide-react';
import { BOARD_BACKGROUNDS } from '../data/initialData';
import './BoardsHomeView.css';

const BG_COLORS = BOARD_BACKGROUNDS;

const BoardCard = ({ board, onClick, onRename, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(board.title);

  const saveRename = () => {
    if (name.trim()) onRename(board.id, name.trim());
    setEditing(false);
  };

  const totalTasks = board.columns.reduce((s, c) => s + c.tasks.filter(t => !t.archived).length, 0);
  const doneTasks = board.columns.reduce((s, c) => s + c.tasks.filter(t => t.status === 'Done' && !t.archived).length, 0);

  return (
    <div className="board-card" onClick={() => !editing && onClick(board.id)}>
      <div className="board-card-bg" style={{ background: board.background }} />
      <div className="board-card-body">
        {editing ? (
          <div className="board-rename" onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              className="board-rename-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditing(false); }}
            />
            <button className="rename-confirm" onClick={saveRename}><Check size={14} /></button>
            <button className="rename-cancel" onClick={() => setEditing(false)}><X size={14} /></button>
          </div>
        ) : (
          <h3 className="board-card-title">{board.title}</h3>
        )}
        <div className="board-card-meta">
          <span>{board.columns.length} listas</span>
          <span>{totalTasks} cards</span>
          {doneTasks > 0 && <span className="done-count">{doneTasks} concluídos</span>}
        </div>
      </div>
      <div className="board-card-actions" onClick={e => e.stopPropagation()}>
        <button className="board-action-btn" title="Renomear" onClick={() => setEditing(true)}>
          <Pencil size={13} />
        </button>
        <button className="board-action-btn danger" title="Excluir" onClick={() => onDelete(board.id)}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

const NewBoardForm = ({ onCreate, onCancel }) => {
  const [title, setTitle] = useState('');
  const [bg, setBg] = useState(BG_COLORS[0].value);

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), background: bg });
  };

  return (
    <div className="new-board-form">
      <div className="nbf-preview" style={{ background: bg }} />
      <div className="nbf-body">
        <input
          autoFocus
          className="nbf-input"
          placeholder="Nome do board..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onCancel(); }}
        />
        <div className="nbf-bg-picker">
          {BG_COLORS.map(bg_opt => (
            <button
              key={bg_opt.id}
              className={`bg-swatch ${bg === bg_opt.value ? 'selected' : ''}`}
              style={{ background: bg_opt.value }}
              title={bg_opt.label}
              onClick={() => setBg(bg_opt.value)}
            />
          ))}
        </div>
        <div className="nbf-actions">
          <button className="nbf-btn-create" onClick={handleCreate}><Check size={14} /> Criar Board</button>
          <button className="nbf-btn-cancel" onClick={onCancel}><X size={14} /></button>
        </div>
      </div>
    </div>
  );
};

const BoardsHomeView = ({ boards, onOpenBoard, onCreateBoard, onRenameBoard, onDeleteBoard }) => {
  const [showNewForm, setShowNewForm] = useState(false);

  const handleCreate = (data) => {
    onCreateBoard(data);
    setShowNewForm(false);
  };

  const handleDelete = (boardId) => {
    if (window.confirm('Tem certeza que deseja excluir este board? Esta ação não pode ser desfeita.')) {
      onDeleteBoard(boardId);
    }
  };

  return (
    <div className="boards-home">
      <div className="boards-home-header">
        <div className="boards-home-title">
          <Layout size={22} />
          <h2>Meus Boards</h2>
        </div>
        <button className="create-board-btn" onClick={() => setShowNewForm(true)}>
          <Plus size={16} /> Novo Board
        </button>
      </div>

      <div className="boards-grid">
        {boards.map(board => (
          <BoardCard
            key={board.id}
            board={board}
            onClick={onOpenBoard}
            onRename={onRenameBoard}
            onDelete={handleDelete}
          />
        ))}

        {showNewForm && (
          <NewBoardForm
            onCreate={handleCreate}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {!showNewForm && (
          <button className="add-board-card" onClick={() => setShowNewForm(true)}>
            <Plus size={20} />
            <span>Criar novo board</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BoardsHomeView;

import React, { useMemo } from 'react';
import {
  Layout, CheckSquare, Clock, AlertCircle, TrendingUp,
  ChevronRight, Activity,
} from 'lucide-react';
import './DashboardView.css';

const dueDateInfo = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = d - now;
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return { days, label: `${Math.abs(days)}d atraso`, cls: 'due-overdue' };
  if (days === 0) return { days, label: 'Hoje', cls: 'due-today' };
  if (days <= 7) return { days, label: `${days}d restantes`, cls: days <= 3 ? 'due-soon' : 'due-ok' };
  return null;
};

const greeting = (name) => {
  const h = new Date().getHours();
  const base = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return `${base}, ${name}!`;
};

const formatTs = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const daysDiff = Math.floor(diff / 86400000);
  if (mins < 2) return 'agora mesmo';
  if (mins < 60) return `${mins} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (daysDiff === 1) return 'ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const PRIORITY_CLASS = { High: 'priority-high', Medium: 'priority-mid', Low: 'priority-low' };
const STATUS_CLASS = { 'In Review': 'status-review', 'Drafts': 'status-draft', 'In Progress': 'status-progress', 'Todo': 'status-todo', 'Done': 'status-done' };

const DashboardView = ({ boards, user, onOpenBoard }) => {
  const stats = useMemo(() => {
    const allTasks = boards.flatMap(b => b.columns.flatMap(c => c.tasks.filter(t => !t.archived)));
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const overdue = allTasks.filter(t => t.dueDate && new Date(t.dueDate + 'T00:00:00') < now && t.status !== 'Done');
    const done = allTasks.filter(t => t.status === 'Done');
    const inProgress = allTasks.filter(t => t.status === 'In Progress');
    return {
      boards: boards.length,
      total: allTasks.length,
      done: done.length,
      overdue: overdue.length,
      inProgress: inProgress.length,
    };
  }, [boards]);

  // Cards vencendo em breve (próximos 7 dias + atrasados) com info do board
  const upcomingTasks = useMemo(() => {
    const result = [];
    boards.forEach(board => {
      board.columns.forEach(col => {
        col.tasks.forEach(task => {
          if (task.archived || task.status === 'Done' || !task.dueDate) return;
          const info = dueDateInfo(task.dueDate);
          if (!info) return;
          result.push({ task, board, columnTitle: col.title, dueInfo: info });
        });
      });
    });
    return result.sort((a, b) => a.dueInfo.days - b.dueInfo.days).slice(0, 6);
  }, [boards]);

  // Atividade recente de todos os boards
  const recentActivity = useMemo(() => {
    const result = [];
    boards.forEach(board => {
      board.columns.forEach(col => {
        col.tasks.forEach(task => {
          task.activity.forEach(act => {
            result.push({ ...act, taskTitle: task.title, boardTitle: board.title, boardId: board.id });
          });
          task.comments.forEach(cm => {
            result.push({
              id: cm.id,
              text: `comentou: "${cm.text.slice(0, 60)}${cm.text.length > 60 ? '…' : ''}"`,
              author: cm.author,
              timestamp: cm.timestamp,
              taskTitle: task.title,
              boardTitle: board.title,
              boardId: board.id,
            });
          });
        });
      });
    });
    return result
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);
  }, [boards]);

  const donePercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="dashboard-view">
      {/* ── Header ── */}
      <div className="dash-header">
        <div className="dash-avatar" style={{ background: user.color }}>
          {user.initials}
        </div>
        <div className="dash-welcome">
          <h2 className="dash-greeting">{greeting(user.name)}</h2>
          <p className="dash-subtitle">
            {stats.total === 0
              ? 'Você não tem cards ainda. Crie seu primeiro board!'
              : stats.overdue > 0
                ? `Você tem ${stats.overdue} card${stats.overdue > 1 ? 's' : ''} atrasado${stats.overdue > 1 ? 's' : ''}. Fique de olho!`
                : `Tudo em dia! ${stats.inProgress} card${stats.inProgress !== 1 ? 's' : ''} em andamento.`}
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#EBF4FC' }}>
            <Layout size={20} style={{ color: '#0A66C2' }} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{stats.boards}</span>
            <span className="stat-label">Boards</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#EDE9FE' }}>
            <CheckSquare size={20} style={{ color: '#7C3AED' }} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Cards no total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#D1FAE5' }}>
            <TrendingUp size={20} style={{ color: '#047857' }} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{stats.done}</span>
            <span className="stat-label">Concluídos</span>
            <div className="stat-sub-bar">
              <div className="stat-bar-bg">
                <div className="stat-bar-fill" style={{ width: `${donePercent}%`, background: '#10b981' }} />
              </div>
              <span className="stat-bar-pct">{donePercent}%</span>
            </div>
          </div>
        </div>

        <div className={`stat-card ${stats.overdue > 0 ? 'stat-danger' : ''}`}>
          <div className="stat-icon-wrap" style={{ background: stats.overdue > 0 ? '#FEE2E2' : '#F1F5F9' }}>
            <AlertCircle size={20} style={{ color: stats.overdue > 0 ? '#DC2626' : '#94A3B8' }} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{stats.overdue}</span>
            <span className="stat-label">Atrasados</span>
          </div>
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className="dash-grid">
        {/* Left: upcoming + boards */}
        <div className="dash-left">
          {/* Vencendo em breve */}
          <div className="dash-card">
            <div className="dash-card-header">
              <Clock size={16} />
              <h3>Vencendo em breve</h3>
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="dash-empty">Nenhum card com prazo próximo.</p>
            ) : (
              <div className="upcoming-list">
                {upcomingTasks.map(({ task, board, columnTitle, dueInfo }) => (
                  <div key={task.id} className="upcoming-item" onClick={() => onOpenBoard(board.id)}>
                    <div className="upcoming-info">
                      <span className="upcoming-title">{task.title}</span>
                      <span className="upcoming-meta">{board.title} · {columnTitle}</span>
                    </div>
                    <div className="upcoming-right">
                      <span className={`badge-pill ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
                      <span className={`due-chip ${dueInfo.cls}`}>{dueInfo.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Boards recentes */}
          <div className="dash-card">
            <div className="dash-card-header">
              <Layout size={16} />
              <h3>Seus Boards</h3>
            </div>
            {boards.length === 0 ? (
              <p className="dash-empty">Nenhum board criado ainda.</p>
            ) : (
              <div className="boards-quick-list">
                {boards.map(board => {
                  const total = board.columns.reduce((s, c) => s + c.tasks.filter(t => !t.archived).length, 0);
                  const done = board.columns.reduce((s, c) => s + c.tasks.filter(t => t.status === 'Done' && !t.archived).length, 0);
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <button key={board.id} className="board-quick-item" onClick={() => onOpenBoard(board.id)}>
                      <div className="bqi-color" style={{ background: board.background }} />
                      <div className="bqi-body">
                        <span className="bqi-title">{board.title}</span>
                        <div className="bqi-bar-row">
                          <div className="stat-bar-bg" style={{ flex: 1 }}>
                            <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="bqi-pct">{pct}%</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="bqi-arrow" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: activity feed */}
        <div className="dash-card dash-activity">
          <div className="dash-card-header">
            <Activity size={16} />
            <h3>Atividade recente</h3>
          </div>
          {recentActivity.length === 0 ? (
            <p className="dash-empty">Nenhuma atividade ainda.</p>
          ) : (
            <div className="activity-feed">
              {recentActivity.map((act, i) => (
                <div key={act.id + i} className="feed-item" onClick={() => onOpenBoard(act.boardId)}>
                  <div className="feed-avatar">{act.author.slice(0, 2).toUpperCase()}</div>
                  <div className="feed-body">
                    <p className="feed-text">
                      <strong>{act.author}</strong> {act.text}
                    </p>
                    <span className="feed-meta">
                      {act.taskTitle} · {act.boardTitle}
                    </span>
                    <span className="feed-time">{formatTs(act.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

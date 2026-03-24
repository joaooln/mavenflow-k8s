import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, LogOut, Check, CheckCheck } from 'lucide-react';
import './TopBar.css';

const TopBar = ({
  title,
  user,
  onOpenProfile,
  onLogout,
  unreadCount = 0,
  notifications = [],
  onOpenNotifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const handleBellClick = () => {
    if (!showNotifs) onOpenNotifications?.();
    setShowNotifs(v => !v);
  };

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-actions">
        {/* Notifications */}
        <div className="notif-wrap" ref={notifsRef}>
          <button
            className="action-btn notifications-btn"
            title="Notificações"
            onClick={handleBellClick}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="badge badge-count">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div className="notif-header">
                <span className="notif-header-title">Notificações</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={onMarkAllRead} title="Marcar todas como lidas">
                    <CheckCheck size={14} />
                    Marcar todas
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Nenhuma notificação</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`notif-item${n.read ? '' : ' notif-item--unread'}`}
                      onClick={() => !n.read && onMarkRead(n.id)}
                    >
                      <div className="notif-dot" />
                      <div className="notif-body">
                        <p className="notif-text">{n.body}</p>
                        <span className="notif-time">
                          {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.read && (
                        <button className="notif-check" title="Marcar como lida" onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}>
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User button */}
        <button
          className="topbar-user"
          onClick={onOpenProfile}
          title="Editar perfil"
        >
          <div className="topbar-avatar" style={{ background: user.color }}>
            {user.initials}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user.name}</span>
            <span className="topbar-user-role">Editar perfil</span>
          </div>
          <Settings size={14} className="topbar-settings-icon" />
        </button>

        {/* Logout */}
        <button className="action-btn" title="Sair" onClick={onLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;

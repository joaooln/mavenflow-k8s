import React from 'react';
import { Bell, Settings } from 'lucide-react';
import './TopBar.css';

const TopBar = ({ title, user, onOpenProfile }) => {
  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-actions">
        <button className="action-btn notifications-btn" title="Notificações">
          <Bell size={20} />
          <span className="badge" />
        </button>

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
      </div>
    </header>
  );
};

export default TopBar;

import React from 'react';
import { LayoutDashboard, Layout, ChevronRight } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentView, selectedBoardId, boards, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">Mavenflow.</span>
      </div>

      <div className="sidebar-menu">
        <div className="menu-group">
          <span className="menu-label">Menu</span>

          <button
            className={`menu-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            className={`menu-item ${currentView === 'boards' ? 'active' : ''}`}
            onClick={() => onNavigate('boards')}
          >
            <Layout size={20} />
            <span>Meus Boards</span>
          </button>
        </div>

        {boards.length > 0 && (
          <div className="menu-group boards-group">
            <span className="menu-label">Boards</span>
            {boards.map(board => (
              <button
                key={board.id}
                className={`menu-item board-item ${selectedBoardId === board.id ? 'active' : ''}`}
                onClick={() => onNavigate(board.id)}
                title={board.title}
              >
                <span className="board-color-dot" style={{ background: board.background }} />
                <span className="board-item-name">{board.title}</span>
                <ChevronRight size={14} className="board-item-arrow" />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

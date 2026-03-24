import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { useWebSocket } from './hooks/useWebSocket.js';
import { getBoards, createBoard as apiCreateBoard, updateBoard as apiUpdateBoard, deleteBoard as apiDeleteBoard, getBoard } from './api/boards.js';
import { updateMe } from './api/auth.js';
import { getNotifications, getUnreadCount, markRead, markAllRead } from './api/notifications.js';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import UserProfileModal from './components/UserProfileModal';
import DashboardView from './views/DashboardView';
import BoardsHomeView from './views/BoardsHomeView';
import BoardView from './views/BoardView';
import LoginView from './views/LoginView';
import './index.css';

function App() {
  const { user, loading: authLoading, logout, updateUser } = useAuth();

  const [boards, setBoards] = useState([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('boards');
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentBoard = selectedBoardId ? boards.find(b => b.id === selectedBoardId) : null;

  // ── Load boards from API ───────────────────────────────────────────────────
  const loadBoards = useCallback(async () => {
    if (!user) return;
    setBoardsLoading(true);
    try {
      const data = await getBoards();
      setBoards(data);
    } catch (e) {
      console.error('Failed to load boards', e);
    } finally {
      setBoardsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadBoards();
      loadUnreadCount();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Notifications ──────────────────────────────────────────────────────────
  const loadUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  // ── WebSocket handlers ─────────────────────────────────────────────────────
  const handleBoardUpdate = useCallback(async (boardId) => {
    try {
      const updated = await getBoard(boardId);
      setBoards(prev => prev.map(b => b.id === boardId ? updated : b));
    } catch {}
  }, []);

  const handleNotification = useCallback((notif) => {
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const { subscribe, unsubscribe } = useWebSocket({
    onBoardUpdate: handleBoardUpdate,
    onNotification: handleNotification,
  });

  // Subscribe/unsubscribe when viewing a board
  useEffect(() => {
    if (selectedBoardId) {
      subscribe(selectedBoardId);
      return () => unsubscribe(selectedBoardId);
    }
  }, [selectedBoardId, subscribe, unsubscribe]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigateTo = (view) => {
    if (view === 'dashboard' || view === 'boards') {
      setSelectedBoardId(null);
      setCurrentView(view);
    } else {
      setSelectedBoardId(view);
      setCurrentView('board');
    }
  };

  // ── Board CRUD ─────────────────────────────────────────────────────────────
  const createBoard = async ({ title, background }) => {
    try {
      const newBoard = await apiCreateBoard({ title, background });
      setBoards(prev => [...prev, newBoard]);
    } catch (e) {
      console.error('Failed to create board', e);
    }
  };

  const renameBoard = async (boardId, newTitle) => {
    try {
      const updated = await apiUpdateBoard(boardId, { title: newTitle });
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, title: updated.title } : b));
    } catch (e) {
      console.error('Failed to rename board', e);
    }
  };

  const deleteBoard = async (boardId) => {
    try {
      await apiDeleteBoard(boardId);
      setBoards(prev => prev.filter(b => b.id !== boardId));
      if (selectedBoardId === boardId) {
        setSelectedBoardId(null);
        setCurrentView('boards');
      }
    } catch (e) {
      console.error('Failed to delete board', e);
    }
  };

  const updateBoard = useCallback((boardId, patchFn) => {
    setBoards(prev =>
      prev.map(b => b.id === boardId
        ? (typeof patchFn === 'function' ? patchFn(b) : { ...b, ...patchFn })
        : b
      )
    );
  }, []);

  // ── User profile ───────────────────────────────────────────────────────────
  const saveUser = async (data) => {
    try {
      const updated = await updateMe(data);
      updateUser(updated);
    } catch (e) {
      console.error('Failed to update profile', e);
    }
  };

  // ── Loading / Auth gate ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const userForUI = {
    ...user,
    initials: user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??',
    color: user.color || '#0A66C2',
  };

  const topBarTitle =
    currentView === 'dashboard' ? 'Dashboard'
    : currentView === 'board' && currentBoard ? currentBoard.title
    : 'Meus Boards';

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        selectedBoardId={selectedBoardId}
        boards={boards}
        onNavigate={navigateTo}
      />

      <main className="main-content">
        <TopBar
          title={topBarTitle}
          user={userForUI}
          onOpenProfile={() => setShowProfile(true)}
          onLogout={logout}
          unreadCount={unreadCount}
          notifications={notifications}
          onOpenNotifications={loadNotifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />

        <div className="view-container">
          {currentView === 'dashboard' && (
            <DashboardView
              boards={boards}
              user={userForUI}
              onOpenBoard={navigateTo}
            />
          )}

          {currentView === 'boards' && (
            <BoardsHomeView
              boards={boards}
              onOpenBoard={navigateTo}
              onCreateBoard={createBoard}
              onRenameBoard={renameBoard}
              onDeleteBoard={deleteBoard}
            />
          )}

          {currentView === 'board' && currentBoard && (
            <BoardView
              board={currentBoard}
              user={userForUI}
              onBack={() => navigateTo('boards')}
              onUpdateBoard={(patchFn) => updateBoard(currentBoard.id, patchFn)}
            />
          )}
        </div>
      </main>

      {showProfile && (
        <UserProfileModal
          user={userForUI}
          onSave={saveUser}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

export default App;

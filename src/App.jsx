import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { INITIAL_BOARDS } from './data/initialData';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import UserProfileModal from './components/UserProfileModal';
import DashboardView from './views/DashboardView';
import BoardsHomeView from './views/BoardsHomeView';
import BoardView from './views/BoardView';
import './index.css';

const INITIAL_USER = {
  name: 'Usuário',
  email: '',
  initials: 'EU',
  color: '#0A66C2',
  bio: '',
};

function App() {
  const [boards, setBoards] = useLocalStorage('mavenflow-boards', INITIAL_BOARDS);
  const [user, setUser] = useLocalStorage('mavenflow-user', INITIAL_USER);
  const [currentView, setCurrentView] = useState('boards'); // 'dashboard' | 'boards' | 'board'
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const currentBoard = selectedBoardId ? boards.find(b => b.id === selectedBoardId) : null;

  const navigateTo = (view) => {
    if (view === 'dashboard' || view === 'boards') {
      setSelectedBoardId(null);
      setCurrentView(view);
    } else {
      setSelectedBoardId(view);
      setCurrentView('board');
    }
  };

  // ── Board CRUD ────────────────────────────────────────────────────────────
  const createBoard = ({ title, background }) => {
    const ts = Date.now();
    const newBoard = {
      id: `board-${ts}`,
      title,
      background,
      labels: [],
      members: [{ id: `mbr-${ts}`, name: user.name, initials: user.initials, color: user.color }],
      columns: [
        { id: `col-${ts}-1`, title: 'A FAZER', tasks: [] },
        { id: `col-${ts}-2`, title: 'EM ANDAMENTO', tasks: [] },
        { id: `col-${ts}-3`, title: 'CONCLUÍDO', tasks: [] },
      ],
    };
    setBoards(prev => [...prev, newBoard]);
  };

  const renameBoard = (boardId, newTitle) => {
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, title: newTitle } : b));
  };

  const deleteBoard = (boardId) => {
    setBoards(prev => prev.filter(b => b.id !== boardId));
    if (selectedBoardId === boardId) {
      setSelectedBoardId(null);
      setCurrentView('boards');
    }
  };

  const updateBoard = (boardId, patchFn) => {
    setBoards(prev =>
      prev.map(b => b.id === boardId
        ? (typeof patchFn === 'function' ? patchFn(b) : { ...b, ...patchFn })
        : b
      )
    );
  };

  // ── User profile ──────────────────────────────────────────────────────────
  const saveUser = (data) => {
    setUser(data);
    // Keep first member in all boards in sync with current user
    setBoards(prev => prev.map(board => ({
      ...board,
      members: board.members.map(m =>
        m.id.startsWith('mbr-') && m.name === user.name
          ? { ...m, name: data.name, initials: data.initials, color: data.color }
          : m
      ),
    })));
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
          user={user}
          onOpenProfile={() => setShowProfile(true)}
        />

        <div className="view-container">
          {currentView === 'dashboard' && (
            <DashboardView
              boards={boards}
              user={user}
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
              user={user}
              onBack={() => navigateTo('boards')}
              onUpdateBoard={(patchFn) => updateBoard(currentBoard.id, patchFn)}
            />
          )}
        </div>
      </main>

      {showProfile && (
        <UserProfileModal
          user={user}
          onSave={saveUser}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

export default App;

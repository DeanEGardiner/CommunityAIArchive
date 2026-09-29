import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BoardSelectionView from './components/BoardSelectionView';
import BoardDetailView from './components/BoardDetailView';
import ThreadView from './components/ThreadView';
import RankingBoardView from './components/RankingBoardView';
import SettingsModal from './components/SettingsModal';
import GoogleSearchModal from './components/GoogleSearchModal';
import UserAuthModal from './components/UserAuthModal';
import { api } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('directory'); // 'directory' | 'board' | 'thread' | 'rankings'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoogleSearchOpen, setIsGoogleSearchOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Community Data State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [boards, setBoards] = useState([]);
  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);
  const [boardThreads, setBoardThreads] = useState([]);
  
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [threadPosts, setThreadPosts] = useState([]);

  const [rankings, setRankings] = useState({ topPosts: [], topUsers: [] });

  // Initial Load
  useEffect(() => {
    loadUsers();
    loadBoards();
    loadRankings();
  }, []);

  // Filter boards on search
  useEffect(() => {
    loadBoards(boardSearchQuery);
  }, [boardSearchQuery]);

  // Support URL hash routing for direct deep-linking and screenshot automation
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash || '';
      if (!hash || hash === '#/' || hash === '#/directory') {
        setCurrentView('directory');
        setIsUserModalOpen(false);
        setIsGoogleSearchOpen(false);
        setIsSettingsOpen(false);
      } else if (hash === '#/rankings') {
        setCurrentView('rankings');
      } else if (hash.startsWith('#/board/')) {
        const boardId = hash.replace('#/board/', '').split('?')[0];
        if (boardId) {
          await handleSelectBoard(boardId);
        }
      } else if (hash.startsWith('#/thread/')) {
        // format: #/thread/<threadId>?board=<boardId>
        const parts = hash.replace('#/thread/', '').split('?');
        const threadId = parts[0];
        const params = new URLSearchParams(parts[1] || '');
        const boardId = params.get('board') || null;
        if (threadId) {
          await handleSelectThread(boardId, threadId);
        }
      } else if (hash === '#/modal/auth') {
        setIsUserModalOpen(true);
      } else if (hash === '#/modal/google-search') {
        setIsGoogleSearchOpen(true);
      } else if (hash === '#/modal/settings') {
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener('hashchange', handleHash);
    // Initial check after short delay to allow boards/users to load
    const timer = setTimeout(handleHash, 300);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      clearTimeout(timer);
    };
  }, []);

  const loadUsers = async () => {
    try {
      const u = await api.getUsers();
      setUsers(u);
      if (u.length > 0 && !currentUser) {
        const hash = window.location.hash || '';
        const adminUser = u.find(user => user.role === 'admin' || user.username.toLowerCase() === 'dean');
        if (hash.includes('user=admin') || hash.includes('user=dean')) {
          setCurrentUser(adminUser || u[0]);
        } else {
          setCurrentUser(u[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadBoards = async (search = '') => {
    try {
      const b = await api.getBoards(search);
      setBoards(b);
    } catch (err) {
      console.error('Failed to load boards:', err);
    }
  };

  const loadRankings = async () => {
    try {
      const r = await api.getRankings();
      setRankings(r);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    }
  };

  const handleSelectBoard = async (boardId) => {
    setActiveBoardId(boardId);
    try {
      const b = await api.getBoard(boardId);
      setActiveBoard(b);
      const th = await api.getThreads(boardId);
      setBoardThreads(th);
      setCurrentView('board');
    } catch (err) {
      console.error('Failed to open board:', err);
    }
  };

  const handleSelectThread = async (boardId, threadId) => {
    if (boardId) {
      setActiveBoardId(boardId);
      const b = await api.getBoard(boardId);
      setActiveBoard(b);
    }
    setActiveThreadId(threadId);
    try {
      const th = await api.getThread(threadId);
      setActiveThread(th);
      setThreadPosts(th.posts || []);
      setCurrentView('thread');
    } catch (err) {
      console.error('Failed to open thread:', err);
    }
  };

  const handleCreateThread = async ({ content, mode, attachment }) => {
    if (!activeBoardId) return;
    try {
      const res = await api.createThread(activeBoardId, {
        userId: currentUser?.id,
        authorName: currentUser?.username,
        content,
        mode,
        attachment
      });

      // Reload board threads
      const th = await api.getThreads(activeBoardId);
      setBoardThreads(th);
      loadBoards();
      loadRankings();

      // Open new thread directly
      await handleSelectThread(activeBoardId, res.threadId);
    } catch (err) {
      alert('Failed to create thread: ' + err.message);
    }
  };

  const handleCreatePost = async ({ content, mode, attachment, parentPostId }) => {
    if (!activeThreadId) return;
    try {
      const res = await api.createPost(activeThreadId, {
        userId: currentUser?.id,
        authorName: currentUser?.username,
        content,
        mode,
        attachment,
        parentPostId
      });

      // Reload thread
      const th = await api.getThread(activeThreadId);
      setActiveThread(th);
      setThreadPosts(th.posts || []);
      loadRankings();
      loadBoards();
    } catch (err) {
      alert('Failed to reply: ' + err.message);
    }
  };

  const handleEditPost = async (postId, content) => {
    if (!currentUser?.id) return;
    try {
      const updated = await api.editPost(postId, {
        userId: currentUser.id,
        content
      });

      // Update local state
      setThreadPosts(prev => prev.map(p => p.id === postId ? { ...p, content: updated.content, updated_at: updated.updated_at } : p));
    } catch (err) {
      alert('Failed to edit post: ' + err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser?.id) return;
    try {
      await api.deletePost(postId, { userId: currentUser.id });
      // Remove post from local state
      setThreadPosts(prev => prev.filter(p => p.id !== postId));
      loadRankings();
      loadBoards();
    } catch (err) {
      alert('Failed to delete post: ' + err.message);
    }
  };

  const handleLockThread = async (threadId, locked) => {
    if (!currentUser?.id) return;
    try {
      const res = await api.lockThread(threadId, { userId: currentUser.id, locked });
      // Update active thread state and reload full thread
      const th = await api.getThread(threadId);
      setActiveThread(th);
      setThreadPosts(th.posts || []);
      // Refresh board threads list if active
      if (activeBoardId) {
        const boardThs = await api.getThreads(activeBoardId);
        setBoardThreads(boardThs);
      }
    } catch (err) {
      alert('Failed to update thread lock status: ' + err.message);
    }
  };

  const handleVotePost = async (postId, direction) => {
    if (!currentUser?.id) return;
    try {
      const res = await api.votePost(postId, {
        userId: currentUser.id,
        direction
      });

      // Update local thread post state
      setThreadPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            upvotes: res.upvotes,
            downvotes: res.downvotes,
            score: res.score,
            is_spam_hidden: res.isSpamHidden ? 1 : 0
          };
        }
        return p;
      }).filter(p => !p.is_spam_hidden));

      // Refresh users (karma) and rankings
      loadUsers();
      loadRankings();

      // If a new board was auto-created from 10 votes, notify user & refresh boards and thread
      if (res.newlyCreatedBoard) {
        await loadBoards();
        // Reload current thread so it shows the lock banner and final announcement post
        if (activeThreadId) {
          const updatedTh = await api.getThread(activeThreadId);
          setActiveThread(updatedTh);
          setThreadPosts(updatedTh.posts || []);
        }
        const msg = `🎉 Suggestion milestone reached!\n\nBoard "${res.newlyCreatedBoard.name}" has been created, and all ${res.newlyCreatedBoard.copiedPostCount || 'prior'} posts from this thread have been copied over to seed the new board!`;
        alert(msg);
      }

      return res;
    } catch (err) {
      alert('Vote failed: ' + err.message);
    }
  };

  const handleLogin = async ({ username, password }) => {
    const res = await api.login({ username, password });
    setCurrentUser(res.user);
    await loadUsers();
    setIsUserModalOpen(false);
  };

  const handleRegister = async ({ username, password, email }) => {
    const res = await api.registerUser({ username, password, email });
    setCurrentUser(res.user);
    await loadUsers();
    setIsUserModalOpen(false);
  };

  const handleQuickSwitch = (user) => {
    setCurrentUser(user);
    setIsUserModalOpen(false);
  };

  return (
    <div className="app-container">
      {/* Community Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          if (view === 'directory') {
            loadBoards();
          } else if (view === 'rankings') {
            loadRankings();
          }
        }}
        boards={boards}
        activeBoardId={activeBoardId}
        onSelectBoard={handleSelectBoard}
        currentUser={currentUser}
        onOpenUserModal={() => {
          loadUsers();
          setIsUserModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGoogleSearch={() => setIsGoogleSearchOpen(true)}
      />

      {/* Main Content View Switcher */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {currentView === 'directory' && (
          <BoardSelectionView
            boards={boards}
            searchQuery={boardSearchQuery}
            setSearchQuery={setBoardSearchQuery}
            onSelectBoard={handleSelectBoard}
            onOpenTipsBoard={() => handleSelectBoard('b-tips-and-suggestions')}
          />
        )}

        {currentView === 'board' && activeBoard && (
          <BoardDetailView
            board={activeBoard}
            threads={boardThreads}
            onSelectThread={(tId) => handleSelectThread(activeBoard.id, tId)}
            onBackToDirectory={() => setCurrentView('directory')}
            onCreateThread={handleCreateThread}
            currentUser={currentUser}
          />
        )}

        {currentView === 'thread' && activeThread && (
          <ThreadView
            board={activeBoard}
            thread={activeThread}
            posts={threadPosts}
            currentUser={currentUser}
            onBackToBoard={() => {
              if (activeBoardId) {
                handleSelectBoard(activeBoardId);
              } else {
                setCurrentView('directory');
              }
            }}
            onNavigateToBoard={handleSelectBoard}
            onNewPost={handleCreatePost}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onVotePost={handleVotePost}
            onLockThread={handleLockThread}
            onOpenGoogleSearch={() => setIsGoogleSearchOpen(true)}
          />
        )}

        {currentView === 'rankings' && (
          <RankingBoardView
            rankings={rankings}
            onSelectThread={(bId, tId) => handleSelectThread(bId, tId)}
          />
        )}
      </main>

      {/* Modals */}
      <UserAuthModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onQuickSwitch={handleQuickSwitch}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          loadBoards();
          loadRankings();
        }}
      />

      <GoogleSearchModal
        isOpen={isGoogleSearchOpen}
        onClose={() => setIsGoogleSearchOpen(false)}
        onInsertIntoComposer={(text) => {
          // If in thread, can paste or launch new thread
          if (activeBoardId) {
            handleCreateThread({
              content: text,
              mode: 'standard'
            });
            setIsGoogleSearchOpen(false);
          }
        }}
      />
    </div>
  );
}

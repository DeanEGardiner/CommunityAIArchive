import React from 'react';
import { 
  Compass, 
  MessageSquare, 
  Trophy, 
  Settings, 
  User, 
  Sparkles, 
  Globe, 
  Pin,
  TrendingUp,
  Award
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  boards,
  activeBoardId,
  onSelectBoard,
  currentUser,
  onOpenUserModal,
  onOpenSettings,
  onOpenGoogleSearch
}) {
  const defaultBoards = boards.filter(b => b.is_default === 1);
  const userBoards = boards.filter(b => b.is_default !== 1);

  return (
    <aside className="sidebar" style={{ width: '310px', minWidth: '310px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <div className="sidebar-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setCurrentView('directory')}>
          <div className="logo-icon-wrap" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--accent-glow)' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <span className="logo-title" style={{ fontSize: '15px', fontWeight: 700, background: 'linear-gradient(135deg, #fff 40%, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
              Community AI Archive
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Powered by Gemini</span>
          </div>
        </div>

        <button 
          className="nav-tab" 
          onClick={onOpenSettings}
          title="Settings & API Keys"
          style={{ padding: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <Settings size={17} />
        </button>
      </div>

      {/* User Switcher Pill / Profile Bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          onClick={onOpenUserModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to switch or register test users"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <img 
              src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.username || 'user'}`}
              alt={currentUser?.username}
              style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#23293e' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{currentUser?.username || 'Dean'}</span>
                {currentUser?.role === 'admin' && (
                  <span style={{
                    fontSize: '9.5px',
                    padding: '1px 5px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    ADMIN
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Award size={10} /> {currentUser?.karma_score || 0} karma
              </div>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>Switch</span>
        </div>
      </div>

      {/* Main Views Navigation */}
      <div className="sidebar-nav" style={{ display: 'flex', gap: '6px', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button 
          className={`nav-tab ${currentView === 'directory' ? 'active' : ''}`}
          onClick={() => setCurrentView('directory')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 8px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 500,
            border: '1px solid transparent',
            cursor: 'pointer',
            background: currentView === 'directory' ? 'var(--bg-tertiary)' : 'transparent',
            color: currentView === 'directory' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <Compass size={14} />
          <span>Boards</span>
        </button>

        <button 
          className={`nav-tab ${currentView === 'rankings' ? 'active' : ''}`}
          onClick={() => setCurrentView('rankings')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 8px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 500,
            border: '1px solid transparent',
            cursor: 'pointer',
            background: currentView === 'rankings' ? 'var(--bg-tertiary)' : 'transparent',
            color: currentView === 'rankings' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <Trophy size={14} />
          <span>Rankings</span>
        </button>
      </div>

      {/* Quick Action: Google Search */}
      <div style={{ padding: '12px 16px 8px' }}>
        <button 
          onClick={onOpenGoogleSearch}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 12px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ color: '#4285F4', fontWeight: 800 }}>G</span>
          <span>Google AI Search</span>
        </button>
      </div>

      {/* Boards Directory List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Core Boards */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 8px 6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Pin size={11} /> Core Boards
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {defaultBoards.map(b => (
              <div
                key={b.id}
                onClick={() => onSelectBoard(b.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: activeBoardId === b.id && currentView !== 'rankings' ? 'var(--bg-tertiary)' : 'transparent',
                  color: activeBoardId === b.id && currentView !== 'rankings' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: activeBoardId === b.id ? 600 : 400
                }}
                onMouseEnter={e => {
                  if (activeBoardId !== b.id) e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  if (activeBoardId !== b.id) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <MessageSquare size={13} color="var(--accent-secondary)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                </div>
                {b.thread_count > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.thread_count}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Boards */}
        {userBoards.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 8px 6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <TrendingUp size={11} /> Community Created
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {userBoards.map(b => (
                <div
                  key={b.id}
                  onClick={() => onSelectBoard(b.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: activeBoardId === b.id && currentView !== 'rankings' ? 'var(--bg-tertiary)' : 'transparent',
                    color: activeBoardId === b.id && currentView !== 'rankings' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: activeBoardId === b.id ? 600 : 400
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <MessageSquare size={13} color="var(--accent-primary)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                  </div>
                  {b.thread_count > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.thread_count}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

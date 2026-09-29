import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  MessageSquare, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Pin, 
  ArrowRight,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

export default function BoardSelectionView({
  boards,
  searchQuery,
  setSearchQuery,
  onSelectBoard,
  onOpenTipsBoard
}) {
  const defaultBoards = boards.filter(b => b.is_default === 1);
  const userBoards = boards.filter(b => b.is_default !== 1);

  return (
    <div className="board-selection-view" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid var(--border-active)',
        borderRadius: '14px',
        padding: '24px 28px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid var(--border-active)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#c084fc', marginBottom: '12px', fontWeight: 600 }}>
            <Sparkles size={13} />
            <span>AI Managed & Moderated Community</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
            Community AI Archive Boards
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
            Discover community discussions powered by Google Gemini. Ask questions with automated community analysis, perform verified Google AI searches, and cast votes to rank the best insights.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenTipsBoard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                background: 'var(--accent-gradient)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--accent-glow)'
              }}
            >
              <PlusCircle size={15} /> Propose New Board (10 Votes)
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Propose in "Tips and Suggestions" board to auto-launch after 10 community votes.
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '520px' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search community boards by name or topic..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 16px 11px 40px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '13.5px',
            outline: 'none'
          }}
        />
      </div>

      {/* Default System Boards */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Pin size={16} color="var(--accent-secondary)" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Core Community Boards
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
          {defaultBoards.map(board => (
            <div
              key={board.id}
              onClick={() => onSelectBoard(board.id)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-active)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{board.name}</h3>
                  <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-secondary)', borderRadius: '12px', fontWeight: 500 }}>
                    {board.category}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>
                  {board.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MessageSquare size={13} /> {board.thread_count || 0} threads • {board.post_count || 0} posts
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  Enter <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User-Created Boards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <TrendingUp size={16} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            User Created & Suggested Boards
          </h2>
        </div>

        {userBoards.length === 0 ? (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}>
            No user boards created yet. Propose your ideas (like Quest boards, Language learners, Book clubs) in <strong>Tips and suggestions</strong> to automatically unlock them at 10 votes!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
            {userBoards.map(board => (
              <div
                key={board.id}
                onClick={() => onSelectBoard(board.id)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-active)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{board.name}</h3>
                    <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)', borderRadius: '12px', fontWeight: 500 }}>
                      Community
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>
                    {board.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MessageSquare size={13} /> {board.thread_count || 0} threads
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    Enter <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

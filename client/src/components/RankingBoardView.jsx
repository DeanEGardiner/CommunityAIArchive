import React, { useState } from 'react';
import { 
  Trophy, 
  ThumbsUp, 
  ThumbsDown, 
  Award, 
  MessageSquare, 
  User, 
  ArrowUpRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function RankingBoardView({
  rankings,
  onSelectThread
}) {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'users'
  const { topPosts = [], topUsers = [] } = rankings || {};

  return (
    <div className="ranking-board-view" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
          }}>
            <Trophy size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Community Rankings</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Top-voted posts and highest-reputation contributors across all boards
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'posts' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'posts' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Top Posts
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'users' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Top Contributors
          </button>
        </div>
      </div>

      {/* Tab: Top Posts */}
      {activeTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topPosts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No upvoted posts yet. Vote on insightful posts to see them here!
            </div>
          ) : (
            topPosts.map((post, idx) => (
              <div
                key={post.id}
                onClick={() => onSelectThread(post.board_id, post.thread_id)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-active)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--bg-tertiary)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>

                {/* Score Pill */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  minWidth: '54px'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: post.score > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    +{post.score}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>votes</span>
                </div>

                {/* Post Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', padding: '1px 6px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)', borderRadius: '4px' }}>
                      {post.board_name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>by <strong>{post.author_name}</strong></span>
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.thread_title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.content}
                  </p>
                </div>

                <ArrowUpRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Top Contributors */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {topUsers.map((u, idx) => (
            <div
              key={u.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                  alt={u.username}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#23293e' }}
                />
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--bg-tertiary)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {idx + 1}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                  {u.username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                    <Award size={13} /> {u.karma_score} karma
                  </span>
                  <span>•</span>
                  <span>{u.post_count || 0} posts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Plus, 
  Check, 
  Award, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function UserSwitcherModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onRegisterUser
}) {
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setError(null);
    try {
      await onRegisterUser({
        username: newUsername.trim(),
        email: newEmail.trim() || undefined
      });
      setNewUsername('');
      setNewEmail('');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Community Identity & Profiles</h3>
          </div>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Switch active test user or register a new one to test posts, image uploads, voting permissions, and community karma rankings.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Profiles
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {users.map(u => {
                const isSelected = currentUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`} 
                        alt={u.username}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#23293e' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.username}
                          {u.id === 'u-community' && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-primary)', borderRadius: '4px' }}>AI Bot</span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{u.post_count || 0} posts</span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-secondary)' }}>
                            <Award size={11} /> {u.karma_score || 0} karma
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--accent-secondary)" />}
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleRegister} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Self-Service Registration (Testing)
            </span>
            {error && <div style={{ color: 'var(--error)', fontSize: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Username (e.g. Maya)"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
              <button 
                type="submit"
                style={{
                  padding: '8px 14px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Add User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

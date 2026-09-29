import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  LogIn, 
  UserPlus, 
  Lock, 
  Check, 
  Award, 
  KeyRound, 
  AlertCircle
} from 'lucide-react';

export default function UserAuthModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onLogin,
  onRegister,
  onQuickSwitch
}) {
  const [tab, setTab] = useState('switch'); // Default directly to Profiles tab for easy switching
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setUsername('');
      setPassword('');
      setEmail('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onLogin({ username: username.trim(), password: password.trim() });
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onRegister({
        username: username.trim(),
        password: password.trim(),
        email: email.trim() || undefined
      });
      setSuccessMsg('Registered and logged in successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Community User Authentication</h3>
          </div>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 20px',
          background: 'var(--bg-secondary)'
        }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              padding: '12px 6px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === 'login' ? 'var(--accent-primary)' : 'transparent'}`,
              color: tab === 'login' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <LogIn size={14} /> Log In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              padding: '12px 6px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === 'register' ? 'var(--accent-primary)' : 'transparent'}`,
              color: tab === 'register' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={14} /> Register
          </button>
          <button
            type="button"
            onClick={() => { setTab('switch'); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              padding: '12px 6px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === 'switch' ? 'var(--accent-primary)' : 'transparent'}`,
              color: tab === 'switch' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <User size={14} /> Profiles
            {users && users.length > 0 && (
              <span style={{
                fontSize: '10.5px',
                padding: '1px 6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                color: tab === 'switch' ? '#fff' : 'var(--text-muted)'
              }}>
                {users.length}
              </span>
            )}
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '12.5px'
            }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#34d399',
              fontSize: '12.5px'
            }}>
              <Check size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0 12px' }}>
                  <User size={15} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="e.g. Dean, Alex M, Sarah K"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0 12px' }}>
                  <Lock size={15} color="var(--text-muted)" />
                  <input
                    type="password"
                    placeholder="Enter password (default: password123)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Demo profiles (Dean, Alex M, Sarah K) use password: <code>password123</code>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Choose Username</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0 12px' }}>
                  <User size={15} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="e.g. Maya, Jordan, Taylor"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Create Password</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0 12px' }}>
                  <Lock size={15} color="var(--text-muted)" />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. user@community.local"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Creating Account...' : 'Register Account'}
              </button>
            </form>
          )}

          {/* TAB 3: PROFILES QUICK SWITCH */}
          {tab === 'switch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Click on any profile below to quick-switch your active user for testing:
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {users.length} profiles
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                {users.map(u => {
                  const isSelected = currentUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        onQuickSwitch(u);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
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
                            {u.role === 'admin' && (
                              <span style={{ fontSize: '10px', padding: '1px 6px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontWeight: 700 }}>
                                Admin
                              </span>
                            )}
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
          )}
        </div>
      </div>
    </div>
  );
}

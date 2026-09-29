import React, { useState } from 'react';
import { 
  PlusCircle, 
  MessageSquare, 
  Clock, 
  ThumbsUp, 
  Sparkles, 
  Globe, 
  Paperclip, 
  ArrowLeft,
  Image as ImageIcon,
  X,
  Compass,
  User,
  Lock
} from 'lucide-react';
import { api } from '../api';

export default function BoardDetailView({
  board,
  threads,
  onSelectThread,
  onBackToDirectory,
  onCreateThread,
  currentUser
}) {
  const [isCreatingThread, setIsCreatingThread] = useState(() => window.location.hash.includes('create=1'));
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadMode, setNewThreadMode] = useState('standard');
  const [attachedImage, setAttachedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = React.useRef(null);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const data = await api.uploadImage(file);
      setAttachedImage(data);
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newThreadContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onCreateThread({
        content: newThreadContent.trim(),
        mode: newThreadMode,
        attachment: attachedImage
      });
      setNewThreadContent('');
      setAttachedImage(null);
      setIsCreatingThread(false);
    } catch (err) {
      alert('Failed to create thread: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="board-detail-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Board Header Banner */}
      <div style={{
        padding: '20px 28px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToDirectory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <ArrowLeft size={14} /> Boards
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{board.name}</h1>
              <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-secondary)', borderRadius: '12px' }}>
                {board.category}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '650px' }}>
              {board.description}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingThread(!isCreatingThread)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            background: 'var(--accent-gradient)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '13px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--accent-glow)'
          }}
        >
          <PlusCircle size={15} /> Start New Discussion
        </button>
      </div>

      {/* New Thread Composer Modal / Collapse */}
      {isCreatingThread && (
        <div style={{
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-active)',
          padding: '20px 28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="var(--accent-primary)" />
              <span>Create New Thread (First line will become the thread title)</span>
            </div>
            <button
              onClick={() => setIsCreatingThread(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit}>
            <textarea
              placeholder={`Write your post or inquiry here as ${currentUser?.username || 'user'}...\nFirst line becomes thread title.`}
              value={newThreadContent}
              onChange={e => setNewThreadContent(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                marginBottom: '10px'
              }}
            />

            {attachedImage && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <ImageIcon size={14} color="var(--accent-secondary)" />
                <span>{attachedImage.file_name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: attachedImage ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  <Paperclip size={14} /> Attach Image
                </button>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setNewThreadMode('standard')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: newThreadMode === 'standard' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      background: newThreadMode === 'standard' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      color: newThreadMode === 'standard' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Post As Is
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewThreadMode('ai_analysis')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: newThreadMode === 'ai_analysis' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      background: newThreadMode === 'ai_analysis' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      color: newThreadMode === 'ai_analysis' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={12} color="var(--accent-primary)" />
                    Post + AI Analysis
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewThreadMode('google_search')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: newThreadMode === 'google_search' ? '#4285F4' : 'var(--border-subtle)',
                      background: newThreadMode === 'google_search' ? 'rgba(66, 133, 244, 0.2)' : 'transparent',
                      color: newThreadMode === 'google_search' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Globe size={12} color="#4285F4" />
                    Post + Google Search
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!newThreadContent.trim() || submitting}
                style={{
                  padding: '8px 18px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: (!newThreadContent.trim() || submitting) ? 0.6 : 1
                }}
              >
                {submitting ? (
                  <>
                    <Sparkles size={14} className="spin-icon" />
                    <span>Processing...</span>
                  </>
                ) : (
                  'Create Thread'
                )}
              </button>
            </div>

            {submitting && (
              <div
                className={newThreadMode === 'google_search' ? 'search-processing-card' : newThreadMode === 'ai_analysis' ? 'ai-processing-card' : ''}
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: newThreadMode === 'google_search' ? '#4285F4' : 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  {newThreadMode === 'google_search' ? <Globe size={15} className="spin-icon" /> : <Sparkles size={15} className="spin-icon" />}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {newThreadMode === 'google_search' ? 'Querying Google Search AI...' : newThreadMode === 'ai_analysis' ? 'Synthesizing Community Archive with Gemini 3.8 Flash...' : 'Creating discussion...'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {newThreadMode === 'google_search' ? 'Retrieving live web grounding sources and generating overview...' : 'Analyzing board history to respond to post questions...'}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Threads List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {threads.length === 0 ? (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '12px',
            padding: '36px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <MessageSquare size={28} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '6px' }}>No discussions in this board yet</h3>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>Be the first to ask a question, start a topic, or propose an idea!</p>
            <button
              onClick={() => setIsCreatingThread(true)}
              style={{
                padding: '8px 16px',
                background: 'var(--accent-gradient)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Start First Discussion
            </button>
          </div>
        ) : (
          threads.map(t => (
            <div
              key={t.id}
              onClick={() => onSelectThread(t.id)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-active)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    by <strong>{t.creator_name || 'Anonymous'}</strong>
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    {t.title}
                  </h3>
                  {t.is_locked ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '1px 7px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#fca5a5',
                      fontWeight: 600
                    }}>
                      <Lock size={10} /> Closed
                    </span>
                  ) : null}
                </div>
                {t.first_post_content && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.first_post_content}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--bg-tertiary)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)'
                }}>
                  <MessageSquare size={13} color="var(--accent-secondary)" />
                  <span>{t.post_count || 1} posts</span>
                </div>

                {t.root_score !== undefined && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: t.root_score > 0 ? 'var(--success)' : 'var(--text-muted)'
                  }}>
                    <ThumbsUp size={13} />
                    <span>{t.root_score}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Globe, 
  Paperclip, 
  ThumbsUp, 
  ThumbsDown, 
  Bot, 
  User, 
  Clock, 
  Image as ImageIcon,
  Check,
  X,
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Reply,
  CornerDownRight,
  Pencil,
  Trash2,
  Shield,
  ExternalLink,
  Lock,
  Unlock
} from 'lucide-react';
import { api } from '../api';

export default function ThreadView({
  board,
  thread,
  posts,
  currentUser,
  onBackToBoard,
  onNavigateToBoard,
  onNewPost,
  onEditPost,
  onDeletePost,
  onVotePost,
  onLockThread,
  onOpenGoogleSearch
}) {
  const [inputText, setInputText] = useState('');
  const [postMode, setPostMode] = useState('standard'); // 'standard' | 'ai_analysis' | 'google_search'
  const [attachedImage, setAttachedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVotes, setUserVotes] = useState({}); // postId -> 1 | -1 | 0
  const [replyingTo, setReplyingTo] = useState(null); // { id, author_name, content }
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevPostCountRef = useRef(posts?.length || 0);
  const initialThreadIdRef = useRef(null);

  // Scroll to bottom ONLY on initial thread open or when a brand-new post/reply is added
  useEffect(() => {
    const isNewThreadOpened = initialThreadIdRef.current !== thread?.id;
    const isBrandNewPostAdded = (posts?.length || 0) > prevPostCountRef.current;

    if (isNewThreadOpened) {
      initialThreadIdRef.current = thread?.id;
      prevPostCountRef.current = posts?.length || 0;
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else if (isBrandNewPostAdded) {
      prevPostCountRef.current = posts?.length || 0;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Just keep count updated (e.g. if posts were deleted or edited, do NOT scroll)
      prevPostCountRef.current = posts?.length || 0;
    }
  }, [posts, thread?.id]);

  // Adjust textarea dynamic height
  const handleTextChange = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

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

  const handleSubmit = async () => {
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onNewPost({
        content: inputText.trim(),
        mode: postMode,
        attachment: attachedImage,
        parentPostId: replyingTo?.id || null
      });
      setInputText('');
      setAttachedImage(null);
      setReplyingTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      alert('Error submitting post: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (post) => {
    setEditingPostId(post.id);
    setEditingContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (postId) => {
    if (!editingContent.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      if (onEditPost) {
        await onEditPost(postId, editingContent.trim());
      }
      setEditingPostId(null);
    } catch (err) {
      alert('Failed to save edit: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStartReply = (post) => {
    setReplyingTo(post);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  /**
   * Parse text and render clickable markdown hyperlinks [label](url), plain URLs,
   * and dedicated Citation Source Cards matching the Personal AI Archive design.
   */
  const renderFormattedContent = (content, postType) => {
    if (!content) return null;

    // Check if content has a Sources & Citations section
    const sourcesMarker = '**Sources & Citations:**';
    const hasSources = content.includes(sourcesMarker);

    let bodyText = content;
    let sourcesText = '';

    if (hasSources) {
      const parts = content.split(sourcesMarker);
      bodyText = parts[0].trim();
      sourcesText = parts.slice(1).join(sourcesMarker).trim();
    }

    // Extract citation links from sourcesText: - [Title](url)
    const sourcesList = [];
    if (sourcesText) {
      const linkRegex = /-\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      let m;
      while ((m = linkRegex.exec(sourcesText)) !== null) {
        sourcesList.push({
          title: m[1],
          url: m[2]
        });
      }
    }

    // Helper to format inline markdown links in the body
    const renderInlineLinks = (text) => {
      const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = markdownLinkRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            value: text.slice(lastIndex, match.index)
          });
        }
        parts.push({
          type: 'link',
          label: match[1],
          url: match[2]
        });
        lastIndex = markdownLinkRegex.lastIndex;
      }

      if (lastIndex < text.length) {
        parts.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }

      return parts.map((part, i) => {
        if (part.type === 'link') {
          const isInternalBoardLink = part.url.startsWith('#board-');
          if (isInternalBoardLink && onNavigateToBoard) {
            const targetBoardId = part.url.replace('#board-', '');
            return (
              <button
                key={i}
                type="button"
                onClick={() => onNavigateToBoard(targetBoardId)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#fff',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  margin: '0 4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(139, 92, 246, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                title={`Open the ${part.label} board`}
              >
                <span>{part.label}</span>
                <CornerDownRight size={12} />
              </button>
            );
          }

          return (
            <a
              key={i}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#60a5fa',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '1px 7px',
                borderRadius: '5px',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '13px',
                margin: '0 2px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                e.currentTarget.style.color = '#93c5fd';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.color = '#60a5fa';
              }}
              title={part.url}
            >
              <span>{part.label}</span>
              <ExternalLink size={11} style={{ opacity: 0.85 }} />
            </a>
          );
        }

        // Plain text segments: autolink raw URLs
        const rawUrlRegex = /(https?:\/\/[^\s]+)/g;
        const subParts = part.value.split(rawUrlRegex);
        return subParts.map((sub, j) => {
          if (/^https?:\/\//.test(sub)) {
            return (
              <a
                key={`${i}-${j}`}
                href={sub}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#60a5fa',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '1px 7px',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '13px',
                  margin: '0 2px'
                }}
                title={sub}
              >
                <span>{sub.length > 40 ? sub.slice(0, 38) + '...' : sub}</span>
                <ExternalLink size={11} style={{ opacity: 0.85 }} />
              </a>
            );
          }
          return <span key={`${i}-${j}`}>{sub}</span>;
        });
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Main Body Text with inline clickable hyperlinks */}
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.65' }}>
          {renderInlineLinks(bodyText)}
        </div>

        {/* Structured Citations & Web Sources Grid (Personal AI Archive Style) */}
        {sourcesList.length > 0 && (
          <div style={{
            marginTop: '4px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Globe size={13} color="#4285F4" />
              <span>Verified Web Citations & Sources ({sourcesList.length})</span>
            </div>

            <div className="google-sources-grid">
              {sourcesList.map((s, idx) => {
                let domain = '';
                try {
                  domain = new URL(s.url).hostname.replace('www.', '');
                } catch (e) {
                  domain = s.title;
                }

                return (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="google-source-card"
                    title={s.url}
                  >
                    <span className="source-index">{idx + 1}</span>
                    <div className="source-info">
                      <span className="source-title">{s.title}</span>
                      <span className="source-url">{domain}</span>
                    </div>
                    <ExternalLink size={12} className="source-ext-icon" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleVote = async (postId, direction) => {
    if (!currentUser?.id) return;
    try {
      const res = await onVotePost(postId, direction);
      setUserVotes(prev => ({
        ...prev,
        [postId]: res.userVote
      }));
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Admin flag at the component level (used in header + renderPostNode)
  const isAdmin = currentUser?.role === 'admin';

  // Build hierarchical post tree so replies appear directly beneath their parent post
  const buildPostTree = (postList) => {
    const postMap = {};
    const roots = [];

    // Initialize map
    postList.forEach(p => {
      postMap[p.id] = { ...p, replies: [] };
    });

    // Populate tree hierarchy
    postList.forEach(p => {
      if (p.parent_post_id && postMap[p.parent_post_id]) {
        postMap[p.parent_post_id].replies.push(postMap[p.id]);
      } else {
        roots.push(postMap[p.id]);
      }
    });

    return roots;
  };

  const postTree = buildPostTree(posts);

  // Recursive component to render a post and its nested replies directly underneath
  const renderPostNode = (post, depth = 0) => {
    const isAI = post.post_type === 'ai_analysis' || post.post_type === 'google_search';
    const voteVal = userVotes[post.id] ?? 0;
    const isChild = depth > 0;
    const isAuthor = currentUser?.id === post.user_id;
    const isAdmin = currentUser?.role === 'admin';
    const canDelete = isAuthor || isAdmin;
    const isEditingThisPost = editingPostId === post.id;
    const wasEdited = post.updated_at && post.updated_at !== post.created_at;

    const handleDelete = async () => {
      const confirmMsg = isAdmin && !isAuthor
        ? `Are you sure you want to delete @${post.author_name}'s post as a Board Administrator?`
        : 'Are you sure you want to delete this post?';
      if (window.confirm(confirmMsg)) {
        if (onDeletePost) {
          await onDeletePost(post.id);
        }
      }
    };

    return (
      <div key={post.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            gap: '14px',
            marginLeft: isChild ? `${Math.min(depth * 32, 96)}px` : '0px',
            background: isAI ? 'rgba(139, 92, 246, 0.05)' : isChild ? 'rgba(26, 30, 46, 0.9)' : 'var(--bg-card)',
            border: `1px solid ${isAI ? 'rgba(139, 92, 246, 0.35)' : isChild ? 'var(--border-active)' : 'var(--border-subtle)'}`,
            borderRadius: '12px',
            padding: '16px 18px',
            position: 'relative',
            boxShadow: isChild ? '0 4px 12px rgba(0, 0, 0, 0.25)' : 'none'
          }}
        >
          {/* Thread Connector Line indicator for replies */}
          {isChild && (
            <div style={{
              position: 'absolute',
              left: '-18px',
              top: '20px',
              width: '12px',
              height: '2px',
              background: 'var(--border-active)'
            }} />
          )}

          {/* Voting Column for User Posts (AI posts have NO voting per specifications) */}
          {!isAI ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '2px' }}>
              <button
                onClick={() => !thread?.is_locked && handleVote(post.id, 1)}
                disabled={Boolean(thread?.is_locked)}
                style={{
                  background: voteVal === 1 ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  border: 'none',
                  color: thread?.is_locked ? 'var(--text-muted)' : (voteVal === 1 ? 'var(--success)' : 'var(--text-muted)'),
                  cursor: thread?.is_locked ? 'not-allowed' : 'pointer',
                  opacity: thread?.is_locked ? 0.45 : 1,
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={thread?.is_locked ? "Thread locked: Voting is closed" : (isAdmin ? "Admin Upvote (+1 each click)" : "Upvote (+1)")}
              >
                <ThumbsUp size={15} />
              </button>
              <span style={{ fontSize: '13px', fontWeight: 700, color: post.score > 0 ? 'var(--success)' : post.score < 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                {post.score}
              </span>
              <button
                onClick={() => !thread?.is_locked && handleVote(post.id, -1)}
                disabled={Boolean(thread?.is_locked)}
                style={{
                  background: voteVal === -1 ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  border: 'none',
                  color: thread?.is_locked ? 'var(--text-muted)' : (voteVal === -1 ? 'var(--error)' : 'var(--text-muted)'),
                  cursor: thread?.is_locked ? 'not-allowed' : 'pointer',
                  opacity: thread?.is_locked ? 0.45 : 1,
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={thread?.is_locked ? "Thread locked: Voting is closed" : (isAdmin ? "Admin Downvote (-1 each click)" : "Downvote (-1)")}
              >
                <ThumbsDown size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: post.post_type === 'google_search' ? '#4285F4' : 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                {post.post_type === 'google_search' ? <Globe size={16} /> : <Bot size={16} />}
              </div>
            </div>
          )}

          {/* Post Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Replying-To Reference Chip */}
            {post.parent_author_name && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                background: isAI ? (post.post_type === 'google_search' ? 'rgba(66, 133, 244, 0.12)' : 'rgba(139, 92, 246, 0.12)') : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isAI ? (post.post_type === 'google_search' ? 'rgba(66, 133, 244, 0.35)' : 'rgba(139, 92, 246, 0.35)') : 'var(--border-subtle)'}`,
                borderRadius: '6px',
                fontSize: '11px',
                color: isAI ? '#fff' : 'var(--text-muted)',
                marginBottom: '6px'
              }}>
                <CornerDownRight size={11} color={post.post_type === 'google_search' ? '#60a5fa' : 'var(--accent-secondary)'} />
                <span>
                  {isAI
                    ? (post.post_type === 'google_search' ? 'Google Search AI answer for' : 'Community AI Analysis for')
                    : 'Replying directly to'}{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>@{post.parent_author_name}</strong>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>
                  {post.author_name}
                </span>
                {isAI && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    background: post.post_type === 'google_search' ? 'rgba(66, 133, 244, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                    color: post.post_type === 'google_search' ? '#60a5fa' : 'var(--accent-primary)',
                    borderRadius: '4px'
                  }}>
                    {post.post_type === 'google_search' ? 'GOOGLE AI SEARCH' : 'COMMUNITY AI ANALYSIS'}
                  </span>
                )}
                {wasEdited && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    (edited)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Edit post button: only available for original author on user posts */}
                {isAuthor && !isAI && !isEditingThisPost && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(post)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    title="Edit your post"
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                )}

                {/* Delete post button: available for original author OR board administrator */}
                {canDelete && !isEditingThisPost && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      background: isAdmin && !isAuthor ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                      border: `1px solid ${isAdmin && !isAuthor ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                      borderRadius: '6px',
                      color: isAdmin && !isAuthor ? '#fca5a5' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--error)';
                      e.currentTarget.style.color = 'var(--error)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isAdmin && !isAuthor ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)';
                      e.currentTarget.style.color = isAdmin && !isAuthor ? '#fca5a5' : 'var(--text-secondary)';
                    }}
                    title={isAdmin && !isAuthor ? 'Delete post (Board Administrator)' : 'Delete your post'}
                  >
                    <Trash2 size={12} />
                    <span>Delete{isAdmin && !isAuthor ? ' (Admin)' : ''}</span>
                  </button>
                )}

                {/* Reply to this post button (disabled when thread is locked) */}
                {!thread?.is_locked && (
                  <button
                    type="button"
                    onClick={() => handleStartReply(post)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    title="Reply directly under this post"
                  >
                    <Reply size={12} />
                    <span>Reply</span>
                  </button>
                )}
              </div>
            </div>

            {/* Text Body or Inline Editor */}
            {isEditingThisPost ? (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  disabled={isSavingEdit}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSavingEdit}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(post.id)}
                    disabled={isSavingEdit || !editingContent.trim()}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--accent-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isSavingEdit || !editingContent.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSavingEdit || !editingContent.trim() ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Edit'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {renderFormattedContent(post.content, post.post_type)}
              </div>
            )}

            {/* Attachments / Images */}
            {post.attachments && post.attachments.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {post.attachments.map(att => (
                  <a key={att.id} href={att.file_path} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <img
                      src={att.file_path}
                      alt={att.file_name}
                      style={{
                        maxWidth: '320px',
                        maxHeight: '220px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        objectFit: 'cover',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nested replies rendered directly under this post */}
        {post.replies && post.replies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
            {post.replies.map(replyPost => renderPostNode(replyPost, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="thread-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Thread Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToBoard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-secondary)' }}>
              <span>{board?.name}</span>
              <span>/</span>
              <span>Thread #{thread?.id?.slice(0, 8)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', maxWidth: '600px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {thread?.title}
              </h1>
              {thread?.is_locked ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#fca5a5',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  <Lock size={11} /> {thread?.locked_target_board_id ? 'Locked (Board Created)' : 'Locked'}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Admin manual lock/unlock toggle */}
          {isAdmin && (
            <button
              onClick={() => {
                const nextState = !thread?.is_locked;
                const confirmMsg = nextState
                  ? 'Are you sure you want to manually lock this thread? Community members will not be able to reply or vote.'
                  : 'Are you sure you want to unlock this thread?';
                if (window.confirm(confirmMsg)) {
                  onLockThread && onLockThread(thread.id, nextState);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: thread?.is_locked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${thread?.is_locked ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                borderRadius: '8px',
                color: thread?.is_locked ? '#6ee7b7' : '#fca5a5',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={thread?.is_locked ? 'Unlock this thread (Admin)' : 'Lock this thread (Admin)'}
            >
              {thread?.is_locked ? <Unlock size={13} /> : <Lock size={13} />}
              <span>{thread?.is_locked ? 'Unlock Thread' : 'Lock Thread'}</span>
            </button>
          )}

          <button
            onClick={onOpenGoogleSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            <span style={{ color: '#4285F4', fontWeight: 700 }}>G</span>
            <span>Google AI Search</span>
          </button>
        </div>
      </div>

      {/* Posts Message Stream with Direct Nested Replies */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {postTree.map((rootPost) => renderPostNode(rootPost, 0))}

        {isSubmitting && (
          <div
            className={postMode === 'google_search' ? 'search-processing-card' : postMode === 'ai_analysis' ? 'ai-processing-card' : ''}
            style={{
              display: 'flex',
              gap: '16px',
              background: postMode === 'google_search' ? 'rgba(66, 133, 244, 0.08)' : 'rgba(139, 92, 246, 0.08)',
              border: `1px solid ${postMode === 'google_search' ? 'rgba(66, 133, 244, 0.5)' : 'rgba(139, 92, 246, 0.5)'}`,
              borderRadius: '12px',
              padding: '20px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: postMode === 'google_search' ? '#4285F4' : 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: postMode === 'google_search' ? '0 0 15px rgba(66, 133, 244, 0.5)' : 'var(--accent-glow)'
              }}>
                {postMode === 'google_search' ? <Globe size={18} className="spin-icon" /> : <Sparkles size={18} className="spin-icon" />}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  {postMode === 'google_search' ? 'Google Search AI' : 'Community AI (Gemini)'}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  background: postMode === 'google_search' ? 'rgba(66, 133, 244, 0.25)' : 'rgba(139, 92, 246, 0.25)',
                  color: postMode === 'google_search' ? '#93c5fd' : '#c084fc',
                  borderRadius: '12px'
                }}>
                  {postMode === 'google_search' ? 'GROUNDING WITH LIVE WEB' : 'SYNTHESIZING COMMUNITY FORUMS'}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} className="spin-icon" color={postMode === 'google_search' ? '#60a5fa' : 'var(--accent-secondary)'} />
                <span>
                  {postMode === 'google_search'
                    ? 'Connecting to Google Search to retrieve live facts, web summaries, and citations...'
                    : 'Cross-referencing discussion threads and historical boards with Gemini 3.8 Flash...'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-shimmer" style={{ height: '14px', width: '92%' }}></div>
                <div className="skeleton-shimmer" style={{ height: '14px', width: '78%' }}></div>
                <div className="skeleton-shimmer" style={{ height: '14px', width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Triple-Action Composer Toolbar or Locked Thread Banner */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        {thread?.is_locked ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                flexShrink: 0
              }}>
                <Lock size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 3px 0' }}>
                  {thread?.locked_target_board_id ? 'This Suggestion Thread is Locked' : 'This Thread is Locked'}
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {thread?.locked_target_board_id
                    ? 'This proposal reached consensus with 10+ votes and has graduated into a full board. Voting and new responses are now closed.'
                    : 'This discussion has been locked by a board administrator. New responses and voting are currently closed.'}
                </p>
              </div>
            </div>

            {thread?.locked_target_board_id && (
              <button
                type="button"
                onClick={() => onNavigateToBoard && onNavigateToBoard(thread.locked_target_board_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                  flexShrink: 0
                }}
              >
                <span>Visit {thread.locked_target_board_name ? `"${thread.locked_target_board_name}" Board` : 'New Board'}</span>
                <CornerDownRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Active Reply Banner if replying to a specific post */}
            {replyingTo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            background: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid var(--border-active)',
            borderRadius: '8px',
            marginBottom: '10px',
            fontSize: '12.5px',
            color: 'var(--text-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
              <Reply size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <span style={{ flexShrink: 0 }}>Replying directly under <strong style={{ color: '#fff' }}>@{replyingTo.author_name}</strong>'s post:</span>
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px', fontStyle: 'italic' }}>
                "{replyingTo.content}"
              </span>
              {replyingTo.attachments && replyingTo.attachments.length > 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: 'rgba(139, 92, 246, 0.25)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#c084fc',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  <ImageIcon size={11} />
                  <span>AI includes @{replyingTo.author_name}'s photo</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              title="Cancel reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Attachment preview if any */}
        {attachedImage && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            marginBottom: '10px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <ImageIcon size={14} color="var(--accent-secondary)" />
            <span>{attachedImage.file_name}</span>
            <button
              onClick={() => setAttachedImage(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Input box */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '8px 12px',
          alignItems: 'flex-end',
          gap: '8px'
        }}>
          <textarea
            ref={textareaRef}
            placeholder={replyingTo ? `Write reply directly to @${replyingTo.author_name}...` : `Reply to thread as ${currentUser?.username || 'user'}...`}
            value={inputText}
            onChange={handleTextChange}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.5',
              maxHeight: '160px'
            }}
          />

          {/* Hidden image input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {/* Attach image button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            style={{
              background: 'transparent',
              border: 'none',
              color: attachedImage ? 'var(--accent-secondary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
            title="Upload and embed image"
          >
            <Paperclip size={18} />
          </button>
        </div>

        {/* Triple Action Selector & Submit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Submission Mode:</span>
            <button
              type="button"
              onClick={() => setPostMode('standard')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: postMode === 'standard' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                background: postMode === 'standard' ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-tertiary)',
                color: postMode === 'standard' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              1. Just Post As Is
            </button>
            <button
              type="button"
              onClick={() => setPostMode('ai_analysis')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: postMode === 'ai_analysis' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                background: postMode === 'ai_analysis' ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-tertiary)',
                color: postMode === 'ai_analysis' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Sparkles size={13} color="var(--accent-primary)" />
              2. Post & AI Board Analysis
            </button>
            <button
              type="button"
              onClick={() => setPostMode('google_search')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: postMode === 'google_search' ? '#4285F4' : 'var(--border-subtle)',
                background: postMode === 'google_search' ? 'rgba(66, 133, 244, 0.2)' : 'var(--bg-tertiary)',
                color: postMode === 'google_search' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Globe size={13} color="#4285F4" />
              3. Post & Google AI Search
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isSubmitting}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'var(--accent-gradient)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: (!inputText.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
              opacity: (!inputText.trim() || isSubmitting) ? 0.6 : 1
            }}
          >
            <Send size={14} /> Send Post
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

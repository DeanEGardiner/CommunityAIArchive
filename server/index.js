require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const { db, MEDIA_DIR } = require('./db');
const geminiProvider = require('./providers');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve uploaded media files
app.use('/media', express.static(MEDIA_DIR));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MEDIA_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `img-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// -------------------------------------------------------------
// Health & Settings
// -------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const health = await geminiProvider.checkHealth();
    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) {
    if (r.key === 'gemini_api_key') {
      const val = r.value || '';
      // Mask key: return whether it is configured and a safe preview only
      settings.gemini_api_key_configured = val.trim().length > 0;
      settings.gemini_api_key_masked = val.trim().length > 8 
        ? `${val.slice(0, 4)}••••••••••••••••••••••••${val.slice(-4)}`
        : (val ? '••••••••' : '');
    } else {
      settings[r.key] = r.value;
    }
  }
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const updates = req.body;
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  db.transaction(() => {
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined && v !== null) {
        upsert.run(k, String(v).trim());
      }
    }
  })();
  res.json({ success: true });
});

// -------------------------------------------------------------
// User Management & Authentication (Registration & Login)
// -------------------------------------------------------------
app.get('/api/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.role, u.email, u.avatar_url, u.karma_score, u.created_at,
      (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_deleted = 0) as post_count
    FROM users u 
    ORDER BY u.karma_score DESC
  `).all();
  res.json(users);
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, email, avatar_url, role = 'user' } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
  if (existing) {
    return res.status(409).json({ error: 'Username is already taken' });
  }

  const id = 'u-' + uuidv4().slice(0, 8);
  const avatar = avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username.trim())}`;
  
  db.prepare(`
    INSERT INTO users (id, username, password_hash, role, email, avatar_url, karma_score)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, username.trim(), password.trim(), role, email || `${username.trim().toLowerCase()}@community.local`, avatar);

  const newUser = db.prepare('SELECT id, username, role, email, avatar_url, karma_score, created_at FROM users WHERE id = ?').get(id);
  res.json({
    user: newUser,
    message: 'Registered successfully'
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
  if (!user) {
    return res.status(401).json({ error: 'User does not exist. Please register first.' });
  }

  // Simple direct match for testing
  if (user.password_hash !== password.trim()) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const { password_hash, ...safeUser } = user;
  res.json({
    user: safeUser,
    message: 'Logged in successfully'
  });
});

// Legacy backward-compatible endpoint
app.post('/api/users', (req, res) => {
  const { username, password, email, avatar_url, role = 'user' } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const existing = db.prepare('SELECT id, username, role, email, avatar_url, karma_score FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
  if (existing) {
    return res.json(existing);
  }

  const id = 'u-' + uuidv4().slice(0, 8);
  const avatar = avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username.trim())}`;
  const pass = password ? password.trim() : 'password123';
  
  db.prepare(`
    INSERT INTO users (id, username, password_hash, role, email, avatar_url, karma_score)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, username.trim(), pass, role, email || `${username.trim().toLowerCase()}@community.local`, avatar);

  const newUser = db.prepare('SELECT id, username, role, email, avatar_url, karma_score FROM users WHERE id = ?').get(id);
  res.json(newUser);
});

// -------------------------------------------------------------
// Boards Endpoints
// -------------------------------------------------------------
app.get('/api/boards', (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT b.*,
      (SELECT COUNT(*) FROM threads WHERE board_id = b.id AND is_deleted = 0) as thread_count,
      (SELECT COUNT(*) FROM posts p JOIN threads t ON p.thread_id = t.id WHERE t.board_id = b.id AND p.is_deleted = 0 AND p.is_spam_hidden = 0) as post_count,
      (SELECT title FROM threads WHERE board_id = b.id AND is_deleted = 0 ORDER BY updated_at DESC LIMIT 1) as latest_thread_title,
      (SELECT updated_at FROM threads WHERE board_id = b.id AND is_deleted = 0 ORDER BY updated_at DESC LIMIT 1) as last_activity
    FROM boards b
    WHERE b.is_deleted = 0
  `;
  const params = [];

  if (search && search.trim()) {
    query += ` AND (b.name LIKE ? OR b.description LIKE ?)`;
    const s = `%${search.trim()}%`;
    params.push(s, s);
  }

  query += ` ORDER BY b.is_default DESC, thread_count DESC, b.name ASC`;
  const boards = db.prepare(query).all(...params);
  res.json(boards);
});

app.get('/api/boards/:id', (req, res) => {
  const { id } = req.params;
  const board = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM threads WHERE board_id = b.id AND is_deleted = 0) as thread_count,
      (SELECT COUNT(*) FROM posts p JOIN threads t ON p.thread_id = t.id WHERE t.board_id = b.id AND p.is_deleted = 0 AND p.is_spam_hidden = 0) as post_count
    FROM boards b
    WHERE b.id = ? AND b.is_deleted = 0
  `).get(id);

  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board);
});

// -------------------------------------------------------------
// Threads Endpoints
// -------------------------------------------------------------
app.get('/api/boards/:id/threads', (req, res) => {
  const { id } = req.params;
  const threads = db.prepare(`
    SELECT t.*, u.username as creator_name, u.avatar_url as creator_avatar,
      (SELECT COUNT(*) FROM posts WHERE thread_id = t.id AND is_deleted = 0 AND is_spam_hidden = 0) as post_count,
      (SELECT content FROM posts WHERE thread_id = t.id AND is_deleted = 0 AND is_spam_hidden = 0 ORDER BY created_at ASC LIMIT 1) as first_post_content,
      (SELECT content FROM posts WHERE thread_id = t.id AND is_deleted = 0 AND is_spam_hidden = 0 ORDER BY created_at DESC LIMIT 1) as latest_post_content,
      (SELECT score FROM posts WHERE thread_id = t.id AND is_deleted = 0 ORDER BY created_at ASC LIMIT 1) as root_score
    FROM threads t
    LEFT JOIN users u ON t.creator_id = u.id
    WHERE t.board_id = ? AND t.is_deleted = 0
    ORDER BY t.updated_at DESC
  `).all(id);

  res.json(threads);
});

app.get('/api/threads/:id', (req, res) => {
  const { id } = req.params;
  const thread = db.prepare(`
    SELECT t.*, b.name as board_name, b.id as board_id, 
      target_b.name as locked_target_board_name,
      u.username as creator_name, u.avatar_url as creator_avatar
    FROM threads t
    JOIN boards b ON t.board_id = b.id
    LEFT JOIN boards target_b ON t.locked_target_board_id = target_b.id
    LEFT JOIN users u ON t.creator_id = u.id
    WHERE t.id = ? AND t.is_deleted = 0
  `).get(id);

  if (!thread) return res.status(404).json({ error: 'Thread not found' });

  // Get all active posts with parent post reference if replying
  const posts = db.prepare(`
    SELECT p.*, u.avatar_url as author_avatar,
      parent.author_name as parent_author_name,
      parent.content as parent_content_snippet
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN posts parent ON p.parent_post_id = parent.id
    WHERE p.thread_id = ? AND p.is_deleted = 0 AND p.is_spam_hidden = 0
    ORDER BY p.created_at ASC
  `).all(id);

  // Attach attachments to posts
  const postIds = posts.map(p => p.id);
  let attachmentsByPost = {};
  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');
    const attachments = db.prepare(`SELECT * FROM attachments WHERE post_id IN (${placeholders})`).all(...postIds);
    for (const att of attachments) {
      if (!attachmentsByPost[att.post_id]) attachmentsByPost[att.post_id] = [];
      attachmentsByPost[att.post_id].push(att);
    }
  }

  const postsWithAttachments = posts.map(p => ({
    ...p,
    attachments: attachmentsByPost[p.id] || []
  }));

  res.json({
    ...thread,
    posts: postsWithAttachments
  });
});

// -------------------------------------------------------------
// Image Attachment Upload
// -------------------------------------------------------------
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const fileUrl = `/media/${req.file.filename}`;
  res.json({
    file_name: req.file.originalname,
    file_path: fileUrl,
    mime_type: req.file.mimetype,
    file_size: req.file.size
  });
});

// -------------------------------------------------------------
// Thread Creation & Triple-Action Post Submission
// -------------------------------------------------------------
app.post('/api/boards/:id/threads', async (req, res) => {
  const { id: boardId } = req.params;
  const { userId, authorName, content, mode = 'standard', attachment } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }

  const board = db.prepare('SELECT * FROM boards WHERE id = ? AND is_deleted = 0').get(boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  // "The first post in a thread becomes the title of the thread"
  const cleanContent = content.trim();
  const firstLine = cleanContent.split('\n')[0].trim();
  const threadTitle = firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;

  const threadId = 't-' + uuidv4().slice(0, 10);
  const postId = 'p-' + uuidv4().slice(0, 10);
  const now = new Date().toISOString();

  // Create thread and initial user post in transaction
  db.transaction(() => {
    db.prepare(`
      INSERT INTO threads (id, board_id, creator_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(threadId, boardId, userId || 'u-dean', threadTitle, now, now);

    db.prepare(`
      INSERT INTO posts (id, thread_id, user_id, author_name, post_type, content, upvotes, downvotes, score, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'user', ?, 0, 0, 0, ?, ?)
    `).run(postId, threadId, userId || 'u-dean', authorName || 'Anonymous', cleanContent, now, now);

    if (attachment && attachment.file_path) {
      db.prepare(`
        INSERT INTO attachments (id, post_id, file_name, file_path, mime_type, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('att-' + uuidv4().slice(0, 8), postId, attachment.file_name, attachment.file_path, attachment.mime_type, attachment.file_size, now);
    }

    // Index in FTS5
    db.prepare(`
      INSERT INTO community_fts (content, title, board_name, post_id, thread_id, board_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cleanContent, threadTitle, board.name, postId, threadId, boardId);
  })();

  // Handle Option 2 or Option 3 asynchronous AI response
  let aiResponsePost = null;
  try {
    const postImages = [];
    if (attachment && attachment.file_path) {
      postImages.push(attachment);
    }

    if (mode === 'ai_analysis') {
      // Gather relevant community context from other threads
      const searchHits = db.prepare(`
        SELECT content, title, board_name FROM community_fts
        WHERE community_fts MATCH ? AND thread_id != ?
        LIMIT 6
      `).all(cleanContent.replace(/[^a-zA-Z0-9\s]/g, ' ').trim() + '*', threadId);

      const communityContext = searchHits.map(h => `[Board: ${h.board_name} | Thread: ${h.title}]\n${h.content}`).join('\n\n');
      const aiAnswer = await geminiProvider.analyzeCommunityKnowledge({
        userPost: cleanContent,
        threadTitle,
        boardName: board.name,
        communityContext,
        images: postImages
      });

      const aiPostId = 'p-' + uuidv4().slice(0, 10);
      const aiTime = new Date().toISOString();
      db.prepare(`
        INSERT INTO posts (id, thread_id, parent_post_id, user_id, author_name, post_type, content, upvotes, downvotes, score, created_at, updated_at)
        VALUES (?, ?, ?, 'u-community', 'Community AI (Gemini)', 'ai_analysis', ?, 0, 0, 0, ?, ?)
      `).run(aiPostId, threadId, postId, aiAnswer, aiTime, aiTime);

      aiResponsePost = {
        id: aiPostId,
        thread_id: threadId,
        parent_post_id: postId,
        user_id: 'u-community',
        author_name: 'Community AI (Gemini)',
        post_type: 'ai_analysis',
        content: aiAnswer,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        created_at: aiTime
      };
    } else if (mode === 'google_search') {
      const searchResult = await geminiProvider.searchWithGoogleAI({ 
        query: cleanContent,
        images: postImages
      });
      const aiPostId = 'p-' + uuidv4().slice(0, 10);
      const aiTime = new Date().toISOString();
      db.prepare(`
        INSERT INTO posts (id, thread_id, parent_post_id, user_id, author_name, post_type, content, upvotes, downvotes, score, created_at, updated_at)
        VALUES (?, ?, ?, 'u-community', 'Google Search AI', 'google_search', ?, 0, 0, 0, ?, ?)
      `).run(aiPostId, threadId, postId, searchResult.summary, aiTime, aiTime);

      aiResponsePost = {
        id: aiPostId,
        thread_id: threadId,
        parent_post_id: postId,
        user_id: 'u-community',
        author_name: 'Google Search AI',
        post_type: 'google_search',
        content: searchResult.summary,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        created_at: aiTime
      };
    }
  } catch (err) {
    console.error('Post AI augmentation error:', err.message);
  }

  res.json({
    threadId,
    threadTitle,
    postId,
    aiResponsePost
  });
});

app.post('/api/threads/:id/posts', async (req, res) => {
  const { id: threadId } = req.params;
  const { userId, authorName, content, mode = 'standard', attachment, parentPostId } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }

  const thread = db.prepare(`
    SELECT t.*, b.name as board_name 
    FROM threads t 
    JOIN boards b ON t.board_id = b.id 
    WHERE t.id = ? AND t.is_deleted = 0
  `).get(threadId);

  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  if (thread.is_locked) {
    return res.status(403).json({ error: 'This thread is locked because the proposed board has already been created. No further responses are allowed.' });
  }

  const cleanContent = content.trim();
  const postId = 'p-' + uuidv4().slice(0, 10);
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO posts (id, thread_id, parent_post_id, user_id, author_name, post_type, content, upvotes, downvotes, score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'user', ?, 0, 0, 0, ?, ?)
    `).run(postId, threadId, parentPostId || null, userId || 'u-dean', authorName || 'Anonymous', cleanContent, now, now);

    db.prepare('UPDATE threads SET updated_at = ? WHERE id = ?').run(now, threadId);

    if (attachment && attachment.file_path) {
      db.prepare(`
        INSERT INTO attachments (id, post_id, file_name, file_path, mime_type, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('att-' + uuidv4().slice(0, 8), postId, attachment.file_name, attachment.file_path, attachment.mime_type, attachment.file_size, now);
    }

    db.prepare(`
      INSERT INTO community_fts (content, title, board_name, post_id, thread_id, board_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cleanContent, thread.title, thread.board_name, postId, threadId, thread.board_id);
  })();

  let aiResponsePost = null;
  try {
    // Collect all relevant images for multimodal understanding:
    // 1. Image attached to this post (if any)
    const combinedImages = [];
    if (attachment && attachment.file_path) {
      combinedImages.push(attachment);
    }

    // 2. Images from the parent post if replying to one
    let parentContentNote = '';
    if (parentPostId) {
      const parentAttachments = db.prepare(`
        SELECT file_name, file_path, mime_type 
        FROM attachments 
        WHERE post_id = ?
      `).all(parentPostId);

      if (parentAttachments && parentAttachments.length > 0) {
        combinedImages.push(...parentAttachments);
      }

      const parentPost = db.prepare('SELECT author_name, content FROM posts WHERE id = ?').get(parentPostId);
      if (parentPost) {
        parentContentNote = `\n[NOTE: This post is replying to @${parentPost.author_name}'s post: "${parentPost.content}"]`;
      }
    }

    const fullPromptContent = cleanContent + parentContentNote;

    if (mode === 'ai_analysis') {
      const searchHits = db.prepare(`
        SELECT content, title, board_name FROM community_fts
        WHERE community_fts MATCH ? AND post_id != ?
        LIMIT 6
      `).all(cleanContent.replace(/[^a-zA-Z0-9\s]/g, ' ').trim() + '*', postId);

      const communityContext = searchHits.map(h => `[Board: ${h.board_name} | Thread: ${h.title}]\n${h.content}`).join('\n\n');
      const aiAnswer = await geminiProvider.analyzeCommunityKnowledge({
        userPost: fullPromptContent,
        threadTitle: thread.title,
        boardName: thread.board_name,
        communityContext,
        images: combinedImages
      });

      const aiPostId = 'p-' + uuidv4().slice(0, 10);
      const aiTime = new Date().toISOString();
      db.prepare(`
        INSERT INTO posts (id, thread_id, parent_post_id, user_id, author_name, post_type, content, upvotes, downvotes, score, created_at, updated_at)
        VALUES (?, ?, ?, 'u-community', 'Community AI (Gemini)', 'ai_analysis', ?, 0, 0, 0, ?, ?)
      `).run(aiPostId, threadId, postId, aiAnswer, aiTime, aiTime);

      aiResponsePost = {
        id: aiPostId,
        thread_id: threadId,
        parent_post_id: postId,
        user_id: 'u-community',
        author_name: 'Community AI (Gemini)',
        post_type: 'ai_analysis',
        content: aiAnswer,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        created_at: aiTime
      };
    } else if (mode === 'google_search') {
      const searchResult = await geminiProvider.searchWithGoogleAI({ 
        query: fullPromptContent,
        images: combinedImages
      });
      const aiPostId = 'p-' + uuidv4().slice(0, 10);
      const aiTime = new Date().toISOString();
      db.prepare(`
        INSERT INTO posts (id, thread_id, parent_post_id, user_id, author_name, post_type, content, upvotes, downvotes, score, created_at, updated_at)
        VALUES (?, ?, ?, 'u-community', 'Google Search AI', 'google_search', ?, 0, 0, 0, ?, ?)
      `).run(aiPostId, threadId, postId, searchResult.summary, aiTime, aiTime);

      aiResponsePost = {
        id: aiPostId,
        thread_id: threadId,
        parent_post_id: postId,
        user_id: 'u-community',
        author_name: 'Google Search AI',
        post_type: 'google_search',
        content: searchResult.summary,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        created_at: aiTime
      };
    }
  } catch (err) {
    console.error('Post AI response error:', err.message);
  }

  res.json({
    postId,
    aiResponsePost
  });
});

// Edit Post (Only Original Author)
app.put('/api/posts/:id', (req, res) => {
  const { id: postId } = req.params;
  const { userId, content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to edit post.' });
  }

  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND is_deleted = 0').get(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  // Author verification check
  if (post.user_id !== userId) {
    return res.status(403).json({ error: 'You can only edit your own posts.' });
  }

  const cleanContent = content.trim();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      UPDATE posts 
      SET content = ?, updated_at = ?
      WHERE id = ?
    `).run(cleanContent, now, postId);

    // Update FTS5 virtual table
    db.prepare('DELETE FROM community_fts WHERE post_id = ?').run(postId);
    const thread = db.prepare('SELECT t.title, b.name as board_name, t.board_id FROM threads t JOIN boards b ON t.board_id = b.id WHERE t.id = ?').get(post.thread_id);
    if (thread) {
      db.prepare(`
        INSERT INTO community_fts (content, title, board_name, post_id, thread_id, board_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(cleanContent, thread.title, thread.board_name, postId, post.thread_id, thread.board_id);
    }
  })();

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  res.json(updated);
});

// Delete Post (Board Administrator or Original Author)
app.delete('/api/posts/:id', (req, res) => {
  const { id: postId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to delete post.' });
  }

  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND is_deleted = 0').get(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  const isAdmin = user.role === 'admin';
  const isAuthor = post.user_id === userId;

  if (!isAdmin && !isAuthor) {
    return res.status(403).json({ error: 'Only board administrators or the original author can delete this post.' });
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    // Soft-delete post
    db.prepare('UPDATE posts SET is_deleted = 1, updated_at = ? WHERE id = ?').run(now, postId);

    // Remove from FTS5 index
    db.prepare('DELETE FROM community_fts WHERE post_id = ?').run(postId);
  })();

  res.json({
    success: true,
    message: 'Post deleted successfully.',
    postId
  });
});

// Admin Manual Thread Lock/Unlock
app.put('/api/threads/:id/lock', (req, res) => {
  const { id: threadId } = req.params;
  const { userId, locked = true } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Only board administrators can lock or unlock threads.' });
  }

  const thread = db.prepare('SELECT * FROM threads WHERE id = ? AND is_deleted = 0').get(threadId);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found.' });
  }

  const isLockedVal = locked ? 1 : 0;
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      UPDATE threads 
      SET is_locked = ?, updated_at = ? 
      WHERE id = ?
    `).run(isLockedVal, now, threadId);

    // If manually locked, append a moderator notice post
    if (isLockedVal) {
      const lockNotice = `🔒 **Thread Locked by Administrator** (@${user.username})\n\nThis discussion has been locked by a board administrator. New replies and voting are closed.`;
      db.prepare(`
        INSERT INTO posts (id, thread_id, user_id, author_name, post_type, content, score, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'ai_analysis', ?, 0, ?, ?)
      `).run('p-' + uuidv4().slice(0, 10), threadId, user.id, `${user.username} (Admin)`, lockNotice, now, now);
    }
  })();

  const updatedThread = db.prepare(`
    SELECT t.*, b.name as board_name, b.id as board_id, 
      target_b.name as locked_target_board_name,
      u.username as creator_name, u.avatar_url as creator_avatar
    FROM threads t
    JOIN boards b ON t.board_id = b.id
    LEFT JOIN boards target_b ON t.locked_target_board_id = target_b.id
    LEFT JOIN users u ON t.creator_id = u.id
    WHERE t.id = ? AND t.is_deleted = 0
  `).get(threadId);

  res.json({
    success: true,
    is_locked: isLockedVal,
    thread: updatedThread,
    message: isLockedVal ? 'Thread locked successfully.' : 'Thread unlocked successfully.'
  });
});

// -------------------------------------------------------------
// Voting & Karma, Spam Moderation, 10-Vote Board Auto-Creation
// -------------------------------------------------------------
app.post('/api/posts/:id/vote', async (req, res) => {
  const { id: postId } = req.params;
  const { userId, direction } = req.body; // direction: 1 or -1

  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  const voteVal = direction > 0 ? 1 : -1;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  const isAdmin = user.role === 'admin';

  const post = db.prepare(`
    SELECT p.*, t.board_id, t.title as thread_title, t.is_locked as thread_is_locked, b.name as board_name
    FROM posts p
    JOIN threads t ON p.thread_id = t.id
    JOIN boards b ON t.board_id = b.id
    WHERE p.id = ? AND p.is_deleted = 0
  `).get(postId);

  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.thread_is_locked) {
    return res.status(403).json({ error: 'This thread is locked because the proposed board has been created. Voting is closed.' });
  }
  if (post.post_type !== 'user') {
    return res.status(400).json({ error: 'AI analysis and search posts cannot be voted on.' });
  }

  const existingVote = db.prepare('SELECT * FROM post_votes WHERE post_id = ? AND user_id = ?').get(postId, userId);

  let newUpvotes = post.upvotes;
  let newDownvotes = post.downvotes;
  let userVoteState = 0; // -1, 0, 1

  db.transaction(() => {
    if (isAdmin) {
      // Board Administrator Testing Capability:
      // Administrators can repeatedly upvote or downvote without the 1-vote-per-user restriction
      // to test auto board creation (10 votes) and spam moderation thresholds.
      if (voteVal === 1) {
        newUpvotes += 1;
      } else {
        newDownvotes += 1;
      }

      // Upsert record into post_votes
      db.prepare(`
        INSERT INTO post_votes (id, post_id, user_id, vote_value)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(post_id, user_id) DO UPDATE SET vote_value = excluded.vote_value, updated_at = CURRENT_TIMESTAMP
      `).run('v-' + uuidv4().slice(0, 8), postId, userId, voteVal);
      userVoteState = voteVal;
    } else {
      // Standard Community Members: strict 1-vote-per-user rule
      if (existingVote) {
        if (existingVote.vote_value === voteVal) {
          // Toggle/cancel vote
          db.prepare('DELETE FROM post_votes WHERE post_id = ? AND user_id = ?').run(postId, userId);
          userVoteState = 0;
        } else {
          // Change vote direction
          db.prepare('UPDATE post_votes SET vote_value = ?, updated_at = CURRENT_TIMESTAMP WHERE post_id = ? AND user_id = ?')
            .run(voteVal, postId, userId);
          userVoteState = voteVal;
        }
      } else {
        // Cast new vote
        db.prepare(`
          INSERT INTO post_votes (id, post_id, user_id, vote_value)
          VALUES (?, ?, ?, ?)
        `).run('v-' + uuidv4().slice(0, 8), postId, userId, voteVal);
        userVoteState = voteVal;
      }

      // Recalculate tallies from unique user votes
      const tallies = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN vote_value = 1 THEN 1 ELSE 0 END), 0) as up,
          COALESCE(SUM(CASE WHEN vote_value = -1 THEN 1 ELSE 0 END), 0) as down
        FROM post_votes
        WHERE post_id = ?
      `).get(postId);

      newUpvotes = tallies.up;
      newDownvotes = tallies.down;
    }

    const newScore = newUpvotes - newDownvotes;

    // Check automatic spam purge: "Posts with more than 10 negative reviews will be removed automatically."
    const isSpamHidden = newDownvotes >= 10 ? 1 : 0;

    db.prepare(`
      UPDATE posts 
      SET upvotes = ?, downvotes = ?, score = ?, is_spam_hidden = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newUpvotes, newDownvotes, newScore, isSpamHidden, postId);

    // Update author's total karma score
    if (post.user_id) {
      db.prepare(`
        UPDATE users 
        SET karma_score = (
          SELECT COALESCE(SUM(score), 0) 
          FROM posts 
          WHERE user_id = ? AND is_deleted = 0 AND is_spam_hidden = 0
        )
        WHERE id = ?
      `).run(post.user_id, post.user_id);
    }
  })();

  const updatedScore = newUpvotes - newDownvotes;

  // Background check 1: Negative score triggers AI Spam review
  if (updatedScore < 0 && newDownvotes < 10) {
    geminiProvider.reviewPostForSpam({
      content: post.content,
      authorName: post.author_name,
      boardName: post.board_name,
      score: updatedScore
    }).then((review) => {
      db.prepare(`
        INSERT INTO ai_moderations (id, post_id, is_spam, confidence, reasoning)
        VALUES (?, ?, ?, ?, ?)
      `).run('mod-' + uuidv4().slice(0, 8), postId, review.is_spam ? 1 : 0, review.confidence, review.reasoning);
    }).catch(e => console.warn('Spam review background error:', e.message));
  }

  // Background check 2: 10 votes in "Tips and suggestions" creates new board
  // "If a user wants to create a new board they will put the suggestion in a post in the Tips and Suggestions Board. If the board gets 10 votes the board will be created."
  let newlyCreatedBoard = null;
  if (post.board_id === 'b-tips-and-suggestions' && updatedScore >= 10) {
    try {
      const extracted = await geminiProvider.extractProposedBoard({
        threadTitle: post.thread_title,
        postContent: post.content
      });

      const boardSlug = 'b-' + extracted.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingBoard = db.prepare('SELECT * FROM boards WHERE id = ? OR name = ?').get(boardSlug, extracted.name);

      if (!existingBoard) {
        db.prepare(`
          INSERT INTO boards (id, name, description, category, is_default, creator_id)
          VALUES (?, ?, ?, ?, 0, ?)
        `).run(boardSlug, extracted.name, extracted.description, extracted.category || 'Interests', post.user_id);

        // Fetch original thread information and all active posts with their attachments
        const origThread = db.prepare('SELECT * FROM threads WHERE id = ?').get(post.thread_id);
        const origPosts = db.prepare(`
          SELECT * FROM posts 
          WHERE thread_id = ? AND is_deleted = 0 AND is_spam_hidden = 0
          ORDER BY created_at ASC
        `).all(post.thread_id);

        // Create a new inaugural thread in the newly created board
        const newThreadId = 't-' + uuidv4().slice(0, 10);
        const newThreadTitle = origThread ? origThread.title : extracted.name;
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO threads (id, board_id, creator_id, title, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(newThreadId, boardSlug, post.user_id || 'u-dean', newThreadTitle, now, now);

        // Map original post IDs to new post IDs so nested replies (parent_post_id) remain intact
        const postIdMap = {};

        for (const op of origPosts) {
          const newPostId = 'p-' + uuidv4().slice(0, 10);
          postIdMap[op.id] = newPostId;
          const mappedParentId = op.parent_post_id ? (postIdMap[op.parent_post_id] || null) : null;

          db.prepare(`
            INSERT INTO posts (id, thread_id, parent_post_id, user_id, author_name, post_type, content, upvotes, downvotes, score, metadata_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            newPostId,
            newThreadId,
            mappedParentId,
            op.user_id,
            op.author_name,
            op.post_type,
            op.content,
            op.upvotes,
            op.downvotes,
            op.score,
            op.metadata_json,
            op.created_at,
            op.updated_at
          );

          // Copy any attachments associated with this post
          const attachments = db.prepare('SELECT * FROM attachments WHERE post_id = ?').all(op.id);
          for (const att of attachments) {
            db.prepare(`
              INSERT INTO attachments (id, post_id, file_name, file_path, mime_type, file_size, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('att-' + uuidv4().slice(0, 8), newPostId, att.file_name, att.file_path, att.mime_type, att.file_size, att.created_at);
          }

          // Index in FTS virtual table for the new board
          db.prepare(`
            INSERT INTO community_fts (content, title, board_name, post_id, thread_id, board_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(op.content, newThreadTitle, extracted.name, newPostId, newThreadId, boardSlug);
        }

        // Add inaugural milestone announcement post inside the new thread on the new board
        const inauguralMsg = `🎉 **Welcome to the brand new "${extracted.name}" board!**\n\nThis board was proposed in the **Tips and suggestions** board and reached community consensus with **${updatedScore} votes**! All discussion, posts, and media from the original proposal thread have been copied over here to seed this community.`;
        db.prepare(`
          INSERT INTO posts (id, thread_id, user_id, author_name, post_type, content, score, created_at, updated_at)
          VALUES (?, ?, 'u-community', 'Community AI (Gemini)', 'ai_analysis', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run('p-' + uuidv4().slice(0, 10), newThreadId, inauguralMsg);

        // Add congratulations milestone post in the original suggestion thread with link and lock announcement
        const finalNoticeMsg = `🔒 **Proposal Approved & Thread Closed**\n\n🎉 **Community Milestone Reached!** This suggestion has received **${updatedScore} votes**, meeting community consensus. The new board [**${extracted.name}**](#board-${boardSlug}) has been created, and all ${origPosts.length} posts and media from this thread have been copied over to its inaugural discussion.\n\nThis suggestion thread is now locked to further responses and voting. Please join the conversation in the new board: [Go to ${extracted.name} Board](#board-${boardSlug})`;
        db.prepare(`
          INSERT INTO posts (id, thread_id, user_id, author_name, post_type, content, score, created_at, updated_at)
          VALUES (?, ?, 'u-community', 'Community AI (Gemini)', 'ai_analysis', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run('p-' + uuidv4().slice(0, 10), post.thread_id, finalNoticeMsg);

        // Lock the original suggestion thread
        db.prepare(`
          UPDATE threads 
          SET is_locked = 1, locked_target_board_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(boardSlug, post.thread_id);

        newlyCreatedBoard = {
          id: boardSlug,
          name: extracted.name,
          description: extracted.description,
          threadId: newThreadId,
          copiedPostCount: origPosts.length
        };
      }
    } catch (err) {
      console.error('Auto board creation error:', err.message);
    }
  }

  res.json({
    postId,
    upvotes: newUpvotes,
    downvotes: newDownvotes,
    score: updatedScore,
    userVote: userVoteState,
    isSpamHidden: newDownvotes >= 10,
    newlyCreatedBoard
  });
});

// -------------------------------------------------------------
// Rankings & Leaderboard Endpoint
// -------------------------------------------------------------
app.get('/api/rankings', (req, res) => {
  // Top posts by net score
  const topPosts = db.prepare(`
    SELECT p.*, t.title as thread_title, b.name as board_name, b.id as board_id, u.avatar_url as author_avatar
    FROM posts p
    JOIN threads t ON p.thread_id = t.id
    JOIN boards b ON t.board_id = b.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.is_deleted = 0 AND p.is_spam_hidden = 0 AND p.post_type = 'user'
    ORDER BY p.score DESC, p.upvotes DESC
    LIMIT 20
  `).all();

  // Top users by karma score
  const topUsers = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_deleted = 0 AND is_spam_hidden = 0) as post_count,
      (SELECT COUNT(*) FROM threads WHERE creator_id = u.id AND is_deleted = 0) as thread_count
    FROM users u
    WHERE u.id != 'u-community'
    ORDER BY u.karma_score DESC
    LIMIT 20
  `).all();

  res.json({
    topPosts,
    topUsers
  });
});

// -------------------------------------------------------------
// Search Full Community
// -------------------------------------------------------------
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);

  const cleanQuery = q.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  try {
    const results = db.prepare(`
      SELECT fts.*, p.score, p.created_at, p.author_name
      FROM community_fts fts
      JOIN posts p ON fts.post_id = p.id
      WHERE community_fts MATCH ? AND p.is_deleted = 0 AND p.is_spam_hidden = 0
      ORDER BY p.score DESC, p.created_at DESC
      LIMIT 30
    `).all(cleanQuery + '*');
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: 'Search failed: ' + err.message });
  }
});

// -------------------------------------------------------------
// Standalone Google Search AI Endpoint
// -------------------------------------------------------------
app.post('/api/search/google-ai', async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const data = await geminiProvider.searchWithGoogleAI({ query: query.trim() });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Serve Frontend (Vite build output)
// -------------------------------------------------------------
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/media')) {
      return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
    next();
  });
}

// Start Express Server
app.listen(PORT, () => {
  console.log(`Community AI Archive server running on http://localhost:${PORT}`);
});

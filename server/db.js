const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'community_archive.db');
const MEDIA_DIR = path.join(DATA_DIR, 'media');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'user', -- 'admin', 'moderator', 'user'
      email TEXT,
      avatar_url TEXT,
      karma_score INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'general',
      is_default INTEGER DEFAULT 0,
      creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      board_id TEXT REFERENCES boards(id) ON DELETE CASCADE,
      creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      thread_id TEXT REFERENCES threads(id) ON DELETE CASCADE,
      parent_post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      post_type TEXT DEFAULT 'user', -- 'user', 'ai_analysis', 'google_search'
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      is_spam_hidden INTEGER DEFAULT 0,
      metadata_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS post_votes (
      id TEXT PRIMARY KEY,
      post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      vote_value INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
      file_name TEXT,
      file_path TEXT,
      mime_type TEXT,
      file_size INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_moderations (
      id TEXT PRIMARY KEY,
      post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
      is_spam INTEGER DEFAULT 0,
      confidence REAL DEFAULT 0,
      reasoning TEXT,
      reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Full-Text Search Virtual Table
    CREATE VIRTUAL TABLE IF NOT EXISTS community_fts USING fts5(
      content,
      title,
      board_name,
      post_id UNINDEXED,
      thread_id UNINDEXED,
      board_id UNINDEXED
    );
  `);

  // Ensure password_hash column exists if upgrading database
  try {
    db.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run();
  } catch (e) {
    // Column already exists
  }

  // Ensure role column exists if upgrading database
  try {
    db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
  } catch (e) {
    // Column already exists
  }

  // Ensure parent_post_id column exists if upgrading database
  try {
    db.prepare('ALTER TABLE posts ADD COLUMN parent_post_id TEXT REFERENCES posts(id) ON DELETE SET NULL').run();
  } catch (e) {
    // Column already exists
  }

  // Ensure is_locked and locked_target_board_id columns exist on threads if upgrading database
  try {
    db.prepare('ALTER TABLE threads ADD COLUMN is_locked INTEGER DEFAULT 0').run();
  } catch (e) {
    // Column already exists
  }
  try {
    db.prepare('ALTER TABLE threads ADD COLUMN locked_target_board_id TEXT REFERENCES boards(id) ON DELETE SET NULL').run();
  } catch (e) {
    // Column already exists
  }

  seedInitialData();
}

function seedInitialData() {
  // 1. Seed Default Settings if not present
  const geminiKey = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get();
  if (!geminiKey) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('gemini_api_key', ?)").run(process.env.GEMINI_API_KEY || '');
  }

  // 2. Seed Default Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, role, email, avatar_url, karma_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('u-dean', 'Dean', 'password123', 'admin', 'dean@example.com', 'https://api.dicebear.com/7.x/bottts/svg?seed=Dean', 25);
    insertUser.run('u-alex', 'Alex M', 'password123', 'user', 'alex@example.com', 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', 12);
    insertUser.run('u-sarah', 'Sarah K', 'password123', 'user', 'sarah@example.com', 'https://api.dicebear.com/7.x/bottts/svg?seed=Sarah', 18);
    insertUser.run('u-community', 'Community AI', 'botpassword', 'admin', 'bot@community.ai', 'https://api.dicebear.com/7.x/bottts/svg?seed=GeminiBot', 100);
  } else {
    // Ensure existing demo users have password123 if null
    db.prepare("UPDATE users SET password_hash = 'password123' WHERE password_hash IS NULL").run();
    // Ensure Dean is administrator
    db.prepare("UPDATE users SET role = 'admin' WHERE id = 'u-dean' OR username = 'Dean'").run();
  }

  // 3. Seed Default Boards as outlined in the Overview document
  const defaultBoards = [
    {
      id: 'b-community-notices',
      name: 'Community notices',
      description: 'Official announcements, guidelines, and town hall updates for the community.',
      category: 'Announcements'
    },
    {
      id: 'b-buy-sell-swap',
      name: 'Buy, sell and swap',
      description: 'Local and global marketplace to buy, sell, or trade goods and services.',
      category: 'Marketplace'
    },
    {
      id: 'b-events-activities',
      name: 'Events and activities',
      description: 'Meetups, workshops, hackathons, and community gatherings.',
      category: 'Events'
    },
    {
      id: 'b-lost-and-found',
      name: 'Lost and found',
      description: 'Report lost belongings, found items, or pets in the neighborhood.',
      category: 'Community'
    },
    {
      id: 'b-job-opportunities',
      name: 'Job opportunities',
      description: 'Full-time, part-time, remote gigs, and project collaborations.',
      category: 'Work'
    },
    {
      id: 'b-tips-and-suggestions',
      name: 'Tips and suggestions',
      description: 'Community tips, ideas, and board proposals. Suggest a board here—10 votes auto-creates it!',
      category: 'Governance'
    }
  ];

  const insertBoard = db.prepare(`
    INSERT OR IGNORE INTO boards (id, name, description, category, is_default, creator_id)
    VALUES (?, ?, ?, ?, 1, 'u-community')
  `);

  for (const b of defaultBoards) {
    insertBoard.run(b.id, b.name, b.description, b.category);
  }

  // 4. Seed initial welcome thread if no threads exist
  const threadCount = db.prepare('SELECT COUNT(*) as count FROM threads').get().count;
  if (threadCount === 0) {
    const welcomeThreadId = 't-welcome-notice';
    const welcomePostId = 'p-welcome-notice-1';
    const aiAnswerPostId = 'p-welcome-notice-2';
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO threads (id, board_id, creator_id, title, created_at, updated_at)
      VALUES (?, 'b-community-notices', 'u-dean', 'Welcome to the Community AI Archive! Here is how our forum works.', ?, ?)
    `).run(welcomeThreadId, now, now);

    db.prepare(`
      INSERT INTO posts (id, thread_id, user_id, author_name, post_type, content, upvotes, downvotes, score, created_at, updated_at)
      VALUES (?, ?, 'u-dean', 'Dean', 'user', ?, 8, 0, 8, ?, ?)
    `).run(
      welcomePostId, 
      welcomeThreadId, 
      'Welcome everyone! The Community AI Archive functions as an AI-moderated community forum with Google Gemini. You can post discussions, ask questions, embed images, and choose between posting as-is, running community AI analysis, or performing a live Google AI Search. You can also vote on community posts and propose new boards in Tips and Suggestions!',
      now, 
      now
    );

    // Initial AI greeting post (no voting)
    db.prepare(`
      INSERT INTO posts (id, thread_id, user_id, author_name, post_type, content, upvotes, downvotes, score, created_at, updated_at)
      VALUES (?, ?, 'u-community', 'Community AI (Gemini)', 'ai_analysis', ?, 0, 0, 0, ?, ?)
    `).run(
      aiAnswerPostId,
      welcomeThreadId,
      'Hello community! I am Gemini, your community AI assistant. Whenever you create a post with AI Analysis enabled, I will cross-reference community archives to answer questions or ground your post with live Google AI Search findings.',
      now,
      now
    );

    // Index in FTS5
    db.prepare(`
      INSERT INTO community_fts (content, title, board_name, post_id, thread_id, board_id)
      VALUES (?, 'Welcome to the Community AI Archive! Here is how our forum works.', 'Community notices', ?, ?, 'b-community-notices')
    `).run(
      'Welcome everyone! The Community AI Archive functions as an AI-moderated community forum with Google Gemini.',
      welcomePostId,
      welcomeThreadId
    );
  }
}

initSchema();

module.exports = {
  db,
  DATA_DIR,
  MEDIA_DIR
};

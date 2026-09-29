// API service for Community AI Archive

export const api = {
  // Provider health (Google Gemini)
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Failed to fetch provider health');
    return res.json();
  },

  // Settings
  async getSettings() {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Users & Authentication
  async getUsers() {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async login({ username, password }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async registerUser({ username, password, email, avatar_url }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, avatar_url })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  // Boards
  async getBoards(search = '') {
    const url = search ? `/api/boards?search=${encodeURIComponent(search)}` : '/api/boards';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch boards');
    return res.json();
  },

  async getBoard(id) {
    const res = await fetch(`/api/boards/${id}`);
    if (!res.ok) throw new Error('Failed to fetch board');
    return res.json();
  },

  // Threads
  async getThreads(boardId) {
    const res = await fetch(`/api/boards/${boardId}/threads`);
    if (!res.ok) throw new Error('Failed to fetch threads');
    return res.json();
  },

  async getThread(threadId) {
    const res = await fetch(`/api/threads/${threadId}`);
    if (!res.ok) throw new Error('Failed to fetch thread details');
    return res.json();
  },

  // Create Thread with First Post (Triple-Action)
  async createThread(boardId, { userId, authorName, content, mode = 'standard', attachment }) {
    const res = await fetch(`/api/boards/${boardId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, authorName, content, mode, attachment })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create thread');
    }
    return res.json();
  },

  // Reply to Thread (Triple-Action, with optional parentPostId)
  async createPost(threadId, { userId, authorName, content, mode = 'standard', attachment, parentPostId }) {
    const res = await fetch(`/api/threads/${threadId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, authorName, content, mode, attachment, parentPostId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit post');
    }
    return res.json();
  },

  // Edit Post (Original Author only)
  async editPost(postId, { userId, content }) {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to edit post');
    }
    return res.json();
  },

  // Delete Post (Board Administrator or Original Author)
  async deletePost(postId, { userId }) {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete post');
    }
    return res.json();
  },

  // Lock or Unlock Thread (Board Administrator only)
  async lockThread(threadId, { userId, locked = true }) {
    const res = await fetch(`/api/threads/${threadId}/lock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, locked })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update thread lock status');
    }
    return res.json();
  },

  // Upload Image Attachment
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload image');
    return res.json();
  },

  // Vote on User Post
  async votePost(postId, { userId, direction }) {
    const res = await fetch(`/api/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, direction })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record vote');
    }
    return res.json();
  },

  // Community Rankings & Leaderboard
  async getRankings() {
    const res = await fetch('/api/rankings');
    if (!res.ok) throw new Error('Failed to fetch rankings');
    return res.json();
  },

  // Global Community Search
  async searchCommunity(query) {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search community');
    return res.json();
  },

  // Google Search AI Grounding Modal
  async searchGoogleAI({ query }) {
    const res = await fetch('/api/search/google-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute Google Search AI');
    }
    return res.json();
  }
};

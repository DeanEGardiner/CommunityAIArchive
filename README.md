# Community AI Archive

A full-stack intelligent community discussion platform powered by **Google Gemini** with AI board analysis, live web search grounding with verified citations, community proposal consensus, automatic board creation, reputation/karma rankings, and comprehensive administrative controls.

---

## Key Features

- **Dynamic Forum Boards & Hierarchical Threads:** Discussion boards categorized by Governance, Announcements, Marketplace, Events, and Community Interests.
- **Triple-Action Submission Modes:**
  1. **Just Post As Is:** Fast standard forum posting.
  2. **Post + AI Board Analysis:** Automatically analyzes historical board context and synthesizes insights using Google Gemini.
  3. **Post + Google Search Grounding:** Queries live web search via Google to provide factual answers, source links, and verified citation cards.
- **Community Consensus & Auto-Board Graduation:** Suggestions that reach **10 community upvotes** in *Tips and Suggestions* automatically graduate into dedicated boards, copying over all prior discussion and locking the original proposal thread.
- **Reputation & Rankings Leaderboard:** Global leaderboard ranking the top contributions and users by net community score.
- **Admin Moderation & Thread Locking:** Board administrators can manually lock/unlock threads, delete inappropriate posts, and cast consecutive votes for testing.
- **Persona Quick Switcher:** Built-in profiles modal allowing instant switching between test users (`Dean` [Admin], `Community AI` [Bot], `Alex M`, `Sarah K`, `Charlotte`, `Maya`).
- **Comprehensive Documentation:** Visual walkthrough with high-resolution UI screenshots and component breakdowns.

---

## Tech Stack

- **Frontend:** React 19, Vite, Lucide Icons, Vanilla CSS with custom design tokens.
- **Backend:** Node.js, Express, SQLite (`better-sqlite3` in WAL mode).
- **AI & Grounding:** `@google/genai` (Google Gemini 3.8 Flash) with live Google Search grounding.

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm**

### 2. Installation
Install root dependencies and client dependencies:
```bash
npm install
npm --prefix client install
```

### 3. Build Client Assets
```bash
npm run build
```

### 4. Running the Application
Start the backend server (serves the API and production client):
```bash
npm start
```
The application will be accessible at:
```
http://localhost:3001
```

For development mode with Vite hot-reloading:
```bash
npm run client
```

### 5. Configuring Google Gemini
Open the application, click the **Settings** gear icon in the top left, and enter your **Google Gemini API Key**.

---

## Documentation

- [UI Components & Visual Walkthrough (Markdown)](./UI_Components_Documentation.md)
- [System Architecture & Processes](./System_Architecture_and_Processes.md)
- [UI Screenshots Directory](./docs_screenshots/)

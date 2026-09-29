# Community AI Archive — UI Components & Visual Walkthrough

This document showcases all primary user interface components, views, workflows, and administrative features in the **Community AI Archive** application.

---

## Table of Contents
1. [Core Navigation & Board Directory](#1-core-navigation--board-directory)
2. [Board Detail View & Thread Listings](#2-board-detail-view--thread-listings)
3. [Thread Creation Composer Drawer](#3-thread-creation-composer-drawer)
4. [Active Discussion Thread & AI Web Grounding](#4-active-discussion-thread--ai-web-grounding)
5. [Administrator Controls & Manual Locking](#5-administrator-controls--manual-locking)
6. [Locked Thread & Graduated Board Banner](#6-locked-thread--graduated-board-banner)
7. [Community Rankings & Leaderboard](#7-community-rankings--leaderboard)
8. [User Authentication & Quick Profile Switcher](#8-user-authentication--quick-profile-switcher)
9. [Google AI Live Search Modal](#9-google-ai-live-search-modal)
10. [Application Settings & API Configuration](#10-application-settings--api-configuration)

---

### 1. Core Navigation & Board Directory

The main hub of the application displays the sidebar navigation alongside the searchable Board Directory. Boards are segregated into default core governance boards and community-graduated boards.

![Community AI Archive - Board Directory View](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/01_board_directory.png)
*Figure 1.1: The Board Directory displaying the sidebar (brand icon, user pill, view switcher, categorized boards list), the hero banner with the 10-vote proposal CTA, search input, and interactive board cards with category chips and thread counters.*

#### Key UI Elements:
- **Collapsible Sidebar Navigation:** Displays the current active user, karma score, quick profile switcher button, settings gear, and list of boards.
- **Hero Banner:** Directs users to propose new boards within the *Tips and Suggestions* governance board.
- **Search Bar:** Real-time filtering of boards by keyword, name, or description.
- **Core Community Boards:** Includes default system boards such as *Tips and suggestions*, *Community notices*, *Buy, sell and swap*, *Events and activities*, *Job opportunities*, and *Lost and found*.
- **User Created & Suggested Boards:** Dynamically lists boards created via community consensus (e.g., *Guitar Enthusiasts*, *Art Appreciation*, *Quest Board*).

---

### 2. Board Detail View & Thread Listings

Clicking into any board transitions the user to the thread list for that board, displaying thread metadata, authors, relative creation timestamps, post counters, and vote tallies.

![Tips and Suggestions Board Detail](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/02_board_detail_suggestions.png)
*Figure 2.1: Tips and suggestions board showing locked/closed proposals that achieved community consensus.*

![Guitar Enthusiasts Board Detail](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/03_board_detail_guitar.png)
*Figure 2.2: A community-created board (Guitar Enthusiasts) listing active discussion threads with interactive vote scores and reply counters.*

#### Key UI Elements:
- **Board Header:** Displays board name, category badge (e.g. `Governance`, `Interests`), description, back navigation button, and the **Start New Discussion** action button.
- **Thread Cards:** Shows author name, relative date, snippet preview, closed/locked indicators, total post count, and net community score.

---

### 3. Thread Creation Composer Drawer

Clicking **Start New Discussion** opens an expandable inline composer directly at the top of the thread stream.

![Create Thread Inline Composer](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/10_create_thread_composer.png)
*Figure 3.1: Thread creation drawer showing multi-line input (first line extracted as title), media attachment option, and submission mode toggles.*

#### Key UI Elements:
- **Multi-Line Textarea:** The first line of input automatically serves as the thread's title, while subsequent lines comprise the body.
- **Attach Image Button:** Allows attaching local photos, screenshots, or diagram files.
- **Submission Mode Selectors:**
  1. `Post As Is`: Standard forum post without automated AI intervention.
  2. `Post + AI Analysis`: Triggers Gemini 3.8 to synthesize existing forum context and historical discussions.
  3. `Post + Google Search`: Triggers live web search grounding with factual synthesis and citation cards.

---

### 4. Active Discussion Thread & AI Web Grounding

When viewing a thread, posts are organized chronologically and hierarchically. User posts feature voting buttons, while AI posts display distinct badges and verified citation cards.

![Active Discussion Thread with Google AI Grounding](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/04_thread_view_guitar_active.png)
*Figure 4.1: Discussion view displaying hierarchical replies, a Google Search AI grounded response, and an interactive grid of citation source cards.*

#### Key UI Elements:
- **Replying Reference Chip:** Indicates direct child replies (e.g. `Google Search AI answer for @Alex M` or `Replying directly to @user`).
- **Google AI Search Badge:** Highlights automated agent responses with specialized badge styling.
- **Verified Web Citations & Sources Grid:** Card-based web sources displaying domain names, citation numbers, and outbound links with external link icons.
- **Triple-Action Composer:** Bottom toolbar with dynamic resizing textarea, image attachment button, and mode selection buttons.

---

### 5. Administrator Controls & Manual Locking

When logged in as an administrator (such as `@Dean`), administrative action buttons appear throughout the interface.

![Thread View with Admin Controls](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/11_thread_view_admin_controls.png)
*Figure 5.1: Thread view rendered for an administrator, showing the red "Lock Thread" header toggle and "Delete (Admin)" button on member posts.*

#### Key UI Elements:
- **Lock Thread Button:** Allows administrators to manually lock any discussion thread to prevent further responses and voting.
- **Delete (Admin) Button:** Allows administrators to remove posts by other members for moderation purposes.
- **Multi-Vote Capability:** Administrators can cast consecutive votes to test and validate the automated 10-vote board graduation trigger.

---

### 6. Locked Thread & Graduated Board Banner

When a proposal thread in *Tips and Suggestions* reaches the 10-vote threshold, it is automatically locked, and all posts are copied over to seed the newly created board.

![Locked Thread Banner with Board Link](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/05_thread_view_locked_graduated.png)
*Figure 6.1: A graduated suggestion thread with a lock banner at the bottom and a direct CTA button navigating to the new board.*

#### Key UI Elements:
- **Locked Badge:** Displayed in the thread header as `Locked (Board Created)` or `Locked`.
- **Disabled Composer Banner:** Replaces the standard composer with an explanatory banner informing users that voting and responses are closed.
- **Visit Board Button:** Direct navigation link taking members straight to the newly auto-generated board.

---

### 7. Community Rankings & Leaderboard

The Rankings view aggregates the highest-scoring contributions across all boards and showcases the top reputation community members.

![Community Rankings Leaderboard](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/06_rankings_leaderboard_view.png)
*Figure 7.1: The Community Rankings view showing top-voted posts ranked by net community score, with board badges and direct links.*

#### Key UI Elements:
- **Rank Indicator:** Gold (#1), silver (#2), bronze (#3), and standard numerical ranking badges.
- **Net Vote Badge:** Green score display showing total upvotes minus downvotes.
- **Thread Deep-Link:** Clicking any ranked item navigates directly to the source discussion.
- **Top Posts / Top Contributors Switcher:** Tabbed toggle allowing inspection of top posts or top users by cumulative karma.

---

### 8. User Authentication & Quick Profile Switcher

Accessible via the profile pill in the sidebar, this modal provides standard login and registration alongside a quick-switch testing palette.

![Community User Authentication Modal](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/07_user_auth_modal.png)
*Figure 8.1: Authentication modal showing the Profiles tab with role badges (Admin, AI Bot), post counts, and karma scores.*

#### Key UI Elements:
- **Tabbed Interface:** `Log In`, `Register`, and `Profiles` tabs.
- **Profiles Quick-Switcher:** Allows switching between seed personas (`Dean` [Admin], `Community AI` [Bot], `Alex M`, `Sarah K`, `Charlotte`, `Maya`) in one click without password re-entry.
- **Role & Karma Badges:** Clearly labels user roles and community standing.

---

### 9. Google AI Live Search Modal

Accessible anytime from the sidebar or thread headers, this modal allows querying live web knowledge with Gemini and Google Search grounding.

![Google AI Search Modal](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/08_google_search_modal.png)
*Figure 9.1: The Google AI Search modal with search prompt input, "Grounded" pill badge, and instant query trigger.*

#### Key UI Elements:
- **Grounded Badge:** Indicates live internet connection via Google Search.
- **Search Query Input:** Supports open-ended natural language research questions.
- **Citation Insertion:** Citations and summaries generated here can be inserted directly into active thread drafts.

---

### 10. Application Settings & API Configuration

The settings dialog allows configuring the Google Gemini API key used for community intelligence, AI analysis, Google Search grounding, and spam detection.

![Community AI Settings Modal](/Users/deangardiner/.gemini/antigravity-ide/brain/3da07bc4-fd76-4aab-9c3a-10869479e750/screenshots/09_settings_modal.png)
*Figure 10.1: Settings modal with Gemini API key input field and feature explanation callout.*

#### Key UI Elements:
- **Info Callout:** Explains the role of Google Gemini in powering forum intelligence.
- **Masked Password Input:** Protects sensitive API credentials.
- **Save Settings Button:** Persists credentials to the server environment securely.

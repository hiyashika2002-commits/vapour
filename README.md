# Vapour — Lightweight Real-Time Stock Dashboard

Vapour is a premium, real-time stock brokerage client web dashboard designed with an editorial aesthetic. Inspired by the *Copilot Money* design system, it features a midnight-canvas layout, whisper-thin typography, tiered neomorphic inset shadow elevations (no drop shadows), and a floating depth-of-field tag constellation.

The application satisfies all brokerage specifications including secure email authentication, real-time price feeds via Server-Sent Events (SSE) without page refreshes, persisted user-level watchlists via Supabase, and multi-user dashboard isolation.

---

## 🚀 Key Features

* **Secure Email Authentication**: Register and log in using Supabase Auth with fully styled state indicators and persistent sessions.
* **Asynchronous Real-Time Price Feeds**: Live quotes (price, change, high/low, volume, and market state) are polled every 10 seconds on the backend via `yahoo-finance2` and streamed to the frontend via Server-Sent Events (SSE) using `EventSource`.
* **Interactive watchlists**: Add/remove any of the 5 supported tech stocks (`GOOG`, `TSLA`, `AMZN`, `META`, `NVDA`) from your watchlist. Watchlists are stored in Supabase and guarded with Row-Level Security (RLS) policies.
* **Multi-User Isolation**: Supports concurrent sessions. Multiple logged-in users receive the same global price updates but maintain entirely independent watchlists and subscription states.
* **Premium Editorial UI/UX**:
  * **Midnight Theme**: Deep `#000814` backdrop with `#010d1e` card surfaces.
  * **Neomorphic Depth**: 3D inset lighting shadows instead of flat elements or drop shadows.
  * **Floating Constellation**: Scattered candy-colored stock category tags featuring dynamic depth-of-field (background tags are blurred, foreground tags are crisp).
  * **Whisper-Thin Typography**: Font weight `100` Inter for body text combined with Space Grotesk display headings.

---

## 🛠️ Technology Stack

* **Frontend**: React, Vite, Recharts (for sparklines), Lucide React (for icons), Vanilla CSS
* **Backend**: Node.js, Express, Yahoo Finance API (`yahoo-finance2`), Server-Sent Events (SSE)
* **Database & Auth**: Supabase Auth, Supabase PostgreSQL (with RLS)

---

## ⚙️ Project Setup & Installation

### Prerequisite: Supabase Database Configuration
Before launching the servers, you need to create the `subscriptions` table in your Supabase project.

1. Go to your **Supabase Dashboard** → **SQL Editor** → **New Query**.
2. Run the following SQL block to create the table, enable Row-Level Security (RLS), and configure user-isolation policies:

```sql
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ticker)
);

-- Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies so users only access their own watchlists
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);
```

3. *(Optional)* Go to your **Supabase Dashboard** → **Authentication** → **Providers** → **Email Provider** and disable **"Confirm email"** to allow immediate testing without checking real inbox verification links.

---

### Step 1: Start the Backend Server
The backend polls real-time market data and streams it over port `3001`.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies (express, cors, yahoo-finance2)
npm install

# Start the SSE backend
npm start
```
The console will log initial market quotes and print `Backend server running on http://localhost:3001`.

### Step 2: Start the Frontend Client
The React application binds to Supabase and the local SSE stream.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (react, lucide-react, recharts, @supabase/supabase-js)
npm install

# Start the Vite HMR development server
npm run dev
```

Open `http://localhost:5173` (or the fallback local URL logged in the console) in your browser.

---

## 📁 Directory Structure

```
├── backend/
│   ├── server.js          # Express app, Yahoo Finance quotes fetcher, & SSE stream endpoint
│   └── package.json       # Backend ESM script config & dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx       # Login/Registration neomorphic view with floating tag backdrop
│   │   │   ├── Dashboard.jsx  # Hero banner, floating tag container, watchlist & stock card grid
│   │   │   ├── Header.jsx     # Transparent top nav bar, status indicators, & log out CTA
│   │   │   └── StockCard.jsx  # Individual stock grid panels with customized Recharts sparklines
│   │   ├── lib/
│   │   │   └── supabaseClient.js  # Supabase client credentials & initialization
│   │   ├── index.css          # Design system stylesheet (variables, fonts, neomorphic cards, tags)
│   │   └── App.jsx            # Core router/session controller
│   ├── index.html         # HTML template & Google Font imports
│   └── package.json       # Frontend project configuration
└── setup-supabase.js      # Utility script demonstrating manual table queries
```

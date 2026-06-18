# Vapour — Lightweight Real-Time Stock Dashboard

🌐 **Live Demo**: [https://vapour2.netlify.app/](https://vapour2.netlify.app/)

Vapour is a premium, real-time stock brokerage client web dashboard designed with an editorial aesthetic. Inspired by the *Copilot Money* design system, it features a midnight-canvas layout, whisper-thin typography, tiered neomorphic inset shadow elevations (no drop shadows), and a floating depth-of-field tag constellation.

The application satisfies all brokerage specifications including secure email authentication, real-time price feeds via [Finnhub](https://finnhub.io/) without page refreshes, persisted user-level watchlists via Supabase, and multi-user dashboard isolation.

---

## 🚀 Key Features

* **Secure Email Authentication**: Register and log in using Supabase Auth with fully styled state indicators and persistent sessions.
* **Asynchronous Real-Time Price Feeds**: Live quotes (price, change, high/low, market cap, 52-week data, and market state) are fetched directly from the [Finnhub](https://finnhub.io/) free API every 15 seconds — no backend server required.
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
* **Stock Data API**: [Finnhub](https://finnhub.io/) (free tier — 60 calls/min)
* **Database & Auth**: Supabase Auth, Supabase PostgreSQL (with RLS)
* **Hosting**: [Netlify](https://www.netlify.com/)

---

## ⚙️ Project Setup & Installation

### Prerequisite: Supabase Database Configuration
Before launching the app, you need to create the `subscriptions` table in your Supabase project.

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

### Finnhub API Key

1. Register for a free API key at [finnhub.io/register](https://finnhub.io/register)
2. Create a `frontend/.env` file:

```env
VITE_FINNHUB_API_KEY=your_api_key_here
```

3. If deploying to Netlify, add this same variable in **Site configuration → Environment variables**.

---

### Local Development

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite HMR development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Deployment (Netlify)

The project includes a [`netlify.toml`](netlify.toml) that auto-configures the build:

| Setting | Value |
|---|---|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` |

Just connect the GitHub repo to Netlify, add `VITE_FINNHUB_API_KEY` as an environment variable, and deploy.

---

## 📁 Directory Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx       # Login/Registration neomorphic view with floating tag backdrop
│   │   │   ├── Dashboard.jsx  # Hero banner, floating tag container, watchlist & stock card grid
│   │   │   ├── Header.jsx     # Transparent top nav bar, status indicators, & log out CTA
│   │   │   └── StockCard.jsx  # Individual stock grid panels with customized Recharts sparklines
│   │   ├── lib/
│   │   │   ├── supabaseClient.js  # Supabase client credentials & initialization
│   │   │   └── finnhubApi.js      # Finnhub API client for real-time stock data
│   │   ├── index.css          # Design system stylesheet (variables, fonts, neomorphic cards, tags)
│   │   └── App.jsx            # Core router/session controller
│   ├── index.html         # HTML template & Google Font imports
│   └── package.json       # Frontend project configuration
├── netlify.toml           # Netlify build configuration
└── setup-supabase.js      # Utility script demonstrating manual table queries
```

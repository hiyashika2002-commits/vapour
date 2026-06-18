import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchAllStocks } from '../lib/finnhubApi';
import Header from './Header';
import StockCard from './StockCard';
import { Activity, Star } from 'lucide-react';

const SUPPORTED_TICKERS = ['GOOG', 'TSLA', 'AMZN', 'META', 'NVDA'];

const HERO_TAGS = [
  { text: 'TSLA 🚗 Auto', color: 'tag-lime', top: '10%', left: '20%', rot: '8deg', scale: 0.9, blur: '1.5px', zIndex: 1, opacity: 0.8 },
  { text: 'NVDA 🧠 AI', color: 'tag-violet', top: '5%', right: '22%', rot: '-10deg', scale: 0.8, blur: '3px', zIndex: 1, opacity: 0.6 },
  { text: 'GOOG 🔍 Tech', color: 'tag-sky', top: '38%', left: '16%', rot: '-6deg', scale: 0.95, blur: '2px', zIndex: 1, opacity: 0.75 },
  { text: 'AMZN 📦 E-Comm', color: 'tag-tangerine', top: '22%', right: '18%', rot: '12deg', scale: 1.05, blur: '0px', zIndex: 3, opacity: 1 },
  { text: 'META 💬 Social', color: 'tag-hot-pink', top: '65%', left: '22%', rot: '6deg', scale: 1.0, blur: '0px', zIndex: 3, opacity: 1 },
  { text: 'Market 📈 Live', color: 'tag-sunflower', top: '55%', right: '20%', rot: '-8deg', scale: 0.9, blur: '1px', zIndex: 1, opacity: 0.8 },
];

const POLL_INTERVAL = 15000; // 15 seconds — well within 60 calls/min free tier

function Dashboard({ user, onLogout }) {
  const [stocks, setStocks] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [subscribed, setSubscribed] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const sparkRef = useRef({});

  // ── Load subscriptions from Supabase ─────────────────────────
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('ticker')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading subscriptions:', error);
          const saved = localStorage.getItem(`broker_subs_${user.id}`);
          if (saved) setSubscribed(JSON.parse(saved));
        } else {
          setSubscribed(data.map((d) => d.ticker));
        }
      } catch (err) {
        console.error('Failed to fetch subscriptions:', err);
      } finally {
        setLoadingSubs(false);
      }
    };

    if (user?.id) {
      fetchSubscriptions();
    }
  }, [user]);

  // ── Poll Finnhub directly (no backend needed) ────────────────
  useEffect(() => {
    let timer;
    let mounted = true;

    const poll = async () => {
      try {
        const data = await fetchAllStocks(SUPPORTED_TICKERS);
        if (!mounted) return;

        setStocks(data);
        setConnected(true);

        // Build sparklines from successive polls
        const updated = { ...sparkRef.current };
        SUPPORTED_TICKERS.forEach((t) => {
          if (data[t]?.price) {
            if (!updated[t]) updated[t] = [];
            updated[t] = [...updated[t], data[t].price].slice(-30);
          }
        });
        sparkRef.current = updated;
        setSparklines(updated);
      } catch (err) {
        console.error('Finnhub poll error:', err);
        if (mounted) setConnected(false);
      }
    };

    poll(); // initial fetch
    timer = setInterval(poll, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // ── Toggle subscription ──────────────────────────────────────
  const toggleSubscription = useCallback(
    async (ticker) => {
      const isCurrentlySubscribed = subscribed.includes(ticker);
      const newSubs = isCurrentlySubscribed
        ? subscribed.filter((s) => s !== ticker)
        : [...subscribed, ticker];
      setSubscribed(newSubs);

      try {
        if (isCurrentlySubscribed) {
          const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('ticker', ticker);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('subscriptions')
            .insert({ user_id: user.id, ticker });
          if (error) throw error;
        }
        localStorage.setItem(`broker_subs_${user.id}`, JSON.stringify(newSubs));
      } catch (err) {
        console.error('Subscription error:', err);
        setSubscribed(subscribed);
      }
    },
    [subscribed, user]
  );

  // Sort: subscribed first
  const sortedTickers = [...SUPPORTED_TICKERS].sort((a, b) => {
    const aSub = subscribed.includes(a);
    const bSub = subscribed.includes(b);
    if (aSub && !bSub) return -1;
    if (!aSub && bSub) return 1;
    return 0;
  });

  const subscribedStocks = SUPPORTED_TICKERS.filter((t) =>
    subscribed.includes(t)
  );

  return (
    <div className="dashboard-layout">
      <Header user={user} connected={connected} onLogout={onLogout} />

      <main className="dash-main">
        {/* Floating tags constellation for Hero */}
        <div className="floating-tags-container" style={{ position: 'absolute', inset: 0, height: '420px', zIndex: 0 }}>
          {HERO_TAGS.map((t, idx) => {
            const [symbol, emoji, ...rest] = t.text.split(' ');
            const label = `${symbol} ${rest.join(' ')}`;
            return (
              <div
                key={idx}
                className={`floating-tag ${t.color}`}
                style={{
                  top: t.top,
                  left: t.left,
                  right: t.right,
                  bottom: t.bottom,
                  opacity: t.opacity,
                  '--rot': t.rot,
                  '--scale': t.scale,
                  '--blur': t.blur,
                  '--z-index': t.zIndex,
                  animationDelay: `${idx * 0.4}s`,
                }}
              >
                <span className="tag-icon-wrapper">{emoji}</span>
                <span className="tag-text">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="dashboard-hero-eyebrow">Vapour Terminal</div>
          <h1 className="dashboard-hero-title">Lightweight Real-time Market Feeds</h1>
          <p className="dashboard-hero-desc">
            Stream price swings, customize your tracking panel, and inspect financial metrics on high-momentum tech stocks.
          </p>
        </div>

        {/* Market Overview */}
        <div className="section-header">
          <h2 className="section-title">
            <Activity />
            Market Overview
          </h2>
          <span className="section-subtitle">
            Real-time prices via Finnhub • Auto-refreshing every 15s
          </span>
        </div>

        <div className="stock-grid">
          {sortedTickers.map((ticker) => (
            <StockCard
              key={ticker}
              stock={stocks[ticker]}
              sparkline={sparklines[ticker]}
              isSubscribed={subscribed.includes(ticker)}
              onToggleSubscribe={toggleSubscription}
            />
          ))}
        </div>

        {/* Watchlist Section */}
        {subscribedStocks.length > 0 && (
          <div className="watchlist-section">
            <div className="section-header">
              <h2 className="section-title">
                <Star />
                Your Watchlist
              </h2>
              <span className="section-subtitle">
                {subscribedStocks.length} stock{subscribedStocks.length !== 1 ? 's' : ''} subscribed
              </span>
            </div>

            <div className="watchlist-grid">
              {subscribedStocks.map((ticker) => {
                const s = stocks[ticker];
                if (!s) return null;
                const isUp = s.change >= 0;
                return (
                  <div key={ticker} className="watchlist-item">
                    <div className="watchlist-left">
                      <div className="stock-icon" style={{ width: 36, height: 36, fontSize: '0.65rem' }}>
                        {ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="watchlist-symbol">{ticker}</div>
                        <div className="watchlist-name">{s.name}</div>
                      </div>
                    </div>
                    <span className={`watchlist-price ${isUp ? 'up' : 'down'}`}>
                      ${s.price?.toFixed(2)}{' '}
                      <span style={{ fontSize: '0.75rem' }}>
                        ({isUp ? '+' : ''}{s.changePercent?.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;

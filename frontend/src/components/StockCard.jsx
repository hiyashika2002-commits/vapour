import React, { useRef, useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Star, StarOff, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function StockCard({ stock, sparkline, isSubscribed, onToggleSubscribe }) {
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef(stock?.price);

  useEffect(() => {
    if (!stock?.price || prevPriceRef.current === undefined) {
      prevPriceRef.current = stock?.price;
      return;
    }

    if (stock.price > prevPriceRef.current) {
      setFlashClass('flash-green');
    } else if (stock.price < prevPriceRef.current) {
      setFlashClass('flash-red');
    }

    prevPriceRef.current = stock.price;

    const timer = setTimeout(() => setFlashClass(''), 1500);
    return () => clearTimeout(timer);
  }, [stock?.price]);

  if (!stock) return null;

  const isUp = stock.change >= 0;
  const changeColor = isUp ? 'up' : 'down';
  const chartColor = isUp ? '#00cc4b' : '#ff4433';

  // Build sparkline data
  const chartData = (sparkline || []).map((val, i) => ({ value: val, index: i }));

  const formatVolume = (vol) => {
    if (!vol) return '0';
    if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
    return vol.toString();
  };

  const formatMarketCap = (cap) => {
    if (!cap) return 'N/A';
    if (cap >= 1e12) return '$' + (cap / 1e12).toFixed(2) + 'T';
    if (cap >= 1e9) return '$' + (cap / 1e9).toFixed(1) + 'B';
    if (cap >= 1e6) return '$' + (cap / 1e6).toFixed(1) + 'M';
    return '$' + cap.toLocaleString();
  };

  const getMarketStateBadge = () => {
    const state = stock.marketState;
    if (state === 'REGULAR') return <span className="market-badge open">Open</span>;
    if (state === 'PRE') return <span className="market-badge pre">Pre-Market</span>;
    if (state === 'POST') return <span className="market-badge pre">After Hours</span>;
    return <span className="market-badge closed">Closed</span>;
  };

  return (
    <div className={`stock-card ${isSubscribed ? 'subscribed' : ''} ${flashClass}`}>
      <div className="stock-card-top">
        <div className="stock-identity">
          <div className="stock-icon">{stock.symbol?.slice(0, 2)}</div>
          <div className="stock-meta">
            <span className="stock-symbol">{stock.symbol}</span>
            <span className="stock-name">{stock.name}</span>
          </div>
        </div>

        <button
          className={`subscribe-btn ${isSubscribed ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSubscribe(stock.symbol);
          }}
          title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        >
          {isSubscribed ? <Star size={14} /> : <StarOff size={14} />}
          {isSubscribed ? 'Watching' : 'Watch'}
        </button>
      </div>

      <div className="stock-price-section">
        <span className={`stock-price ${changeColor}`}>
          ${stock.price?.toFixed(2) || '---'}
        </span>
        <div className={`stock-change change-${changeColor}`}>
          <span className="change-amount">
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {' '}{isUp ? '+' : ''}{stock.change?.toFixed(2)}
          </span>
          <span className="change-percent">
            {isUp ? '+' : ''}{stock.changePercent?.toFixed(2)}%
          </span>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="stock-sparkline">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`gradient-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={1.5}
                fill={`url(#gradient-${stock.symbol})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="stock-details">
        <div className="detail-item">
          <span className="detail-label">Day High</span>
          <span className="detail-value">${stock.dayHigh?.toFixed(2) || '—'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Day Low</span>
          <span className="detail-value">${stock.dayLow?.toFixed(2) || '—'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Volume</span>
          <span className="detail-value">{formatVolume(stock.volume)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Mkt Cap</span>
          <span className="detail-value">{formatMarketCap(stock.marketCap)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">52W High</span>
          <span className="detail-value">${stock.fiftyTwoWeekHigh?.toFixed(2) || '—'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Status</span>
          <span className="detail-value">{getMarketStateBadge()}</span>
        </div>
      </div>
    </div>
  );
}

export default StockCard;

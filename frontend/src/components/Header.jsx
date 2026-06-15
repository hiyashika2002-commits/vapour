import React, { useState, useEffect } from 'react';
import { TrendingUp, LogOut, Clock } from 'lucide-react';

function Header({ user, connected, onLogout }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const userInitial = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="dash-header">
      <div className="dash-header-left">
        <div className="dash-logo">
          <div className="dash-logo-icon">
            <TrendingUp />
          </div>
          <span className="dash-logo-text">Vapour</span>
        </div>

        <div className="dash-status">
          <div className={`status-dot ${connected ? '' : 'offline'}`} />
          {connected ? 'Live' : 'Reconnecting...'}
        </div>
      </div>

      <div className="dash-header-right">
        <div className="dash-time">
          <Clock size={12} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          {formatDate(time)} • {formatTime(time)}
        </div>

        <div className="dash-user">
          <div className="dash-user-avatar">{userInitial}</div>
          <div className="dash-user-info">
            <span className="dash-user-email">{user?.email || 'User'}</span>
            <span className="dash-user-role">Trader</span>
          </div>
        </div>

        <button className="dash-logout" onClick={onLogout}>
          <LogOut size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;

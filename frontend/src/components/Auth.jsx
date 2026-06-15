import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const FLOATING_TAGS = [
  { text: 'TSLA 🚗 Auto', color: 'tag-lime', top: '15%', left: '10%', rot: '-8deg', scale: 0.9, blur: '1.5px', zIndex: 1, opacity: 0.8 },
  { text: 'NVDA 🧠 AI', color: 'tag-violet', top: '25%', right: '12%', rot: '12deg', scale: 0.8, blur: '3px', zIndex: 1, opacity: 0.6 },
  { text: 'GOOG 🔍 Tech', color: 'tag-sky', top: '55%', right: '8%', rot: '10deg', scale: 1.05, blur: '0px', zIndex: 3, opacity: 1 },
  { text: 'Stocks 📈 Trade', color: 'tag-sunflower', bottom: '15%', right: '15%', rot: '-10deg', scale: 0.9, blur: '1px', zIndex: 1, opacity: 0.8 },
  { text: 'Options 📊 Leverage', color: 'tag-tangerine', bottom: '20%', left: '8%', rot: '6deg', scale: 1.0, blur: '0px', zIndex: 3, opacity: 1 },
  { text: 'Portfolio 💼 Assets', color: 'tag-olive', top: '65%', left: '20%', rot: '-5deg', scale: 0.95, blur: '2px', zIndex: 1, opacity: 0.75 },
];

function Auth() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        if (data?.user && !data?.session) {
          // Email confirmation required
          setSuccessMessage(
            `Confirmation email sent to ${email}. Please check your inbox and click the link to verify your account.`
          );
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Floating tags background constellation */}
      <div className="floating-tags-container">
        {FLOATING_TAGS.map((t, idx) => {
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
                animationDelay: `${idx * 0.5}s`,
              }}
            >
              <span className="tag-icon-wrapper">{emoji}</span>
              <span className="tag-text">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <TrendingUp />
            </div>
            <h1>Vapour</h1>
            <p>Lightweight real-time stock analytics</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => { setMode('signin'); setError(''); setSuccessMessage(''); }}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); }}
              type="button"
            >
              Sign Up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {successMessage && (
            <div className="auth-success">
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {!successMessage && (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Mail className="form-icon" />
              </div>

              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <Lock className="form-icon" />
              </div>

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="auth-footer">
            Secure authentication powered by Supabase
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;

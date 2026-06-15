import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle the email confirmation redirect
    // Supabase appends tokens to the URL hash after email verification
    const handleAuthRedirect = async () => {
      const hashParams = new URLSearchParams(
        window.location.hash.substring(1)
      );

      // If there's an error in the hash (e.g., expired link)
      if (hashParams.get('error')) {
        const errorDesc = hashParams.get('error_description')?.replace(/\+/g, ' ');
        console.warn('Auth redirect error:', errorDesc);
        // Clear the hash so the error doesn't persist on refresh
        window.history.replaceState(null, '', window.location.pathname);
      }

      // If there are access tokens in the hash, Supabase will automatically
      // exchange them via onAuthStateChange. We just need to clean the URL.
      if (hashParams.get('access_token')) {
        // Give Supabase a moment to process the tokens
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleAuthRedirect();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (including email confirmation callbacks)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);

      // Clean URL after successful sign in via email confirmation
      if (event === 'SIGNED_IN' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span className="loading-text">Initializing Vapour...</span>
      </div>
    );
  }

  return (
    <>
      {session ? (
        <Dashboard user={session.user} onLogout={handleLogout} />
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App;

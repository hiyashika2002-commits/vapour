/**
 * Run this script ONCE to create the 'subscriptions' table in Supabase.
 * Usage: node setup-supabase.js
 */

const SUPABASE_URL = 'https://fbtfobpvgatfqylzjopo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidGZvYnB2Z2F0ZnF5bHpqb3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mjc4OTcsImV4cCI6MjA5NzEwMzg5N30.JqC_AyZWUuWtPretrlU6-WN5oU2hEnLhzB_LsW83WnQ';

async function setupDatabase() {
  console.log('Setting up Supabase database...\n');

  // SQL to create the subscriptions table
  const sql = `
    -- Create subscriptions table if not exists
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      ticker TEXT NOT NULL,
      subscribed_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, ticker)
    );

    -- Enable RLS
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist (idempotent)
    DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
    DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
    DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;

    -- Create RLS policies
    CREATE POLICY "Users can view their own subscriptions"
      ON subscriptions FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own subscriptions"
      ON subscriptions FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own subscriptions"
      ON subscriptions FOR DELETE
      USING (auth.uid() = user_id);
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      console.log('Note: The REST API cannot run raw SQL directly.');
      console.log('You need to run the SQL below in the Supabase SQL Editor:');
      console.log('Go to: https://supabase.com/dashboard → SQL Editor\n');
      console.log('='.repeat(60));
      console.log(sql);
      console.log('='.repeat(60));
    } else {
      console.log('✓ Database setup complete!');
    }
  } catch (err) {
    console.log('Cannot run SQL via REST API (expected).');
    console.log('Please run the following SQL in your Supabase SQL Editor:\n');
    console.log('Go to: https://supabase.com/dashboard → your project → SQL Editor\n');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
  }
}

setupDatabase();

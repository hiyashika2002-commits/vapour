import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbtfobpvgatfqylzjopo.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidGZvYnB2Z2F0ZnF5bHpqb3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mjc4OTcsImV4cCI6MjA5NzEwMzg5N30.JqC_AyZWUuWtPretrlU6-WN5oU2hEnLhzB_LsW83WnQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

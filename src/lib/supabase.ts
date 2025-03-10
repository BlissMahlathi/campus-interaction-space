
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qixoidricuounrfucmwc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeG9pZHJpY3VvdW5yZnVjbXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNDE4ODMsImV4cCI6MjA1NjcxNzg4M30.Lju_cvxjkjOZguO_yowu3Y-gcH4e3Bw8Tey0P9zOPCU';

export const supabase = createClient(supabaseUrl, supabaseKey);

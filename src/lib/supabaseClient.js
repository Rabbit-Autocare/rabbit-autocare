import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bisrgvfnsoqrbrrilcnu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpc3JndmZuc29xcmJycmlsY251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDI0NzgsImV4cCI6MjA2Mjc3ODQ3OH0.9gZ5wfO3_McxvRSguwq40vFxiq0qlH6MS_ikSe3culU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

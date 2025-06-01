import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';


const extra = Constants.expoConfig?.extra || Constants.manifest?.extra;

const { SUPABASE_URL, SUPABASE_ANON_KEY } = extra;


export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { enabled: false },
  }
);

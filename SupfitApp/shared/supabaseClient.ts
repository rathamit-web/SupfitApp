import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Failing fast avoids silent auth misconfigurations.
  throw new Error('Supabase environment variables are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

// Platform-specific storage adapter
class SecureStoreAdapter {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    // Use SecureStore on native
    return SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    // Use SecureStore on native
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  }

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      // Use localStorage on web
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return;
    }
    // Use SecureStore on native
    await SecureStore.deleteItemAsync(key);
  }
}

// NOTE: We do not currently ship generated Database types in this repo.
// Avoid constraining SupabaseClientOptions with a schema generic, otherwise
// TypeScript may infer an overly-narrow Database type like `{ public: never }`,
// which makes `.from('table')` calls resolve to `never`.
const clientOptions: SupabaseClientOptions = {
  auth: {
    storage: new SecureStoreAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};

const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, clientOptions);

export { supabase };
export default supabase;

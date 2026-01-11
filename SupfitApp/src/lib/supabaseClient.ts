
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Fail fast if env is missing to avoid silent auth misconfiguration.
const SUPABASE_URL =
	process.env.EXPO_PUBLIC_SUPABASE_URL ||
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	process.env.VITE_SUPABASE_URL ||
	'';
const SUPABASE_ANON_KEY =
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	process.env.VITE_SUPABASE_ANON_KEY ||
	'';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	throw new Error('Supabase environment variables are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

// Use SecureStore on native to keep sessions off-disk in plaintext.
const secureStoreAdapter =
	Platform.OS === 'web'
		? undefined
		: {
				getItem: (key: string) => SecureStore.getItemAsync(key),
				setItem: (key: string, value: string) =>
					SecureStore.setItemAsync(key, value, {
						keychainAccessible: SecureStore.WHEN_UNLOCKED,
					}),
				removeItem: (key: string) => SecureStore.deleteItemAsync(key),
			};

const clientOptions: SupabaseClientOptions<'public'> = {
	auth: {
		...(secureStoreAdapter ? { storage: secureStoreAdapter } : {}),
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: Platform.OS === 'web',
	},
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);

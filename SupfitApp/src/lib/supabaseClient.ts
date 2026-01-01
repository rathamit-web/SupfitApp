
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
let storageOption = undefined;
if (Platform.OS !== 'web') {
	// Only import AsyncStorage on native
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const AsyncStorage = require('@react-native-async-storage/async-storage').default;
	storageOption = AsyncStorage;
}

console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
	SUPABASE_URL,
	SUPABASE_ANON_KEY,
	{
		auth: {
			...(storageOption ? { storage: storageOption } : {}),
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: false,
		},
	}
);

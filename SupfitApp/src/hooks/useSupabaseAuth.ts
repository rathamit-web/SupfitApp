import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSupabaseAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login or signup with email/password
  async function signInOrSignUp(email: string, password: string, isLogin: boolean) {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }
      if (result.error) setError(result.error.message);
      return result;
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      return { error: e };
    } finally {
      setLoading(false);
    }
  }

  return { signInOrSignUp, loading, error };
}

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
        
        // Check for specific error types
        if (result.error) {
          if (result.error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (result.error.message.includes('Email not confirmed')) {
            setError('Please confirm your email before logging in. Check your inbox for a confirmation link.');
          } else {
            setError(result.error.message);
          }
        }
      } else {
        // Sign up - include selected role in metadata so trigger can read it
        const userType = (window as any).__supfit_selected_role || 'individual';
        console.log('[useSupabaseAuth] Signup: userType from global context =', userType);
        result = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              created_at: new Date().toISOString(),
              role: userType,
              role_source: 'user_selection',
            }
          }
        });
        
        if (result.error) {
          if (result.error.message.includes('already registered')) {
            setError('This email is already registered. Please login instead.');
          } else {
            setError(result.error.message);
          }
        } else if (result.data?.user && !result.data.session) {
          // User created but no session means email confirmation is required
          setError('CONFIRM_EMAIL');
        }
      }
      return result;
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      return { error: e };
    } finally {
      setLoading(false);
    }
  }

  // Resend confirmation email
  async function resendConfirmationEmail(email: string) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        setError(error.message);
        return { error };
      }
      return { success: true };
    } catch (e: any) {
      setError(e.message || 'Failed to resend confirmation email');
      return { error: e };
    } finally {
      setLoading(false);
    }
  }

  return { signInOrSignUp, resendConfirmationEmail, loading, error, setError };
}

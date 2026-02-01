import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import supabaseClient from '../../shared/supabaseClient';
import { getLocalActiveDateString, readTodayActiveMinutes } from '../health/activeHours';

type SyncResult = {
  ok: true;
  minutesActive: number;
  source: string;
} | {
  ok: false;
  error: string;
};

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabaseClient.auth.getSession();
  return data?.session?.access_token ?? null;
}

export function useActiveHoursSync(options?: { onSynced?: () => void }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const syncToday = useCallback(async (): Promise<SyncResult> => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return { ok: false, error: 'Active Hours sync is only available on iOS/Android.' };
    }

    setIsSyncing(true);
    setLastError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        return { ok: false, error: 'You must be signed in to sync.' };
      }

      // 1) Read from platform provider
      const read = await readTodayActiveMinutes();
      const activeDate = getLocalActiveDateString(new Date());

      // 2) Store consent (server-side) after OS permissions are granted
      const { error: consentError } = await supabaseClient.functions.invoke('set-active-hours-consent', {
        body: {
          granted: true,
          // Keep this short-lived unless you add a renewal UI.
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            platform: Platform.OS,
          },
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (consentError) {
        return { ok: false, error: 'Failed to record consent. Please try again.' };
      }

      // 3) Push derived total to Supabase
      const { data, error } = await supabaseClient.functions.invoke('ingest-active-hours', {
        body: {
          activeDate,
          minutesActive: read.minutesActive,
          source: read.source,
          confidence: read.confidence,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        const message = (error as any)?.message || 'Sync failed.';
        return { ok: false, error: message };
      }

      if (!data?.ok) {
        return { ok: false, error: 'Sync failed.' };
      }

      options?.onSynced?.();
      return { ok: true, minutesActive: read.minutesActive, source: read.source };
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : 'Sync failed.';
      setLastError(message);
      return { ok: false, error: message };
    } finally {
      setIsSyncing(false);
    }
  }, [options]);

  return { syncToday, isSyncing, lastError };
}

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import supabaseClient from '../lib/supabaseClient';
import { getLocalActiveDateString } from '../health/activeHours';
import { readTodayDailyMetrics, type DailyMetricsReadResult } from '../health/dailyMetrics';

type SyncResult =
  | { ok: true; metrics: DailyMetricsReadResult }
  | { ok: false; error: string };

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabaseClient.auth.getSession();
  return data?.session?.access_token ?? null;
}

export function useDailyMetricsSync(options?: { onSynced?: () => void }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const syncToday = useCallback(async (): Promise<SyncResult> => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return { ok: false, error: 'Daily metrics sync is only available on iOS/Android.' };
    }

    setIsSyncing(true);
    setLastError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        return { ok: false, error: 'You must be signed in to sync.' };
      }

      const metrics = await readTodayDailyMetrics();
      const metricDate = getLocalActiveDateString(new Date());

      const { error: consentError } = await supabaseClient.functions.invoke('set-daily-metrics-consent', {
        body: {
          granted: true,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            platform: Platform.OS,
            source: metrics.source,
          },
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (consentError) {
        return { ok: false, error: 'Failed to record consent. Please try again.' };
      }

      const { data, error } = await supabaseClient.functions.invoke('ingest-daily-metrics', {
        body: {
          metricDate,
          steps: metrics.steps,
          caloriesKcal: metrics.caloriesKcal,
          avgHrBpm: metrics.avgHeartRateBpm,
          sleepMinutes: metrics.sleepMinutes,
          gymMinutes: metrics.gymMinutes,
          badmintonMinutes: metrics.badmintonMinutes,
          swimMinutes: metrics.swimMinutes,
          source: metrics.source,
          confidence: metrics.confidence,
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
      return { ok: true, metrics };
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

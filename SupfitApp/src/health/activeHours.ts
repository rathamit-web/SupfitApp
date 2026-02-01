import { Platform } from 'react-native';

type HealthKitPermissions = import('react-native-health').HealthKitPermissions;
type HealthValue = import('react-native-health').HealthValue;

export type ActiveHoursSource = 'healthkit' | 'health_connect' | 'google_fit' | 'manual' | 'unknown';

export type ActiveHoursReadResult = {
  minutesActive: number;
  source: ActiveHoursSource;
  confidence?: number;
};

export function getLocalActiveDateString(day: Date): string {
  const yyyy = day.getFullYear();
  const mm = String(day.getMonth() + 1).padStart(2, '0');
  const dd = String(day.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getLocalDayRangeIso(day: Date): { startIso: string; endIso: string } {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

let healthKitInitPromise: Promise<void> | null = null;

async function ensureHealthKitInitialized(): Promise<void> {
  if (healthKitInitPromise) return healthKitInitPromise;

  healthKitInitPromise = new Promise<void>((resolve, reject) => {
    // Lazy import so Android/web bundles don’t eagerly require HealthKit.
    import('react-native-health')
      .then((mod) => {
        const AppleHealthKit = mod.default;
        const permissions = {
          permissions: {
            read: [(mod as any).HealthDataType?.AppleExerciseTime ?? 'AppleExerciseTime'],
            write: [],
          },
        } as HealthKitPermissions;

        AppleHealthKit.initHealthKit(permissions, (err: string) => {
          if (err) {
            reject(new Error(err));
            return;
          }
          resolve();
        });
      })
      .catch((e) => reject(e));
  });

  return healthKitInitPromise;
}

export async function readActiveMinutesFromHealthKit(day: Date): Promise<ActiveHoursReadResult> {
  if (Platform.OS !== 'ios') {
    return { minutesActive: 0, source: 'unknown', confidence: 0 };
  }

  await ensureHealthKitInitialized();
  const { startIso, endIso } = getLocalDayRangeIso(day);

  const mod = await import('react-native-health');
  const AppleHealthKit = mod.default;

  const samples = await new Promise<HealthValue[]>((resolve, reject) => {
    AppleHealthKit.getAppleExerciseTime(
      { startDate: startIso, endDate: endIso, unit: (mod as any).HealthUnit?.minute ?? 'minute' },
      (err: string, results: HealthValue[]) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(Array.isArray(results) ? results : []);
      },
    );
  });

  const totalMinutes = samples.reduce((sum, sample) => {
    const v = typeof sample?.value === 'number' ? sample.value : 0;
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  return {
    minutesActive: Math.max(0, Math.round(totalMinutes)),
    source: 'healthkit',
    confidence: 100,
  };
}

let healthConnectInitPromise: Promise<boolean> | null = null;

async function ensureHealthConnectInitialized(): Promise<boolean> {
  if (healthConnectInitPromise) return healthConnectInitPromise;
  healthConnectInitPromise = import('react-native-health-connect').then(async (hc) => {
    try {
      return await hc.initialize();
    } catch {
      return false;
    }
  });
  return healthConnectInitPromise;
}

export async function readActiveMinutesFromHealthConnect(day: Date): Promise<ActiveHoursReadResult> {
  if (Platform.OS !== 'android') {
    return { minutesActive: 0, source: 'unknown', confidence: 0 };
  }

  const hc = await import('react-native-health-connect');
  const ok = await ensureHealthConnectInitialized();
  if (!ok) {
    throw new Error('Health Connect is not available');
  }

  // Request minimal permission: ExerciseSession (duration-based).
  await hc.requestPermission([{ accessType: 'read', recordType: 'ExerciseSession' }]);

  const { startIso, endIso } = getLocalDayRangeIso(day);

  // Note: The public typings for readRecords are inconsistent across versions.
  // The native module supports { startTime, endTime }.
  const sessions = (await hc.readRecords('ExerciseSession', {
    startTime: startIso,
    endTime: endIso,
  } as any)) as any[];

  const totalMinutes = sessions.reduce((sum, session) => {
    const start = Date.parse(session?.startTime);
    const end = Date.parse(session?.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return sum;
    return sum + (end - start) / 60000;
  }, 0);

  return {
    minutesActive: Math.max(0, Math.round(totalMinutes)),
    source: 'health_connect',
    confidence: 90,
  };
}

export async function readTodayActiveMinutes(): Promise<ActiveHoursReadResult> {
  const today = new Date();
  if (Platform.OS === 'ios') return readActiveMinutesFromHealthKit(today);
  if (Platform.OS === 'android') return readActiveMinutesFromHealthConnect(today);
  return { minutesActive: 0, source: 'unknown', confidence: 0 };
}

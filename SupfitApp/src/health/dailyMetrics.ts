import { Platform } from 'react-native';
import { getLocalDayRangeIso } from './activeHours';

type HealthKitPermissions = import('react-native-health').HealthKitPermissions;

type HealthValue = import('react-native-health').HealthValue;

type HealthSample = {
  value?: number;
  startDate?: string;
  endDate?: string;
};

export type DailyMetricsSource = 'healthkit' | 'health_connect' | 'google_fit' | 'manual' | 'unknown';

export type DailyMetricsReadResult = {
  steps: number;
  caloriesKcal: number;
  avgHeartRateBpm: number;
  sleepMinutes: number;
  gymMinutes: number;
  badmintonMinutes: number;
  swimMinutes: number;
  source: DailyMetricsSource;
  confidence?: number;
};

let healthKitInitPromise: Promise<void> | null = null;

async function ensureHealthKitInitialized(): Promise<void> {
  if (healthKitInitPromise) return healthKitInitPromise;

  healthKitInitPromise = new Promise<void>((resolve, reject) => {
    import('react-native-health')
      .then((mod) => {
        const AppleHealthKit = mod.default;
        const HealthDataType = (mod as any).HealthDataType ?? {};
        const permissions = {
          permissions: {
            read: [
              HealthDataType.StepCount ?? 'StepCount',
              HealthDataType.ActiveEnergyBurned ?? 'ActiveEnergyBurned',
              HealthDataType.HeartRate ?? 'HeartRate',
              HealthDataType.SleepAnalysis ?? 'SleepAnalysis',
            ],
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

async function readHealthKitSteps(startIso: string, endIso: string): Promise<number> {
  const mod = await import('react-native-health');
  const AppleHealthKit = mod.default;

  const response = await new Promise<{ value?: number }>((resolve, reject) => {
    AppleHealthKit.getStepCount({ startDate: startIso, endDate: endIso }, (err: string, results: any) => {
      if (err) {
        reject(new Error(err));
        return;
      }
      resolve(results ?? {});
    });
  });

  return Number.isFinite(response?.value) ? Math.max(0, Math.round(response.value ?? 0)) : 0;
}

async function readHealthKitActiveEnergy(startIso: string, endIso: string): Promise<number> {
  const mod = await import('react-native-health');
  const AppleHealthKit = mod.default;

  const samples = await new Promise<HealthValue[]>((resolve, reject) => {
    AppleHealthKit.getActiveEnergyBurned(
      { startDate: startIso, endDate: endIso, unit: (mod as any).HealthUnit?.kilocalorie ?? 'kilocalorie' },
      (err: string, results: HealthValue[]) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(Array.isArray(results) ? results : []);
      },
    );
  });

  const total = samples.reduce((sum, sample) => {
    const v = typeof sample?.value === 'number' ? sample.value : 0;
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  return Math.max(0, Math.round(total));
}

async function readHealthKitAvgHeartRate(startIso: string, endIso: string): Promise<number> {
  const mod = await import('react-native-health');
  const AppleHealthKit = mod.default;

  const samples = await new Promise<HealthValue[]>((resolve, reject) => {
    AppleHealthKit.getHeartRateSamples(
      { startDate: startIso, endDate: endIso, unit: (mod as any).HealthUnit?.bpm ?? 'bpm' },
      (err: string, results: HealthValue[]) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(Array.isArray(results) ? results : []);
      },
    );
  });

  if (!samples.length) return 0;
  const { sum, count } = samples.reduce(
    (acc, sample) => {
      const v = typeof sample?.value === 'number' ? sample.value : 0;
      if (Number.isFinite(v) && v > 0) {
        acc.sum += v;
        acc.count += 1;
      }
      return acc;
    },
    { sum: 0, count: 0 },
  );

  if (!count) return 0;
  return Math.max(0, Math.round(sum / count));
}

async function readHealthKitSleepMinutes(startIso: string, endIso: string): Promise<number> {
  const mod = await import('react-native-health');
  const AppleHealthKit = mod.default as any;

  if (typeof AppleHealthKit.getSleepSamples !== 'function') {
    return 0;
  }

  const samples = await new Promise<HealthSample[]>((resolve, reject) => {
    AppleHealthKit.getSleepSamples({ startDate: startIso, endDate: endIso }, (err: string, results: any[]) => {
      if (err) {
        reject(new Error(err));
        return;
      }
      resolve(Array.isArray(results) ? results : []);
    });
  });

  const totalMinutes = samples.reduce((sum, sample) => {
    const start = sample?.startDate ? Date.parse(sample.startDate) : NaN;
    const end = sample?.endDate ? Date.parse(sample.endDate) : NaN;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return sum;
    return sum + (end - start) / 60000;
  }, 0);

  return Math.max(0, Math.round(totalMinutes));
}

export async function readDailyMetricsFromHealthKit(day: Date): Promise<DailyMetricsReadResult> {
  if (Platform.OS !== 'ios') {
    return {
      steps: 0,
      caloriesKcal: 0,
      avgHeartRateBpm: 0,
      sleepMinutes: 0,
      gymMinutes: 0,
      badmintonMinutes: 0,
      swimMinutes: 0,
      source: 'unknown',
      confidence: 0,
    };
  }

  await ensureHealthKitInitialized();
  const { startIso, endIso } = getLocalDayRangeIso(day);

  const [steps, calories, avgHr, sleepMinutes] = await Promise.all([
    readHealthKitSteps(startIso, endIso),
    readHealthKitActiveEnergy(startIso, endIso),
    readHealthKitAvgHeartRate(startIso, endIso),
    readHealthKitSleepMinutes(startIso, endIso),
  ]);

  return {
    steps,
    caloriesKcal: calories,
    avgHeartRateBpm: avgHr,
    sleepMinutes,
    gymMinutes: 0,
    badmintonMinutes: 0,
    swimMinutes: 0,
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

async function readHealthConnectRecords(recordType: any, startIso: string, endIso: string): Promise<any[]> {
  const hc = await import('react-native-health-connect');
  return (await hc.readRecords(recordType as any, { startTime: startIso, endTime: endIso } as any)) as any[];
}

export async function readDailyMetricsFromHealthConnect(day: Date): Promise<DailyMetricsReadResult> {
  if (Platform.OS !== 'android') {
    return {
      steps: 0,
      caloriesKcal: 0,
      avgHeartRateBpm: 0,
      sleepMinutes: 0,
      gymMinutes: 0,
      badmintonMinutes: 0,
      swimMinutes: 0,
      source: 'unknown',
      confidence: 0,
    };
  }

  const hc = await import('react-native-health-connect');
  const ok = await ensureHealthConnectInitialized();
  if (!ok) {
    throw new Error('Health Connect is not available');
  }

  await hc.requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'SleepSession' },
  ] as any);

  const { startIso, endIso } = getLocalDayRangeIso(day);

  const [stepsRecords, caloriesRecords, heartRateRecords, sleepRecords] = await Promise.all([
    readHealthConnectRecords('Steps', startIso, endIso),
    readHealthConnectRecords('ActiveCaloriesBurned', startIso, endIso),
    readHealthConnectRecords('HeartRate', startIso, endIso),
    readHealthConnectRecords('SleepSession', startIso, endIso),
  ]);

  const steps = stepsRecords.reduce((sum, record) => {
    const count = Number(record?.count ?? record?.steps ?? 0);
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);

  const calories = caloriesRecords.reduce((sum, record) => {
    const energy =
      record?.energy?.inKilocalories ??
      record?.energy?.kilocalories ??
      record?.energy?.value ??
      record?.calories ??
      0;
    const value = Number(energy);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const heartRates = heartRateRecords.flatMap((record) => {
    if (Array.isArray(record?.samples)) {
      return record.samples.map((sample: any) => sample?.beatsPerMinute ?? sample?.bpm ?? 0);
    }
    return [record?.beatsPerMinute ?? record?.bpm ?? 0];
  });

  const avgHeartRateBpm = heartRates.length
    ? Math.round(
        heartRates.reduce((sum: number, value: number) => sum + (Number.isFinite(value) ? value : 0), 0) /
          heartRates.length,
      )
    : 0;

  const sleepMinutes = sleepRecords.reduce((sum, record) => {
    const start = Date.parse(record?.startTime);
    const end = Date.parse(record?.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return sum;
    return sum + (end - start) / 60000;
  }, 0);

  return {
    steps: Math.max(0, Math.round(steps)),
    caloriesKcal: Math.max(0, Math.round(calories)),
    avgHeartRateBpm: Math.max(0, Math.round(avgHeartRateBpm)),
    sleepMinutes: Math.max(0, Math.round(sleepMinutes)),
    gymMinutes: 0,
    badmintonMinutes: 0,
    swimMinutes: 0,
    source: 'health_connect',
    confidence: 90,
  };
}

export async function readTodayDailyMetrics(): Promise<DailyMetricsReadResult> {
  const today = new Date();
  if (Platform.OS === 'ios') return readDailyMetricsFromHealthKit(today);
  if (Platform.OS === 'android') return readDailyMetricsFromHealthConnect(today);
  return {
    steps: 0,
    caloriesKcal: 0,
    avgHeartRateBpm: 0,
    sleepMinutes: 0,
    gymMinutes: 0,
    badmintonMinutes: 0,
    swimMinutes: 0,
    source: 'unknown',
    confidence: 0,
  };
}

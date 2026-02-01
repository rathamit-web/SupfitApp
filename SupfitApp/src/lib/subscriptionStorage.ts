// AsyncStorage utility for subscriptions
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUBSCRIPTION_KEYS = {
  gym: 'gymSubscription',
  coach: 'coachSubscription',
  dietician: 'dieticianSubscription',
};

export type SubscriptionType = keyof typeof SUBSCRIPTION_KEYS;

export async function saveSubscription(type: SubscriptionType, data: unknown) {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS[type], JSON.stringify(data));
  } catch {
    // Best-effort persistence; ignore failures.
  }
}

export async function getSubscription<T = unknown>(type: SubscriptionType): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(SUBSCRIPTION_KEYS[type]);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function clearSubscription(type: SubscriptionType) {
  try {
    await AsyncStorage.removeItem(SUBSCRIPTION_KEYS[type]);
  } catch {
    // Ignore
  }
}

// AsyncStorage utility for subscriptions
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUBSCRIPTION_KEYS = {
  gym: 'gymSubscription',
  coach: 'coachSubscription',
  dietician: 'dieticianSubscription',
};

export async function saveSubscription(type, data) {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_KEYS[type], JSON.stringify(data));
  } catch (e) {
    // handle error
  }
}

export async function getSubscription(type) {
  try {
    const value = await AsyncStorage.getItem(SUBSCRIPTION_KEYS[type]);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
}

export async function clearSubscription(type) {
  try {
    await AsyncStorage.removeItem(SUBSCRIPTION_KEYS[type]);
  } catch (e) {}
}

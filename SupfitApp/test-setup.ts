import { afterAll, afterEach, beforeAll, jest } from '@jest/globals';
import { setupServer } from 'msw/native';
import '@testing-library/react-native/extend-expect';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Basic SecureStore mock to keep tests from touching device keychain.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
}));

// Silence React Native animated warnings in tests.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

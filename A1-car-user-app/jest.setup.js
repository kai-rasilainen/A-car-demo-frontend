// Jest setup for React Native testing
import '@testing-library/jest-native/extend-expect';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Silence React Native warnings
jest.mock('react-native/Libraries/LogBox/LogBox');

// Mock Animated for React Native
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Clean up after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});

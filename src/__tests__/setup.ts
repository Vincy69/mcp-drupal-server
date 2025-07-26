// Global test setup
import 'jest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DRUPAL_BASE_URL = 'http://localhost:8080';
process.env.DRUPAL_USERNAME = 'test_user';
process.env.DRUPAL_PASSWORD = 'test_password';

// Setup global test timeout
jest.setTimeout(10000);
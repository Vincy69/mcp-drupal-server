import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise during tests

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging failed tests
  error: console.error,
};

// Global test timeout
jest.setTimeout(10000);

// Mock axios for API calls
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
export const mockApiResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

export const mockApiError = (message: string, status = 500) => ({
  response: {
    data: { error: message },
    status,
    statusText: 'Error',
    headers: {},
    config: {} as any,
  },
  isAxiosError: true,
  message,
});

// Test data factories
export const createMockDrupalModule = (overrides = {}) => ({
  name: 'Test Module',
  machine_name: 'test_module',
  description: 'A test module',
  version: '1.0.0',
  core_version_requirement: '^10 || ^11',
  type: 'module',
  ...overrides,
});

export const createMockDrupalFunction = (overrides = {}) => ({
  name: 'test_function',
  signature: 'test_function($param1, $param2 = NULL)',
  description: 'A test function',
  parameters: [
    { name: '$param1', type: 'string', description: 'First parameter' },
    { name: '$param2', type: 'mixed', description: 'Second parameter', default: 'NULL' },
  ],
  return: { type: 'array', description: 'An array of results' },
  deprecated: false,
  since: '10.0.0',
  ...overrides,
});

export const createMockDrupalHook = (overrides = {}) => ({
  name: 'hook_test',
  description: 'A test hook',
  signature: 'hook_test($param)',
  parameters: [{ name: '$param', type: 'array', description: 'Hook parameter' }],
  return: { type: 'void' },
  group: 'test',
  file: 'test.api.php',
  ...overrides,
});

// Environment setup helpers
export const setupTestEnvironment = (overrides = {}) => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DRUPAL_BASE_URL: 'http://test.local',
      DRUPAL_USERNAME: 'test_user',
      DRUPAL_PASSWORD: 'test_pass',
      CACHE_TIMEOUT: '60000',
      API_TIMEOUT: '5000',
      MAX_RETRIES: '1',
      ...overrides,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
};

// Dummy test to satisfy Jest requirement
describe('Test Setup', () => {
  it('should be configured correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

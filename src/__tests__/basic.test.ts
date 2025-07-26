import { describe, it, expect } from '@jest/globals';

describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should handle string operations', () => {
    const str = 'Drupal MCP';
    expect(str.toLowerCase()).toBe('drupal mcp');
  });
  
  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBeTruthy();
  });
  
  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });
});

describe('Environment Tests', () => {
  it('should be in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
  
  it('should have test configuration', () => {
    expect(process.env.LOG_LEVEL).toBe('error');
  });
});
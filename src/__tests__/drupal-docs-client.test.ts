import { jest } from '@jest/globals';
import axios from 'axios';
import { DrupalDocsClient } from '../drupal-docs-client.js';
import { 
  mockApiResponse, 
  mockApiError, 
  createMockDrupalFunction,
  createMockDrupalHook,
  setupTestEnvironment 
} from './setup.js';

describe('DrupalDocsClient', () => {
  let client: DrupalDocsClient;
  let mockAxios: any;
  
  setupTestEnvironment();
  
  beforeEach(() => {
    client = new DrupalDocsClient();
    mockAxios = (axios.create as jest.Mock).mock.results[0].value;
  });
  
  describe('searchFunctions', () => {
    it('should search functions successfully', async () => {
      const mockFunctions = [
        createMockDrupalFunction({ name: 'drupal_set_message' }),
        createMockDrupalFunction({ name: 'drupal_get_messages' }),
      ];
      
      mockAxios.get.mockResolvedValueOnce(
        mockApiResponse({ functions: mockFunctions })
      );
      
      const result = await client.searchFunctions('11.x', 'message');
      
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/drupal/11.x/functions'),
        expect.objectContaining({
          params: { query: 'message' }
        })
      );
      expect(result).toEqual(mockFunctions);
    });
    
    it('should handle API errors gracefully', async () => {
      mockAxios.get.mockRejectedValueOnce(
        mockApiError('API Error', 500)
      );
      
      const result = await client.searchFunctions('11.x', 'test');
      
      expect(result).toEqual([]);
    });
    
    it('should return cached results on subsequent calls', async () => {
      const mockFunctions = [createMockDrupalFunction()];
      
      mockAxios.get.mockResolvedValueOnce(
        mockApiResponse({ functions: mockFunctions })
      );
      
      // First call
      await client.searchFunctions('11.x', 'test');
      
      // Second call - should use cache
      const result = await client.searchFunctions('11.x', 'test');
      
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFunctions);
    });
  });
  
  describe('searchHooks', () => {
    it('should search hooks successfully', async () => {
      const mockHooks = [
        createMockDrupalHook({ name: 'hook_entity_view' }),
        createMockDrupalHook({ name: 'hook_entity_presave' }),
      ];
      
      mockAxios.get.mockResolvedValueOnce(
        mockApiResponse({ hooks: mockHooks })
      );
      
      const result = await client.searchHooks('11.x', 'entity');
      
      expect(result).toEqual(mockHooks);
    });
    
    it('should handle empty results', async () => {
      mockAxios.get.mockResolvedValueOnce(
        mockApiResponse({ hooks: [] })
      );
      
      const result = await client.searchHooks('11.x', 'nonexistent');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('searchAll', () => {
    it('should aggregate results from multiple endpoints', async () => {
      const mockFunctions = [createMockDrupalFunction()];
      const mockHooks = [createMockDrupalHook()];
      const mockClasses = [{ name: 'TestClass', type: 'class' }];
      
      mockAxios.get
        .mockResolvedValueOnce(mockApiResponse({ functions: mockFunctions }))
        .mockResolvedValueOnce(mockApiResponse({ hooks: mockHooks }))
        .mockResolvedValueOnce(mockApiResponse({ classes: mockClasses }))
        .mockResolvedValueOnce(mockApiResponse({ services: [] }))
        .mockResolvedValueOnce(mockApiResponse({ topics: [] }));
      
      const result = await client.searchAll('11.x', 'test');
      
      // searchAll returns an array of SearchResult
      const functionResults = result.filter(r => r.type === 'function');
      const hookResults = result.filter(r => r.type === 'hook');
      const classResults = result.filter(r => r.type === 'class');
      
      expect(functionResults.length).toBe(mockFunctions.length);
      expect(hookResults.length).toBe(mockHooks.length);
      expect(classResults.length).toBe(mockClasses.length);
      expect(mockAxios.get).toHaveBeenCalledTimes(5);
    });
  });
  
  describe('getFunctionDetails', () => {
    it('should get function details successfully', async () => {
      const mockFunction = createMockDrupalFunction({
        name: 'drupal_set_message',
        examples: ['Example code here'],
      });
      
      mockAxios.get.mockResolvedValueOnce(
        mockApiResponse(mockFunction)
      );
      
      const result = await client.getFunctionDetails('drupal_set_message', '11.x');
      
      expect(result).toEqual(mockFunction);
    });
    
    it('should return null for non-existent function', async () => {
      mockAxios.get.mockRejectedValueOnce(
        mockApiError('Not found', 404)
      );
      
      const result = await client.getFunctionDetails('nonexistent', '11.x');
      
      expect(result).toBeNull();
    });
  });
  
  describe('cache management', () => {
    it('should clear cache', async () => {
      const mockFunctions = [createMockDrupalFunction()];
      
      mockAxios.get.mockResolvedValue(
        mockApiResponse({ functions: mockFunctions })
      );
      
      // First call - populates cache
      await client.searchFunctions('11.x', 'test');
      
      // Clear cache
      client.clearCache();
      
      // Second call - should hit API again
      await client.searchFunctions('11.x', 'test');
      
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
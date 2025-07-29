import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DrupalDocsClient } from '../drupal-docs-client.js';
import { DrupalDynamicExamples } from '../drupal-dynamic-examples.js';
import { DrupalModeManager, DrupalServerMode } from '../drupal-mode-manager.js';

// Mock axios to avoid actual HTTP calls
jest.mock('axios');

describe('Performance Optimization Tests', () => {
  describe('DrupalDocsClient Performance', () => {
    let client: DrupalDocsClient;

    beforeEach(() => {
      client = new DrupalDocsClient();
    });

    afterEach(() => {
      client.clearCache();
    });

    it('should implement efficient caching with hit tracking', async () => {
      // Mock the fetchAndParse method to simulate API calls
      const mockFetch = jest.spyOn(client as any, 'fetchAndParse')
        .mockResolvedValue([{ name: 'test_function', description: 'Test function' }]);

      // First call should miss cache
      await client.searchFunctions('11.x', 'test');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should hit cache
      await client.searchFunctions('11.x', 'test');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should not increase

      const stats = client.getCacheStats();
      expect(stats.hitRatio).toBeGreaterThan(0);
      expect(stats.performance.totalRequests).toBeGreaterThan(0);
    });

    it('should provide performance recommendations', async () => {
      // Simulate high memory usage
      const stats = client.getCacheStats();
      const recommendations = client.getPerformanceRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(typeof stats.memoryUsage).toBe('number');
      expect(typeof stats.hitRatio).toBe('number');
    });

    it('should implement cache cleanup properly', async () => {
      // Fill cache with test data
      const mockFetch = jest.spyOn(client as any, 'fetchAndParse')
        .mockResolvedValue([{ name: 'test_function', description: 'Test function' }]);

      // Make multiple unique requests to fill cache
      for (let i = 0; i < 10; i++) {
        await client.searchFunctions('11.x', `test_${i}`);
      }

      const initialSize = client.getCacheStats().size;
      expect(initialSize).toBeGreaterThan(0);

      // Trigger cache cleanup
      client.clearCache();
      
      const afterCleanupSize = client.getCacheStats().size;
      expect(afterCleanupSize).toBe(0);
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockFetch = jest.spyOn(client as any, 'fetchAndParse')
        .mockImplementation(() => new Promise(resolve => 
          setTimeout(() => resolve([{ name: 'test_function' }]), 100)
        ));

      // Make 5 concurrent requests for the same data
      const promises = Array(5).fill(null).map(() => 
        client.searchFunctions('11.x', 'concurrent_test')
      );

      await Promise.all(promises);

      // Should only make one actual API call due to deduplication
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should provide cache warmup functionality', async () => {
      const mockFetch = jest.spyOn(client as any, 'fetchAndParse')
        .mockResolvedValue([{ name: 'test_function' }]);

      await client.warmupCache('11.x');

      const stats = client.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('DrupalDynamicExamples Performance', () => {
    let examples: DrupalDynamicExamples;

    beforeEach(() => {
      examples = new DrupalDynamicExamples();
    });

    afterEach(() => {
      examples.clearCache();
    });

    it('should implement enhanced example search with multiple sources', async () => {
      // Mock the various search methods
      const mockGitHub = jest.spyOn(examples as any, 'searchGitHubExamples')
        .mockResolvedValue([{
          title: 'GitHub Example',
          description: 'From GitHub',
          category: 'nodes',
          drupal_version: ['11.x'],
          code: 'function github_example() {}',
          tags: ['github'],
          difficulty: 'intermediate'
        }]);

      const mockDrupalOrg = jest.spyOn(examples as any, 'searchDrupalOrgExamples')
        .mockResolvedValue([{
          title: 'Drupal.org Example',
          description: 'From Drupal.org',
          category: 'nodes',
          drupal_version: ['11.x'],
          code: 'function drupalorg_example() {}',
          tags: ['drupalorg'],
          difficulty: 'beginner'
        }]);

      const mockCommunity = jest.spyOn(examples as any, 'searchCommunityExamples')
        .mockResolvedValue([{
          title: 'Community Example',
          description: 'From Community',
          category: 'nodes',
          drupal_version: ['11.x'],
          code: 'function community_example() {}',
          tags: ['community'],
          difficulty: 'advanced'
        }]);

      const results = await examples.searchExamples('node', 'nodes');

      expect(mockGitHub).toHaveBeenCalled();
      expect(mockDrupalOrg).toHaveBeenCalled();
      expect(mockCommunity).toHaveBeenCalled();
      expect(results.length).toBeGreaterThan(0);
      
      // Check that results include enhanced metadata
      results.forEach(result => {
        expect(result).toHaveProperty('difficulty');
        expect(result).toHaveProperty('best_practices');
        expect(result).toHaveProperty('common_pitfalls');
      });
    });

    it('should provide diverse example selection', async () => {
      // Mock multiple examples with different difficulties
      const mockExamples = [
        { title: 'Beginner Example', difficulty: 'beginner', category: 'nodes' },
        { title: 'Intermediate Example', difficulty: 'intermediate', category: 'nodes' },
        { title: 'Advanced Example', difficulty: 'advanced', category: 'nodes' },
        { title: 'Another Beginner', difficulty: 'beginner', category: 'users' },
      ].map(base => ({
        ...base,
        description: `Description for ${base.title}`,
        drupal_version: ['11.x'],
        code: `function ${base.title.toLowerCase().replace(' ', '_')}() {}`,
        tags: [base.category]
      }));

      jest.spyOn(examples as any, 'getEnhancedMockExamples')
        .mockReturnValue(mockExamples);

      const results = await examples.searchExamples('example');
      
      // Should have diversity in difficulty levels
      const difficulties = new Set(results.map(r => r.difficulty));
      expect(difficulties.size).toBeGreaterThan(1);
    });

    it('should implement intelligent relevance scoring', async () => {
      const mockExamples = [
        {
          title: 'Node Load Example', // Exact title match
          description: 'How to load nodes',
          category: 'nodes',
          tags: ['node', 'load'],
          code: 'Node::load($nid)',
          drupal_version: ['11.x'],
          difficulty: 'beginner' as const
        },
        {
          title: 'User Management',
          description: 'Contains node information', // Description match
          category: 'users',
          tags: ['user'],
          code: 'User::load($uid)',
          drupal_version: ['11.x'],
          difficulty: 'intermediate' as const
        }
      ];

      jest.spyOn(examples as any, 'getEnhancedMockExamples')
        .mockReturnValue(mockExamples);

      const results = await examples.searchExamples('node');
      
      // First result should be the exact title match
      expect(results[0].title).toContain('Node');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should provide contextual code snippets', async () => {
      const snippets = (examples as any).generateContextualSnippets('node load', 'nodes');
      
      expect(Array.isArray(snippets)).toBe(true);
      expect(snippets.length).toBeGreaterThan(0);
      
      snippets.forEach((snippet: any) => {
        expect(snippet).toHaveProperty('title');
        expect(snippet).toHaveProperty('code');
        expect(snippet).toHaveProperty('use_case');
        expect(snippet).toHaveProperty('best_practices');
        expect(snippet).toHaveProperty('common_pitfalls');
      });
    });
  });

  describe('DrupalModeManager Cache Optimization', () => {
    let modeManager: DrupalModeManager;

    beforeEach(() => {
      modeManager = new DrupalModeManager({
        mode: DrupalServerMode.DOCS_ONLY,
        cache: {
          enabled: true,
          ttl: 60000, // 1 minute for testing
          maxSize: 100,
          maxMemory: 1024 * 1024, // 1MB
          cleanupInterval: 30000 // 30 seconds
        }
      });
    });

    afterEach(() => {
      modeManager.destroy();
    });

    it('should implement advanced caching with metrics', async () => {
      const testFn = jest.fn().mockResolvedValue({ test: 'data' });
      
      // First call should execute function
      const result1 = await modeManager.getCachedOrFetch('test_key', testFn);
      expect(testFn).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ test: 'data' });

      // Second call should use cache
      const result2 = await modeManager.getCachedOrFetch('test_key', testFn);
      expect(testFn).toHaveBeenCalledTimes(1); // Should not increase
      expect(result2).toEqual({ test: 'data' });

      const stats = modeManager.getModeStats();
      expect(stats.cache.hitRatio).toBeGreaterThan(0);
      expect(stats.cache.size).toBeGreaterThan(0);
    });

    it('should implement request deduplication', async () => {
      const slowFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: 'slow' }), 100))
      );

      // Make 3 concurrent requests for the same key
      const promises = [
        modeManager.getCachedOrFetch('slow_key', slowFn),
        modeManager.getCachedOrFetch('slow_key', slowFn),
        modeManager.getCachedOrFetch('slow_key', slowFn)
      ];

      const results = await Promise.all(promises);

      // Should only call the function once due to deduplication
      expect(slowFn).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(3);
      results.forEach(result => expect(result).toEqual({ data: 'slow' }));
    });

    it('should provide cache management features', () => {
      // Test cache clearing with patterns
      modeManager.clearCache('test_*');
      
      // Test cache recommendations
      const recommendations = modeManager.getCacheRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);

      // Test comprehensive stats
      const stats = modeManager.getModeStats();
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('performance');
      expect(stats.cache).toHaveProperty('hitRatio');
      expect(stats.cache).toHaveProperty('memoryUsage');
    });

    it('should implement intelligent cache cleanup', async () => {
      // Fill cache with multiple entries
      for (let i = 0; i < 10; i++) {
        await modeManager.getCachedOrFetch(`key_${i}`, () => 
          Promise.resolve({ data: `value_${i}`, large: 'x'.repeat(1000) })
        );
      }

      const initialStats = modeManager.getModeStats();
      expect(initialStats.cache.size).toBeGreaterThan(0);

      // Manually trigger cleanup
      (modeManager as any).cleanupCache();

      // Cache should still function correctly after cleanup
      const testResult = await modeManager.getCachedOrFetch('new_key', () => 
        Promise.resolve({ test: 'after_cleanup' })
      );
      expect(testResult).toEqual({ test: 'after_cleanup' });
    });

    it('should provide performance monitoring', () => {
      const stats = modeManager.getModeStats();
      
      expect(typeof stats.performance.avgResponseTime).toBe('number');
      expect(typeof stats.performance.requestsPerMinute).toBe('number');
      expect(typeof stats.performance.errorRate).toBe('number');
      
      expect(stats.cache.enabled).toBe(true);
      expect(typeof stats.cache.hitRatio).toBe('number');
      expect(typeof stats.cache.memoryUsage).toBe('number');
    });
  });

  describe('Integration Performance Tests', () => {
    it('should handle high concurrent load', async () => {
      const client = new DrupalDocsClient();
      const examples = new DrupalDynamicExamples();
      
      // Mock to avoid actual API calls
      jest.spyOn(client as any, 'fetchAndParse').mockResolvedValue([
        { name: 'test_function', description: 'Test' }
      ]);
      
      jest.spyOn(examples as any, 'searchGitHubExamples').mockResolvedValue([
        { title: 'Test', description: 'Test', code: 'test', tags: [], category: 'test', drupal_version: ['11.x'] }
      ]);

      // Simulate high concurrent load
      const promises = [];
      
      for (let i = 0; i < 50; i++) {
        promises.push(client.searchFunctions('11.x', `query_${i % 10}`)); // Some overlap for cache testing
        promises.push(examples.searchExamples(`example_${i % 5}`)); // Some overlap
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();

      // Most requests should succeed
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(results.length * 0.8); // At least 80% success

      // Should complete in reasonable time (under 10 seconds for all)
      expect(endTime - startTime).toBeLessThan(10000);

      // Check cache performance
      const clientStats = client.getCacheStats();
      expect(clientStats.hitRatio).toBeGreaterThan(0); // Should have some cache hits due to overlap

      // Cleanup
      client.clearCache();
      examples.clearCache();
    });

    it('should maintain performance under memory pressure', async () => {
      const client = new DrupalDocsClient();
      
      // Mock large responses to simulate memory pressure
      const largeResponse = Array(1000).fill(null).map((_, i) => ({
        name: `function_${i}`,
        description: 'Large description '.repeat(100),
        code: 'Large code block '.repeat(200)
      }));

      jest.spyOn(client as any, 'fetchAndParse').mockResolvedValue(largeResponse);

      // Make multiple requests with large responses
      for (let i = 0; i < 20; i++) {
        await client.searchFunctions('11.x', `large_query_${i}`);
      }

      const stats = client.getCacheStats();
      
      // Should maintain reasonable memory usage
      expect(stats.memoryUsage).toBeLessThan(200); // Less than 200MB
      
      // Should provide recommendations for high memory usage
      const recommendations = client.getPerformanceRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);

      client.clearCache();
    });
  });
});
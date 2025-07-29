import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DrupalDocsClient } from '../drupal-docs-client.js';
import { DrupalDynamicExamples } from '../drupal-dynamic-examples.js';
import { DrupalModeManager, DrupalServerMode } from '../drupal-mode-manager.js';
import { DrupalContribClient } from '../drupal-contrib-client.js';

// Mock external dependencies
jest.mock('axios');

describe('MCP Drupal Server Integration Tests', () => {
  describe('End-to-End Workflows', () => {
    let docsClient: DrupalDocsClient;
    let examplesClient: DrupalDynamicExamples;
    let contribClient: DrupalContribClient;
    let modeManager: DrupalModeManager;

    beforeEach(() => {
      docsClient = new DrupalDocsClient();
      examplesClient = new DrupalDynamicExamples();
      contribClient = new DrupalContribClient();
      modeManager = new DrupalModeManager({
        mode: DrupalServerMode.DOCS_ONLY
      });
    });

    afterEach(() => {
      docsClient.clearCache();
      examplesClient.clearCache();
      contribClient.clearCache();
      modeManager.destroy();
    });

    it('should execute complete documentation search workflow', async () => {
      // Mock all the API calls
      jest.spyOn(docsClient as any, 'fetchAndParse').mockResolvedValue([
        {
          name: 'node_load',
          description: 'Loads a node entity by ID',
          file: 'core/modules/node/node.module',
          url: 'https://api.drupal.org/api/drupal/core!modules!node!node.module/function/node_load/11.x',
          deprecated: false
        }
      ]);

      jest.spyOn(examplesClient as any, 'searchGitHubExamples').mockResolvedValue([
        {
          title: 'Node Loading Example',
          description: 'How to properly load nodes in Drupal',
          category: 'nodes',
          drupal_version: ['11.x'],
          code: '$node = \\Drupal::entityTypeManager()->getStorage(\"node\")->load($nid);',
          tags: ['node', 'load', 'entity'],
          difficulty: 'beginner',
          source_url: 'https://github.com/drupal/drupal/blob/11.x/example.php'
        }
      ]);

      jest.spyOn(contribClient as any, 'fetchModulesFromAPI').mockResolvedValue([
        {
          title: 'Entity Browser',
          name: 'entity_browser',
          description: 'Provides a generic framework for building entity browsers',
          usage: 50000,
          core_compatibility: ['11.x', '10.x'],
          status: 'published'
        }
      ]);

      // Simulate complete workflow: search functions -> find examples -> check contrib modules
      const functions = await docsClient.searchFunctions('11.x', 'node_load');
      expect(functions.length).toBeGreaterThan(0);
      expect(functions[0].name).toBe('node_load');

      const examples = await examplesClient.searchExamples('node load', 'nodes');
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].category).toBe('nodes');

      const contribModules = await contribClient.searchModules('entity', ['11.x']);
      expect(contribModules.length).toBeGreaterThan(0);
      expect(contribModules[0].name).toBe('entity_browser');

      // Verify that all components maintain their caches
      expect(docsClient.getCacheStats().size).toBeGreaterThan(0);
      expect(examplesClient.getCacheStats().size).toBeGreaterThan(0);
      expect(contribClient.getCacheStats().size).toBeGreaterThan(0);
    });

    it('should handle cross-component data consistency', async () => {
      // Mock consistent data across components
      const mockFunctionData = {
        name: 'user_load',
        description: 'Loads a user entity by ID',
        category: 'User'
      };

      const mockExampleData = {
        title: 'User Loading Example',
        description: 'How to load users in Drupal',
        category: 'users',
        related_functions: ['user_load']
      };

      jest.spyOn(docsClient as any, 'fetchAndParse').mockResolvedValue([mockFunctionData]);
      jest.spyOn(examplesClient as any, 'getEnhancedMockExamples').mockReturnValue([mockExampleData]);

      const functions = await docsClient.searchFunctions('11.x', 'user_load');
      const examples = await examplesClient.searchExamples('user load');

      // Verify cross-references are maintained
      expect(functions[0].name).toBe('user_load');
      expect(examples[0].related_functions).toContain('user_load');
      expect(examples[0].category).toBe('users');
    });

    it('should maintain performance across multiple concurrent operations', async () => {
      // Setup mocks for concurrent operations
      jest.spyOn(docsClient as any, 'fetchAndParse').mockImplementation((url: string) => {
        const delay = Math.random() * 100; // Random delay 0-100ms
        return new Promise(resolve => setTimeout(() => resolve([
          { name: `function_${Date.now()}`, description: 'Test function' }
        ]), delay));
      });

      jest.spyOn(examplesClient as any, 'searchGitHubExamples').mockImplementation(() => {
        const delay = Math.random() * 150;
        return new Promise(resolve => setTimeout(() => resolve([
          { title: 'Test Example', description: 'Test', category: 'test', drupal_version: ['11.x'], code: 'test', tags: [] }
        ]), delay));
      });

      // Execute multiple concurrent operations
      const operations = [];
      
      for (let i = 0; i < 20; i++) {
        operations.push(docsClient.searchFunctions('11.x', `query_${i}`));
        operations.push(examplesClient.searchExamples(`example_${i}`));
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(operations);
      const endTime = Date.now();

      // All operations should complete
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(results.length);

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(3000); // Under 3 seconds

      // Verify cache efficiency
      const docsStats = docsClient.getCacheStats();
      const examplesStats = examplesClient.getCacheStats();
      
      expect(docsStats.size).toBeGreaterThan(0);
      expect(examplesStats.size).toBeGreaterThan(0);
    });

    it('should handle mode switching and fallback scenarios', async () => {
      // Start with hybrid mode
      const hybridManager = new DrupalModeManager({
        mode: DrupalServerMode.HYBRID,
        fallbackMode: DrupalServerMode.DOCS_ONLY
      });

      // Mock connection failure
      jest.spyOn(hybridManager as any, 'testLiveConnection').mockResolvedValue(false);

      await hybridManager.initialize();

      // Should fallback to docs-only mode
      expect(hybridManager.getCurrentMode()).toBe(DrupalServerMode.DOCS_ONLY);

      // Verify capabilities are adjusted accordingly
      expect(hybridManager.isCapabilityAvailable('search_drupal_functions')).toBe(true);
      expect(hybridManager.isCapabilityAvailable('get_node')).toBe(false);

      // Test manual mode switching
      jest.spyOn(hybridManager as any, 'testLiveConnection').mockResolvedValue(true);
      const switched = await hybridManager.switchMode(DrupalServerMode.HYBRID);
      expect(switched).toBe(true);
      expect(hybridManager.getCurrentMode()).toBe(DrupalServerMode.HYBRID);

      hybridManager.destroy();
    });

    it('should provide comprehensive system health monitoring', async () => {
      // Initialize all components
      await modeManager.initialize();

      // Perform some operations to generate metrics
      jest.spyOn(docsClient as any, 'fetchAndParse').mockResolvedValue([
        { name: 'test_function', description: 'Test' }
      ]);

      await docsClient.searchFunctions('11.x', 'test');
      await docsClient.searchFunctions('11.x', 'test'); // Second call for cache hit

      // Get comprehensive health stats
      const modeStats = modeManager.getModeStats();
      const docsStats = docsClient.getCacheStats();
      const docsRecommendations = docsClient.getPerformanceRecommendations();

      // Verify comprehensive monitoring data
      expect(modeStats).toHaveProperty('currentMode');
      expect(modeStats).toHaveProperty('connectionStatus');
      expect(modeStats).toHaveProperty('cache');
      expect(modeStats).toHaveProperty('performance');

      expect(docsStats).toHaveProperty('hitRatio');
      expect(docsStats).toHaveProperty('performance');
      expect(docsStats).toHaveProperty('memoryUsage');

      expect(Array.isArray(docsRecommendations)).toBe(true);

      // Verify cache hit tracking
      expect(docsStats.hitRatio).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    let docsClient: DrupalDocsClient;
    let examplesClient: DrupalDynamicExamples;

    beforeEach(() => {
      docsClient = new DrupalDocsClient();
      examplesClient = new DrupalDynamicExamples();
    });

    afterEach(() => {
      docsClient.clearCache();
      examplesClient.clearCache();
    });

    it('should gracefully handle API failures with fallback to mock data', async () => {
      // Mock API failure
      jest.spyOn(docsClient as any, 'fetchAndParse').mockRejectedValue(new Error('API Error'));

      // Should fallback to mock data without throwing
      const functions = await docsClient.searchFunctions('11.x', 'node_load');
      expect(functions.length).toBeGreaterThan(0);
      expect(functions[0]).toHaveProperty('name');
      expect(functions[0]).toHaveProperty('description');
    });

    it('should handle partial failures in multi-source searches', async () => {
      // Mock partial failures in examples search
      jest.spyOn(examplesClient as any, 'searchGitHubExamples').mockRejectedValue(new Error('GitHub API Error'));
      jest.spyOn(examplesClient as any, 'searchDrupalOrgExamples').mockResolvedValue([
        {
          title: 'Drupal.org Example',
          description: 'From Drupal.org',
          category: 'test',
          drupal_version: ['11.x'],
          code: 'test',
          tags: []
        }
      ]);
      jest.spyOn(examplesClient as any, 'searchCommunityExamples').mockResolvedValue([]);

      const examples = await examplesClient.searchExamples('test query');

      // Should return results from successful sources
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].title).toContain('Drupal.org');
    });

    it('should maintain cache consistency during errors', async () => {
      // First successful call
      jest.spyOn(docsClient as any, 'fetchAndParse').mockResolvedValueOnce([
        { name: 'success_function', description: 'Success' }
      ]);

      const successResult = await docsClient.searchFunctions('11.x', 'success');
      expect(successResult.length).toBeGreaterThan(0);

      // Second call fails
      jest.spyOn(docsClient as any, 'fetchAndParse').mockRejectedValueOnce(new Error('Network Error'));

      const failureResult = await docsClient.searchFunctions('11.x', 'failure');
      expect(failureResult.length).toBeGreaterThan(0); // Should get mock data

      // Cache should still work for first call
      const cachedResult = await docsClient.searchFunctions('11.x', 'success');
      expect(cachedResult[0].name).toBe('success_function');

      // Verify cache integrity
      const stats = docsClient.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle memory pressure gracefully', async () => {
      // Mock very large responses
      const largeResponse = Array(5000).fill(null).map((_, i) => ({
        name: `large_function_${i}`,
        description: 'Very large description '.repeat(1000),
        code: 'Large code block '.repeat(2000)
      }));

      jest.spyOn(docsClient as any, 'fetchAndParse').mockResolvedValue(largeResponse);

      // Make multiple requests that would consume significant memory
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(docsClient.searchFunctions('11.x', `large_query_${i}`));
      }

      await Promise.all(requests);

      // System should handle memory pressure
      const stats = docsClient.getCacheStats();
      expect(stats.memoryUsage).toBeLessThan(500); // Less than 500MB

      // Should provide memory warnings
      const recommendations = docsClient.getPerformanceRecommendations();
      expect(recommendations.some(r => r.includes('memory'))).toBe(true);
    });

    it('should recover from temporary network issues', async () => {
      let callCount = 0;
      
      // Mock intermittent failures
      jest.spyOn(docsClient as any, 'fetchAndParse').mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve([{ name: 'recovered_function', description: 'Success after retry' }]);
      });

      // Should eventually succeed with mock fallback for first calls
      const result1 = await docsClient.searchFunctions('11.x', 'retry_test_1');
      const result2 = await docsClient.searchFunctions('11.x', 'retry_test_2');
      const result3 = await docsClient.searchFunctions('11.x', 'retry_test_3');

      expect(result1.length).toBeGreaterThan(0); // Mock data
      expect(result2.length).toBeGreaterThan(0); // Mock data
      expect(result3.length).toBeGreaterThan(0); // Should be real data or mock

      // Verify error tracking
      const stats = docsClient.getCacheStats();
      expect(stats.performance.errorCount).toBeGreaterThan(0);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle typical development workflow efficiently', async () => {
      const docsClient = new DrupalDocsClient();
      const examplesClient = new DrupalDynamicExamples();

      // Mock realistic API responses
      jest.spyOn(docsClient as any, 'fetchAndParse').mockImplementation((url: string) => {
        if (url.includes('functions')) {
          return Promise.resolve([
            { name: 'node_load', description: 'Loads a node' },
            { name: 'node_save', description: 'Saves a node' },
            { name: 'node_delete', description: 'Deletes a node' }
          ]);
        }
        return Promise.resolve([]);
      });

      jest.spyOn(examplesClient as any, 'searchGitHubExamples').mockResolvedValue([
        {
          title: 'Node CRUD Operations',
          description: 'Complete node management example',
          category: 'nodes',
          drupal_version: ['11.x'],
          code: `
// Load node
$node = Node::load($nid);

// Create node
$node = Node::create([
  'type' => 'article',
  'title' => 'Test Article',
]);
$node->save();

// Delete node
$node->delete();
          `.trim(),
          tags: ['node', 'crud', 'entity'],
          difficulty: 'intermediate',
          use_case: 'Complete node management workflow',
          best_practices: ['Always check access permissions', 'Validate input data'],
          common_pitfalls: ['Not checking if node exists', 'Forgetting to save after modifications']
        }
      ]);

      // Simulate typical developer workflow
      const startTime = Date.now();

      // 1. Search for functions
      const functions = await docsClient.searchFunctions('11.x', 'node');
      expect(functions.length).toBeGreaterThan(0);

      // 2. Look for examples
      const examples = await examplesClient.searchExamples('node operations');
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('best_practices');
      expect(examples[0]).toHaveProperty('common_pitfalls');

      // 3. Search for related functions (cache hit)
      const relatedFunctions = await docsClient.searchFunctions('11.x', 'node');
      expect(relatedFunctions.length).toBe(functions.length);

      const endTime = Date.now();

      // Should complete quickly due to caching
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify cache effectiveness
      const docsStats = docsClient.getCacheStats();
      expect(docsStats.hitRatio).toBeGreaterThan(50); // At least 50% hit ratio

      docsClient.clearCache();
      examplesClient.clearCache();
    });

    it('should support complex query patterns with intelligent matching', async () => {
      const examplesClient = new DrupalDynamicExamples();

      // Mock examples with various patterns
      jest.spyOn(examplesClient as any, 'getEnhancedMockExamples').mockReturnValue([
        {
          title: 'Entity Query Builder',
          description: 'How to use EntityQuery for complex database queries',
          category: 'database',
          code: `
$query = \\Drupal::entityQuery('node')
  ->condition('type', 'article')
  ->condition('status', 1)
  ->condition('created', strtotime('-1 month'), '>')
  ->sort('created', 'DESC')
  ->range(0, 10)
  ->execute();
          `.trim(),
          tags: ['entity', 'query', 'database'],
          difficulty: 'intermediate',
          related_functions: ['EntityQuery', 'EntityStorageInterface::getQuery'],
          drupal_version: ['11.x']
        },
        {
          title: 'Custom Entity Creation',
          description: 'Step-by-step guide to creating custom entities',
          category: 'entities',
          code: `
// Define entity in annotation
/**
 * @ContentEntityType(
 *   id = "custom_entity",
 *   label = @Translation("Custom Entity"),
 *   handlers = {
 *     "storage" => "Drupal\\Core\\Entity\\Sql\\SqlContentEntityStorage",
 *   },
 *   base_table = "custom_entity",
 *   entity_keys = {
 *     "id" = "id",
 *     "label" = "name",
 *   },
 * )
 */
class CustomEntity extends ContentEntityBase {
  // Entity implementation
}
          `.trim(),
          tags: ['entity', 'custom', 'annotation'],
          difficulty: 'advanced',
          use_case: 'Creating reusable content types with custom logic',
          drupal_version: ['11.x']
        }
      ]);

      // Test fuzzy matching and intelligent scoring
      const queryResults = await examplesClient.searchExamples('entity query');
      expect(queryResults.length).toBeGreaterThan(0);
      expect(queryResults[0].title).toContain('Query');

      const entityResults = await examplesClient.searchExamples('custom entity creation');
      expect(entityResults.length).toBeGreaterThan(0);
      expect(entityResults[0].title).toContain('Custom Entity');

      // Verify enhanced metadata
      entityResults.forEach(result => {
        expect(result).toHaveProperty('difficulty');
        expect(result).toHaveProperty('use_case');
        expect(result.tags.length).toBeGreaterThan(0);
      });

      examplesClient.clearCache();
    });
  });
});
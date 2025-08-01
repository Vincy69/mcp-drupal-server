import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { mockDrupalFunctions, mockDrupalHooks, mockDrupalClasses, mockCodeExamples, mockModuleTemplates, exampleCategories } from './mock-data.js';

const DrupalVersionSchema = z.enum(['7.x', '8.x', '9.x', '10.x', '11.x']);
type DrupalVersion = z.infer<typeof DrupalVersionSchema>;

const DocTypeSchema = z.enum([
  'topics',
  'classes',
  'functions', 
  'constants',
  'globals',
  'files',
  'namespaces',
  'deprecated',
  'services',
  'elements'
]);
type DocType = z.infer<typeof DocTypeSchema>;

interface DrupalAPIFunction {
  name: string;
  file: string;
  description: string;
  url?: string;
  signature?: string;
  parameters?: string[];
  return_type?: string;
  deprecated?: boolean;
  since?: string;
  examples?: string[];
  module?: string;
  category?: string;
}

interface DrupalAPIClass {
  name: string;
  namespace: string;
  file: string;
  description: string;
  url?: string;
  methods?: string[];
  properties?: string[];
  deprecated?: boolean;
  since?: string;
}

interface DrupalAPIHook {
  name: string;
  description: string;
  url?: string;
  parameters?: string[];
  file?: string;
  group?: string;
  examples?: string[];
}

interface SearchResult {
  type: DocType;
  name: string;
  description: string;
  url: string;
  version: DrupalVersion;
  deprecated?: boolean;
}

// Performance cache configuration
interface CacheEntry {
  data: any;
  timestamp: number;
  hitCount: number;
  size: number;
}

interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  errorCount: number;
}

export class DrupalDocsClient {
  private client: AxiosInstance;
  private cache = new Map<string, CacheEntry>();
  private cacheTimeout = 15 * 60 * 1000; // Reduced to 15 minutes for better freshness
  private maxCacheSize = 500; // Maximum number of cache entries
  private maxCacheMemory = 50 * 1024 * 1024; // 50MB max cache memory
  private performanceMetrics: PerformanceMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgResponseTime: 0,
    errorCount: 0
  };
  private requestQueue = new Map<string, Promise<any>>(); // Deduplicate concurrent requests

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.drupal.org',
      headers: {
        'User-Agent': 'MCP-Drupal-Server/1.0.0',
        'Accept': 'text/html,application/json',
        'Accept-Encoding': 'gzip, deflate', // Enable compression
      },
      timeout: 15000, // Increased timeout for better reliability
      maxRedirects: 3,
      validateStatus: (status) => status < 500, // Accept 4xx errors to cache them
    });
    
    // Setup periodic cache cleanup
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  private getCacheKey(type: DocType, version: DrupalVersion, query?: string): string {
    // Create normalized cache key with hash for long queries
    const baseKey = `${type}-${version}`;
    if (!query) return `${baseKey}-all`;
    
    // Hash long queries to prevent excessive memory usage
    if (query.length > 50) {
      const hash = this.simpleHash(query);
      return `${baseKey}-hash-${hash}`;
    }
    
    return `${baseKey}-${query.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  private estimateSize(data: any): number {
    // Rough estimate of object size in bytes
    return JSON.stringify(data).length * 2; // UTF-16 encoding
  }

  private cleanupCache(): void {
    const now = Date.now();
    let totalSize = 0;
    const entries: Array<[string, CacheEntry]> = [];
    
    // Calculate total size and collect entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.cache.delete(key); // Remove expired entries
      } else {
        totalSize += entry.size;
        entries.push([key, entry]);
      }
    }
    
    // If over memory limit, remove least recently used entries
    if (totalSize > this.maxCacheMemory) {
      entries.sort((a, b) => a[1].hitCount - b[1].hitCount); // Sort by hit count (LRU)
      
      while (totalSize > this.maxCacheMemory * 0.8 && entries.length > 0) {
        const [key, entry] = entries.shift()!;
        this.cache.delete(key);
        totalSize -= entry.size;
      }
    }
    
    // Ensure we don't exceed max entry count
    if (this.cache.size > this.maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hitCount - b[1].hitCount);
      
      const toRemove = sortedEntries.slice(0, this.cache.size - this.maxCacheSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  private async fetchAndParse(url: string): Promise<any> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;
    
    const cacheKey = this.simpleHash(url);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      cached.hitCount++;
      this.performanceMetrics.cacheHits++;
      return cached.data;
    }
    
    // Check if request is already in progress to avoid duplicate requests
    if (this.requestQueue.has(url)) {
      return this.requestQueue.get(url)!;
    }
    
    const requestPromise = this.performFetch(url, cacheKey, startTime);
    this.requestQueue.set(url, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(url);
    }
  }
  
  private async performFetch(url: string, cacheKey: string, startTime: number): Promise<any> {
    try {
      const response = await this.client.get(url);
      const data = this.parseHTMLContent(response.data);
      
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime, false);
      
      const size = this.estimateSize(data);
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        hitCount: 1,
        size
      };
      
      this.cache.set(cacheKey, cacheEntry);
      this.performanceMetrics.cacheMisses++;
      
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime, true);
      this.performanceMetrics.errorCount++;
      
      // Cache empty results for failed requests (with shorter TTL)
      if (error instanceof Error && error.message.includes('404')) {
        const cacheEntry: CacheEntry = {
          data: [],
          timestamp: Date.now(),
          hitCount: 1,
          size: 100 // Small size for empty results
        };
        this.cache.set(cacheKey, cacheEntry);
        return [];
      }
      
      throw new Error(`Failed to fetch documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private updatePerformanceMetrics(responseTime: number, isError: boolean): void {
    if (!isError) {
      this.performanceMetrics.avgResponseTime = 
        (this.performanceMetrics.avgResponseTime * (this.performanceMetrics.totalRequests - 1) + responseTime) / 
        this.performanceMetrics.totalRequests;
    }
  }

  private parseHTMLContent(html: string): any {
    // Parse HTML content to extract API documentation from Drupal API tables
    const results: any[] = [];
    
    // Match table rows in the API listing
    const rowMatches = html.match(/<tr class="(?:odd|even)"[^>]*>[\s\S]*?<\/tr>/g) || [];
    
    for (const row of rowMatches) {
      try {
        // Try different naming patterns - functions/hooks use "title", classes use "object-name"
        let nameMatch = row.match(/<td[^>]*class="[^"]*views-field-title[^"]*"[^>]*>[\s\S]*?<a href="([^"]*)"[^>]*>([^<]*)<\/a>/);
        if (!nameMatch) {
          nameMatch = row.match(/<td[^>]*class="[^"]*views-field-object-name[^"]*"[^>]*>[\s\S]*?<a href="([^"]*)"[^>]*>([^<]*)<\/a>/);
        }
        
        // Extract description from summary column
        const descMatch = row.match(/<td[^>]*class="[^"]*views-field-summary[^"]*"[^>]*>([^<]*)/);
        
        // Extract file path - try different patterns
        let fileMatch = row.match(/<td[^>]*class="[^"]*views-field-file-name[^"]*"[^>]*>[\s\S]*?>([^<]+\.(module|inc|php|install))</);
        if (!fileMatch) {
          fileMatch = row.match(/<td[^>]*class="[^"]*views-field-file-name[^"]*"[^>]*>[\s\S]*?<a href="[^"]*">([^<]+\.(module|inc|php|install))</);
        }
        
        // Check if deprecated
        const deprecatedMatch = row.match(/<td[^>]*class="[^"]*views-field-deprecated[^"]*"[^>]*>\s*([^<\s]+)/);
        
        // Extract namespace for classes
        const namespaceMatch = row.match(/<td[^>]*class="[^"]*views-field-namespace[^"]*"[^>]*>([^<]*)/);
        
        if (nameMatch && nameMatch[2] && nameMatch[2].trim()) {
          const result: any = {
            name: nameMatch[2].trim(),
            url: nameMatch[1].startsWith('http') ? nameMatch[1] : `https://api.drupal.org${nameMatch[1]}`,
            description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '',
            file: fileMatch ? fileMatch[1].trim() : '',
            deprecated: deprecatedMatch ? true : false
          };

          // Add namespace if available (for classes)
          if (namespaceMatch && namespaceMatch[1].trim()) {
            result.namespace = namespaceMatch[1].trim();
          }

          // Only add if we have meaningful data
          if (result.name && result.name.length > 1) {
            results.push(result);
          }
        }
      } catch (error) {
        // Skip malformed rows
        continue;
      }
    }

    return results;
  }

  // Enhanced function search with performance optimizations
  async searchFunctions(version: DrupalVersion = '11.x', query?: string): Promise<DrupalAPIFunction[]> {
    const cacheKey = this.getCacheKey('functions', version, query);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      cached.hitCount++;
      return cached.data;
    }
    
    try {
      console.error(`Drupal API: Starting optimized function search for version ${version}`);
      
      // Optimized strategy: Prioritize based on query specificity
      let allFunctions: DrupalAPIFunction[] = [];
      
      if (query && query.trim()) {
        // For specific queries, use targeted search to reduce API calls
        allFunctions = await this.getTargetedFunctions(version, query);
      } else {
        // For general search, use parallel requests for better performance
        const [coreFunctions, deprecatedFunctions] = await Promise.all([
          this.getCoreAPIFunctions(version, 10), // Limit pages for better performance
          this.getDeprecatedFunctions(version)
        ]);
        
        allFunctions = [...coreFunctions, ...deprecatedFunctions];
      }
      
      // Optimize deduplication and enhancement
      const uniqueFunctions = this.deduplicateFunctions(allFunctions);
      const enhancedFunctions = this.batchEnhanceFunctions(uniqueFunctions, version);
      
      console.error(`Drupal API: Found ${enhancedFunctions.length} total functions (optimized)`);
      
      let results = enhancedFunctions;
      if (query && query.trim()) {
        results = this.filterFunctions(enhancedFunctions, query).slice(0, 200);
        console.error(`Drupal API: Filtered to ${results.length} functions with query "${query}"`);
      } else {
        results = results.slice(0, 300); // Reduced default limit
      }
      
      // Cache results
      const size = this.estimateSize(results);
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now(),
        hitCount: 1,
        size
      });
      
      return results;
    } catch (error) {
      console.error(`Error searching functions: ${error instanceof Error ? error.message : String(error)}`);
      console.log('Falling back to mock data...');
      return this.getMockFunctions(query);
    }
  }
  
  // Targeted function search for specific queries
  private async getTargetedFunctions(version: DrupalVersion, query: string): Promise<DrupalAPIFunction[]> {
    // Analyze query to determine best search strategy
    const queryLower = query.toLowerCase();
    const strategies: Array<() => Promise<DrupalAPIFunction[]>> = [];
    
    // Strategy 1: Core functions (always include)
    strategies.push(() => this.getCoreAPIFunctions(version, 5));
    
    // Strategy 2: Module-specific if query suggests it
    if (queryLower.includes('node') || queryLower.includes('user') || queryLower.includes('field')) {
      strategies.push(() => this.getCoreModuleFunctions(version));
    }
    
    // Strategy 3: Deprecated if query suggests it
    if (queryLower.includes('deprecated') || queryLower.includes('old') || queryLower.includes('legacy')) {
      strategies.push(() => this.getDeprecatedFunctions(version));
    }
    
    // Execute strategies in parallel
    const results = await Promise.all(strategies.map(strategy => 
      strategy().catch(() => []) // Don't fail on individual strategy errors
    ));
    
    return results.flat();
  }
  
  // Batch enhancement of functions for better performance
  private batchEnhanceFunctions(functions: DrupalAPIFunction[], version: DrupalVersion): DrupalAPIFunction[] {
    const batchSize = 50; // Process in batches
    const enhanced: DrupalAPIFunction[] = [];
    
    for (let i = 0; i < functions.length; i += batchSize) {
      const batch = functions.slice(i, i + batchSize);
      const enhancedBatch = batch.map(func => this.enhanceFunctionData(func, version));
      enhanced.push(...enhancedBatch);
    }
    
    return enhanced;
  }

  // Strategy 1: Get core API functions with optimized pagination
  private async getCoreAPIFunctions(version: DrupalVersion, maxPages: number = 15): Promise<DrupalAPIFunction[]> {
    try {
      const url = `/api/drupal/functions/${version}`;
      const functions: DrupalAPIFunction[] = [];
      
      // Optimized: Fetch pages sequentially with early termination on empty results
      for (let page = 0; page < maxPages; page++) {
        try {
          const pageUrl = page === 0 ? url : `${url}?page=${page}`;
          const pageResults = await this.fetchAndParse(pageUrl);
          
          if (pageResults.length === 0) {
            console.error(`Strategy 1: No more results at page ${page}, stopping`);
            break; // No more results, stop fetching
          }
          
          functions.push(...pageResults);
          
          // Early termination if we have enough results for most queries
          if (functions.length > 1000) {
            console.error(`Strategy 1: Reached 1000 functions, stopping for performance`);
            break;
          }
        } catch (pageError) {
          console.error(`Strategy 1: Error fetching page ${page}, continuing...`);
          // Continue with next page
        }
      }
      
      console.error(`Strategy 1: Found ${functions.length} core API functions (optimized)`);
      return functions;
    } catch (error) {
      console.error(`Error in getCoreAPIFunctions: ${error}`);
      return [];
    }
  }

  // Strategy 2: Get deprecated functions with warnings
  private async getDeprecatedFunctions(version: DrupalVersion): Promise<DrupalAPIFunction[]> {
    try {
      // Try to get deprecated function documentation
      const deprecatedUrl = `/api/drupal/deprecated/${version}`;
      let deprecatedFunctions: any[] = [];
      
      try {
        deprecatedFunctions = await this.fetchAndParse(deprecatedUrl);
      } catch {
        // Fallback: search for deprecated functions in regular API
        const allFunctions = await this.fetchAndParse(`/api/drupal/functions/${version}`);
        deprecatedFunctions = allFunctions.filter((func: any) => 
          func.description && (
            func.description.includes('@deprecated') ||
            func.description.includes('Deprecated') ||
            func.description.includes('deprecated') ||
            func.description.includes('legacy')
          )
        );
      }
      
      // Add deprecation warnings
      const functionsWithWarnings = deprecatedFunctions.map((func: any) => ({
        ...func,
        deprecated: true,
        description: `⚠️ DEPRECATED: ${func.description || func.name}`,
        since: this.extractDeprecationVersion(func.description)
      }));
      
      console.error(`Strategy 2: Found ${functionsWithWarnings.length} deprecated functions`);
      return functionsWithWarnings;
    } catch (error) {
      console.error(`Error in getDeprecatedFunctions: ${error}`);
      return [];
    }
  }

  // Strategy 3: Get functions from specific core modules
  private async getCoreModuleFunctions(version: DrupalVersion): Promise<DrupalAPIFunction[]> {
    try {
      const coreModules = [
        'node', 'user', 'field', 'system', 'menu', 'block', 'taxonomy',
        'file', 'image', 'comment', 'search', 'path', 'contact', 'update'
      ];
      
      const allModuleFunctions: any[] = [];
      
      for (const module of coreModules) {
        try {
          // Try module-specific API endpoints
          const moduleUrl = `/api/drupal/core!modules!${module}/${version}`;
          const moduleFunctions = await this.fetchAndParse(moduleUrl);
          
          const enhancedModuleFunctions = moduleFunctions.map((func: any) => ({
            ...func,
            module: module,
            description: `[${module.toUpperCase()}] ${func.description || func.name}`,
          }));
          
          allModuleFunctions.push(...enhancedModuleFunctions);
        } catch {
          // Skip modules that don't have accessible API endpoints
          continue;
        }
      }
      
      console.error(`Strategy 3: Found ${allModuleFunctions.length} core module functions`);
      return allModuleFunctions;
    } catch (error) {
      console.error(`Error in getCoreModuleFunctions: ${error}`);
      return [];
    }
  }

  // Strategy 4: Get utility and helper functions
  private async getUtilityFunctions(version: DrupalVersion): Promise<DrupalAPIFunction[]> {
    try {
      // Add commonly used utility functions that might be missed
      const utilityPatterns = ['_', 'drupal_', 'check_', 'format_', 'theme_', 'template_'];
      const allFunctions = await this.fetchAndParse(`/api/drupal/functions/${version}`);
      
      const utilityFunctions = allFunctions.filter((func: any) => {
        return utilityPatterns.some(pattern => 
          func.name && func.name.toLowerCase().startsWith(pattern)
        );
      }).map((func: any) => ({
        ...func,
        category: 'Utility',
        description: `[UTILITY] ${func.description || func.name}`,
      }));
      
      console.error(`Strategy 4: Found ${utilityFunctions.length} utility functions`);
      return utilityFunctions;
    } catch (error) {
      console.error(`Error in getUtilityFunctions: ${error}`);
      return [];
    }
  }

  // Deduplicate functions based on name
  private deduplicateFunctions(functions: DrupalAPIFunction[]): DrupalAPIFunction[] {
    const seenFunctions = new Map<string, DrupalAPIFunction>();
    
    for (const func of functions) {
      const key = func.name?.toLowerCase() || '';
      if (!seenFunctions.has(key) && key) {
        seenFunctions.set(key, func);
      } else if (seenFunctions.has(key)) {
        // Merge information from duplicate functions
        const existing = seenFunctions.get(key)!;
        
        // Prefer non-deprecated versions unless specifically looking for deprecated
        if (func.deprecated && !existing.deprecated) {
          continue; // Keep existing non-deprecated version
        }
        
        // Enhance with additional information
        if (func.module && !existing.module) {
          existing.module = func.module;
        }
        
        if (func.examples && !existing.examples) {
          existing.examples = func.examples;
        }
      }
    }
    
    return Array.from(seenFunctions.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // Enhanced function filtering with better matching
  private filterFunctions(functions: DrupalAPIFunction[], query: string): DrupalAPIFunction[] {
    const queryLower = query.toLowerCase();
    
    return functions.filter((func: any) => {
      const name = func.name?.toLowerCase() || '';
      const description = (func.description || '').replace(/&[#\w]+;/g, '').toLowerCase();
      const file = (func.file || '').toLowerCase();
      const module = (func.module || '').toLowerCase();
      const category = (func.category || '').toLowerCase();
      
      // Multiple matching strategies
      return (
        name.includes(queryLower) ||
        name.startsWith(queryLower) ||
        description.includes(queryLower) ||
        file.includes(queryLower) ||
        module.includes(queryLower) ||
        category.includes(queryLower) ||
        // Fuzzy matching for function names
        this.fuzzyMatchFunction(name, queryLower)
      );
    });
  }

  // Fuzzy matching for function names
  private fuzzyMatchFunction(functionName: string, query: string): boolean {
    // Remove common prefixes/suffixes for better matching
    const cleanFunctionName = functionName
      .replace(/^(drupal_|_drupal_|theme_|template_)/, '')
      .replace(/(_alter|_validate|_submit|_form)$/, '');
    
    const cleanQuery = query
      .replace(/^(drupal_|_drupal_|theme_|template_)/, '')
      .replace(/(_alter|_validate|_submit|_form)$/, '');
    
    return cleanFunctionName.includes(cleanQuery) || cleanQuery.includes(cleanFunctionName);
  }

  // Enhance function data with additional metadata
  private enhanceFunctionData(func: DrupalAPIFunction, version: DrupalVersion): DrupalAPIFunction {
    try {
      const enhanced = { ...func };
      
      // Add function category if not present
      if (!enhanced.category) {
        enhanced.category = this.getFunctionCategory(enhanced.name || '');
      }
      
      // Extract parameters if not present
      if (!enhanced.parameters && enhanced.description) {
        enhanced.parameters = this.extractFunctionParameters(enhanced.description);
      }
      
      // Extract return type if not present
      if (!enhanced.return_type && enhanced.description) {
        enhanced.return_type = this.extractReturnType(enhanced.description);
      }
      
      // Ensure URL is properly formatted
      if (!enhanced.url && enhanced.name) {
        enhanced.url = `https://api.drupal.org/api/drupal/core/functions/${enhanced.name}/${version}`;
      }
      
      // Add usage examples for common functions
      if (!enhanced.examples) {
        enhanced.examples = this.getCommonFunctionExamples(enhanced.name || '');
      }
      
      return enhanced;
    } catch (error) {
      console.error(`Error enhancing function data: ${error}`);
      return func;
    }
  }

  // Get function category based on name patterns
  private getFunctionCategory(functionName: string): string {
    if (functionName.includes('node_')) return 'Node';
    if (functionName.includes('user_')) return 'User';
    if (functionName.includes('field_')) return 'Field';
    if (functionName.includes('form_')) return 'Form';
    if (functionName.includes('theme_')) return 'Theme';
    if (functionName.includes('menu_')) return 'Menu';
    if (functionName.includes('block_')) return 'Block';
    if (functionName.includes('cache_')) return 'Cache';
    if (functionName.includes('database_') || functionName.includes('db_')) return 'Database';
    if (functionName.includes('file_')) return 'File';
    if (functionName.includes('image_')) return 'Image';
    if (functionName.includes('mail_')) return 'Mail';
    if (functionName.includes('path_')) return 'Path';
    if (functionName.includes('url_')) return 'URL';
    if (functionName.includes('check_') || functionName.includes('valid')) return 'Validation';
    if (functionName.includes('format_') || functionName.includes('render_')) return 'Formatting';
    if (functionName.startsWith('_')) return 'Helper';
    if (functionName.includes('drupal_')) return 'Core';
    
    return 'General';
  }

  // Extract function parameters from description
  private extractFunctionParameters(description: string): string[] {
    const paramMatches = description.match(/\$[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const cleanParams = paramMatches.map(param => param.substring(1)); // Remove $
    return [...new Set(cleanParams)]; // Remove duplicates
  }

  // Extract return type from description
  private extractReturnType(description: string): string {
    const returnPatterns = [
      /Returns?\s+([a-zA-Z][a-zA-Z0-9_]*(?:\[\])?)/i,
      /Return\s+value:?\s*([a-zA-Z][a-zA-Z0-9_]*(?:\[\])?)/i,
      /@return\s+([a-zA-Z][a-zA-Z0-9_]*(?:\[\])?)/i,
    ];
    
    for (const pattern of returnPatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    // Guess return type from function name
    if (description.includes('Returns TRUE') || description.includes('TRUE if')) return 'boolean';
    if (description.includes('Returns FALSE') || description.includes('FALSE if')) return 'boolean';
    if (description.includes('Returns an array')) return 'array';
    if (description.includes('Returns a string')) return 'string';
    if (description.includes('Returns the')) return 'mixed';
    
    return '';
  }

  // Extract deprecation version from description
  private extractDeprecationVersion(description: string): string {
    const versionMatch = description.match(/deprecated.*?(\d+\.x)/i);
    return versionMatch ? versionMatch[1] : '';
  }

  // Get common function usage examples
  private getCommonFunctionExamples(functionName: string): string[] {
    const examples: { [key: string]: string[] } = {
      'node_load': ['$node = node_load(123);'],
      'user_load': ['$user = user_load(1);'],
      'drupal_set_message': ['drupal_set_message("Hello world!");'],
      'drupal_goto': ['drupal_goto("admin/config");'],
      'check_plain': ['$safe_text = check_plain($user_input);'],
      'format_date': ['$formatted = format_date(time());'],
      't': ['$text = t("Hello @name", array("@name" => $name));'],
      'variable_get': ['$value = variable_get("site_name", "Default");'],
      'variable_set': ['variable_set("site_name", "My Site");'],
      'db_query': ['$result = db_query("SELECT * FROM {node}");'],
      'db_insert': ['db_insert("mytable")->fields($record)->execute();'],
      'cache_get': ['$cache = cache_get("my_cache_key");'],
      'cache_set': ['cache_set("my_cache_key", $data, "cache", time() + 3600);'],
    };
    
    return examples[functionName] || [];
  }

  // Search classes
  async searchClasses(version: DrupalVersion = '11.x', query?: string): Promise<DrupalAPIClass[]> {
    try {
      const url = `/api/drupal/classes/${version}`;
      let allData = await this.fetchAndParse(url);
      
      console.error(`Drupal API: Found ${allData.length} classes for version ${version}`);
      
      if (query && query.trim()) {
        let filtered = allData.filter((cls: any) => {
          const name = cls.name?.toLowerCase() || '';
          const description = (cls.description || '').replace(/&[#\w]+;/g, '').toLowerCase();
          const namespace = (cls.namespace || '').toLowerCase();
          const queryLower = query.toLowerCase();
          
          return name.includes(queryLower) || 
                 description.includes(queryLower) || 
                 namespace.includes(queryLower);
        });
        
        // If no results found and query seems to be for classes later in alphabet, 
        // try fetching more pages
        if (filtered.length === 0 && this.shouldFetchMorePages(query)) {
          console.error(`Drupal API: No results found for "${query}", trying additional pages...`);
          try {
            // Try to fetch page 2 and 3 (covers more of the alphabet)
            const page2Data = await this.fetchAndParse(`${url}?page=1`);
            const page3Data = await this.fetchAndParse(`${url}?page=2`);
            
            allData = [...allData, ...page2Data, ...page3Data];
            console.error(`Drupal API: Extended search found ${allData.length} total classes`);
            
            filtered = allData.filter((cls: any) => {
              const name = cls.name?.toLowerCase() || '';
              const description = (cls.description || '').replace(/&[#\w]+;/g, '').toLowerCase();
              const namespace = (cls.namespace || '').toLowerCase();
              const queryLower = query.toLowerCase();
              
              return name.includes(queryLower) || 
                     description.includes(queryLower) || 
                     namespace.includes(queryLower);
            });
          } catch (pageError) {
            console.error(`Could not fetch additional pages: ${pageError}`);
          }
        }
        
        console.error(`Drupal API: Filtered to ${filtered.length} classes with query "${query}"`);
        return filtered;
      }
      
      return allData;
    } catch (error) {
      console.error(`Error searching classes: ${error instanceof Error ? error.message : String(error)}`);
      console.log('Falling back to mock data...');
      return this.getMockClasses(query);
    }
  }

  // Helper to determine if we should fetch more pages based on query
  private shouldFetchMorePages(query: string): boolean {
    const firstChar = query.toLowerCase().charAt(0);
    // If query starts with letters later in alphabet (E-Z), try more pages
    return firstChar >= 'e' && firstChar <= 'z';
  }

  // Enhanced hooks search with multiple strategies and comprehensive coverage
  async searchHooks(version: DrupalVersion = '11.x', query?: string): Promise<DrupalAPIHook[]> {
    try {
      console.error(`Drupal API: Starting comprehensive hooks search for version ${version}`);
      
      // Strategy 1: Extract from function implementations (improved)
      const functionsHooks = await this.extractHooksFromFunctions(version);
      
      // Strategy 2: Search for dedicated hook documentation pages
      const dedicatedHooks = await this.searchDedicatedHooks(version);
      
      // Strategy 3: Search in topics/groups for hook documentation
      const topicHooks = await this.extractHooksFromTopics(version);
      
      // Strategy 4: Add popular core hooks that might be missed
      const coreHooks = this.getPopularCoreHooks();
      
      // Strategy 5: Fallback to searchAll for hook-related content if query provided
      const fallbackHooks = query ? await this.searchHooksFallback(version, query) : [];
      
      // Combine and deduplicate all results
      const allHooks = [...functionsHooks, ...dedicatedHooks, ...topicHooks, ...coreHooks, ...fallbackHooks];
      const uniqueHooks = this.deduplicateHooks(allHooks);
      
      console.error(`Drupal API: Found ${uniqueHooks.length} total unique hooks from all strategies`);
      
      // Filter by query if provided
      if (query && query.trim()) {
        const filtered = uniqueHooks.filter(hook => {
          const name = hook.name.toLowerCase();
          const description = hook.description.toLowerCase();
          const group = (hook.group || '').toLowerCase();
          const queryLower = query.toLowerCase();
          
          return name.includes(queryLower) || 
                 description.includes(queryLower) || 
                 group.includes(queryLower);
        });
        console.error(`Drupal API: Filtered to ${filtered.length} hooks with query "${query}"`);
        return filtered.slice(0, 100); // Limit to prevent overwhelming results
      }
      
      return uniqueHooks.slice(0, 200); // Return more hooks but with reasonable limit
    } catch (error) {
      console.error(`Error searching hooks: ${error instanceof Error ? error.message : String(error)}`);
      console.log('Falling back to mock data...');
      return this.getMockHooks(query);
    }
  }

  // Strategy 1: Extract hooks from function implementations (improved)
  private async extractHooksFromFunctions(version: DrupalVersion): Promise<DrupalAPIHook[]> {
    try {
      // Get more comprehensive function data by fetching multiple pages
      const functions = await this.getExtensiveFunctionData(version);
      
      const hookImplementations = functions.filter((func: any) => 
        func.description && (
          func.description.includes('Implements hook_') ||
          func.description.includes('Implementation of hook_') ||
          func.name.includes('hook_') ||
          func.description.includes('Hook implementation')
        ));
      
      console.error(`Strategy 1: Found ${hookImplementations.length} hook implementations`);
      
      const hooks: DrupalAPIHook[] = [];
      const seenHooks = new Set<string>();
      
      for (const impl of hookImplementations) {
        // Multiple regex patterns to catch different hook formats
        const patterns = [
          /Implements (hook_[a-zA-Z_]+)\(\)/,
          /Implementation of (hook_[a-zA-Z_]+)\(\)/,
          /(hook_[a-zA-Z_]+)\(\)/,
          /Hook\s+(hook_[a-zA-Z_]+)/i
        ];
        
        for (const pattern of patterns) {
          const match = impl.description.match(pattern);
          if (match) {
            const hookName = match[1];
            if (!seenHooks.has(hookName)) {
              seenHooks.add(hookName);
              hooks.push({
                name: hookName,
                description: this.generateHookDescription(hookName, impl.description),
                url: impl.url,
                file: impl.file,
                group: this.getHookGroup(hookName),
                examples: [`${impl.name}()`],
                parameters: this.extractHookParameters(impl.description),
              });
            } else {
              // Add this implementation to existing hook
              const existingHook = hooks.find(h => h.name === hookName);
              if (existingHook && existingHook.examples) {
                existingHook.examples.push(`${impl.name}()`);
              }
            }
            break; // Found a pattern, stop looking
          }
        }
      }
      
      return hooks;
    } catch (error) {
      console.error(`Error in extractHooksFromFunctions: ${error}`);
      return [];
    }
  }

  // Strategy 2: Search for dedicated hook documentation
  private async searchDedicatedHooks(version: DrupalVersion): Promise<DrupalAPIHook[]> {
    try {
      // Try to find hooks in the documentation structure
      const hookUrls = [
        `/api/drupal/elements/${version}`, // Some hooks documented as elements
        `/api/drupal/groups/${version}`, // Hook groups
      ];
      
      const hooks: DrupalAPIHook[] = [];
      
      for (const url of hookUrls) {
        try {
          const data = await this.fetchAndParse(url);
          const hookData = data.filter((item: any) => 
            item.name && (
              item.name.startsWith('hook_') ||
              item.description?.includes('hook_') ||
              item.name.includes('Hook')
            )
          );
          
          for (const item of hookData) {
            hooks.push({
              name: item.name.startsWith('hook_') ? item.name : `hook_${item.name}`,
              description: item.description || `Hook: ${item.name}`,
              url: item.url,
              group: item.category || this.getHookGroup(item.name),
              file: item.file,
            });
          }
        } catch (urlError) {
          // Skip URLs that don't work
          continue;
        }
      }
      
      console.error(`Strategy 2: Found ${hooks.length} dedicated hook docs`);
      return hooks;
    } catch (error) {
      console.error(`Error in searchDedicatedHooks: ${error}`);
      return [];
    }
  }

  // Strategy 3: Extract hooks from topics/groups
  private async extractHooksFromTopics(version: DrupalVersion): Promise<DrupalAPIHook[]> {
    try {
      const topics = await this.searchTopics(version, 'hook');
      const hooks: DrupalAPIHook[] = [];
      
      for (const topic of topics) {
        if (topic.name && topic.name.toLowerCase().includes('hook')) {
          // Extract hook names from topic descriptions
          const hookMatches = topic.description.match(/hook_[a-zA-Z_]+/g) || [];
          
          for (const hookName of hookMatches) {
            hooks.push({
              name: hookName,
              description: `Documented in topic: ${topic.name}`,
              url: topic.url,
              group: topic.name,
            });
          }
        }
      }
      
      console.error(`Strategy 3: Found ${hooks.length} hooks from topics`);
      return hooks;
    } catch (error) {
      console.error(`Error in extractHooksFromTopics: ${error}`);
      return [];
    }
  }

  // Strategy 4: Get popular core hooks that might be missed
  private getPopularCoreHooks(): DrupalAPIHook[] {
    const popularHooks = [
      {
        name: 'hook_init',
        description: 'Runs on every page request during initialization',
        group: 'Bootstrap',
        url: 'https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Extension!module.api.php/function/hook_init/11.x'
      },
      {
        name: 'hook_menu',
        description: 'Defines menu items and page callbacks',
        group: 'Menu',
        url: 'https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Menu!menu.api.php/function/hook_menu/11.x'
      },
      {
        name: 'hook_form_alter',
        description: 'Modifies forms before they are rendered',
        group: 'Form',
        url: 'https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Form!form.api.php/function/hook_form_alter/11.x'
      },
      {
        name: 'hook_node_presave',
        description: 'Executes before a node is saved to the database',
        group: 'Node',
        url: 'https://api.drupal.org/api/drupal/core!modules!node!node.api.php/function/hook_node_presave/11.x'
      },
      {
        name: 'hook_user_login',
        description: 'Executes after a user has been logged in',
        group: 'User',
        url: 'https://api.drupal.org/api/drupal/core!modules!user!user.api.php/function/hook_user_login/11.x'
      },
      {
        name: 'hook_cron',
        description: 'Executes periodic tasks during cron runs',
        group: 'System',
        url: 'https://api.drupal.org/api/drupal/core!core.api.php/function/hook_cron/11.x'
      },
      {
        name: 'hook_install',
        description: 'Executes when a module is installed',
        group: 'Install',
        url: 'https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Extension!module.api.php/function/hook_install/11.x'
      },
      {
        name: 'hook_schema',
        description: 'Defines database table schemas',
        group: 'Database',
        url: 'https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Database!database.api.php/function/hook_schema/11.x'
      },
      {
        name: 'hook_permission',
        description: 'Defines user permissions for the module',
        group: 'Security',
        url: 'https://api.drupal.org/api/drupal/core!modules!user!user.api.php/function/hook_permission/11.x'
      },
      {
        name: 'hook_theme',
        description: 'Defines theme templates and functions',
        group: 'Theme',
        url: 'https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Render!theme.api.php/function/hook_theme/11.x'
      }
    ];
    
    console.error(`Strategy 4: Added ${popularHooks.length} popular core hooks`);
    return popularHooks;
  }

  // Strategy 5: Fallback search using searchAll
  private async searchHooksFallback(version: DrupalVersion, query: string): Promise<DrupalAPIHook[]> {
    try {
      const searchQuery = query.startsWith('hook_') ? query : `hook_${query}`;
      const allResults = await this.searchAll(searchQuery, version);
      
      const hooks: DrupalAPIHook[] = [];
      
      for (const result of allResults) {
        if (result.name.includes('hook_') || result.description.includes('hook_')) {
          hooks.push({
            name: result.name.startsWith('hook_') ? result.name : `hook_${result.name}`,
            description: result.description,
            url: result.url,
            group: 'Fallback Search',
          });
        }
      }
      
      console.error(`Strategy 5: Found ${hooks.length} hooks from fallback search`);
      return hooks;
    } catch (error) {
      console.error(`Error in searchHooksFallback: ${error}`);
      return [];
    }
  }

  // Get extensive function data by fetching multiple pages
  private async getExtensiveFunctionData(version: DrupalVersion): Promise<any[]> {
    try {
      const url = `/api/drupal/functions/${version}`;
      const promises = [];
      
      // Fetch first 10 pages to get comprehensive function data
      for (let page = 0; page < 10; page++) {
        promises.push(
          this.fetchAndParse(page === 0 ? url : `${url}?page=${page}`)
            .catch(() => []) // Return empty array on error
        );
      }
      
      const results = await Promise.all(promises);
      const allFunctions = results.flat();
      
      console.error(`Extensive function search: Found ${allFunctions.length} total functions`);
      return allFunctions;
    } catch (error) {
      console.error(`Error in getExtensiveFunctionData: ${error}`);
      return [];
    }
  }

  // Deduplicate hooks based on name
  private deduplicateHooks(hooks: DrupalAPIHook[]): DrupalAPIHook[] {
    const seenHooks = new Map<string, DrupalAPIHook>();
    
    for (const hook of hooks) {
      const key = hook.name.toLowerCase();
      if (!seenHooks.has(key)) {
        seenHooks.set(key, hook);
      } else {
        // Merge information from duplicate hooks
        const existing = seenHooks.get(key)!;
        if (hook.examples && existing.examples) {
          existing.examples = [...new Set([...existing.examples, ...hook.examples])];
        }
        if (hook.description && hook.description !== existing.description && !existing.description.includes(hook.description)) {
          existing.description += ` | ${hook.description}`;
        }
      }
    }
    
    return Array.from(seenHooks.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // Generate better hook descriptions
  private generateHookDescription(hookName: string, originalDescription: string): string {
    const hookPurpose = this.getHookPurpose(hookName);
    const cleanDescription = originalDescription.replace(/Implements hook_[a-zA-Z_]+\(\)\./g, '').trim();
    
    if (hookPurpose) {
      return `${hookPurpose}${cleanDescription ? ` - ${cleanDescription}` : ''}`;
    }
    
    return cleanDescription || `Hook: ${hookName}`;
  }

  // Extract parameters from hook descriptions
  private extractHookParameters(description: string): string[] {
    const paramMatches = description.match(/\$[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    return [...new Set(paramMatches)]; // Remove duplicates
  }

  // Get hook purpose based on name patterns
  private getHookPurpose(hookName: string): string {
    const purposes: { [key: string]: string } = {
      'hook_init': 'Runs on every page request',
      'hook_menu': 'Defines menu items and page callbacks',
      'hook_form_alter': 'Modifies forms before they are rendered',
      'hook_node_presave': 'Executes before a node is saved',
      'hook_node_insert': 'Executes after a new node is saved',
      'hook_node_update': 'Executes after an existing node is saved',
      'hook_node_delete': 'Executes before a node is deleted',
      'hook_user_login': 'Executes when a user logs in',
      'hook_user_logout': 'Executes when a user logs out',
      'hook_cron': 'Executes during cron runs',
      'hook_install': 'Executes when a module is installed',
      'hook_uninstall': 'Executes when a module is uninstalled',
      'hook_schema': 'Defines database table schemas',
      'hook_permission': 'Defines user permissions',
      'hook_theme': 'Defines theme templates and functions',
      'hook_block_info': 'Defines available blocks',
      'hook_block_view': 'Renders block content',
    };
    
    // Check for exact matches first
    if (purposes[hookName]) {
      return purposes[hookName];
    }
    
    // Check for pattern matches
    for (const [pattern, purpose] of Object.entries(purposes)) {
      if (hookName.includes(pattern.replace('hook_', ''))) {
        return purpose;
      }
    }
    
    // Fallback: guess from hook name
    if (hookName.includes('presave')) return 'Executes before entity is saved';
    if (hookName.includes('insert')) return 'Executes after entity is created';
    if (hookName.includes('update')) return 'Executes after entity is updated';
    if (hookName.includes('delete')) return 'Executes before entity is deleted';
    if (hookName.includes('alter')) return 'Modifies existing data or behavior';
    if (hookName.includes('view')) return 'Renders or modifies display';
    if (hookName.includes('form')) return 'Handles form-related functionality';
    if (hookName.includes('mail')) return 'Handles email functionality';
    if (hookName.includes('field')) return 'Handles field-related functionality';
    
    return '';
  }

  // Get hook group/category
  private getHookGroup(hookName: string): string {
    if (hookName.includes('node_')) return 'Node';
    if (hookName.includes('user_')) return 'User';
    if (hookName.includes('form_')) return 'Form';
    if (hookName.includes('field_')) return 'Field';
    if (hookName.includes('block_')) return 'Block';
    if (hookName.includes('theme_')) return 'Theme';
    if (hookName.includes('menu_')) return 'Menu';
    if (hookName.includes('mail_')) return 'Mail';
    if (hookName.includes('cache_')) return 'Cache';
    if (hookName.includes('cron')) return 'System';
    if (hookName.includes('install') || hookName.includes('uninstall')) return 'Install';
    if (hookName.includes('schema') || hookName.includes('database')) return 'Database';
    if (hookName.includes('permission') || hookName.includes('access')) return 'Security';
    if (hookName.includes('init') || hookName.includes('boot')) return 'Bootstrap';
    
    return 'General';
  }

  // Search topics
  async searchTopics(version: DrupalVersion = '11.x', query?: string): Promise<any[]> {
    try {
      const url = `/api/drupal/groups/${version}`;
      const data = await this.fetchAndParse(url);
      
      console.error(`Drupal API: Found ${data.length} topics for version ${version}`);
      
      if (query && query.trim()) {
        const filtered = data.filter((topic: any) => {
          const name = topic.name?.toLowerCase() || '';
          const description = (topic.description || '').replace(/&[#\w]+;/g, '').toLowerCase();
          const queryLower = query.toLowerCase();
          
          return name.includes(queryLower) || description.includes(queryLower);
        });
        console.error(`Drupal API: Filtered to ${filtered.length} topics with query "${query}"`);
        return filtered;
      }
      
      return data;
    } catch (error) {
      console.error(`Error searching topics: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // Search services
  async searchServices(version: DrupalVersion = '11.x', query?: string): Promise<any[]> {
    try {
      const url = `/api/drupal/services/${version}`;
      const data = await this.fetchAndParse(url);
      
      if (query && query.trim()) {
        const filtered = data.filter((service: any) => {
          const name = service.name?.toLowerCase() || '';
          const description = (service.description || '').replace(/&[#\w]+;/g, '').toLowerCase();
          const queryLower = query.toLowerCase();
          
          return name.includes(queryLower) || description.includes(queryLower);
        });
        console.error(`Drupal API: Filtered to ${filtered.length} services with query "${query}"`);
        return filtered;
      }
      
      return data;
    } catch (error) {
      console.error(`Error searching services: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // Generic search across all documentation types
  async searchAll(query: string, version: DrupalVersion = '11.x'): Promise<SearchResult[]> {
    try {
      const [functions, classes, topics, services] = await Promise.all([
        this.searchFunctions(version, query),
        this.searchClasses(version, query), 
        this.searchTopics(version, query),
        this.searchServices(version, query),
      ]);

      const results: SearchResult[] = [];

      functions.forEach(func => {
        if (func.url) {
          results.push({
            type: 'functions',
            name: func.name,
            description: func.description,
            url: func.url,
            version,
            deprecated: func.deprecated,
          });
        }
      });

      classes.forEach(cls => {
        if (cls.url) {
          results.push({
            type: 'classes',
            name: cls.name,
            description: cls.description,
            url: cls.url,
            version,
            deprecated: cls.deprecated,
          });
        }
      });

      topics.forEach(topic => {
        if (topic.url) {
          results.push({
            type: 'topics',
            name: topic.name,
            description: topic.description,
            url: topic.url,
            version,
          });
        }
      });

      services.forEach(service => {
        if (service.url) {
          results.push({
            type: 'services',
            name: service.name,
            description: service.description,
            url: service.url,
            version,
          });
        }
      });

      return results.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error(`Error in searchAll: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // Get detailed information about a specific function
  async getFunctionDetails(functionName: string, version: DrupalVersion = '11.x'): Promise<DrupalAPIFunction | null> {
    try {
      // First try with standard search (may include pagination if needed)
      const functions = await this.searchFunctions(version, functionName);
      let found = functions.find(func => func.name === functionName);
      
      // If not found, try fetching more pages
      if (!found) {
        console.error(`Function "${functionName}" not found in initial search, trying extended search...`);
        
        try {
          // Fetch multiple pages to increase chances of finding the function
          const url = `/api/drupal/functions/${version}`;
          const page1Data = await this.fetchAndParse(url);
          const page2Data = await this.fetchAndParse(`${url}?page=1`);
          const page3Data = await this.fetchAndParse(`${url}?page=2`);
          const page4Data = await this.fetchAndParse(`${url}?page=3`);
          const page5Data = await this.fetchAndParse(`${url}?page=4`);
          
          const allFunctions = [...page1Data, ...page2Data, ...page3Data, ...page4Data, ...page5Data];
          console.error(`Extended search found ${allFunctions.length} total functions for exact match`);
          
          found = allFunctions.find(func => func.name === functionName);
        } catch (pageError) {
          console.error(`Could not fetch additional pages for function details: ${pageError}`);
        }
      }
      
      if (found) {
        console.error(`Found function "${functionName}": ${found.description}`);
      } else {
        console.error(`Function "${functionName}" not found in any searched pages`);
      }
      
      return found || null;
    } catch (error) {
      console.error(`Error in getFunctionDetails: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  // Enhanced class details with improved caching, fallbacks and fuzzy matching
  async getClassDetails(className: string, version: DrupalVersion = '11.x'): Promise<DrupalAPIClass | null> {
    try {
      console.error(`Starting comprehensive class search for "${className}" in version ${version}`);
      
      // Strategy 1: Check local cache first
      const cacheKey = `class-details-${className}-${version}`;
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.error(`Cache hit for class "${className}"`);
        return cached.data;
      }
      
      // Strategy 2: Exact match search (improved)
      let found = await this.findClassExactMatch(className, version);
      
      // Strategy 3: Fuzzy matching if exact match fails
      if (!found) {
        found = await this.findClassFuzzyMatch(className, version);
      }
      
      // Strategy 4: Search in searchAll as fallback
      if (!found) {
        found = await this.findClassInSearchAll(className, version);
      }
      
      // Strategy 5: Partial match with namespace
      if (!found) {
        found = await this.findClassWithNamespace(className, version);
      }
      
      // Strategy 6: Common class patterns
      if (!found) {
        found = await this.findClassByPatterns(className, version);
      }
      
      // Cache the result (including null results to prevent repeated failed searches)
      this.cache.set(cacheKey, {
        data: found,
        timestamp: Date.now(),
        hitCount: 1,
        size: found ? this.estimateSize(found) : 100
      });
      
      if (found) {
        console.error(`Successfully found class "${className}": ${found.description?.substring(0, 100)}...`);
        
        // Enhance found class with additional metadata
        return this.enhanceClassDetails(found, version);
      } else {
        console.error(`Class "${className}" not found after trying all strategies`);
        return null;
      }
    } catch (error) {
      console.error(`Error in getClassDetails: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  // Strategy 1: Find exact match using comprehensive search
  private async findClassExactMatch(className: string, version: DrupalVersion): Promise<DrupalAPIClass | null> {
    try {
      console.error(`Strategy 1: Exact match search for "${className}"`);
      
      // First try with standard search
      const classes = await this.searchClasses(version, className);
      let found = classes.find(cls => cls.name === className);
      
      if (found) {
        console.error(`Exact match found in standard search`);
        return found;
      }
      
      // Extended search across multiple pages
      const url = `/api/drupal/classes/${version}`;
      const promises = [];
      
      // Search first 15 pages for comprehensive coverage
      for (let page = 0; page < 15; page++) {
        promises.push(
          this.fetchAndParse(page === 0 ? url : `${url}?page=${page}`)
            .catch(() => [])
        );
      }
      
      const results = await Promise.all(promises);
      const allClasses = results.flat();
      
      found = allClasses.find(cls => cls.name === className);
      
      if (found) {
        console.error(`Exact match found in extended search (${allClasses.length} classes searched)`);
      }
      
      return found || null;
    } catch (error) {
      console.error(`Error in findClassExactMatch: ${error}`);
      return null;
    }
  }

  // Strategy 2: Fuzzy matching for class names
  private async findClassFuzzyMatch(className: string, version: DrupalVersion): Promise<DrupalAPIClass | null> {
    try {
      console.error(`Strategy 2: Fuzzy match search for "${className}"`);
      
      const classes = await this.searchClasses(version);
      
      // Try different fuzzy matching strategies
      const candidates = [
        // Case insensitive exact match
        classes.find(cls => cls.name.toLowerCase() === className.toLowerCase()),
        
        // Partial match (starts with)
        classes.find(cls => cls.name.toLowerCase().startsWith(className.toLowerCase())),
        
        // Partial match (ends with)
        classes.find(cls => cls.name.toLowerCase().endsWith(className.toLowerCase())),
        
        // Contains match
        classes.find(cls => cls.name.toLowerCase().includes(className.toLowerCase())),
        
        // Remove common prefixes/suffixes and match
        classes.find(cls => {
          const cleanName = cls.name.replace(/^(Drupal\\|\\|Core\\|Entity\\|Field\\)/, '');
          return cleanName.toLowerCase() === className.toLowerCase();
        }),
        
        // Match without namespace
        classes.find(cls => {
          const shortName = cls.name.split('\\').pop() || cls.name;
          return shortName.toLowerCase() === className.toLowerCase();
        })
      ].filter(Boolean);
      
      if (candidates.length > 0) {
        const found = candidates[0];
        console.error(`Fuzzy match found: "${found!.name}" for "${className}"`);
        return found!;
      }
      
      return null;
    } catch (error) {
      console.error(`Error in findClassFuzzyMatch: ${error}`);
      return null;
    }
  }

  // Strategy 3: Search in searchAll results
  private async findClassInSearchAll(className: string, version: DrupalVersion): Promise<DrupalAPIClass | null> {
    try {
      console.error(`Strategy 3: SearchAll fallback for "${className}"`);
      
      const allResults = await this.searchAll(className, version);
      const classResults = allResults.filter(result => result.type === 'classes');
      
      for (const result of classResults) {
        if (result.name === className || 
            result.name.toLowerCase() === className.toLowerCase() ||
            result.name.endsWith(`\\${className}`)) {
          
          // Convert SearchResult to DrupalAPIClass format
          const classData: DrupalAPIClass = {
            name: result.name,
            namespace: this.extractNamespace(result.name),
            file: '',
            description: result.description,
            url: result.url,
            deprecated: result.deprecated
          };
          
          console.error(`Found class in searchAll: "${result.name}"`);
          return classData;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error in findClassInSearchAll: ${error}`);
      return null;
    }
  }

  // Strategy 4: Find class with namespace variations
  private async findClassWithNamespace(className: string, version: DrupalVersion): Promise<DrupalAPIClass | null> {
    try {
      console.error(`Strategy 4: Namespace variation search for "${className}"`);
      
      const commonNamespaces = [
        'Drupal\\Core\\Entity',
        'Drupal\\Core\\Field',
        'Drupal\\Core\\Form',
        'Drupal\\Core\\Plugin',
        'Drupal\\Core\\Controller',
        'Drupal\\Core\\Service',
        'Drupal\\node\\Entity',
        'Drupal\\user\\Entity',
        'Drupal\\Core\\Database',
        'Drupal\\Core\\Cache',
        'Drupal\\Core\\Config'
      ];
      
      for (const namespace of commonNamespaces) {
        const fullClassName = `${namespace}\\${className}`;
        const found = await this.findClassExactMatch(fullClassName, version);
        if (found) {
          console.error(`Found class with namespace: "${fullClassName}"`);
          return found;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error in findClassWithNamespace: ${error}`);
      return null;
    }
  }

  // Strategy 5: Find by common patterns
  private async findClassByPatterns(className: string, version: DrupalVersion): Promise<DrupalAPIClass | null> {
    try {
      console.error(`Strategy 5: Pattern-based search for "${className}"`);
      
      const patterns = [
        `${className}Interface`,
        `${className}Base`,
        `${className}Manager`,
        `${className}Service`,
        `${className}Controller`,
        `${className}Form`,
        `Abstract${className}`,
        `Base${className}`,
        `Default${className}`
      ];
      
      for (const pattern of patterns) {
        const found = await this.findClassExactMatch(pattern, version);
        if (found) {
          console.error(`Found class with pattern: "${pattern}"`);
          return found;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error in findClassByPatterns: ${error}`);
      return null;
    }
  }

  // Enhance class details with additional metadata
  private enhanceClassDetails(classData: DrupalAPIClass, version: DrupalVersion): DrupalAPIClass {
    try {
      // Add inferred information based on class name and namespace
      const enhanced = { ...classData };
      
      // Extract namespace if not already present
      if (!enhanced.namespace && enhanced.name.includes('\\')) {
        enhanced.namespace = this.extractNamespace(enhanced.name);
      }
      
      // Add category based on namespace/name
      const category = this.getClassCategory(enhanced.name);
      if (category) {
        enhanced.description = `[${category}] ${enhanced.description || ''}`;
      }
      
      // Ensure URL is properly formatted
      if (!enhanced.url && enhanced.name) {
        enhanced.url = `https://api.drupal.org/api/drupal/core/classes/${enhanced.name}/${version}`;
      }
      
      return enhanced;
    } catch (error) {
      console.error(`Error enhancing class details: ${error}`);
      return classData;
    }
  }

  // Extract namespace from full class name
  private extractNamespace(fullClassName: string): string {
    const parts = fullClassName.split('\\');
    if (parts.length > 1) {
      return parts.slice(0, -1).join('\\');
    }
    return '';
  }

  // Get class category based on namespace/name patterns
  private getClassCategory(className: string): string {
    if (className.includes('\\Entity\\')) return 'Entity';
    if (className.includes('\\Field\\')) return 'Field';
    if (className.includes('\\Form\\')) return 'Form';
    if (className.includes('\\Plugin\\')) return 'Plugin';
    if (className.includes('\\Controller\\')) return 'Controller';
    if (className.includes('\\Service\\')) return 'Service';
    if (className.includes('\\Database\\')) return 'Database';
    if (className.includes('\\Cache\\')) return 'Cache';
    if (className.includes('\\Config\\')) return 'Configuration';
    if (className.includes('\\Theme\\')) return 'Theme';
    if (className.includes('\\Menu\\')) return 'Menu';
    if (className.includes('\\User\\')) return 'User';
    if (className.includes('\\Node\\')) return 'Node';
    if (className.includes('\\Block\\')) return 'Block';
    if (className.includes('Manager')) return 'Manager';
    if (className.includes('Interface')) return 'Interface';
    if (className.includes('Exception')) return 'Exception';
    if (className.includes('Event')) return 'Event';
    if (className.includes('Subscriber')) return 'Event Subscriber';
    
    return '';
  }

  // Get available Drupal versions
  getAvailableVersions(): DrupalVersion[] {
    // Fetch supported versions dynamically from API instead of hardcoding
    throw new Error('Drupal versions must be fetched dynamically from API');
  }

  // Get available documentation types
  getAvailableDocTypes(): DocType[] {
    // Fetch search types dynamically from API instead of hardcoding
    throw new Error('Search types must be fetched dynamically from API');
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get comprehensive cache and performance stats
  getCacheStats(): { 
    size: number; 
    entries: string[]; 
    memoryUsage: number;
    performance: PerformanceMetrics;
    hitRatio: number;
    topHits: Array<{key: string; hits: number}>;
  } {
    let totalMemory = 0;
    const hitCounts: Array<{key: string; hits: number}> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      totalMemory += entry.size;
      hitCounts.push({key: key.substring(0, 50) + '...', hits: entry.hitCount});
    }
    
    const hitRatio = this.performanceMetrics.totalRequests > 0 
      ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100 
      : 0;
    
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).map(k => k.substring(0, 50) + '...'),
      memoryUsage: Math.round(totalMemory / 1024 / 1024 * 100) / 100, // MB
      performance: { ...this.performanceMetrics },
      hitRatio: Math.round(hitRatio * 100) / 100,
      topHits: hitCounts.sort((a, b) => b.hits - a.hits).slice(0, 10)
    };
  }

  // Get performance recommendations based on usage patterns
  getPerformanceRecommendations(): string[] {
    const stats = this.getCacheStats();
    const recommendations: string[] = [];
    
    if (stats.hitRatio < 60) {
      recommendations.push('Cache hit ratio is low (<60%). Consider increasing cache timeout or reviewing query patterns.');
    }
    
    if (stats.memoryUsage > 40) {
      recommendations.push('Cache memory usage is high (>40MB). Consider reducing maxCacheMemory or cleaning up more frequently.');
    }
    
    if (this.performanceMetrics.avgResponseTime > 2000) {
      recommendations.push('Average response time is high (>2s). Consider optimizing queries or using more targeted searches.');
    }
    
    if (this.performanceMetrics.errorCount > this.performanceMetrics.totalRequests * 0.1) {
      recommendations.push('Error rate is high (>10%). Check network connectivity or API availability.');
    }
    
    if (stats.size > this.maxCacheSize * 0.9) {
      recommendations.push('Cache is near capacity. Consider increasing maxCacheSize or implementing better eviction policies.');
    }
    
    return recommendations;
  }

  // Warm up cache with commonly used queries
  async warmupCache(version: DrupalVersion = '11.x'): Promise<void> {
    const commonQueries = [
      { type: 'functions' as DocType, query: 'node' },
      { type: 'functions' as DocType, query: 'user' },
      { type: 'functions' as DocType, query: 'form' },
      { type: 'hooks' as DocType, query: 'alter' },
      { type: 'classes' as DocType, query: 'Entity' },
    ];
    
    console.error('Starting cache warmup...');
    
    const warmupPromises = commonQueries.map(async ({ type, query }) => {
      try {
        switch (type) {
          case 'functions':
            await this.searchFunctions(version, query);
            break;
          case 'classes':
            await this.searchClasses(version, query);
            break;
        }
      } catch (error) {
        console.error(`Warmup failed for ${type}:${query}:`, error);
      }
    });
    
    await Promise.all(warmupPromises);
    console.error(`Cache warmup completed. Cache size: ${this.cache.size}`);
  }

  // Mock data fallback methods
  private getMockFunctions(query?: string): DrupalAPIFunction[] {
    let functions = mockDrupalFunctions;
    
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      functions = mockDrupalFunctions.filter(func => 
        func.name.toLowerCase().includes(queryLower) ||
        func.description.toLowerCase().includes(queryLower) ||
        (func.category && func.category.toLowerCase().includes(queryLower)) ||
        (func.module && func.module.toLowerCase().includes(queryLower))
      );
    }
    
    console.log(`Mock data: Returning ${functions.length} functions`);
    return functions;
  }

  private getMockHooks(query?: string): DrupalAPIHook[] {
    let hooks = mockDrupalHooks;
    
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      hooks = mockDrupalHooks.filter(hook => 
        hook.name.toLowerCase().includes(queryLower) ||
        hook.description.toLowerCase().includes(queryLower) ||
        (hook.group && hook.group.toLowerCase().includes(queryLower))
      );
    }
    
    console.log(`Mock data: Returning ${hooks.length} hooks`);
    return hooks;
  }

  private getMockClasses(query?: string): DrupalAPIClass[] {
    let classes = mockDrupalClasses;
    
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      classes = mockDrupalClasses.filter(cls => 
        cls.name.toLowerCase().includes(queryLower) ||
        cls.description.toLowerCase().includes(queryLower) ||
        cls.namespace.toLowerCase().includes(queryLower)
      );
    }
    
    console.log(`Mock data: Returning ${classes.length} classes`);
    return classes;
  }

  getMockCodeExamples(query?: string): any[] {
    let examples = mockCodeExamples;
    
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      examples = mockCodeExamples.filter(example => 
        example.title.toLowerCase().includes(queryLower) ||
        example.description.toLowerCase().includes(queryLower) ||
        example.category.toLowerCase().includes(queryLower) ||
        example.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }
    
    console.log(`Mock data: Returning ${examples.length} code examples`);
    return examples;
  }

  getMockModuleTemplates(): any[] {
    console.log(`Mock data: Returning ${mockModuleTemplates.length} module templates`);
    return mockModuleTemplates;
  }

  getMockExampleCategories(): any[] {
    console.log(`Mock data: Returning ${exampleCategories.length} example categories`);
    return exampleCategories;
  }
}
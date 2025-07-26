import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

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

export class DrupalDocsClient {
  private client: AxiosInstance;
  private cache = new Map<string, any>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.drupal.org',
      headers: {
        'User-Agent': 'MCP-Drupal-Server/1.0.0',
        'Accept': 'text/html,application/json',
      },
      timeout: 10000,
    });
  }

  private getCacheKey(type: DocType, version: DrupalVersion, query?: string): string {
    return `${type}-${version}-${query || 'all'}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  private async fetchAndParse(url: string): Promise<any> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const response = await this.client.get(url);
      const data = this.parseHTMLContent(response.data);
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
      
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch documentation: ${error instanceof Error ? error.message : String(error)}`);
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

  // Search functions
  async searchFunctions(version: DrupalVersion = '11.x', query?: string): Promise<DrupalAPIFunction[]> {
    try {
      const url = `/api/drupal/functions/${version}`;
      const data = await this.fetchAndParse(url);
      
      console.error(`Drupal API: Found ${data.length} functions for version ${version}`);
      
      if (query && query.trim()) {
        const filtered = data.filter((func: any) => {
          const name = func.name?.toLowerCase() || '';
          const description = (func.description || '').replace(/&[#\w]+;/g, '').toLowerCase();
          const queryLower = query.toLowerCase();
          
          return name.includes(queryLower) || description.includes(queryLower);
        });
        console.error(`Drupal API: Filtered to ${filtered.length} functions with query "${query}"`);
        return filtered;
      }
      
      return data;
    } catch (error) {
      console.error(`Error searching functions: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
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
      return [];
    }
  }

  // Helper to determine if we should fetch more pages based on query
  private shouldFetchMorePages(query: string): boolean {
    const firstChar = query.toLowerCase().charAt(0);
    // If query starts with letters later in alphabet (E-Z), try more pages
    return firstChar >= 'e' && firstChar <= 'z';
  }

  // Search hooks - extracts hook information from implementations
  async searchHooks(version: DrupalVersion = '11.x', query?: string): Promise<DrupalAPIHook[]> {
    try {
      const functions = await this.searchFunctions(version);
      
      // Extract hooks from function descriptions that mention "Implements hook_"
      const hookImplementations = functions.filter((func: any) => 
        func.description && func.description.includes('Implements hook_'));
      
      console.error(`Drupal API: Found ${hookImplementations.length} hook implementations for version ${version}`);
      
      // Extract the actual hook names and create hook objects
      const hooks: DrupalAPIHook[] = [];
      const seenHooks = new Set<string>();
      
      for (const impl of hookImplementations) {
        const match = impl.description.match(/Implements (hook_[a-zA-Z_]+)\(\)/);
        if (match) {
          const hookName = match[1];
          if (!seenHooks.has(hookName)) {
            seenHooks.add(hookName);
            hooks.push({
              name: hookName,
              description: `Hook implemented by functions like ${impl.name}()`,
              url: impl.url,
              file: impl.file,
              examples: [impl.name]
            });
          } else {
            // Add this implementation as an example
            const existingHook = hooks.find(h => h.name === hookName);
            if (existingHook && existingHook.examples) {
              existingHook.examples.push(impl.name);
            }
          }
        }
      }
      
      if (query && query.trim()) {
        const filtered = hooks.filter((hook: any) => {
          const name = hook.name?.toLowerCase() || '';
          const description = (hook.description || '').replace(/&[#\w]+;/g, '').toLowerCase();
          const queryLower = query.toLowerCase();
          
          return name.includes(queryLower) || description.includes(queryLower);
        });
        console.error(`Drupal API: Filtered to ${filtered.length} hooks with query "${query}"`);
        return filtered;
      }
      
      console.error(`Drupal API: Extracted ${hooks.length} unique hooks from implementations`);
      return hooks;
    } catch (error) {
      console.error(`Error searching hooks: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
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

  // Get detailed information about a specific class
  async getClassDetails(className: string, version: DrupalVersion = '11.x'): Promise<DrupalAPIClass | null> {
    try {
      // First try with standard search (may include pagination if needed)
      const classes = await this.searchClasses(version, className);
      let found = classes.find(cls => cls.name === className);
      
      // If not found and we haven't tried extended search, try fetching more pages
      if (!found) {
        console.error(`Class "${className}" not found in initial search, trying extended search...`);
        
        try {
          // Fetch multiple pages to increase chances of finding the class
          const url = `/api/drupal/classes/${version}`;
          const page1Data = await this.fetchAndParse(url);
          const page2Data = await this.fetchAndParse(`${url}?page=1`);
          const page3Data = await this.fetchAndParse(`${url}?page=2`);
          const page4Data = await this.fetchAndParse(`${url}?page=3`);
          const page5Data = await this.fetchAndParse(`${url}?page=4`);
          
          const allClasses = [...page1Data, ...page2Data, ...page3Data, ...page4Data, ...page5Data];
          console.error(`Extended search found ${allClasses.length} total classes for exact match`);
          
          found = allClasses.find(cls => cls.name === className);
        } catch (pageError) {
          console.error(`Could not fetch additional pages for class details: ${pageError}`);
        }
      }
      
      if (found) {
        console.error(`Found class "${className}": ${found.description}`);
      } else {
        console.error(`Class "${className}" not found in any searched pages`);
      }
      
      return found || null;
    } catch (error) {
      console.error(`Error in getClassDetails: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  // Get available Drupal versions
  getAvailableVersions(): DrupalVersion[] {
    return ['7.x', '8.x', '9.x', '10.x', '11.x'];
  }

  // Get available documentation types
  getAvailableDocTypes(): DocType[] {
    return ['topics', 'classes', 'functions', 'constants', 'globals', 'files', 'namespaces', 'deprecated', 'services', 'elements'];
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
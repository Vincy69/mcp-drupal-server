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
  methods?: string[];
  properties?: string[];
  deprecated?: boolean;
  since?: string;
}

interface DrupalAPIHook {
  name: string;
  description: string;
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
    // Parse HTML content to extract API documentation
    // This is a simplified parser - in production, you'd use a proper HTML parser
    const functionMatches = html.match(/<tr[^>]*>.*?<\/tr>/gs) || [];
    const results: any[] = [];

    for (const match of functionMatches) {
      const nameMatch = match.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/);
      const descMatch = match.match(/<td[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/td>/s);
      
      if (nameMatch && descMatch) {
        results.push({
          name: nameMatch[2].trim(),
          url: `https://api.drupal.org${nameMatch[1]}`,
          description: descMatch[1].replace(/<[^>]*>/g, '').trim(),
        });
      }
    }

    return results;
  }

  // Search functions
  async searchFunctions(version: DrupalVersion = '11.x', query?: string): Promise<DrupalAPIFunction[]> {
    const url = `/api/drupal/functions/${version}`;
    const data = await this.fetchAndParse(url);
    
    if (query) {
      return data.filter((func: any) => 
        func.name.toLowerCase().includes(query.toLowerCase()) ||
        func.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return data;
  }

  // Search classes
  async searchClasses(version: DrupalVersion = '11.x', query?: string): Promise<DrupalAPIClass[]> {
    const url = `/api/drupal/classes/${version}`;
    const data = await this.fetchAndParse(url);
    
    if (query) {
      return data.filter((cls: any) =>
        cls.name.toLowerCase().includes(query.toLowerCase()) ||
        cls.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return data;
  }

  // Search hooks
  async searchHooks(version: DrupalVersion = '11.x', query?: string): Promise<DrupalAPIHook[]> {
    const functions = await this.searchFunctions(version);
    const hooks = functions.filter((func: any) => func.name.startsWith('hook_'));
    
    if (query) {
      return hooks.filter((hook: any) =>
        hook.name.toLowerCase().includes(query.toLowerCase()) ||
        hook.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return hooks;
  }

  // Search topics
  async searchTopics(version: DrupalVersion = '11.x', query?: string): Promise<any[]> {
    const url = `/api/drupal/topics/${version}`;
    const data = await this.fetchAndParse(url);
    
    if (query) {
      return data.filter((topic: any) =>
        topic.name.toLowerCase().includes(query.toLowerCase()) ||
        topic.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return data;
  }

  // Search services
  async searchServices(version: DrupalVersion = '11.x', query?: string): Promise<any[]> {
    const url = `/api/drupal/services/${version}`;
    const data = await this.fetchAndParse(url);
    
    if (query) {
      return data.filter((service: any) =>
        service.name.toLowerCase().includes(query.toLowerCase()) ||
        service.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return data;
  }

  // Generic search across all documentation types
  async searchAll(query: string, version: DrupalVersion = '11.x'): Promise<SearchResult[]> {
    const [functions, classes, topics, services] = await Promise.all([
      this.searchFunctions(version, query),
      this.searchClasses(version, query), 
      this.searchTopics(version, query),
      this.searchServices(version, query),
    ]);

    const results: SearchResult[] = [];

    functions.forEach(func => {
      results.push({
        type: 'functions',
        name: func.name,
        description: func.description,
        url: `https://api.drupal.org/api/drupal/functions/${version}`,
        version,
        deprecated: func.deprecated,
      });
    });

    classes.forEach(cls => {
      results.push({
        type: 'classes',
        name: cls.name,
        description: cls.description,
        url: `https://api.drupal.org/api/drupal/classes/${version}`,
        version,
        deprecated: cls.deprecated,
      });
    });

    topics.forEach(topic => {
      results.push({
        type: 'topics',
        name: topic.name,
        description: topic.description,
        url: `https://api.drupal.org/api/drupal/topics/${version}`,
        version,
      });
    });

    services.forEach(service => {
      results.push({
        type: 'services',
        name: service.name,
        description: service.description,
        url: `https://api.drupal.org/api/drupal/services/${version}`,
        version,
      });
    });

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get detailed information about a specific function
  async getFunctionDetails(functionName: string, version: DrupalVersion = '11.x'): Promise<DrupalAPIFunction | null> {
    const functions = await this.searchFunctions(version, functionName);
    return functions.find(func => func.name === functionName) || null;
  }

  // Get detailed information about a specific class
  async getClassDetails(className: string, version: DrupalVersion = '11.x'): Promise<DrupalAPIClass | null> {
    const classes = await this.searchClasses(version, className);
    return classes.find(cls => cls.name === className) || null;
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
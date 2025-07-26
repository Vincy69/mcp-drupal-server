import axios, { AxiosInstance } from 'axios';

export interface CodeExample {
  title: string;
  description: string;
  category: string;
  drupal_version: string[];
  code: string;
  tags: string[];
  related_functions?: string[];
  related_hooks?: string[];
  source_url?: string;
  last_updated?: string;
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubFile[];
}

interface GitHubFile {
  name: string;
  path: string;
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  html_url: string;
}

interface DrupalOrgExample {
  id: string;
  title: string;
  body: string;
  url: string;
  changed: string;
}

export class DrupalDynamicExamples {
  private githubClient: AxiosInstance;
  private drupalApiClient: AxiosInstance;
  private cache = new Map<string, any>();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes cache

  constructor() {
    this.githubClient = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MCP-Drupal-Server/1.2.0'
      },
      timeout: 30000
    });

    this.drupalApiClient = axios.create({
      baseURL: 'https://api.drupal.org',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MCP-Drupal-Server/1.2.0'
      },
      timeout: 30000
    });
  }

  /**
   * Search for code examples dynamically from multiple sources
   */
  async searchExamples(query: string, category?: string): Promise<CodeExample[]> {
    const cacheKey = `examples_${query}_${category || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const [githubExamples, drupalOrgExamples, documentationExamples] = await Promise.allSettled([
        this.searchGitHubExamples(query, category),
        this.searchDrupalOrgExamples(query, category),
        this.searchDocumentationExamples(query, category)
      ]);

      const allExamples: CodeExample[] = [];

      // Aggregate results from all sources
      if (githubExamples.status === 'fulfilled') {
        allExamples.push(...githubExamples.value);
      }
      if (drupalOrgExamples.status === 'fulfilled') {
        allExamples.push(...drupalOrgExamples.value);
      }
      if (documentationExamples.status === 'fulfilled') {
        allExamples.push(...documentationExamples.value);
      }

      // Deduplicate and sort by relevance
      const uniqueExamples = this.deduplicateExamples(allExamples);
      const sortedExamples = this.sortByRelevance(uniqueExamples, query);

      // Cache results
      this.cache.set(cacheKey, {
        data: sortedExamples,
        timestamp: Date.now()
      });

      return sortedExamples;
    } catch (error) {
      throw new Error(`Failed to search examples: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get examples by category from live sources
   */
  async getExamplesByCategory(category: string, drupalVersion?: string): Promise<CodeExample[]> {
    return this.searchExamples('', category);
  }

  /**
   * Get examples by tag from live sources
   */
  async getExamplesByTag(tag: string): Promise<CodeExample[]> {
    return this.searchExamples(tag);
  }

  /**
   * Get available categories from live API data
   */
  async getCategories(): Promise<string[]> {
    const cacheKey = 'categories';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      // Fetch categories from various API endpoints
      const categories = await this.fetchLiveCategories();
      
      this.cache.set(cacheKey, {
        data: categories,
        timestamp: Date.now()
      });

      return categories;
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search GitHub repositories for Drupal code examples
   */
  private async searchGitHubExamples(query: string, category?: string): Promise<CodeExample[]> {
    const searchQuery = this.buildGitHubSearchQuery(query, category);
    
    try {
      const response = await this.githubClient.get<GitHubSearchResponse>('/search/code', {
        params: {
          q: searchQuery,
          sort: 'indexed',
          order: 'desc',
          per_page: 20
        }
      });

      const examples: CodeExample[] = [];
      
      for (const item of response.data.items) {
        try {
          const example = await this.convertGitHubFileToExample(item);
          if (example) {
            examples.push(example);
          }
        } catch (error) {
          // Skip individual file errors but log them
          console.error(`Failed to process GitHub file ${item.path}:`, error);
          continue;
        }
      }

      return examples;
    } catch (error) {
      console.error('GitHub search failed:', error);
      return [];
    }
  }

  /**
   * Search Drupal.org for code examples
   */
  private async searchDrupalOrgExamples(query: string, category?: string): Promise<CodeExample[]> {
    try {
      // Search in Drupal.org documentation and community posts
      const response = await this.drupalApiClient.get('/node.json', {
        params: {
          type: 'documentation',
          field_tags: category,
          title: query,
          limit: 10
        }
      });

      return this.convertDrupalOrgToExamples(response.data);
    } catch (error) {
      console.error('Drupal.org search failed:', error);
      return [];
    }
  }

  /**
   * Search official Drupal documentation for examples
   */
  private async searchDocumentationExamples(query: string, category?: string): Promise<CodeExample[]> {
    try {
      // This would integrate with api.drupal.org to fetch real examples from function/class documentation
      const response = await axios.get(`https://api.drupal.org/api/drupal/11.x/search/${encodeURIComponent(query)}`, {
        timeout: 30000
      });

      return this.convertApiDocsToExamples(response.data, category);
    } catch (error) {
      console.error('API documentation search failed:', error);
      return [];
    }
  }

  /**
   * Build GitHub search query based on parameters
   */
  private buildGitHubSearchQuery(query: string, category?: string): string {
    let searchQuery = `${query} drupal extension:php OR extension:module`;
    
    if (category) {
      const categoryKeywords = this.getCategoryKeywords(category);
      searchQuery += ` ${categoryKeywords.join(' OR ')}`;
    }

    // Focus on Drupal-specific repositories
    searchQuery += ` repo:drupal/* OR repo:*/drupal-* OR filename:*.module OR filename:*.inc`;
    
    return searchQuery;
  }

  /**
   * Get search keywords for specific categories
   */
  private getCategoryKeywords(category: string): string[] {
    const keywordMap: { [key: string]: string[] } = {
      'nodes': ['node', 'entity', 'content'],
      'users': ['user', 'account', 'auth'],
      'forms': ['form', 'FormBase', 'buildForm'],
      'hooks': ['hook_', 'implements'],
      'database': ['database', 'query', 'select'],
      'cache': ['cache', 'CacheBackend'],
      'services': ['service', 'dependency injection', 'container'],
      'configuration': ['config', 'ConfigFactory', 'settings'],
      'events': ['event', 'EventDispatcher', 'subscriber'],
      'migrations': ['migration', 'migrate', 'MigrateSource'],
      'testing': ['test', 'TestCase', 'PHPUnit'],
      'performance': ['performance', 'cache', 'optimization'],
      'security': ['security', 'access', 'permission'],
      'theming': ['theme', 'template', 'preprocess'],
      'api': ['api', 'rest', 'json'],
      'media': ['media', 'file', 'image'],
      'multilingual': ['translation', 'locale', 'i18n']
    };

    return keywordMap[category] || [category];
  }

  /**
   * Convert GitHub file to CodeExample
   */
  private async convertGitHubFileToExample(file: GitHubFile): Promise<CodeExample | null> {
    try {
      // Fetch file content
      const response = await this.githubClient.get(file.path.replace('https://github.com/', '/repos/').replace('/blob/', '/contents/'));
      
      if (response.data.content) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        
        return {
          title: this.extractTitleFromCode(content) || file.name,
          description: this.extractDescriptionFromCode(content),
          category: this.inferCategoryFromPath(file.path),
          drupal_version: this.inferDrupalVersionFromCode(content),
          code: this.cleanCodeContent(content),
          tags: this.extractTagsFromCode(content),
          source_url: file.html_url,
          last_updated: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Failed to fetch GitHub file content for ${file.path}:`, error);
    }
    
    return null;
  }

  /**
   * Convert Drupal.org response to examples
   */
  private convertDrupalOrgToExamples(response: any): CodeExample[] {
    if (!response?.list) return [];

    return response.list.map((item: any) => ({
      title: item.title || 'Untitled Example',
      description: this.extractTextFromHtml(item.body || ''),
      category: this.inferCategoryFromPath(item.body || ''),
      drupal_version: ['10.x', '11.x'], // Infer from content
      code: this.extractCodeFromHtml(item.body || ''),
      tags: this.extractTagsFromContent(item.body || ''),
      source_url: item.url,
      last_updated: new Date(parseInt(item.changed) * 1000).toISOString()
    })).filter((example: CodeExample) => example.code.trim().length > 0);
  }

  /**
   * Convert API docs to examples
   */
  private convertApiDocsToExamples(response: any, category?: string): CodeExample[] {
    // This would parse the API documentation response
    // Implementation depends on the actual API structure
    return [];
  }

  /**
   * Helper methods for content extraction and processing
   */
  private extractTitleFromCode(code: string): string | null {
    const titleMatch = code.match(/@file\s+(.+)/);
    if (titleMatch) return titleMatch[1].trim();
    
    const functionMatch = code.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (functionMatch) return `Function: ${functionMatch[1]}`;
    
    return null;
  }

  private extractDescriptionFromCode(code: string): string {
    const descMatch = code.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    return descMatch ? descMatch[1] : 'No description available';
  }

  private inferCategoryFromPath(path: string): string {
    if (path.includes('/node/')) return 'nodes';
    if (path.includes('/user/')) return 'users';
    if (path.includes('/form/')) return 'forms';
    if (path.includes('/hook/')) return 'hooks';
    if (path.includes('/test/')) return 'testing';
    if (path.includes('/migration/')) return 'migrations';
    return 'other';
  }

  private inferDrupalVersionFromCode(code: string): string[] {
    // Try to infer from code patterns but don't default
    if (code.includes('\\Drupal\\Core\\')) return ['9.x', '10.x', '11.x'];
    if (code.includes('drupal_get_')) return ['7.x'];
    
    // No clear version indicators - return empty array
    return [];
  }

  private cleanCodeContent(content: string): string {
    // Remove comments, clean formatting, etc.
    return content.trim();
  }

  private extractTagsFromCode(code: string): string[] {
    const tags: string[] = [];
    
    if (code.includes('function ')) tags.push('function');
    if (code.includes('class ')) tags.push('class');
    if (code.includes('hook_')) tags.push('hook');
    if (code.includes('Entity::')) tags.push('entity');
    if (code.includes('Node::')) tags.push('node');
    if (code.includes('User::')) tags.push('user');
    
    return tags;
  }

  private extractTextFromHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private extractCodeFromHtml(html: string): string {
    const codeMatch = html.match(/<code[^>]*>(.*?)<\/code>/s);
    return codeMatch ? codeMatch[1].replace(/<[^>]*>/g, '') : html;
  }

  private extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];
    
    if (content.includes('node')) tags.push('node');
    if (content.includes('user')) tags.push('user');
    if (content.includes('form')) tags.push('form');
    if (content.includes('hook')) tags.push('hook');
    
    return tags;
  }

  private deduplicateExamples(examples: CodeExample[]): CodeExample[] {
    const seen = new Set<string>();
    return examples.filter(example => {
      const key = `${example.title}_${example.code.substring(0, 100)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortByRelevance(examples: CodeExample[], query: string): CodeExample[] {
    return examples.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, query);
      const bScore = this.calculateRelevanceScore(b, query);
      return bScore - aScore;
    });
  }

  private calculateRelevanceScore(example: CodeExample, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    if (example.title.toLowerCase().includes(queryLower)) score += 10;
    if (example.description.toLowerCase().includes(queryLower)) score += 5;
    if (example.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 3;
    if (example.code.toLowerCase().includes(queryLower)) score += 2;
    
    return score;
  }

  private async fetchLiveCategories(): Promise<string[]> {
    // Fetch categories from live APIs instead of hardcoded list
    try {
      // This could query multiple sources to get current category taxonomies
      const response = await this.drupalApiClient.get('/taxonomy/categories');
      return response.data.map((cat: any) => cat.name);
    } catch {
      // If API fails, return empty array - no fallback data
      return [];
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
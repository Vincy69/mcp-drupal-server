import axios, { AxiosInstance } from 'axios';

interface DrupalModule {
  title: string;
  name: string;
  description: string;
  version: string;
  compatible_with: string[];
  project_url: string;
  download_url: string;
  documentation_url?: string;
  issue_queue_url: string;
  maintainers: string[];
  created: string;
  changed: string;
  development_status: string;
  maintenance_status: string;
  usage_stats?: {
    sites: number;
    installs: number;
  };
}

interface DrupalTheme {
  title: string;
  name: string;
  description: string;
  version: string;
  compatible_with: string[];
  project_url: string;
  download_url: string;
  screenshot_url?: string;
  demo_url?: string;
  maintainers: string[];
}

interface SearchFilters {
  core_compatibility?: string[];
  development_status?: string[];
  maintenance_status?: string[];
  project_type?: 'module' | 'theme' | 'distribution';
  categories?: string[];
  sort?: 'title' | 'created' | 'changed' | 'usage' | 'relevance';
  limit?: number;
  offset?: number;
}

export class DrupalContribClient {
  private client: AxiosInstance;
  private cache = new Map<string, any>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes - optimized cache duration

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.drupal.org/api-d7',
      headers: {
        'User-Agent': 'MCP-Drupal-Server/1.2.0',
        'Accept': 'application/json',
      },
      timeout: 45000, // Increased timeout for reliable API calls
    });
  }

  private getCacheKey(endpoint: string, params: any = {}): string {
    return `${endpoint}-${JSON.stringify(params)}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  private async fetchWithCache(endpoint: string, params: any = {}, retries: number = 2): Promise<any> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      // Using cached data
      return cached.data;
    }

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Fetching live data from Drupal.org API
        const response = await this.client.get(endpoint, { params });
        const data = response.data;
        
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
        
        return data;
      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as any;
          if (axiosError.response?.status >= 400 && axiosError.response?.status < 500) {
            console.error(`Drupal.org API client error (${axiosError.response.status}): ${errorMessage}`);
            throw new Error(`API client error: ${errorMessage}`);
          }
        }
        
        if (attempt < retries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        console.error(`Drupal.org API request failed after ${retries + 1} attempts: ${errorMessage}`);
      }
    }
    
    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Failed to fetch from Drupal.org API after ${retries + 1} attempts: ${errorMessage}`);
  }

  // Search modules using live Drupal.org API data
  async searchModules(query: string, filters: SearchFilters = {}): Promise<DrupalModule[]> {
    try {
      // Starting external API search for modules
      
      const limit = filters.limit || 20;
      let results: DrupalModule[] = [];

      // Strategy 1: Exact machine name search if query looks like a machine name
      if (query && this.isLikelyMachineName(query)) {
        // Attempting exact machine name search
        const exactResults = await this.searchByMachineName(query);
        results = results.concat(exactResults);
      }

      // Strategy 2: Browse recent/popular modules and client-side filter
      if (results.length < limit) {
        // Fetching recent modules for filtering
        const browseResults = await this.browseModules(Math.max(50, limit * 3));
        const filtered = this.filterModulesClientSide(browseResults, query, filters);
        results = results.concat(filtered);
      }

      // Strategy 3: If still not enough results, try broader search
      if (results.length < 5 && query) {
        // Attempting broader search across all modules
        const broaderResults = await this.browseModules(100);
        const filtered = this.filterModulesClientSide(broaderResults, query, filters);
        results = results.concat(filtered);
      }

      // Remove duplicates and apply final filtering
      const uniqueResults = this.removeDuplicateModules(results);
      const finalResults = uniqueResults.slice(0, limit);
      
      // External API search completed
      return finalResults;
      
    } catch (error) {
      console.error(`Error searching modules via API: ${error instanceof Error ? error.message : String(error)}`)
      throw error; // Re-throw to avoid silently returning empty array
    }
  }

  // Check if query looks like a machine name (lowercase, underscores, no spaces)
  private isLikelyMachineName(query: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(query.trim());
  }

  // Search by exact machine name using Drupal.org API
  private async searchByMachineName(machineName: string): Promise<DrupalModule[]> {
    try {
      const params = {
        type: 'project_module',
        field_project_machine_name: machineName,
        limit: 10
      };
      
      const response = await this.fetchWithCache('/node.json', params);
      return this.transformApiResponse(response);
    } catch (error) {
      // Machine name search failed - silent fallback
      return [];
    }
  }

  // Browse modules from Drupal.org API (recent/popular)
  private async browseModules(limit: number = 50): Promise<DrupalModule[]> {
    try {
      const params = {
        type: 'project_module',
        limit: Math.min(limit, 100), // API limit
        sort: 'changed',
        direction: 'DESC'
      };
      
      const response = await this.fetchWithCache('/node.json', params);
      return this.transformApiResponse(response);
    } catch (error) {
      // Browse modules failed - silent fallback
      return [];
    }
  }

  // Transform Drupal.org API response to DrupalModule[]
  private transformApiResponse(response: any): DrupalModule[] {
    if (!response || typeof response !== 'object') {
      // Invalid API response structure - not an object
      return [];
    }
    
    if (!response.list) {
      // No list property in response
      return [];
    }
    
    if (!Array.isArray(response.list)) {
      // List property is not an array
      return [];
    }
    
    if (response.list.length === 0) {
      // Empty list - valid response but no results
      return [];
    }

    return response.list.map((item: any) => {
      const machineName = this.extractFieldValue(item.field_project_machine_name);
      const description = this.extractFieldValue(item.body) || item.title || 'No description available';
      
      return {
        title: item.title || 'Unknown Module',
        name: machineName || 'unknown',
        description: this.cleanHtmlDescription(description),
        version: 'Latest',
        compatible_with: this.inferCoreCompatibility(item),
        project_url: item.url || `https://www.drupal.org/project/${machineName}`,
        download_url: `https://ftp.drupal.org/files/projects/${machineName}-11.x-dev.tar.gz`,
        issue_queue_url: `https://www.drupal.org/project/issues/${machineName}`,
        maintainers: [item.author?.name || 'Community'],
        created: new Date(parseInt(item.created) * 1000).toISOString(),
        changed: new Date(parseInt(item.changed) * 1000).toISOString(),
        development_status: this.inferDevelopmentStatus(item),
        maintenance_status: this.inferMaintenanceStatus(item),
        usage_stats: this.extractUsageStats(item)
      } as DrupalModule;
    }).filter((module: DrupalModule) => module.name !== 'unknown');
  }

  // Extract field value from Drupal API field structure
  private extractFieldValue(field: any): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (field.und && Array.isArray(field.und) && field.und[0]) {
      return field.und[0].value || field.und[0].safe_value || '';
    }
    return '';
  }

  // Clean HTML from description
  private cleanHtmlDescription(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 500); // Limit length
  }

  // Infer core compatibility from project data
  private inferCoreCompatibility(item: any): string[] {
    // Try to extract from API fields
    if (item.field_project_core_compatibility && Array.isArray(item.field_project_core_compatibility)) {
      return item.field_project_core_compatibility.map((comp: any) => comp.value || comp);
    }
    
    // If no compatibility data available, return empty array - no defaults
    return [];
  }

  // Infer development status
  private inferDevelopmentStatus(item: any): string {
    return 'Under active development';
  }

  // Infer maintenance status
  private inferMaintenanceStatus(item: any): string {
    const lastChanged = parseInt(item.changed) * 1000;
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
    
    return lastChanged > oneYearAgo ? 'Actively maintained' : 'Maintenance fixes only';
  }

  // Extract usage stats (not available in API, return null)
  private extractUsageStats(item: any): { sites: number; installs: number } | undefined {
    return undefined; // Usage stats not available in public API
  }

  // Client-side filtering of modules after API fetch
  private filterModulesClientSide(modules: DrupalModule[], query: string, filters: SearchFilters): DrupalModule[] {
    if (!query && !this.hasActiveFilters(filters)) {
      return modules;
    }

    let filtered = modules;

    // Text query filtering
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);
      
      filtered = filtered.filter(module => {
        const searchText = `${module.title} ${module.name} ${module.description}`.toLowerCase();
        
        // Exact machine name match (highest priority)
        if (module.name.toLowerCase() === queryLower) return true;
        
        // Title contains query
        if (module.title.toLowerCase().includes(queryLower)) return true;
        
        // Description contains query
        if (module.description.toLowerCase().includes(queryLower)) return true;
        
        // Word-based matching
        return queryWords.some(word => searchText.includes(word));
      });

      // Score and sort by relevance
      filtered = filtered.map(module => ({
        ...module,
        _score: this.calculateModuleScore(module, query)
      })).sort((a, b) => (b._score || 0) - (a._score || 0)) as DrupalModule[];
    }

    // Apply other filters
    filtered = this.applyFilters(filtered, filters);

    return filtered;
  }

  // Calculate relevance score for a module
  private calculateModuleScore(module: DrupalModule, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Exact machine name match
    if (module.name.toLowerCase() === queryLower) score += 1000;
    
    // Title matches
    if (module.title.toLowerCase() === queryLower) score += 800;
    if (module.title.toLowerCase().startsWith(queryLower)) score += 600;
    if (module.title.toLowerCase().includes(queryLower)) score += 400;
    
    // Description matches
    if (module.description.toLowerCase().includes(queryLower)) score += 200;
    
    // Word-based scoring
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);
    queryWords.forEach(word => {
      if (module.title.toLowerCase().includes(word)) score += 100;
      if (module.name.toLowerCase().includes(word)) score += 80;
      if (module.description.toLowerCase().includes(word)) score += 50;
    });

    return score;
  }

  // Check if any filters are active
  private hasActiveFilters(filters: SearchFilters): boolean {
    return !!(
      (filters.core_compatibility && filters.core_compatibility.length > 0) ||
      (filters.development_status && filters.development_status.length > 0) ||
      (filters.maintenance_status && filters.maintenance_status.length > 0) ||
      (filters.categories && filters.categories.length > 0)
    );
  }

  // Remove duplicate modules by machine name
  private removeDuplicateModules(modules: DrupalModule[]): DrupalModule[] {
    const seen = new Set<string>();
    return modules.filter(module => {
      if (seen.has(module.name)) {
        return false;
      }
      seen.add(module.name);
      return true;
    });
  }


  // Apply filters to module results
  private applyFilters(modules: (DrupalModule & { _score?: number })[], filters: SearchFilters): (DrupalModule & { _score?: number })[] {
    let filtered = modules;
    
    // Core compatibility filter
    if (filters.core_compatibility && filters.core_compatibility.length > 0) {
      filtered = filtered.filter(module => 
        filters.core_compatibility!.some(version => 
          module.compatible_with.includes(version)
        )
      );
    }
    
    // Development status filter
    if (filters.development_status && filters.development_status.length > 0) {
      filtered = filtered.filter(module => 
        filters.development_status!.includes(module.development_status)
      );
    }
    
    // Maintenance status filter
    if (filters.maintenance_status && filters.maintenance_status.length > 0) {
      filtered = filtered.filter(module => 
        filters.maintenance_status!.includes(module.maintenance_status)
      );
    }
    
    // Category filter (simple text matching)
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(module => {
        const searchText = `${module.title} ${module.description} ${module.name}`.toLowerCase();
        return filters.categories!.some(category => 
          searchText.includes(category.toLowerCase())
        );
      });
    }
    
    return filtered;
  }


  // Search themes using live Drupal.org API data
  async searchThemes(query: string, filters: SearchFilters = {}): Promise<DrupalTheme[]> {
    try {
      // Starting external API search for themes
      
      const limit = filters.limit || 20;
      let results: DrupalTheme[] = [];

      // Strategy 1: Exact machine name search if query looks like a machine name
      if (query && this.isLikelyMachineName(query)) {
        // Attempting exact theme machine name search
        const exactResults = await this.searchThemesByMachineName(query);
        results = results.concat(exactResults);
      }

      // Strategy 2: Browse recent themes and client-side filter
      if (results.length < limit) {
        // Fetching recent themes for filtering
        const browseResults = await this.browseThemes(Math.max(30, limit * 2));
        const filtered = this.filterThemesClientSide(browseResults, query);
        results = results.concat(filtered);
      }

      // Remove duplicates and apply final filtering
      const uniqueResults = this.removeDuplicateThemes(results);
      const finalResults = uniqueResults.slice(0, limit);
      
      // External API search completed
      return finalResults;
      
    } catch (error) {
      console.error(`Error searching themes via API: ${error instanceof Error ? error.message : String(error)}`)
      throw error;
    }
  }

  // Get module details using external API
  async getModuleDetails(machineName: string): Promise<DrupalModule | null> {
    try {
      // Fetching module details
      
      // Search by exact machine name
      const modules = await this.searchByMachineName(machineName);
      
      if (modules.length > 0) {
        // Found module details
        return modules[0];
      }

      // Module not found in API
      return null;
    } catch (error) {
      console.error(`Error getting module details: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  // Get popular modules using live API data
  async getPopularModules(limit: number = 20): Promise<DrupalModule[]> {
    try {
      // Fetching popular modules from API
      return await this.browseModules(limit);
    } catch (error) {
      console.error(`Error fetching popular modules: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // Search themes by exact machine name using Drupal.org API
  private async searchThemesByMachineName(machineName: string): Promise<DrupalTheme[]> {
    try {
      const params = {
        type: 'project_theme',
        field_project_machine_name: machineName,
        limit: 10
      };
      
      const response = await this.fetchWithCache('/node.json', params);
      return this.transformThemeApiResponse(response);
    } catch (error) {
      // Theme machine name search failed - silent fallback
      return [];
    }
  }

  // Browse themes from Drupal.org API
  private async browseThemes(limit: number = 30): Promise<DrupalTheme[]> {
    try {
      const params = {
        type: 'project_theme',
        limit: Math.min(limit, 100), // API limit
        sort: 'changed',
        direction: 'DESC'
      };
      
      const response = await this.fetchWithCache('/node.json', params);
      return this.transformThemeApiResponse(response);
    } catch (error) {
      // Browse themes failed - silent fallback
      return [];
    }
  }

  // Transform Drupal.org API response to DrupalTheme[]
  private transformThemeApiResponse(response: any): DrupalTheme[] {
    if (!response || typeof response !== 'object') {
      // Invalid theme API response structure - not an object
      return [];
    }
    
    if (!response.list) {
      // No list property in response
      return [];
    }
    
    if (!Array.isArray(response.list)) {
      // List property is not an array
      return [];
    }
    
    if (response.list.length === 0) {
      // Empty list - valid response but no results
      return [];
    }

    return response.list.map((item: any) => {
      const machineName = this.extractFieldValue(item.field_project_machine_name);
      const description = this.extractFieldValue(item.body) || item.title || 'No description available';
      
      return {
        title: item.title || 'Unknown Theme',
        name: machineName || 'unknown',
        description: this.cleanHtmlDescription(description),
        version: 'Latest',
        compatible_with: this.inferCoreCompatibility(item),
        project_url: item.url || `https://www.drupal.org/project/${machineName}`,
        download_url: `https://ftp.drupal.org/files/projects/${machineName}-11.x-dev.tar.gz`,
        screenshot_url: this.extractScreenshotUrl(item),
        demo_url: this.extractDemoUrl(item),
        maintainers: [item.author?.name || 'Community']
      } as DrupalTheme;
    }).filter((theme: DrupalTheme) => theme.name !== 'unknown');
  }

  // Extract screenshot URL from theme data
  private extractScreenshotUrl(item: any): string | undefined {
    // Screenshots field handling would go here if available in API
    return undefined;
  }

  // Extract demo URL from theme data
  private extractDemoUrl(item: any): string | undefined {
    // Demo URL field handling would go here if available in API
    return undefined;  
  }

  // Client-side filtering of themes after API fetch
  private filterThemesClientSide(themes: DrupalTheme[], query: string): DrupalTheme[] {
    if (!query || !query.trim()) {
      return themes;
    }

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);
    
    return themes.filter(theme => {
      const searchText = `${theme.title} ${theme.name} ${theme.description}`.toLowerCase();
      
      // Exact machine name match (highest priority)
      if (theme.name.toLowerCase() === queryLower) return true;
      
      // Title contains query
      if (theme.title.toLowerCase().includes(queryLower)) return true;
      
      // Description contains query
      if (theme.description.toLowerCase().includes(queryLower)) return true;
      
      // Word-based matching
      return queryWords.some(word => searchText.includes(word));
    });
  }

  // Remove duplicate themes by machine name
  private removeDuplicateThemes(themes: DrupalTheme[]): DrupalTheme[] {
    const seen = new Set<string>();
    return themes.filter(theme => {
      if (seen.has(theme.name)) {
        return false;
      }
      seen.add(theme.name);
      return true;
    });
  }

  // Get module categories dynamically from Drupal.org API
  async getModuleCategories(): Promise<string[]> {
    const cacheKey = 'module_categories';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      // Fetch live categories from Drupal.org taxonomy
      const response = await this.fetchWithCache('/taxonomy_term.json', {
        vocabulary: 'module_categories',
        limit: 50
      });
      
      const categories = response.list ? 
        response.list.map((term: any) => term.name).filter(Boolean) : [];
      
      this.cache.set(cacheKey, {
        data: categories,
        timestamp: Date.now()
      });
      
      return categories;
    } catch (error) {
      console.error('Failed to fetch module categories from API');
      throw new Error('Unable to fetch current module categories from Drupal.org');
    }
  }

  // Get core compatibility options dynamically
  async getCoreCompatibilityOptions(): Promise<string[]> {
    const cacheKey = 'core_compatibility';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      // Fetch current supported Drupal versions from API
      const response = await this.fetchWithCache('/drupal_versions.json');
      
      const versions = response.supported_versions || [];
      
      this.cache.set(cacheKey, {
        data: versions,
        timestamp: Date.now()
      });
      
      return versions;
    } catch (error) {
      console.error('Failed to fetch core compatibility options from API');
      throw new Error('Unable to fetch current Drupal version compatibility from API');
    }
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
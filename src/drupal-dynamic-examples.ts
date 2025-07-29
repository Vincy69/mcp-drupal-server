import axios, { AxiosInstance } from 'axios';
import { mockCodeExamples, exampleCategories } from './mock-data.js';

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
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  use_case?: string;
  prerequisites?: string[];
  output_example?: string;
  common_pitfalls?: string[];
  best_practices?: string[];
  alternatives?: Array<{title: string; description: string; code: string}>;
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
  private popularRepositories = [
    'drupal/drupal',
    'drupal/core',
    'drupal/recommended-project',
    'drupal-composer/drupal-project',
    'acquia/drupal-recommended-project',
    'pantheon-systems/drupal-recommended'
  ];
  private examplePatterns = {
    functions: /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    hooks: /hook_[a-zA-Z_]+/g,
    classes: /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    services: /\$this->get\('([^']+)'\)/g,
    entities: /\\?([A-Z][a-zA-Z]*Entity)(?:Interface)?/g
  };

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
   * Search for code examples dynamically from multiple sources with enhanced results
   */
  async searchExamples(query: string, category?: string): Promise<CodeExample[]> {
    const cacheKey = `examples_${query}_${category || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      console.error(`Searching examples for: "${query}" in category: ${category || 'all'}`);
      
      // Enhanced multi-source search with parallel execution
      const [githubExamples, drupalOrgExamples, documentationExamples, communityExamples, snippetExamples] = await Promise.allSettled([
        this.searchGitHubExamples(query, category),
        this.searchDrupalOrgExamples(query, category),
        this.searchDocumentationExamples(query, category),
        this.searchCommunityExamples(query, category),
        this.generateContextualSnippets(query, category)
      ]);

      const allExamples: CodeExample[] = [];
      let successfulSources = 0;

      // Aggregate results from all sources with source tracking
      if (githubExamples.status === 'fulfilled' && githubExamples.value.length > 0) {
        allExamples.push(...this.enhanceExamplesWithMetadata(githubExamples.value, 'GitHub'));
        successfulSources++;
        console.error(`GitHub: Found ${githubExamples.value.length} examples`);
      }
      if (drupalOrgExamples.status === 'fulfilled' && drupalOrgExamples.value.length > 0) {
        allExamples.push(...this.enhanceExamplesWithMetadata(drupalOrgExamples.value, 'Drupal.org'));
        successfulSources++;
        console.error(`Drupal.org: Found ${drupalOrgExamples.value.length} examples`);
      }
      if (documentationExamples.status === 'fulfilled' && documentationExamples.value.length > 0) {
        allExamples.push(...this.enhanceExamplesWithMetadata(documentationExamples.value, 'Documentation'));
        successfulSources++;
        console.error(`Documentation: Found ${documentationExamples.value.length} examples`);
      }
      if (communityExamples.status === 'fulfilled' && communityExamples.value.length > 0) {
        allExamples.push(...this.enhanceExamplesWithMetadata(communityExamples.value, 'Community'));
        successfulSources++;
        console.error(`Community: Found ${communityExamples.value.length} examples`);
      }
      if (snippetExamples.status === 'fulfilled' && snippetExamples.value.length > 0) {
        allExamples.push(...this.enhanceExamplesWithMetadata(snippetExamples.value, 'Generated'));
        successfulSources++;
        console.error(`Generated: Found ${snippetExamples.value.length} examples`);
      }

      // If no live sources returned results, use enhanced mock data
      if (allExamples.length === 0) {
        console.error('All example sources returned empty results, using enhanced mock data...');
        return this.getEnhancedMockExamples(query, category);
      }

      // Advanced processing: deduplicate, sort, and enhance
      const uniqueExamples = this.deduplicateExamples(allExamples);
      const sortedExamples = this.sortByRelevance(uniqueExamples, query);
      const enhancedExamples = this.addAlternativesAndBestPractices(sortedExamples, query);
      
      // Limit results but ensure quality diversity
      const finalExamples = this.selectDiverseExamples(enhancedExamples, 25);

      console.error(`Total: ${finalExamples.length} examples from ${successfulSources} sources`);

      // Cache results with longer TTL for enhanced data
      this.cache.set(cacheKey, {
        data: finalExamples,
        timestamp: Date.now()
      });

      return finalExamples;
    } catch (error) {
      console.error('All example sources failed, using enhanced mock data:', error);
      return this.getEnhancedMockExamples(query, category);
    }
  }
  
  /**
   * Enhance examples with additional metadata based on source
   */
  private enhanceExamplesWithMetadata(examples: CodeExample[], source: string): CodeExample[] {
    return examples.map(example => ({
      ...example,
      description: `[${source}] ${example.description}`,
      source_url: example.source_url || `${source.toLowerCase()}-example`,
      best_practices: example.best_practices || this.inferBestPractices(example.code),
      common_pitfalls: example.common_pitfalls || this.inferCommonPitfalls(example.code),
      difficulty: example.difficulty || this.inferDifficulty(example.code)
    }));
  }
  
  /**
   * Select diverse examples to avoid redundancy
   */
  private selectDiverseExamples(examples: CodeExample[], limit: number): CodeExample[] {
    const selected: CodeExample[] = [];
    const categorySeen = new Set<string>();
    const difficultySeen = new Set<string>();
    
    // First pass: select most relevant examples with category diversity
    for (const example of examples) {
      if (selected.length >= limit) break;
      
      const categoryKey = `${example.category}-${example.difficulty}`;
      if (!categorySeen.has(categoryKey)) {
        selected.push(example);
        categorySeen.add(categoryKey);
        difficultySeen.add(example.difficulty || 'intermediate');
      }
    }
    
    // Second pass: fill remaining slots with best remaining examples
    for (const example of examples) {
      if (selected.length >= limit) break;
      if (!selected.includes(example)) {
        selected.push(example);
      }
    }
    
    return selected;
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
   * Get enhanced mock examples as fallback with comprehensive metadata
   */
  private getEnhancedMockExamples(query?: string, category?: string): CodeExample[] {
    let examples = mockCodeExamples.map(example => ({
      title: example.title,
      description: example.description,
      category: example.category,
      drupal_version: ['11.x', '10.x'],
      code: example.code,
      tags: example.tags,
      source_url: 'mock-data',
      difficulty: this.inferDifficulty(example.code),
      use_case: this.inferUseCase(example.code, example.category),
      prerequisites: this.inferPrerequisites(example.code),
      output_example: this.generateOutputExample(example.code),
      best_practices: this.inferBestPractices(example.code),
      common_pitfalls: this.inferCommonPitfalls(example.code),
      alternatives: this.generateAlternatives(example.code, example.category),
      related_functions: this.extractRelatedFunctions(example.code),
      related_hooks: this.extractRelatedHooks(example.code)
    }));

    // Enhanced filtering with fuzzy matching
    if (category) {
      examples = examples.filter(ex => 
        ex.category.toLowerCase().includes(category.toLowerCase()) ||
        ex.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
      );
    }

    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      examples = examples.filter(ex => 
        ex.title.toLowerCase().includes(queryLower) ||
        ex.description.toLowerCase().includes(queryLower) ||
        ex.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        ex.code.toLowerCase().includes(queryLower) ||
        (ex.use_case && ex.use_case.toLowerCase().includes(queryLower)) ||
        (ex.related_functions && ex.related_functions.some(fn => fn.toLowerCase().includes(queryLower)))
      );
    }

    // Add generated examples based on query patterns
    if (query) {
      const generatedExamples = this.generateContextualSnippets(query, category);
      // Ensure all generated examples have the same shape as mock examples
      const normalizedGenerated = generatedExamples.map(ex => ({
        ...ex,
        source_url: ex.source_url || 'generated',
        difficulty: ex.difficulty || 'intermediate' as const,
        use_case: ex.use_case || '',
        prerequisites: ex.prerequisites || [],
        output_example: ex.output_example || '',
        best_practices: ex.best_practices || [],
        common_pitfalls: ex.common_pitfalls || [],
        alternatives: ex.alternatives || [],
        related_functions: ex.related_functions || [],
        related_hooks: ex.related_hooks || []
      }));
      examples.push(...normalizedGenerated);
    }

    console.log(`Enhanced mock fallback: Returning ${examples.length} comprehensive code examples`);
    return this.selectDiverseExamples(examples, 20);
  }
  
  /**
   * Generate contextual code snippets based on query patterns
   */
  private generateContextualSnippets(query: string, category?: string): CodeExample[] {
    const snippets: CodeExample[] = [];
    const queryLower = query.toLowerCase();
    
    // Node-related snippets
    if (queryLower.includes('node') || category === 'nodes') {
      snippets.push({
        title: 'Load and Display Node',
        description: 'Basic node loading and field access pattern',
        category: 'nodes',
        drupal_version: ['11.x', '10.x'],
        code: `<?php
// Load a node by ID
$node = \Drupal::entityTypeManager()->getStorage('node')->load($nid);

if ($node && $node->access('view')) {
  $title = $node->getTitle();
  $body = $node->get('body')->value;
  $created = $node->getCreatedTime();
  
  // Access custom field
  if ($node->hasField('field_custom')) {
    $custom_value = $node->get('field_custom')->value;
  }
}`,
        tags: ['node', 'entity', 'load', 'access'],
        difficulty: 'beginner',
        use_case: 'Loading and accessing node data safely',
        prerequisites: ['Basic Drupal entity system knowledge'],
        best_practices: ['Always check access permissions', 'Verify field exists before accessing'],
        common_pitfalls: ['Not checking if node exists', 'Forgetting access control'],
        related_functions: ['Node::load', 'EntityInterface::access', 'EntityInterface::hasField'],
        source_url: 'generated',
        related_hooks: []
      });
    }
    
    // User-related snippets
    if (queryLower.includes('user') || category === 'users') {
      snippets.push({
        title: 'Current User Information',
        description: 'Get current user and check permissions',
        category: 'users',
        drupal_version: ['11.x', '10.x'],
        code: `<?php
// Get current user
$current_user = \Drupal::currentUser();

// Check if user is authenticated
if ($current_user->isAuthenticated()) {
  $uid = $current_user->id();
  $username = $current_user->getAccountName();
  $email = $current_user->getEmail();
  
  // Check specific permission
  if ($current_user->hasPermission('administer nodes')) {
    // User can administer nodes
  }
  
  // Load full user entity for additional data
  $user_entity = \Drupal::entityTypeManager()->getStorage('user')->load($uid);
}`,
        tags: ['user', 'current-user', 'permission', 'authentication'],
        difficulty: 'beginner',
        use_case: 'User authentication and permission checking',
        best_practices: ['Use dependency injection in classes', 'Cache permission checks when possible'],
        related_functions: ['\Drupal::currentUser', 'AccountInterface::hasPermission'],
        source_url: 'generated',
        related_hooks: []
      });
    }
    
    // Form-related snippets
    if (queryLower.includes('form') || category === 'forms') {
      snippets.push({
        title: 'Custom Form with Validation',
        description: 'Complete form class with validation and submission',
        category: 'forms',
        drupal_version: ['11.x', '10.x'],
        code: `<?php
namespace Drupal\mymodule\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

class CustomForm extends FormBase {
  
  public function getFormId() {
    return 'mymodule_custom_form';
  }
  
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['email'] = [
      '#type' => 'email',
      '#title' => $this->t('Email'),
      '#required' => TRUE,
    ];
    
    $form['message'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Message'),
      '#required' => TRUE,
    ];
    
    $form['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Send'),
    ];
    
    return $form;
  }
  
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $email = $form_state->getValue('email');
    if (!\Drupal::service('email.validator')->isValid($email)) {
      $form_state->setErrorByName('email', $this->t('Invalid email address.'));
    }
  }
  
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $email = $form_state->getValue('email');
    $message = $form_state->getValue('message');
    
    // Process form data
    $this->messenger()->addMessage($this->t('Form submitted successfully!'));
  }
}`,
        tags: ['form', 'validation', 'submission', 'class'],
        difficulty: 'intermediate',
        use_case: 'Creating custom forms with validation',
        prerequisites: ['Understanding of Drupal form API', 'Basic OOP knowledge'],
        best_practices: ['Use dependency injection for services', 'Validate all user input', 'Use translation functions'],
        common_pitfalls: ['Not validating input', 'Forgetting CSRF protection'],
        related_functions: ['FormBase', 'FormStateInterface', 'EmailValidator'],
        source_url: 'generated',
        related_hooks: []
      });
    }
    
    return snippets;
  }

  /**
   * Get mock categories as fallback
   */
  private getMockCategories(): string[] {
    const categories = exampleCategories.map(cat => cat.name);
    console.log(`Mock fallback: Returning ${categories.length} categories`);
    return categories;
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
      console.error('Categories fetch failed, using mock data:', error);
      return this.getMockCategories();
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
   * Convert GitHub file to enhanced CodeExample
   */
  private async convertGitHubFileToExample(file: GitHubFile): Promise<CodeExample | null> {
    try {
      // Construct API URL for file content
      const apiUrl = file.html_url
        .replace('https://github.com/', '/repos/')
        .replace('/blob/', '/contents/');
      
      const response = await this.githubClient.get(apiUrl);
      
      if (response.data.content) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        
        // Enhanced analysis of the code
        const analysis = this.analyzeCodeContent(content);
        
        return {
          title: this.extractTitleFromCode(content) || this.generateTitleFromFilename(file.name),
          description: this.extractDescriptionFromCode(content) || this.generateDescriptionFromCode(content),
          category: this.inferCategoryFromPath(file.path),
          drupal_version: this.inferDrupalVersionFromCode(content),
          code: this.cleanAndFormatCode(content),
          tags: [...this.extractTagsFromCode(content), ...analysis.detectedPatterns],
          source_url: file.html_url,
          last_updated: new Date().toISOString(),
          difficulty: this.inferDifficulty(content),
          use_case: this.inferUseCase(content, this.inferCategoryFromPath(file.path)),
          prerequisites: this.inferPrerequisites(content),
          best_practices: this.inferBestPractices(content),
          common_pitfalls: this.inferCommonPitfalls(content),
          related_functions: analysis.functions,
          related_hooks: analysis.hooks,
          output_example: this.generateOutputExample(content)
        };
      }
    } catch (error) {
      console.error(`Failed to fetch GitHub file content for ${file.path}:`, error);
    }
    
    return null;
  }
  
  /**
   * Analyze code content for patterns and extract metadata
   */
  private analyzeCodeContent(code: string): {
    functions: string[];
    hooks: string[];
    classes: string[];
    services: string[];
    entities: string[];
    detectedPatterns: string[];
  } {
    const analysis = {
      functions: [] as string[],
      hooks: [] as string[],
      classes: [] as string[],
      services: [] as string[],
      entities: [] as string[],
      detectedPatterns: [] as string[]
    };
    
    // Extract patterns with safe iteration
    try {
      // Extract functions
      const functionMatches = [...code.matchAll(this.examplePatterns.functions)];
      for (const match of functionMatches) {
        if (match[1]) analysis.functions.push(match[1]);
      }
      
      // Extract hooks
      const hookMatches = [...code.matchAll(this.examplePatterns.hooks)];
      for (const match of hookMatches) {
        if (match[0]) analysis.hooks.push(match[0]);
      }
      
      // Extract classes
      const classMatches = [...code.matchAll(this.examplePatterns.classes)];
      for (const match of classMatches) {
        if (match[1]) analysis.classes.push(match[1]);
      }
      
      // Extract services
      const serviceMatches = [...code.matchAll(this.examplePatterns.services)];
      for (const match of serviceMatches) {
        if (match[1]) analysis.services.push(match[1]);
      }
      
      // Extract entities
      const entityMatches = [...code.matchAll(this.examplePatterns.entities)];
      for (const match of entityMatches) {
        if (match[1]) analysis.entities.push(match[1]);
      }
      
      // Detect common patterns
      if (code.includes('dependency injection')) analysis.detectedPatterns.push('dependency-injection');
      if (code.includes('EntityQuery')) analysis.detectedPatterns.push('entity-query');
      if (code.includes('CacheBackend')) analysis.detectedPatterns.push('caching');
      if (code.includes('EventDispatcher')) analysis.detectedPatterns.push('events');
      if (code.includes('Migration')) analysis.detectedPatterns.push('migration');
      if (code.includes('PHPUnit')) analysis.detectedPatterns.push('testing');
    } catch (error) {
      // Fallback if regex fails
      console.error('Pattern matching failed:', error);
    }
    
    return analysis;
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
    
    // Title matches are most important
    if (example.title.toLowerCase().includes(queryLower)) score += 20;
    if (example.title.toLowerCase().startsWith(queryLower)) score += 10;
    
    // Description relevance
    if (example.description.toLowerCase().includes(queryLower)) score += 10;
    
    // Tag matches
    if (example.tags.some(tag => tag.toLowerCase() === queryLower)) score += 15;
    if (example.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 8;
    
    // Code content relevance
    if (example.code.toLowerCase().includes(queryLower)) score += 5;
    
    // Use case and related functions boost
    if (example.use_case && example.use_case.toLowerCase().includes(queryLower)) score += 12;
    if (example.related_functions?.some(fn => fn.toLowerCase().includes(queryLower))) score += 8;
    if (example.related_hooks?.some(hook => hook.toLowerCase().includes(queryLower))) score += 8;
    
    // Category match boost
    if (example.category.toLowerCase() === queryLower) score += 15;
    if (example.category.toLowerCase().includes(queryLower)) score += 8;
    
    // Difficulty preference (intermediate gets slight boost for being practical)
    if (example.difficulty === 'intermediate') score += 2;
    if (example.difficulty === 'beginner' && queryLower.includes('basic')) score += 5;
    if (example.difficulty === 'advanced' && queryLower.includes('advanced')) score += 5;
    
    // Freshness bonus (more recent examples are better)
    if (example.last_updated) {
      const age = Date.now() - new Date(example.last_updated).getTime();
      const daysSinceUpdate = age / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) score += 3; // Recent examples get bonus
    }
    
    return score;
  }

  private async fetchLiveCategories(): Promise<string[]> {
    // Fetch categories from live APIs instead of hardcoded list
    try {
      // This could query multiple sources to get current category taxonomies
      const response = await this.drupalApiClient.get('/taxonomy/categories');
      return response.data.map((cat: any) => cat.name);
    } catch (error) {
      // If API fails, throw error to trigger fallback to mock data
      throw new Error(`Failed to fetch live categories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Search community sources for examples
   */
  private async searchCommunityExamples(query: string, category?: string): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];
    
    try {
      // Search in popular community repositories
      for (const repo of this.popularRepositories.slice(0, 3)) { // Limit to avoid rate limits
        const repoExamples = await this.searchRepositoryExamples(repo, query, category);
        examples.push(...repoExamples);
      }
    } catch (error) {
      console.error('Community examples search failed:', error);
    }
    
    return examples;
  }
  
  /**
   * Search specific repository for examples
   */
  private async searchRepositoryExamples(repo: string, query: string, category?: string): Promise<CodeExample[]> {
    try {
      const searchQuery = `${query} repo:${repo} extension:php extension:module`;
      const response = await this.githubClient.get<GitHubSearchResponse>('/search/code', {
        params: {
          q: searchQuery,
          per_page: 5 // Limit per repo
        }
      });
      
      const examples: CodeExample[] = [];
      for (const item of response.data.items) {
        const example = await this.convertGitHubFileToExample(item);
        if (example) examples.push(example);
      }
      
      return examples;
    } catch (error) {
      console.error(`Repository search failed for ${repo}:`, error);
      return [];
    }
  }
  
  /**
   * Add alternatives and best practices to examples
   */
  private addAlternativesAndBestPractices(examples: CodeExample[], query: string): CodeExample[] {
    return examples.map(example => ({
      ...example,
      alternatives: example.alternatives || this.generateAlternatives(example.code, example.category),
      best_practices: example.best_practices || this.inferBestPractices(example.code),
      common_pitfalls: example.common_pitfalls || this.inferCommonPitfalls(example.code)
    }));
  }
  
  // Enhanced helper methods for code analysis
  
  private generateTitleFromFilename(filename: string): string {
    return filename
      .replace(/\.(php|module|inc)$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  private generateDescriptionFromCode(code: string): string {
    // Try to extract from docblock
    const docMatch = code.match(/\/\*\*[\s\S]*?\*\//)
    if (docMatch) {
      const cleanDoc = docMatch[0]
        .replace(/\/\*\*|\*\/|\*\s?/g, '')
        .split('\n')[0]
        .trim();
      if (cleanDoc.length > 10) return cleanDoc;
    }
    
    // Fallback: analyze function/class names
    const funcMatch = code.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/)
    if (funcMatch) {
      return `Function: ${funcMatch[1].replace(/_/g, ' ')}`;
    }
    
    const classMatch = code.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/)
    if (classMatch) {
      return `Class: ${classMatch[1]}`;
    }
    
    return 'Code example with common Drupal patterns';
  }
  
  private cleanAndFormatCode(content: string): string {
    // Remove excessive whitespace but preserve structure
    return content
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 consecutive newlines
      .replace(/^\s+|\s+$/g, '') // Trim start and end
      .replace(/\t/g, '  '); // Convert tabs to spaces
  }
  
  private inferDifficulty(code: string): 'beginner' | 'intermediate' | 'advanced' {
    let complexity = 0;
    
    // Complexity indicators
    if (code.includes('dependency injection')) complexity += 2;
    if (code.includes('EventDispatcher')) complexity += 2;
    if (code.includes('Migration')) complexity += 3;
    if (code.includes('Plugin')) complexity += 2;
    if (code.includes('Service')) complexity += 1;
    if (code.includes('Interface')) complexity += 1;
    if (code.includes('Abstract')) complexity += 2;
    if (code.includes('namespace')) complexity += 1;
    if ((code.match(/class\s+/g) || []).length > 1) complexity += 2;
    if ((code.match(/function\s+/g) || []).length > 5) complexity += 1;
    
    if (complexity >= 5) return 'advanced';
    if (complexity >= 2) return 'intermediate';
    return 'beginner';
  }
  
  private inferUseCase(code: string, category: string): string {
    const useCaseMap: {[key: string]: string} = {
      'nodes': 'Content management and node operations',
      'users': 'User management and authentication',
      'forms': 'Form creation and data collection',
      'hooks': 'Extending Drupal functionality',
      'database': 'Data storage and retrieval',
      'services': 'Dependency injection and service architecture',
      'testing': 'Automated testing and quality assurance',
      'migration': 'Data migration and content import',
      'api': 'REST API and web services',
      'performance': 'Site optimization and caching'
    };
    
    return useCaseMap[category] || 'General Drupal development task';
  }
  
  private inferPrerequisites(code: string): string[] {
    const prerequisites: string[] = [];
    
    if (code.includes('namespace')) prerequisites.push('Understanding of PHP namespaces');
    if (code.includes('class')) prerequisites.push('Basic object-oriented programming');
    if (code.includes('extends')) prerequisites.push('Inheritance concepts');
    if (code.includes('implements')) prerequisites.push('Interface implementation');
    if (code.includes('dependency injection')) prerequisites.push('Dependency injection pattern');
    if (code.includes('Entity')) prerequisites.push('Drupal entity system');
    if (code.includes('Form')) prerequisites.push('Drupal Form API');
    if (code.includes('Plugin')) prerequisites.push('Drupal plugin system');
    
    return prerequisites.length > 0 ? prerequisites : ['Basic Drupal development knowledge'];
  }
  
  private generateOutputExample(code: string): string {
    if (code.includes('return')) {
      if (code.includes('array')) return 'Returns an array of results';
      if (code.includes('string')) return 'Returns a formatted string';
      if (code.includes('bool')) return 'Returns TRUE on success, FALSE on failure';
      if (code.includes('Entity')) return 'Returns an entity object or NULL';
    }
    
    if (code.includes('echo') || code.includes('print')) {
      return 'Outputs formatted content to the browser';
    }
    
    if (code.includes('messenger')) {
      return 'Displays a status message to the user';
    }
    
    return 'Executes the defined functionality';
  }
  
  private inferBestPractices(code: string): string[] {
    const practices: string[] = [];
    
    if (code.includes('access(')) practices.push('Always check entity access permissions');
    if (code.includes('hasField(')) practices.push('Verify field existence before accessing');
    if (code.includes('$this->t(')) practices.push('Use translation functions for user-facing text');
    if (code.includes('dependency injection')) practices.push('Use dependency injection instead of static calls');
    if (code.includes('cache')) practices.push('Implement caching for expensive operations');
    if (code.includes('validate')) practices.push('Validate all user input thoroughly');
    if (code.includes('sanitize') || code.includes('escape')) practices.push('Sanitize output to prevent XSS');
    
    return practices.length > 0 ? practices : ['Follow Drupal coding standards', 'Use appropriate APIs'];
  }
  
  private inferCommonPitfalls(code: string): string[] {
    const pitfalls: string[] = [];
    
    if (code.includes('load(') && !code.includes('access(')) {
      pitfalls.push('Not checking entity access permissions');
    }
    if (code.includes('get(') && !code.includes('hasField(')) {
      pitfalls.push('Accessing fields without checking if they exist');
    }
    if (code.includes('\\Drupal::')) {
      pitfalls.push('Using static service calls instead of dependency injection');
    }
    if (code.includes('$_POST') || code.includes('$_GET')) {
      pitfalls.push('Using global variables instead of proper request handling');
    }
    
    return pitfalls.length > 0 ? pitfalls : ['Not following Drupal best practices'];
  }
  
  private generateAlternatives(code: string, category: string): Array<{title: string; description: string; code: string}> {
    const alternatives: Array<{title: string; description: string; code: string}> = [];
    
    // Generate contextual alternatives based on code patterns
    if (code.includes('Node::load') && !code.includes('loadMultiple')) {
      alternatives.push({
        title: 'Batch Loading',
        description: 'Load multiple nodes at once for better performance',
        code: '$nodes = Node::loadMultiple($nids);'
      });
    }
    
    if (code.includes('\\Drupal::database()')) {
      alternatives.push({
        title: 'Entity Query',
        description: 'Use Entity Query API instead of direct database queries',
        code: '$query = \\Drupal::entityQuery(\'node\')\n  ->condition(\'type\', \'article\')\n  ->execute();'
      });
    }
    
    return alternatives;
  }
  
  private extractRelatedFunctions(code: string): string[] {
    const functions: string[] = [];
    const matches = code.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)::[a-zA-Z_][a-zA-Z0-9_]*|\\Drupal::[a-zA-Z_][a-zA-Z0-9_]*/g);
    
    for (const match of matches) {
      functions.push(match[0]);
    }
    
    return [...new Set(functions)]; // Remove duplicates
  }
  
  private extractRelatedHooks(code: string): string[] {
    const hooks: string[] = [];
    const matches = code.matchAll(/hook_[a-zA-Z_]+/g);
    
    for (const match of matches) {
      hooks.push(match[0]);
    }
    
    return [...new Set(hooks)]; // Remove duplicates
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
# 📚 MCP Drupal God Mod - API Documentation

This document provides comprehensive API documentation for all available tools and methods in the MCP Drupal God Mod server.

## Table of Contents

- [Search & Discovery](#search--discovery)
- [Detailed Information](#detailed-information)
- [Code Analysis](#code-analysis)
- [Code Generation](#code-generation)
- [Hybrid Mode](#hybrid-mode)
- [Advanced Intelligence](#advanced-intelligence)
- [System Management](#system-management)

---

## Search & Discovery

### `search_drupal_all`
Universal search across all Drupal documentation and APIs.

**Parameters:**
- `query` (string, required): Search term or phrase
- `version` (string, optional): Drupal version (7.x, 8.x, 9.x, 10.x, 11.x) - defaults to 11.x
- `limit` (number, optional): Maximum results per category - defaults to 10

**Returns:**
```typescript
{
  functions: SearchResult[],
  hooks: SearchResult[],
  classes: SearchResult[],
  services: SearchResult[],
  topics: SearchResult[]
}
```

**Example:**
```json
{
  "tool": "search_drupal_all",
  "arguments": {
    "query": "entity query",
    "version": "11.x",
    "limit": 5
  }
}
```

### `search_drupal_functions`
Search for specific Drupal functions.

**Parameters:**
- `query` (string, required): Function name or partial name
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:** Array of function definitions with signatures and descriptions

### `search_drupal_hooks`
Search for Drupal hooks and their implementations.

**Parameters:**
- `query` (string, required): Hook name or pattern
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:** Array of hook definitions with parameters and usage examples

### `search_drupal_services`
Search for Drupal services in the service container.

**Parameters:**
- `query` (string, required): Service ID or description
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:** Array of service definitions with methods and dependencies

### `search_drupal_classes`
Search for PHP classes and interfaces in Drupal.

**Parameters:**
- `query` (string, required): Class or interface name
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:** Array of class definitions with namespaces and methods

### `search_drupal_topics`
Search conceptual topics and documentation.

**Parameters:**
- `query` (string, required): Topic or concept
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:** Array of documentation topics with summaries and links

### `search_contrib_modules`
Search for contributed modules on Drupal.org.

**Parameters:**
- `query` (string, required): Module name or functionality
- `sort` (string, optional): Sort by 'relevance', 'downloads', 'installs', 'updated' - defaults to 'relevance'
- `status` (number, optional): Module status (1 = full project) - defaults to 1
- `core_compatibility` (string, optional): Core version compatibility - defaults to 11.x

**Returns:** Array of module information with statistics and compatibility

### `search_contrib_themes`
Search for contributed themes on Drupal.org.

**Parameters:**
- `query` (string, required): Theme name or style
- `sort` (string, optional): Sort criteria - defaults to 'relevance'
- `core_compatibility` (string, optional): Core version compatibility - defaults to 11.x

**Returns:** Array of theme information with screenshots and features

### `search_code_examples`
Search for real-world code examples.

**Parameters:**
- `query` (string, required): Code pattern or functionality
- `source` (string, optional): Source filter ('github', 'drupal.org', 'all') - defaults to 'all'
- `language` (string, optional): Programming language filter - defaults to 'php'

**Returns:** Array of code examples with context and source

### `get_examples_by_category`
Get categorized code examples.

**Parameters:**
- `category` (string, required): Category name (e.g., 'forms', 'entities', 'routing')
- `limit` (number, optional): Maximum examples - defaults to 20

**Returns:** Array of examples organized by subcategory

### `get_examples_by_tag`
Get examples filtered by tags.

**Parameters:**
- `tags` (string[], required): Array of tags to filter by
- `matchAll` (boolean, optional): Require all tags to match - defaults to false

**Returns:** Array of tagged examples

---

## Detailed Information

### `get_function_details`
Get complete details for a specific function.

**Parameters:**
- `function_name` (string, required): Exact function name
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:**
```typescript
{
  name: string,
  signature: string,
  description: string,
  parameters: Parameter[],
  return: ReturnType,
  deprecated: boolean,
  since: string,
  examples: string[],
  related: string[],
  file: string,
  namespace?: string
}
```

### `get_class_details`
Get complete details for a specific class.

**Parameters:**
- `class_name` (string, required): Full class name (with or without namespace)
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:** Complete class information with methods, properties, and inheritance

### `get_hook_details`
Get detailed hook documentation.

**Parameters:**
- `hook_name` (string, required): Hook name (with or without 'hook_' prefix)
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:** Hook details with implementation examples and invoke patterns

### `get_service_details`
Get service container details.

**Parameters:**
- `service_id` (string, required): Service ID (e.g., 'entity_type.manager')
- `version` (string, optional): Drupal version - defaults to 11.x

**Returns:** Service details with interface, methods, and usage

### `get_module_details`
Get contributed module details.

**Parameters:**
- `project_name` (string, required): Module machine name

**Returns:**
```typescript
{
  title: string,
  name: string,
  created: number,
  changed: number,
  project_status: string,
  link: string,
  type: string,
  short_description: string,
  description: string,
  downloads: number,
  installs: number,
  usage: string[],
  versions: Release[],
  maintainers: Maintainer[]
}
```

### `get_popular_modules`
Get popular modules by category.

**Parameters:**
- `category` (string, optional): Category filter (e.g., 'content', 'commerce', 'media')
- `limit` (number, optional): Maximum results - defaults to 10

**Returns:** Array of popular modules with download statistics

---

## Code Analysis

### `analyze_drupal_file`
Analyze a Drupal PHP file for structure and issues.

**Parameters:**
- `file_path` (string, required): Path to the PHP file

**Returns:**
```typescript
{
  structure: {
    namespaces: string[],
    uses: string[],
    classes: ClassInfo[],
    functions: FunctionInfo[],
    hooks: string[],
    services: string[]
  },
  issues: Issue[],
  metrics: {
    lines: number,
    loc: number,
    classes: number,
    methods: number,
    complexity: number
  },
  suggestions: string[]
}
```

### `check_drupal_standards`
Check if code follows Drupal coding standards.

**Parameters:**
- `file_path` (string, required): Path to the PHP file

**Returns:**
```typescript
{
  valid: boolean,
  errors: StandardError[],
  warnings: StandardWarning[],
  summary: {
    total_errors: number,
    total_warnings: number,
    fixable: number
  }
}
```

---

## Code Generation

### `generate_module_skeleton`
Generate a complete Drupal module structure.

**Parameters:**
```typescript
{
  name: string,           // Human-readable module name
  machineName: string,    // Machine name (lowercase, underscores)
  description: string,    // Module description
  package?: string,       // Package grouping - defaults to 'Custom'
  dependencies?: string[],// Module dependencies
  version?: string,       // Drupal version - defaults to 11.x
  includeTests?: boolean, // Include test structure - defaults to true
  includeConfig?: boolean,// Include configuration - defaults to true
  includeController?: boolean, // Include controller - defaults to false
  includeBlock?: boolean, // Include custom block - defaults to false
  includeEntity?: boolean,// Include custom entity - defaults to false
  includeThemeHooks?: boolean, // Include theme hooks - defaults to false
  features?: string[]     // Additional features to include
}
```

**Returns:** Array of generated files with paths and content

### `get_module_template_info`
Get information about available module templates.

**Parameters:** None

**Returns:** List of available templates with descriptions and options

---

## Hybrid Mode

### `get_mode_status`
Check current operational mode and connection status.

**Parameters:** None

**Returns:**
```typescript
{
  mode: 'DOCS_ONLY' | 'LIVE_ONLY' | 'HYBRID' | 'SMART_FALLBACK',
  drupal_connected: boolean,
  drupal_version?: string,
  site_name?: string,
  available_features: string[]
}
```

### `hybrid_analyze_module`
Analyze a module with live installation data.

**Parameters:**
- `module_name` (string, required): Module machine name

**Returns:** Module analysis with installation status, dependencies, and usage

### `hybrid_analyze_function`
Analyze function usage in the live site.

**Parameters:**
- `function_name` (string, required): Function name to analyze

**Returns:** Function usage statistics and implementation details

### `hybrid_analyze_site`
Perform comprehensive site analysis.

**Parameters:**
- `include_modules` (boolean, optional): Include module analysis - defaults to true
- `include_performance` (boolean, optional): Include performance metrics - defaults to true
- `include_security` (boolean, optional): Include security checks - defaults to true

**Returns:** Complete site analysis with recommendations

### `hybrid_analyze_content_type`
Analyze content type configuration and usage.

**Parameters:**
- `content_type` (string, required): Content type machine name

**Returns:** Content type analysis with field configuration and statistics

---

## Advanced Intelligence

### `deep_analyze_file`
Perform advanced code analysis with AI-powered insights.

**Parameters:**
- `file_path` (string, required): Path to analyze

**Returns:**
```typescript
{
  file: string,
  qualityScore: number,        // 0-100
  performanceIssues: PerformanceIssue[],
  securityScore: SecurityScore,
  refactoringSuggestions: RefactoringSuggestion[],
  deprecations: Deprecation[],
  bestPractices: BestPractice[],
  metrics: {
    cyclomaticComplexity: number,
    linesOfCode: number,
    commentRatio: number,
    testCoverage?: number
  }
}
```

### `smart_search`
Intelligent search with typo tolerance and suggestions.

**Parameters:**
- `query` (string, required): Search query (may contain typos)

**Returns:**
```typescript
{
  exactMatches: any[],
  fuzzyMatches: FuzzyMatch[],
  corrections: string[],
  suggestions: string[],
  expandedQuery: string
}
```

### `generate_custom_entity`
Generate a complete custom entity with all files.

**Parameters:**
```typescript
{
  entity_info: {
    entity_type: string,      // Machine name
    label: string,            // Human label
    bundles?: Bundle[],       // Entity bundles
    revisionable?: boolean,   // Support revisions
    translatable?: boolean,   // Support translations
    include_rest_api?: boolean,
    include_views?: boolean,
    include_admin_ui?: boolean
  },
  module_info: {
    name: string,
    machine_name: string
  }
}
```

**Returns:** Array of 15+ generated files for the entity

### `analyze_upgrade_path`
Analyze project for version upgrade compatibility.

**Parameters:**
- `project_path` (string, required): Project root path
- `from_version` (string, required): Current Drupal version (e.g., "9")
- `to_version` (string, required): Target Drupal version (e.g., "10")

**Returns:**
```typescript
{
  projectPath: string,
  currentVersion: string,
  targetVersion: string,
  summary: {
    totalIssues: number,
    criticalIssues: number,
    warnings: number,
    automatedFixes: number,
    estimatedEffortHours: number
  },
  issues: MigrationIssue[],
  recommendations: string[],
  migrationPlan: MigrationStep[]
}
```

### `generate_migration_patches`
Generate automated patches for migration issues.

**Parameters:**
- `report` (MigrationReport, required): Report from analyze_upgrade_path

**Returns:** Map of file paths to patched content

### `generate_migration_report`
Generate HTML migration report.

**Parameters:**
- `report` (MigrationReport, required): Report from analyze_upgrade_path

**Returns:** HTML string with formatted migration report

---

## System Management

### `clear_cache`
Clear the internal cache.

**Parameters:**
- `type` (string, optional): Cache type to clear ('all', 'docs', 'contrib', 'examples') - defaults to 'all'

**Returns:** Confirmation message

### `get_cache_stats`
Get cache statistics.

**Parameters:** None

**Returns:**
```typescript
{
  total_entries: number,
  memory_usage: string,
  hit_rate: number,
  oldest_entry: string,
  newest_entry: string
}
```

---

## Error Handling

All tools follow consistent error handling:

```typescript
// Success response
{
  success: true,
  data: <tool-specific-data>
}

// Error response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

Common error codes:
- `INVALID_PARAMETERS`: Missing or invalid parameters
- `NOT_FOUND`: Resource not found
- `API_ERROR`: External API error
- `FILE_ERROR`: File system error
- `NETWORK_ERROR`: Network connectivity issue
- `RATE_LIMIT`: API rate limit exceeded
- `INTERNAL_ERROR`: Unexpected server error

---

## Rate Limiting

The server implements rate limiting for external API calls:
- Drupal.org API: 60 requests/minute
- GitHub API: 100 requests/minute (authenticated)
- Cache is used to minimize API calls

---

## Best Practices

1. **Always specify version**: Include the Drupal version parameter for accurate results
2. **Use specific searches**: Use targeted search tools rather than universal search when possible
3. **Cache awareness**: Results are cached for 15-30 minutes for performance
4. **Error handling**: Always handle potential errors in your implementation
5. **Batch operations**: Use batch operations when analyzing multiple files
6. **Live mode**: Enable hybrid mode for the most comprehensive analysis

---

## Examples

### Example 1: Search and Implement
```javascript
// Search for entity query examples
const examples = await search_code_examples({
  query: "entity query condition",
  source: "all"
});

// Get detailed function information
const details = await get_function_details({
  function_name: "entity_load_multiple",
  version: "11.x"
});
```

### Example 2: Module Development
```javascript
// Generate module structure
const files = await generate_module_skeleton({
  name: "My Custom Module",
  machineName: "my_custom_module",
  description: "Provides custom functionality",
  includeController: true,
  includeBlock: true
});

// Analyze generated files
for (const file of files) {
  if (file.filename.endsWith('.php')) {
    const analysis = await analyze_drupal_file({
      file_path: file.path
    });
  }
}
```

### Example 3: Migration Analysis
```javascript
// Analyze upgrade path
const report = await analyze_upgrade_path({
  project_path: "/var/www/drupal",
  from_version: "9",
  to_version: "10"
});

// Generate patches
const patches = await generate_migration_patches({
  report: report
});

// Generate HTML report
const html = await generate_migration_report({
  report: report
});
```
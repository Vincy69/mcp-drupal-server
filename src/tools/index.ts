import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const drupalTools: Tool[] = [
  // Node operations
  {
    name: 'get_node',
    description: 'Retrieve a specific Drupal node by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The node ID to retrieve',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_node',
    description: 'Create a new Drupal node',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The node title',
        },
        body: {
          type: 'string',
          description: 'The node body content',
        },
        status: {
          type: 'boolean',
          description: 'Whether the node is published',
          default: true,
        },
        type: {
          type: 'string',
          description: 'The node type',
          default: 'article',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_node',
    description: 'Update an existing Drupal node',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The node ID to update',
        },
        title: {
          type: 'string',
          description: 'The new node title',
        },
        body: {
          type: 'string',
          description: 'The new node body content',
        },
        status: {
          type: 'boolean',
          description: 'Whether the node is published',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_node',
    description: 'Delete a Drupal node',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The node ID to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_nodes',
    description: 'List Drupal nodes with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter by node type',
        },
        status: {
          type: 'boolean',
          description: 'Filter by published status',
        },
        limit: {
          type: 'number',
          description: 'Limit the number of results',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination',
          default: 0,
        },
      },
    },
  },

  // User operations
  {
    name: 'get_user',
    description: 'Retrieve a specific Drupal user by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The user ID to retrieve',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_user',
    description: 'Create a new Drupal user',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The username',
        },
        mail: {
          type: 'string',
          description: 'The user email',
        },
        pass: {
          type: 'string',
          description: 'The user password',
        },
        status: {
          type: 'boolean',
          description: 'Whether the user is active',
          default: true,
        },
      },
      required: ['name', 'mail'],
    },
  },
  {
    name: 'update_user',
    description: 'Update an existing Drupal user',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The user ID to update',
        },
        name: {
          type: 'string',
          description: 'The new username',
        },
        mail: {
          type: 'string',
          description: 'The new user email',
        },
        status: {
          type: 'boolean',
          description: 'Whether the user is active',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_user',
    description: 'Delete a Drupal user',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The user ID to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_users',
    description: 'List Drupal users with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'boolean',
          description: 'Filter by user status',
        },
        limit: {
          type: 'number',
          description: 'Limit the number of results',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination',
          default: 0,
        },
      },
    },
  },

  // Taxonomy operations
  {
    name: 'get_taxonomy_term',
    description: 'Retrieve a specific taxonomy term by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The taxonomy term ID to retrieve',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_taxonomy_term',
    description: 'Create a new taxonomy term',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The term name',
        },
        description: {
          type: 'string',
          description: 'The term description',
        },
        vocabulary: {
          type: 'string',
          description: 'The vocabulary machine name',
          default: 'tags',
        },
        parent: {
          type: 'string',
          description: 'Parent term ID',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_taxonomy_term',
    description: 'Update an existing taxonomy term',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The taxonomy term ID to update',
        },
        name: {
          type: 'string',
          description: 'The new term name',
        },
        description: {
          type: 'string',
          description: 'The new term description',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_taxonomy_term',
    description: 'Delete a taxonomy term',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The taxonomy term ID to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_taxonomy_terms',
    description: 'List taxonomy terms with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        vocabulary: {
          type: 'string',
          description: 'Filter by vocabulary machine name',
        },
        limit: {
          type: 'number',
          description: 'Limit the number of results',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination',
          default: 0,
        },
      },
    },
  },

  // Database operations
  {
    name: 'execute_query',
    description: 'Execute a custom database query',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The SQL query to execute',
        },
        parameters: {
          type: 'object',
          description: 'Parameters for the query',
        },
      },
      required: ['query'],
    },
  },

  // Module management
  {
    name: 'get_module_list',
    description: 'Get list of all available modules',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'enable_module',
    description: 'Enable a Drupal module',
    inputSchema: {
      type: 'object',
      properties: {
        module: {
          type: 'string',
          description: 'The module machine name to enable',
        },
      },
      required: ['module'],
    },
  },
  {
    name: 'disable_module',
    description: 'Disable a Drupal module',
    inputSchema: {
      type: 'object',
      properties: {
        module: {
          type: 'string',
          description: 'The module machine name to disable',
        },
      },
      required: ['module'],
    },
  },

  // Configuration management
  {
    name: 'get_configuration',
    description: 'Get Drupal configuration value',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The configuration name',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'set_configuration',
    description: 'Set Drupal configuration value',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The configuration name',
        },
        value: {
          type: 'object',
          description: 'The configuration value',
        },
      },
      required: ['name', 'value'],
    },
  },

  // Cache management
  {
    name: 'clear_cache',
    description: 'Clear Drupal cache',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'The cache type to clear (all, render, discovery, etc.)',
          default: 'all',
        },
      },
    },
  },

  // Site information
  {
    name: 'get_site_info',
    description: 'Get general site information',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // Drupal Documentation Tools
  {
    name: 'search_drupal_functions',
    description: 'Search Drupal core functions in official API documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for function names or descriptions',
        },
        version: {
          type: 'string',
          description: 'Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)',
          default: '11.x',
          enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
        },
      },
    },
  },
  {
    name: 'search_drupal_classes',
    description: 'Search Drupal core classes in official API documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for class names or descriptions',
        },
        version: {
          type: 'string',
          description: 'Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)',
          default: '11.x',
          enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
        },
      },
    },
  },
  {
    name: 'search_drupal_hooks',
    description: 'Search Drupal hooks in official API documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for hook names or descriptions',
        },
        version: {
          type: 'string',
          description: 'Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)',
          default: '11.x',
          enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
        },
      },
    },
  },
  {
    name: 'search_drupal_topics',
    description: 'Search Drupal topics and guides in official API documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for topics or guide names',
        },
        version: {
          type: 'string',
          description: 'Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)',
          default: '11.x',
          enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
        },
      },
    },
  },
  {
    name: 'search_drupal_services',
    description: 'Search Drupal services in official API documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for service names or descriptions',
        },
        version: {
          type: 'string',
          description: 'Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)',
          default: '11.x',
          enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
        },
      },
    },
  },
  {
    name: 'search_drupal_all',
    description:
      'Search across all Drupal documentation types (functions, classes, hooks, topics, services)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term to find across all documentation types',
        },
        version: {
          type: 'string',
          description: 'Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)',
          default: '11.x',
          enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_function_details',
    description: 'Get detailed information about a specific Drupal function',
    inputSchema: {
      type: 'object',
      properties: {
        function_name: {
          type: 'string',
          description: 'The exact name of the Drupal function',
        },
        version: {
          type: 'string',
          description: 'Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)',
          default: '11.x',
          enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
        },
      },
      required: ['function_name'],
    },
  },
  {
    name: 'get_class_details',
    description: 'Get detailed information about a specific Drupal class',
    inputSchema: {
      type: 'object',
      properties: {
        class_name: {
          type: 'string',
          description: 'The exact name of the Drupal class',
        },
        version: {
          type: 'string',
          description: 'Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)',
          default: '11.x',
          enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
        },
      },
      required: ['class_name'],
    },
  },

  // Drupal Contrib Module Tools
  {
    name: 'search_contrib_modules',
    description: 'Search Drupal contributed modules on Drupal.org',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for module names or descriptions',
        },
        core_compatibility: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
          },
          description: 'Filter by Drupal core compatibility',
        },
        category: {
          type: 'string',
          description: 'Filter by module category',
        },
        limit: {
          type: 'number',
          description: 'Limit the number of results',
          default: 20,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_contrib_themes',
    description: 'Search Drupal contributed themes on Drupal.org',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for theme names or descriptions',
        },
        core_compatibility: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['7.x', '8.x', '9.x', '10.x', '11.x'],
          },
          description: 'Filter by Drupal core compatibility',
        },
        limit: {
          type: 'number',
          description: 'Limit the number of results',
          default: 20,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_module_details',
    description: 'Get detailed information about a specific Drupal contributed module',
    inputSchema: {
      type: 'object',
      properties: {
        machine_name: {
          type: 'string',
          description: "The machine name of the module (e.g., 'views', 'devel')",
        },
      },
      required: ['machine_name'],
    },
  },
  {
    name: 'get_popular_modules',
    description: 'Get a list of popular Drupal contributed modules',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Limit the number of results',
          default: 50,
        },
        category: {
          type: 'string',
          description: 'Filter by module category',
        },
      },
    },
  },

  // Drupal Code Examples Tools
  {
    name: 'search_code_examples',
    description: 'Search Drupal code examples and snippets',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for code examples',
        },
        category: {
          type: 'string',
          description: 'Filter by category (nodes, users, hooks, forms, database, services, etc.)',
        },
        drupal_version: {
          type: 'string',
          description: 'Filter by Drupal version',
          enum: ['9.x', '10.x', '11.x'],
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_example_by_title',
    description: 'Get a specific code example by its title',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The exact title of the code example',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_example_categories',
    description: 'Get all available code example categories',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_examples_by_category',
    description: 'Get all code examples in a specific category',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'The category name (nodes, users, hooks, forms, etc.)',
        },
        drupal_version: {
          type: 'string',
          description: 'Filter by Drupal version',
          enum: ['9.x', '10.x', '11.x'],
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'get_examples_by_tag',
    description: 'Get code examples by tag',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'The tag to search for (node, user, api, hook, etc.)',
        },
      },
      required: ['tag'],
    },
  },

  // Drupal Code Analysis Tools
  {
    name: 'analyze_drupal_file',
    description:
      'Analyze a Drupal file for structure, hooks, functions, classes, issues, and metrics',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the Drupal file to analyze',
        },
        include_summary: {
          type: 'boolean',
          description: 'Whether to include a formatted summary report',
          default: true,
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'check_drupal_standards',
    description: 'Check a Drupal file against coding standards and best practices',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the Drupal file to check',
        },
        drupal_version: {
          type: 'string',
          description: 'Target Drupal version for standards checking',
          enum: ['9.x', '10.x', '11.x'],
          default: '11.x',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'generate_module_skeleton',
    description: 'Generate a complete Drupal module skeleton with configurable options',
    inputSchema: {
      type: 'object',
      properties: {
        module_info: {
          type: 'object',
          description: 'Module information',
          properties: {
            name: { type: 'string', description: 'Human-readable module name' },
            machine_name: { type: 'string', description: 'Machine name (lowercase, underscores)' },
            description: { type: 'string', description: 'Module description' },
            package_name: { type: 'string', description: 'Package name', default: 'Custom' },
            version: { type: 'string', description: 'Module version', default: '1.0.0' },
            core_version_requirement: {
              type: 'string',
              description: 'Drupal core version requirement',
              default: '^10.2 || ^11',
            },
            dependencies: {
              type: 'array',
              items: { type: 'string' },
              description: 'Module dependencies',
              default: [],
            },
            type: {
              type: 'string',
              enum: ['module', 'theme', 'profile'],
              description: 'Type of extension',
              default: 'module',
            },
          },
          required: ['name', 'machine_name', 'description'],
        },
        options: {
          type: 'object',
          description: 'Generation options',
          properties: {
            include_install: {
              type: 'boolean',
              description: 'Include .install file',
              default: true,
            },
            include_routing: { type: 'boolean', description: 'Include routing.yml', default: true },
            include_services: {
              type: 'boolean',
              description: 'Include services.yml',
              default: false,
            },
            include_hooks: {
              type: 'array',
              items: { type: 'string' },
              description: 'Hooks to implement',
              default: ['hook_help'],
            },
            include_controller: {
              type: 'boolean',
              description: 'Include controller class',
              default: true,
            },
            include_form: { type: 'boolean', description: 'Include form class', default: false },
            include_entity: {
              type: 'boolean',
              description: 'Include entity class',
              default: false,
            },
            include_plugin: {
              type: 'boolean',
              description: 'Include block plugin',
              default: false,
            },
            include_permissions: {
              type: 'boolean',
              description: 'Include permissions.yml',
              default: true,
            },
            include_config_schema: {
              type: 'boolean',
              description: 'Include config schema',
              default: false,
            },
          },
        },
        output_path: {
          type: 'string',
          description: 'Output directory path',
          default: './modules/custom',
        },
      },
      required: ['module_info'],
    },
  },
  {
    name: 'get_module_template_info',
    description: 'Get information about available module templates and hooks',
    inputSchema: {
      type: 'object',
      properties: {
        show_structure: {
          type: 'boolean',
          description: 'Show recommended module structure',
          default: true,
        },
      },
    },
  },

  // Hybrid Intelligence Tools (combine docs + live when available)
  {
    name: 'hybrid_analyze_module',
    description:
      'Intelligent module analysis combining documentation with live installation status',
    inputSchema: {
      type: 'object',
      properties: {
        module_name: {
          type: 'string',
          description: 'Module machine name to analyze',
        },
        include_recommendations: {
          type: 'boolean',
          description: 'Whether to include actionable recommendations',
          default: true,
        },
      },
      required: ['module_name'],
    },
  },
  {
    name: 'hybrid_analyze_function',
    description:
      'Intelligent function analysis combining API documentation with live usage patterns',
    inputSchema: {
      type: 'object',
      properties: {
        function_name: {
          type: 'string',
          description: 'Drupal function name to analyze',
        },
        include_examples: {
          type: 'boolean',
          description: 'Whether to include code examples',
          default: true,
        },
      },
      required: ['function_name'],
    },
  },
  {
    name: 'hybrid_analyze_site',
    description: 'Comprehensive site analysis combining best practices with current site state',
    inputSchema: {
      type: 'object',
      properties: {
        include_security_audit: {
          type: 'boolean',
          description: 'Whether to include security recommendations',
          default: true,
        },
        include_performance_tips: {
          type: 'boolean',
          description: 'Whether to include performance recommendations',
          default: true,
        },
      },
    },
  },
  {
    name: 'hybrid_analyze_content_type',
    description: 'Content type analysis combining documentation with existing content structure',
    inputSchema: {
      type: 'object',
      properties: {
        content_type: {
          type: 'string',
          description: "Content type machine name (e.g., 'article', 'page')",
        },
        suggest_improvements: {
          type: 'boolean',
          description: 'Whether to suggest structural improvements',
          default: true,
        },
      },
      required: ['content_type'],
    },
  },
  {
    name: 'get_mode_status',
    description: 'Get current server mode and connection status information',
    inputSchema: {
      type: 'object',
      properties: {
        include_capabilities: {
          type: 'boolean',
          description: 'Whether to include detailed capability information',
          default: true,
        },
      },
    },
  },

  // Phase 4 - Advanced Analysis Tools
  {
    name: 'deep_analyze_file',
    description:
      'Advanced file analysis with quality score, performance issues, security audit, and refactoring suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the Drupal file to analyze',
        },
        generate_report: {
          type: 'boolean',
          description: 'Generate comprehensive markdown report',
          default: true,
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'smart_search',
    description:
      'Intelligent search with typo correction, fuzzy matching, and contextual suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (supports typos and abbreviations)',
        },
        search_type: {
          type: 'string',
          description: 'Type of search to perform',
          enum: ['all', 'functions', 'classes', 'hooks', 'modules', 'examples'],
          default: 'all',
        },
        context: {
          type: 'object',
          description: 'Optional context for better results',
          properties: {
            current_file: {
              type: 'string',
              description: 'Current file being edited',
            },
            project_type: {
              type: 'string',
              description: 'Type of Drupal project',
            },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'generate_custom_entity',
    description: 'Generate a complete custom entity with all necessary files and configurations',
    inputSchema: {
      type: 'object',
      properties: {
        entity_info: {
          type: 'object',
          description: 'Entity configuration',
          properties: {
            entity_type: { type: 'string', description: 'Machine name of entity' },
            label: { type: 'string', description: 'Human readable label' },
            label_plural: { type: 'string', description: 'Plural form of label' },
            description: { type: 'string', description: 'Entity description' },
            bundles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string' },
                  description: { type: 'string' },
                },
              },
              description: 'Entity bundles',
            },
            base_fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: [
                      'string',
                      'text',
                      'integer',
                      'boolean',
                      'datetime',
                      'decimal',
                      'entity_reference',
                      'file',
                      'image',
                    ],
                  },
                  label: { type: 'string' },
                  required: { type: 'boolean' },
                  description: { type: 'string' },
                },
              },
              description: 'Base fields for the entity',
            },
            revisionable: { type: 'boolean', default: false },
            translatable: { type: 'boolean', default: false },
            include_rest_api: { type: 'boolean', default: false },
            include_views: { type: 'boolean', default: true },
            include_admin_ui: { type: 'boolean', default: true },
            include_tests: { type: 'boolean', default: false },
          },
          required: ['entity_type', 'label'],
        },
        module_info: {
          type: 'object',
          description: 'Module information',
          properties: {
            name: { type: 'string' },
            machine_name: { type: 'string' },
            namespace: { type: 'string' },
          },
          required: ['name', 'machine_name'],
        },
        output_dir: {
          type: 'string',
          description: 'Output directory for generated files',
          default: './generated_entity',
        },
      },
      required: ['entity_info', 'module_info'],
    },
  },
  {
    name: 'analyze_upgrade_path',
    description: 'Analyze project for Drupal version upgrade issues and generate migration report',
    inputSchema: {
      type: 'object',
      properties: {
        project_path: {
          type: 'string',
          description: 'Path to Drupal project root',
        },
        current_version: {
          type: 'string',
          description: 'Current Drupal version',
          enum: ['8', '9', '10'],
        },
        target_version: {
          type: 'string',
          description: 'Target Drupal version',
          enum: ['9', '10', '11'],
        },
        generate_patches: {
          type: 'boolean',
          description: 'Generate automated fix patches',
          default: false,
        },
        generate_html_report: {
          type: 'boolean',
          description: 'Generate HTML report',
          default: true,
        },
      },
      required: ['project_path', 'current_version', 'target_version'],
    },
  },
  {
    name: 'suggest_alternatives',
    description: 'Suggest modern alternatives for deprecated or outdated Drupal patterns',
    inputSchema: {
      type: 'object',
      properties: {
        code_snippet: {
          type: 'string',
          description: 'Code snippet to analyze',
        },
        drupal_version: {
          type: 'string',
          description: 'Target Drupal version',
          default: '11',
        },
      },
      required: ['code_snippet'],
    },
  },

  // Project Intelligence Tools
  {
    name: 'analyze_project_structure',
    description: 'Analyze entire project structure and provide insights',
    inputSchema: {
      type: 'object',
      properties: {
        project_path: {
          type: 'string',
          description: 'Path to Drupal project root',
        },
        include_custom_modules: {
          type: 'boolean',
          description: 'Analyze custom modules',
          default: true,
        },
        include_custom_themes: {
          type: 'boolean',
          description: 'Analyze custom themes',
          default: true,
        },
      },
      required: ['project_path'],
    },
  },
  {
    name: 'detect_coding_patterns',
    description: 'Detect coding patterns and conventions used in the project',
    inputSchema: {
      type: 'object',
      properties: {
        project_path: {
          type: 'string',
          description: 'Path to Drupal project root',
        },
      },
      required: ['project_path'],
    },
  },
  {
    name: 'suggest_next_steps',
    description: 'Suggest next development steps based on current project state',
    inputSchema: {
      type: 'object',
      properties: {
        project_path: {
          type: 'string',
          description: 'Path to Drupal project root',
        },
        goal: {
          type: 'string',
          description: 'Development goal or feature to implement',
        },
      },
      required: ['project_path'],
    },
  },
  {
    name: 'generate_contextual_code',
    description: 'Generate code that matches project style and conventions',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of what to generate',
        },
        context_file: {
          type: 'string',
          description: 'File to use as style reference',
        },
        target_location: {
          type: 'string',
          description: 'Where the code will be placed',
        },
      },
      required: ['description'],
    },
  },
];

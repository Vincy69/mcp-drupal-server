import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const drupalTools: Tool[] = [
  // Node operations
  {
    name: "get_node",
    description: "Retrieve a specific Drupal node by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The node ID to retrieve",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_node",
    description: "Create a new Drupal node",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The node title",
        },
        body: {
          type: "string",
          description: "The node body content",
        },
        status: {
          type: "boolean",
          description: "Whether the node is published",
          default: true,
        },
        type: {
          type: "string",
          description: "The node type",
          default: "article",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_node",
    description: "Update an existing Drupal node",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The node ID to update",
        },
        title: {
          type: "string",
          description: "The new node title",
        },
        body: {
          type: "string",
          description: "The new node body content",
        },
        status: {
          type: "boolean",
          description: "Whether the node is published",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_node",
    description: "Delete a Drupal node",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The node ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_nodes",
    description: "List Drupal nodes with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Filter by node type",
        },
        status: {
          type: "boolean",
          description: "Filter by published status",
        },
        limit: {
          type: "number",
          description: "Limit the number of results",
          default: 50,
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
          default: 0,
        },
      },
    },
  },

  // User operations
  {
    name: "get_user",
    description: "Retrieve a specific Drupal user by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The user ID to retrieve",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_user",
    description: "Create a new Drupal user",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The username",
        },
        mail: {
          type: "string",
          description: "The user email",
        },
        pass: {
          type: "string",
          description: "The user password",
        },
        status: {
          type: "boolean",
          description: "Whether the user is active",
          default: true,
        },
      },
      required: ["name", "mail"],
    },
  },
  {
    name: "update_user",
    description: "Update an existing Drupal user",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The user ID to update",
        },
        name: {
          type: "string",
          description: "The new username",
        },
        mail: {
          type: "string",
          description: "The new user email",
        },
        status: {
          type: "boolean",
          description: "Whether the user is active",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_user",
    description: "Delete a Drupal user",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The user ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_users",
    description: "List Drupal users with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "boolean",
          description: "Filter by user status",
        },
        limit: {
          type: "number",
          description: "Limit the number of results",
          default: 50,
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
          default: 0,
        },
      },
    },
  },

  // Taxonomy operations
  {
    name: "get_taxonomy_term",
    description: "Retrieve a specific taxonomy term by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The taxonomy term ID to retrieve",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_taxonomy_term",
    description: "Create a new taxonomy term",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The term name",
        },
        description: {
          type: "string",
          description: "The term description",
        },
        vocabulary: {
          type: "string",
          description: "The vocabulary machine name",
          default: "tags",
        },
        parent: {
          type: "string",
          description: "Parent term ID",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "update_taxonomy_term",
    description: "Update an existing taxonomy term",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The taxonomy term ID to update",
        },
        name: {
          type: "string",
          description: "The new term name",
        },
        description: {
          type: "string",
          description: "The new term description",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_taxonomy_term",
    description: "Delete a taxonomy term",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The taxonomy term ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_taxonomy_terms",
    description: "List taxonomy terms with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        vocabulary: {
          type: "string",
          description: "Filter by vocabulary machine name",
        },
        limit: {
          type: "number",
          description: "Limit the number of results",
          default: 50,
        },
        offset: {
          type: "number",
          description: "Offset for pagination",
          default: 0,
        },
      },
    },
  },

  // Database operations
  {
    name: "execute_query",
    description: "Execute a custom database query",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The SQL query to execute",
        },
        parameters: {
          type: "object",
          description: "Parameters for the query",
        },
      },
      required: ["query"],
    },
  },

  // Module management
  {
    name: "get_module_list",
    description: "Get list of all available modules",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "enable_module",
    description: "Enable a Drupal module",
    inputSchema: {
      type: "object",
      properties: {
        module: {
          type: "string",
          description: "The module machine name to enable",
        },
      },
      required: ["module"],
    },
  },
  {
    name: "disable_module",
    description: "Disable a Drupal module",
    inputSchema: {
      type: "object",
      properties: {
        module: {
          type: "string",
          description: "The module machine name to disable",
        },
      },
      required: ["module"],
    },
  },

  // Configuration management
  {
    name: "get_configuration",
    description: "Get Drupal configuration value",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The configuration name",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "set_configuration",
    description: "Set Drupal configuration value",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The configuration name",
        },
        value: {
          type: "object",
          description: "The configuration value",
        },
      },
      required: ["name", "value"],
    },
  },

  // Cache management
  {
    name: "clear_cache",
    description: "Clear Drupal cache",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "The cache type to clear (all, render, discovery, etc.)",
          default: "all",
        },
      },
    },
  },

  // Site information
  {
    name: "get_site_info",
    description: "Get general site information",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // Drupal Documentation Tools
  {
    name: "search_drupal_functions",
    description: "Search Drupal core functions in official API documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for function names or descriptions",
        },
        version: {
          type: "string",
          description: "Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)",
          default: "11.x",
          enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
        },
      },
    },
  },
  {
    name: "search_drupal_classes",
    description: "Search Drupal core classes in official API documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for class names or descriptions",
        },
        version: {
          type: "string",
          description: "Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)",
          default: "11.x",
          enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
        },
      },
    },
  },
  {
    name: "search_drupal_hooks",
    description: "Search Drupal hooks in official API documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for hook names or descriptions",
        },
        version: {
          type: "string",
          description: "Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)",
          default: "11.x",
          enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
        },
      },
    },
  },
  {
    name: "search_drupal_topics",
    description: "Search Drupal topics and guides in official API documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for topics or guide names",
        },
        version: {
          type: "string",
          description: "Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)",
          default: "11.x",
          enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
        },
      },
    },
  },
  {
    name: "search_drupal_services",
    description: "Search Drupal services in official API documentation",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for service names or descriptions",
        },
        version: {
          type: "string",
          description: "Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)",
          default: "11.x",
          enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
        },
      },
    },
  },
  {
    name: "search_drupal_all",
    description: "Search across all Drupal documentation types (functions, classes, hooks, topics, services)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to find across all documentation types",
        },
        version: {
          type: "string",
          description: "Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)",
          default: "11.x",
          enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_function_details",
    description: "Get detailed information about a specific Drupal function",
    inputSchema: {
      type: "object",
      properties: {
        function_name: {
          type: "string",
          description: "The exact name of the Drupal function",
        },
        version: {
          type: "string",
          description: "Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)",
          default: "11.x",
          enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
        },
      },
      required: ["function_name"],
    },
  },
  {
    name: "get_class_details",
    description: "Get detailed information about a specific Drupal class",
    inputSchema: {
      type: "object",
      properties: {
        class_name: {
          type: "string",
          description: "The exact name of the Drupal class",
        },
        version: {
          type: "string",
          description: "Drupal version (7.x, 8.x, 9.x, 10.x, 11.x)",
          default: "11.x",
          enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
        },
      },
      required: ["class_name"],
    },
  },

  // Drupal Contrib Module Tools
  {
    name: "search_contrib_modules",
    description: "Search Drupal contributed modules on Drupal.org",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for module names or descriptions",
        },
        core_compatibility: {
          type: "array",
          items: {
            type: "string",
            enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
          },
          description: "Filter by Drupal core compatibility",
        },
        category: {
          type: "string",
          description: "Filter by module category",
        },
        limit: {
          type: "number",
          description: "Limit the number of results",
          default: 20,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_contrib_themes",
    description: "Search Drupal contributed themes on Drupal.org",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for theme names or descriptions",
        },
        core_compatibility: {
          type: "array",
          items: {
            type: "string",
            enum: ["7.x", "8.x", "9.x", "10.x", "11.x"],
          },
          description: "Filter by Drupal core compatibility",
        },
        limit: {
          type: "number",
          description: "Limit the number of results",
          default: 20,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_module_details",
    description: "Get detailed information about a specific Drupal contributed module",
    inputSchema: {
      type: "object",
      properties: {
        machine_name: {
          type: "string",
          description: "The machine name of the module (e.g., 'views', 'devel')",
        },
      },
      required: ["machine_name"],
    },
  },
  {
    name: "get_popular_modules",
    description: "Get a list of popular Drupal contributed modules",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Limit the number of results",
          default: 50,
        },
        category: {
          type: "string",
          description: "Filter by module category",
        },
      },
    },
  },

  // Drupal Code Examples Tools
  {
    name: "search_code_examples",
    description: "Search Drupal code examples and snippets",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for code examples",
        },
        category: {
          type: "string",
          description: "Filter by category (nodes, users, hooks, forms, database, services, etc.)",
        },
        drupal_version: {
          type: "string",
          description: "Filter by Drupal version",
          enum: ["9.x", "10.x", "11.x"],
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_example_by_title",
    description: "Get a specific code example by its title",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The exact title of the code example",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "list_example_categories",
    description: "Get all available code example categories",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_examples_by_category",
    description: "Get all code examples in a specific category",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "The category name (nodes, users, hooks, forms, etc.)",
        },
        drupal_version: {
          type: "string",
          description: "Filter by Drupal version",
          enum: ["9.x", "10.x", "11.x"],
        },
      },
      required: ["category"],
    },
  },
  {
    name: "get_examples_by_tag",
    description: "Get code examples by tag",
    inputSchema: {
      type: "object",
      properties: {
        tag: {
          type: "string",
          description: "The tag to search for (node, user, api, hook, etc.)",
        },
      },
      required: ["tag"],
    },
  },
];
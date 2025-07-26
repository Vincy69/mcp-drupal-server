#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DrupalClient } from "./drupal-client.js";
import { DrupalDocsClient } from "./drupal-docs-client.js";
import { DrupalContribClient } from "./drupal-contrib-client.js";
import { DrupalExamples } from "./drupal-examples.js";
import { drupalTools } from "./tools/index.js";

export class DrupalMCPServer {
  private server: Server;
  private drupalClient: DrupalClient | null;
  private docsClient: DrupalDocsClient;
  private contribClient: DrupalContribClient;
  private examples: DrupalExamples;
  private docsOnlyMode: boolean;

  constructor() {
    this.server = new Server(
      {
        name: "mcp-drupal-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Always initialize documentation clients first
    this.docsClient = new DrupalDocsClient();
    this.contribClient = new DrupalContribClient();
    this.examples = new DrupalExamples();
    
    // Initialize with null Drupal client
    this.drupalClient = null;
    this.docsOnlyMode = true;

    this.setupHandlers();
    this.initializeDrupalConnection();
  }

  private async initializeDrupalConnection() {
    // Force docs-only mode if explicitly set
    if (process.env.DOCS_ONLY_MODE === 'true') {
      console.error("Drupal MCP server running in documentation-only mode (forced)");
      return;
    }

    // Check if we have connection details
    const hasConnectionDetails = process.env.DRUPAL_BASE_URL && 
                                process.env.DRUPAL_BASE_URL !== 'http://localhost' &&
                                (process.env.DRUPAL_USERNAME || process.env.DRUPAL_TOKEN || process.env.DRUPAL_API_KEY);

    if (!hasConnectionDetails) {
      console.error("Drupal MCP server running in documentation-only mode (no connection details)");
      return;
    }

    try {
      // Initialize Drupal client
      this.drupalClient = new DrupalClient();
      
      // Test the connection
      await this.testDrupalConnection();
      
      this.docsOnlyMode = false;
      console.error("Drupal MCP server running in full mode (live connection established)");
    } catch (error) {
      console.error(`Drupal connection failed, falling back to documentation-only mode: ${error instanceof Error ? error.message : String(error)}`);
      this.drupalClient = null;
      this.docsOnlyMode = true;
    }
  }

  private async testDrupalConnection(): Promise<void> {
    if (!this.drupalClient) {
      throw new Error("Drupal client not initialized");
    }

    try {
      // Try a simple API call to test connectivity
      await this.drupalClient.getSiteInfo();
    } catch (error) {
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [
        {
          uri: "drupal://docs",
          name: "Drupal Documentation",
          description: "Access to Drupal documentation and examples",
          mimeType: "application/json",
        },
      ];

      // Only add live Drupal resources if not in docs-only mode
      if (!this.docsOnlyMode && this.drupalClient) {
        resources.push(
          {
            uri: "drupal://entities",
            name: "Drupal Entities",
            description: "Access to all Drupal entities",
            mimeType: "application/json",
          },
          {
            uri: "drupal://config",
            name: "Drupal Configuration",
            description: "Drupal configuration management",
            mimeType: "application/json",
          }
        );
      }

      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case "drupal://docs":
          const docsInfo = {
            mode: this.docsOnlyMode ? "Documentation Only" : "Full Drupal Connection",
            available_tools: [
              "search_drupal_functions",
              "search_drupal_classes", 
              "search_drupal_hooks",
              "search_drupal_topics",
              "search_contrib_modules",
              "search_code_examples"
            ],
            description: "Drupal MCP Server providing access to Drupal documentation, contrib modules, and code examples"
          };
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(docsInfo, null, 2),
              },
            ],
          };
        case "drupal://entities":
          if (!this.drupalClient) {
            throw new McpError(ErrorCode.InvalidRequest, "Live Drupal connection not available in docs-only mode");
          }
          const entities = await this.drupalClient.getAllEntities();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(entities, null, 2),
              },
            ],
          };
        case "drupal://config":
          if (!this.drupalClient) {
            throw new McpError(ErrorCode.InvalidRequest, "Live Drupal connection not available in docs-only mode");
          }
          const config = await this.drupalClient.getSystemConfiguration();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(config, null, 2),
              },
            ],
          };
        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      }
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: drupalTools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Live Drupal operations - only available if not in docs-only mode
        if (!this.docsOnlyMode && this.drupalClient) {
          switch (name) {
            case "get_node":
              return await this.drupalClient.getNode(args?.id as string);
            case "create_node":
              return await this.drupalClient.createNode(args as any);
            case "update_node":
              return await this.drupalClient.updateNode(args?.id as string, args as any);
            case "delete_node":
              return await this.drupalClient.deleteNode(args?.id as string);
            case "list_nodes":
              return await this.drupalClient.listNodes(args as any);
            case "get_user":
              return await this.drupalClient.getUser(args?.id as string);
            case "create_user":
              return await this.drupalClient.createUser(args as any);
            case "update_user":
              return await this.drupalClient.updateUser(args?.id as string, args as any);
            case "delete_user":
              return await this.drupalClient.deleteUser(args?.id as string);
            case "list_users":
              return await this.drupalClient.listUsers(args as any);
            case "get_taxonomy_term":
              return await this.drupalClient.getTaxonomyTerm(args?.id as string);
            case "create_taxonomy_term":
              return await this.drupalClient.createTaxonomyTerm(args as any);
            case "update_taxonomy_term":
              return await this.drupalClient.updateTaxonomyTerm(args?.id as string, args as any);
            case "delete_taxonomy_term":
              return await this.drupalClient.deleteTaxonomyTerm(args?.id as string);
            case "list_taxonomy_terms":
              return await this.drupalClient.listTaxonomyTerms(args as any);
            case "execute_query":
              return await this.drupalClient.executeQuery(args?.query as string, args?.parameters as any);
            case "get_module_list":
              return await this.drupalClient.getModuleList();
            case "enable_module":
              return await this.drupalClient.enableModule(args?.module as string);
            case "disable_module":
              return await this.drupalClient.disableModule(args?.module as string);
            case "get_configuration":
              return await this.drupalClient.getConfiguration(args?.name as string);
            case "set_configuration":
              return await this.drupalClient.setConfiguration(args?.name as string, args?.value as any);
            case "clear_cache":
              return await this.drupalClient.clearCache(args?.type as string);
            case "get_site_info":
              return await this.drupalClient.getSiteInfo();
          }
        } else if (["get_node", "create_node", "update_node", "delete_node", "list_nodes", 
                   "get_user", "create_user", "update_user", "delete_user", "list_users",
                   "get_taxonomy_term", "create_taxonomy_term", "update_taxonomy_term", "delete_taxonomy_term", "list_taxonomy_terms",
                   "execute_query", "get_module_list", "enable_module", "disable_module",
                   "get_configuration", "set_configuration", "clear_cache", "get_site_info"].includes(name)) {
          
          const helpMessage = this.generateHelpMessage(name);
          return { 
            content: [{ 
              type: "text", 
              text: helpMessage
            }] 
          };
        }

        // Documentation and examples tools - always available
        switch (name) {
          
          // Drupal Documentation tools
          case "search_drupal_functions":
            const functions = await this.docsClient.searchFunctions(args?.version as any, args?.query as string);
            const functionSummary = functions.length > 0 ? 
              `Found ${functions.length} functions. Examples: ${functions.slice(0, 3).map(f => f.name).join(', ')}` :
              'No functions found. Try broader search terms like "form", "node", "user", or "cache".';
            return { 
              content: [{ 
                type: "text", 
                text: `${functionSummary}\n\nFull results:\n${JSON.stringify(functions, null, 2)}` 
              }] 
            };
          case "search_drupal_classes":
            const classes = await this.docsClient.searchClasses(args?.version as any, args?.query as string);
            const classSummary = classes.length > 0 ? 
              `Found ${classes.length} classes. Examples: ${classes.slice(0, 3).map(c => c.name).join(', ')}` :
              'No classes found in first 50 results (alphabetically sorted). Try terms starting with A-D like "Access", "Account", "Ajax", "Batch", "Cache", "Config", or "Database".';
            return { 
              content: [{ 
                type: "text", 
                text: `${classSummary}\n\nFull results:\n${JSON.stringify(classes, null, 2)}` 
              }] 
            };
          case "search_drupal_hooks":
            const hooks = await this.docsClient.searchHooks(args?.version as any, args?.query as string);
            const hookSummary = hooks.length > 0 ? 
              `Found ${hooks.length} hooks. Examples: ${hooks.slice(0, 3).map(h => h.name).join(', ')}` :
              'No hooks found. Try broader search terms like "alter", "preprocess", "insert", or "update".';
            return { 
              content: [{ 
                type: "text", 
                text: `${hookSummary}\n\nFull results:\n${JSON.stringify(hooks, null, 2)}` 
              }] 
            };
          case "search_drupal_topics":
            const topics = await this.docsClient.searchTopics(args?.version as any, args?.query as string);
            const topicSummary = topics.length > 0 ? 
              `Found ${topics.length} topics. Examples: ${topics.slice(0, 3).map(t => t.name).join(', ')}` :
              'No topics found. Try broader search terms like "api", "theme", "module", or "database".';
            return { 
              content: [{ 
                type: "text", 
                text: `${topicSummary}\n\nFull results:\n${JSON.stringify(topics, null, 2)}` 
              }] 
            };
          case "search_drupal_services":
            const services = await this.docsClient.searchServices(args?.version as any, args?.query as string);
            const serviceSummary = services.length > 0 ? 
              `Found ${services.length} services. Examples: ${services.slice(0, 3).map(s => s.name).join(', ')}` :
              'No services found. Try broader search terms like "entity", "cache", "config", or "logger".';
            return { 
              content: [{ 
                type: "text", 
                text: `${serviceSummary}\n\nFull results:\n${JSON.stringify(services, null, 2)}` 
              }] 
            };
          case "search_drupal_all":
            const allResults = await this.docsClient.searchAll(args?.query as string, args?.version as any);
            return { content: [{ type: "text", text: JSON.stringify(allResults, null, 2) }] };
          case "get_function_details":
            const functionDetails = await this.docsClient.getFunctionDetails(args?.function_name as string, args?.version as any);
            return { content: [{ type: "text", text: JSON.stringify(functionDetails, null, 2) }] };
          case "get_class_details":
            const classDetails = await this.docsClient.getClassDetails(args?.class_name as string, args?.version as any);
            return { content: [{ type: "text", text: JSON.stringify(classDetails, null, 2) }] };
          
          // Drupal Contrib tools
          case "search_contrib_modules":
            const modules = await this.contribClient.searchModules(args?.query as string, {
              core_compatibility: (args?.core_compatibility as string[]) || undefined,
              categories: args?.category ? [args.category as string] : undefined,
              limit: args?.limit as number,
            });
            return { content: [{ type: "text", text: JSON.stringify(modules, null, 2) }] };
          case "search_contrib_themes":
            const themes = await this.contribClient.searchThemes(args?.query as string, {
              core_compatibility: (args?.core_compatibility as string[]) || undefined,
              limit: args?.limit as number,
            });
            return { content: [{ type: "text", text: JSON.stringify(themes, null, 2) }] };
          case "get_module_details":
            const moduleDetails = await this.contribClient.getModuleDetails(args?.machine_name as string);
            if (moduleDetails) {
              const summary = `Module: ${moduleDetails.title}\nDescription: ${moduleDetails.description}\nVersion: ${moduleDetails.version}\nCompatibility: ${moduleDetails.compatible_with.join(', ')}\nProject URL: ${moduleDetails.project_url}`;
              return { 
                content: [{ 
                  type: "text", 
                  text: `${summary}\n\nFull details:\n${JSON.stringify(moduleDetails, null, 2)}` 
                }] 
              };
            } else {
              return { 
                content: [{ 
                  type: "text", 
                  text: `Module "${args?.machine_name}" not found in our database. Try searching with search_contrib_modules first, or visit https://www.drupal.org/project/${args?.machine_name}` 
                }] 
              };
            }
          case "get_popular_modules":
            const popularModules = await this.contribClient.searchModules('', {
              limit: args?.limit as number,
              categories: args?.category ? [args.category as string] : undefined,
            });
            return { content: [{ type: "text", text: JSON.stringify(popularModules, null, 2) }] };
          
          // Drupal Code Examples tools
          case "search_code_examples":
            const searchResults = this.examples.searchExamples(args?.query as string);
            const filteredResults = args?.category || args?.drupal_version ? 
              this.examples.getExamples(args?.category as string, args?.drupal_version as string)
                .filter(example => searchResults.some(result => result.title === example.title)) :
              searchResults;
            return { content: [{ type: "text", text: JSON.stringify(filteredResults, null, 2) }] };
          case "get_example_by_title":
            const example = this.examples.getExampleByTitle(args?.title as string);
            return { content: [{ type: "text", text: JSON.stringify(example, null, 2) }] };
          case "list_example_categories":
            const categories = this.examples.getCategories();
            return { content: [{ type: "text", text: JSON.stringify(categories, null, 2) }] };
          case "get_examples_by_category":
            const categoryExamples = this.examples.getExamples(args?.category as string, args?.drupal_version as string);
            return { content: [{ type: "text", text: JSON.stringify(categoryExamples, null, 2) }] };
          case "get_examples_by_tag":
            const tagExamples = this.examples.getExamplesByTag(args?.tag as string);
            return { content: [{ type: "text", text: JSON.stringify(tagExamples, null, 2) }] };
          
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private generateHelpMessage(toolName: string): string {
    const baseMessage = `🚫 "${toolName}" requires a live Drupal connection (not available in docs-only mode).\n\n`;
    
    const toolCategories = {
      nodes: ["get_node", "create_node", "update_node", "delete_node", "list_nodes"],
      users: ["get_user", "create_user", "update_user", "delete_user", "list_users"],
      taxonomy: ["get_taxonomy_term", "create_taxonomy_term", "update_taxonomy_term", "delete_taxonomy_term", "list_taxonomy_terms"],
      admin: ["execute_query", "get_module_list", "enable_module", "disable_module", "get_configuration", "set_configuration", "clear_cache", "get_site_info"]
    };

    let categoryName = "administration";
    let docAlternative = "administration tasks";
    
    if (toolCategories.nodes.includes(toolName)) {
      categoryName = "content management";
      docAlternative = "creating and managing content";
    } else if (toolCategories.users.includes(toolName)) {
      categoryName = "user management";
      docAlternative = "user management and authentication";
    } else if (toolCategories.taxonomy.includes(toolName)) {
      categoryName = "taxonomy management";
      docAlternative = "taxonomy and categorization";
    }

    const alternativeHelp = `📚 Available documentation tools for ${categoryName}:\n\n` +
      `🔍 For ${docAlternative}, try:\n` +
      `   • search_drupal_functions - Search API functions\n` +
      `   • search_code_examples - Find practical code examples\n` +
      `   • search_drupal_hooks - Find relevant hooks\n\n` +
      `🔌 For related modules, try:\n` +
      `   • search_contrib_modules - Find community modules\n` +
      `   • get_module_details - Get module information\n\n` +
      `💡 Example queries:\n` +
      `   - "How to ${docAlternative} in Drupal 11?"\n` +
      `   - "Show me code examples for ${categoryName}"\n` +
      `   - "What hooks are available for ${categoryName}?"\n\n`;

    const setupHelp = `⚙️ To enable live Drupal operations:\n` +
      `1. Configure environment: npm run configure-claude full --base-url https://your-site.com\n` +
      `2. Test connection: npm run test-connection\n` +
      `3. Restart Claude Desktop\n`;

    return baseMessage + alternativeHelp + setupHelp;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Drupal MCP server running on stdio");
  }
}

const server = new DrupalMCPServer();
server.run().catch(console.error);
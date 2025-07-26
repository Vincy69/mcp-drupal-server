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
  private drupalClient: DrupalClient;
  private docsClient: DrupalDocsClient;
  private contribClient: DrupalContribClient;
  private examples: DrupalExamples;

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

    this.drupalClient = new DrupalClient();
    this.docsClient = new DrupalDocsClient();
    this.contribClient = new DrupalContribClient();
    this.examples = new DrupalExamples();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
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
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case "drupal://entities":
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
          
          // Drupal Documentation tools
          case "search_drupal_functions":
            const functions = await this.docsClient.searchFunctions(args?.version as any, args?.query as string);
            return { content: [{ type: "text", text: JSON.stringify(functions, null, 2) }] };
          case "search_drupal_classes":
            const classes = await this.docsClient.searchClasses(args?.version as any, args?.query as string);
            return { content: [{ type: "text", text: JSON.stringify(classes, null, 2) }] };
          case "search_drupal_hooks":
            const hooks = await this.docsClient.searchHooks(args?.version as any, args?.query as string);
            return { content: [{ type: "text", text: JSON.stringify(hooks, null, 2) }] };
          case "search_drupal_topics":
            const topics = await this.docsClient.searchTopics(args?.version as any, args?.query as string);
            return { content: [{ type: "text", text: JSON.stringify(topics, null, 2) }] };
          case "search_drupal_services":
            const services = await this.docsClient.searchServices(args?.version as any, args?.query as string);
            return { content: [{ type: "text", text: JSON.stringify(services, null, 2) }] };
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
            return { content: [{ type: "text", text: JSON.stringify(moduleDetails, null, 2) }] };
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Drupal MCP server running on stdio");
  }
}

const server = new DrupalMCPServer();
server.run().catch(console.error);
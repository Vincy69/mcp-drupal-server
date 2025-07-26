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
import { drupalTools } from "./tools/index.js";

class DrupalMCPServer {
  private server: Server;
  private drupalClient: DrupalClient;

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
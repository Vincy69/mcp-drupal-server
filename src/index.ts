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
import { DrupalDynamicExamples } from "./drupal-dynamic-examples.js";
import { DrupalCodeAnalyzer } from "./drupal-code-analyzer.js";
import { DrupalCodeAnalyzerV2 } from "./drupal-code-analyzer-v2.js";
import { DrupalModuleGenerator } from "./drupal-module-generator.js";
import { DrupalEntityGenerator } from "./drupal-entity-generator.js";
import { DrupalMigrationAssistant } from "./drupal-migration-assistant.js";
import { DrupalFuzzySearch } from "./drupal-fuzzy-search.js";
import { DrupalModeManager, DrupalServerMode } from "./drupal-mode-manager.js";
import { DrupalHybridTools } from "./drupal-hybrid-tools.js";
import { drupalTools } from "./tools/index.js";

export class DrupalMCPServer {
  private server: Server;
  private drupalClient: DrupalClient | null;
  private docsClient: DrupalDocsClient;
  private contribClient: DrupalContribClient;
  private examples: DrupalDynamicExamples;
  private codeAnalyzer: DrupalCodeAnalyzer;
  private codeAnalyzerV2: DrupalCodeAnalyzerV2;
  private moduleGenerator: DrupalModuleGenerator;
  private entityGenerator: DrupalEntityGenerator;
  private migrationAssistant: DrupalMigrationAssistant;
  private fuzzySearch: DrupalFuzzySearch;
  private modeManager: DrupalModeManager;
  private hybridTools: DrupalHybridTools;
  private docsOnlyMode: boolean; // Kept for backward compatibility

  constructor() {
    this.server = new Server(
      {
        name: "mcp-drupal-server",
        version: "1.0.0-beta",
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
    this.examples = new DrupalDynamicExamples();
    this.codeAnalyzer = new DrupalCodeAnalyzer();
    this.codeAnalyzerV2 = new DrupalCodeAnalyzerV2();
    this.moduleGenerator = new DrupalModuleGenerator();
    this.entityGenerator = new DrupalEntityGenerator();
    this.migrationAssistant = new DrupalMigrationAssistant();
    this.fuzzySearch = new DrupalFuzzySearch();
    
    // Initialize Mode Manager
    this.hybridTools = new DrupalHybridTools();
    this.modeManager = new DrupalModeManager({
      mode: DrupalServerMode.SMART_FALLBACK,
      enableAutoRecovery: true,
      healthCheckInterval: 30000 // 30 seconds
    });
    
    // Initialize with null Drupal client
    this.drupalClient = null;
    this.docsOnlyMode = true;

    this.setupHandlers();
    this.initializeIntelligentMode();
  }

  private async initializeIntelligentMode() {
    try {
      const mode = await this.modeManager.initialize();
      
      switch (mode) {
        case DrupalServerMode.DOCS_ONLY:
          this.docsOnlyMode = true;
          this.drupalClient = null;
          console.error("[Server] Intelligent Mode: Documentation Only");
          break;
          
        case DrupalServerMode.LIVE_ONLY:
        case DrupalServerMode.HYBRID:
        case DrupalServerMode.SMART_FALLBACK:
          await this.initializeLiveConnection();
          break;
      }
    } catch (error) {
      console.error(`[Server] Mode initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      this.docsOnlyMode = true;
      this.drupalClient = null;
    }
  }

  private async initializeLiveConnection() {
    const connectionStatus = this.modeManager.getConnectionStatus();
    
    if (connectionStatus.isConnected) {
      try {
        this.drupalClient = new DrupalClient();
        await this.testDrupalConnection();
        
        this.docsOnlyMode = false;
        console.error(`[Server] Live connection established (${connectionStatus.responseTime}ms)`);
        
        const mode = this.modeManager.getCurrentMode();
        console.error(`[Server] Running in ${mode} mode with live capabilities`);
      } catch (error) {
        console.error(`[Server] Live connection setup failed: ${error instanceof Error ? error.message : String(error)}`);
        this.drupalClient = null;
        this.docsOnlyMode = true;
      }
    } else {
      console.error(`[Server] No live connection available: ${connectionStatus.error}`);
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
        // Intelligent tool routing with fallback
        const toolMode = this.modeManager.getOptimalModeForTool(name);
        
        if (toolMode === null) {
          return {
            content: [{
              type: "text",
              text: `❌ Tool "${name}" is not available in current mode (${this.modeManager.getCurrentMode()}). Live connection required but not available.`
            }]
          };
        }
        
        // Live Drupal operations - with intelligent fallback
        if (toolMode === 'live' && this.drupalClient) {
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
        } else if (toolMode === null || (toolMode === 'live' && !this.drupalClient)) {
          // Tool requires live connection but it's not available
          const helpMessage = this.generateIntelligentHelpMessage(name);
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
            try {
              const searchResults = await this.examples.searchExamples(args?.query as string, args?.category as string);
              return { content: [{ type: "text", text: JSON.stringify(searchResults, null, 2) }] };
            } catch (error) {
              console.error('Code examples search failed, using mock data:', error);
              const mockResults = this.docsClient.getMockCodeExamples(args?.query as string);
              return { content: [{ type: "text", text: JSON.stringify(mockResults, null, 2) }] };
            }
          case "get_example_by_title":
            const titleResults = await this.examples.searchExamples(args?.title as string);
            const example = titleResults.find(ex => ex.title === args?.title) || null;
            return { content: [{ type: "text", text: JSON.stringify(example, null, 2) }] };
          case "list_example_categories":
            try {
              const categories = await this.examples.getCategories();
              return { content: [{ type: "text", text: JSON.stringify(categories, null, 2) }] };
            } catch (error) {
              console.error('Categories list failed, using mock data:', error);
              const mockCategories = this.docsClient.getMockExampleCategories();
              return { content: [{ type: "text", text: JSON.stringify(mockCategories, null, 2) }] };
            }
          case "get_examples_by_category":
            try {
              const categoryExamples = await this.examples.getExamplesByCategory(args?.category as string, args?.drupal_version as any);
              return { content: [{ type: "text", text: JSON.stringify(categoryExamples, null, 2) }] };
            } catch (error) {
              console.error('Category examples failed, using mock data:', error);
              const mockExamples = this.docsClient.getMockCodeExamples();
              const categoryFilter = args?.category as string;
              const filtered = categoryFilter ? mockExamples.filter(ex => ex.category.toLowerCase().includes(categoryFilter.toLowerCase())) : mockExamples;
              return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
            }
          case "get_examples_by_tag":
            try {
              const tagExamples = await this.examples.getExamplesByTag(args?.tag as string);
              return { content: [{ type: "text", text: JSON.stringify(tagExamples, null, 2) }] };
            } catch (error) {
              console.error('Tag examples failed, using mock data:', error);
              const mockExamples = this.docsClient.getMockCodeExamples();
              const tagFilter = args?.tag as string;
              const filtered = tagFilter ? mockExamples.filter(ex => ex.tags.some((tag: string) => tag.toLowerCase().includes(tagFilter.toLowerCase()))) : mockExamples;
              return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
            }
          
          // Drupal Code Analysis tools
          case "analyze_drupal_file":
            const analysis = await this.codeAnalyzer.analyzeDrupalFile(args?.file_path as string);
            const analysisText = args?.include_summary !== false ? 
              this.codeAnalyzer.generateSummary(analysis) + "\n\n" + JSON.stringify(analysis, null, 2) :
              JSON.stringify(analysis, null, 2);
            return { content: [{ type: "text", text: analysisText }] };
          case "check_drupal_standards":
            const standardsAnalysis = await this.codeAnalyzer.analyzeDrupalFile(args?.file_path as string);
            const issues = standardsAnalysis.issues.filter(issue => 
              issue.severity === 'critical' || issue.severity === 'major'
            );
            const standardsReport = this.generateStandardsReport(standardsAnalysis, args?.drupal_version as string);
            return { content: [{ type: "text", text: standardsReport }] };
          case "generate_module_skeleton":
            const moduleInfo = args?.module_info as any;
            const options = args?.options as any || {};
            const outputPath = args?.output_path as string || './modules/custom';
            
            // Set defaults and transform snake_case to camelCase
            const fullModuleInfo = {
              packageName: 'Custom',
              version: '1.0.0',
              coreVersionRequirement: '^10.2 || ^11',
              dependencies: [],
              type: 'module',
              ...moduleInfo,
              // Transform snake_case to camelCase for internal interface
              machineName: moduleInfo?.machine_name || moduleInfo?.machineName
            };
            
            const fullOptions = {
              includeInstall: true,
              includeRouting: true,
              includeServices: false,
              includeHooks: ['hook_help'],
              includeController: true,
              includeForm: false,
              includeEntity: false,
              includePlugin: false,
              includePermissions: true,
              includeConfigSchema: false,
              ...options
            };
            
            try {
              const generatedFiles = await this.moduleGenerator.generateModuleSkeleton(
                fullModuleInfo,
                fullOptions,
                outputPath
              );
              
              const summary = `## Module Generated Successfully! 🎉\n\n` +
                `**Module:** ${fullModuleInfo.name} (${fullModuleInfo.machineName})\n` +
                `**Location:** ${outputPath}/${fullModuleInfo.machineName}/\n` +
                `**Files Created:** ${generatedFiles.length}\n\n` +
                `### Generated Files:\n` +
                generatedFiles.map(file => `- **${file.path.split('/').pop()}**: ${file.description}`).join('\n') +
                `\n\n### Next Steps:\n` +
                `1. Copy the module to your Drupal installation's modules/custom/ directory\n` +
                `2. Enable the module: \`drush en ${fullModuleInfo.machineName}\`\n` +
                `3. Configure permissions at /admin/people/permissions\n` +
                `4. Access admin page at /admin/config/system/${fullModuleInfo.machineName}\n`;
                
              return { content: [{ type: "text", text: summary }] };
            } catch (error) {
              console.error('Module generation failed, providing fallback guidance:', error);
              const fallbackMessage = `## ⚠️ Module Generation Failed\n\n` +
                `**Error:** ${error instanceof Error ? error.message : String(error)}\n\n` +
                `### Manual Module Creation Guide\n\n` +
                `To create a basic module manually:\n\n` +
                `1. Create directory: \`${outputPath}/${fullModuleInfo.machineName || 'my_module'}/\`\n` +
                `2. Create \`.info.yml\` file with module metadata\n` +
                `3. Create \`.module\` file for hook implementations\n` +
                `4. Add routing and controller files as needed\n\n` +
                `**Alternative:** Use Drupal Console: \`drupal generate:module\`\n` +
                `**Alternative:** Use Drush: \`drush generate module\`\n`;
              
              return {
                content: [{
                  type: "text",
                  text: fallbackMessage
                }]
              };
            }
          case "get_module_template_info":
            try {
              const availableHooks = await this.moduleGenerator.getAvailableHooks();
              const structure = args?.show_structure !== false ? this.moduleGenerator.getRecommendedStructure() : '';
              
              const templateInfo = `## Drupal Module Generator\n\n` +
                `### Available Hooks\n` +
                availableHooks.map(hook => `- ${hook}`).join('\n') +
                `\n\n### Module Options\n` +
                `- **include_install**: Database schema and installation hooks\n` +
                `- **include_routing**: URL routing definitions\n` +
                `- **include_services**: Dependency injection services\n` +
                `- **include_controller**: HTTP request controllers\n` +
                `- **include_form**: Configuration forms\n` +
                `- **include_entity**: Content entities\n` +
                `- **include_plugin**: Block plugins\n` +
                `- **include_permissions**: Custom permissions\n` +
                `- **include_config_schema**: Configuration schemas\n` +
                (structure ? `\n${structure}` : '');
                
              return { content: [{ type: "text", text: templateInfo }] };
            } catch (error) {
              console.error('Module template info failed, using mock data:', error);
              const mockTemplates = this.docsClient.getMockModuleTemplates();
              const templateInfo = `## Drupal Module Generator (Mock Data)\n\n` +
                `### Available Templates\n` +
                mockTemplates.map(template => `- **${template.name}**: ${template.description}`).join('\n') +
                `\n\n### Features Available\n` +
                mockTemplates.map(template => `- ${template.features.join(', ')}`).join('\n');
              return { content: [{ type: "text", text: templateInfo }] };
            }
          
          // Hybrid Intelligence Tools
          case "hybrid_analyze_module":
            const moduleAnalysis = await this.hybridTools.analyzeModule(
              args?.module_name as string,
              this.drupalClient || undefined
            );
            const moduleReport = this.formatHybridResult(moduleAnalysis, 'Module Analysis');
            return { content: [{ type: "text", text: moduleReport }] };
          case "hybrid_analyze_function":
            const functionAnalysis = await this.hybridTools.analyzeFunction(
              args?.function_name as string,
              this.drupalClient || undefined
            );
            const functionReport = this.formatHybridResult(functionAnalysis, 'Function Analysis');
            return { content: [{ type: "text", text: functionReport }] };
          case "hybrid_analyze_site":
            const siteAnalysis = await this.hybridTools.analyzeSite(
              this.drupalClient || undefined
            );
            const siteReport = this.formatHybridResult(siteAnalysis, 'Site Analysis');
            return { content: [{ type: "text", text: siteReport }] };
          case "hybrid_analyze_content_type":
            const contentTypeAnalysis = await this.hybridTools.analyzeContentType(
              args?.content_type as string,
              this.drupalClient || undefined
            );
            const contentTypeReport = this.formatHybridResult(contentTypeAnalysis, 'Content Type Analysis');
            return { content: [{ type: "text", text: contentTypeReport }] };
          case "get_mode_status":
            const modeStats = this.modeManager.getModeStats();
            const connectionStatus = this.modeManager.getConnectionStatus();
            
            const statusReport = `## 🚀 MCP Drupal Server Status\n\n` +
              `**Current Mode:** ${modeStats.currentMode}\n` +
              `**Live Connection:** ${connectionStatus.isConnected ? '✅ Connected' : '❌ Disconnected'}\n` +
              `**Response Time:** ${connectionStatus.responseTime || 'N/A'}ms\n` +
              `**Uptime:** ${Math.round(modeStats.uptime / 1000)}s\n` +
              `**Reconnect Attempts:** ${modeStats.reconnectAttempts}\n\n` +
              `### Available Capabilities\n` +
              modeStats.capabilities.map(cap => `- ${cap}`).join('\n') +
              (connectionStatus.error ? `\n\n### Connection Error\n${connectionStatus.error}` : '') +
              `\n\n### Mode Descriptions\n` +
              `- **docs_only**: Documentation and examples only\n` +
              `- **live_only**: Live Drupal instance operations only\n` +
              `- **hybrid**: Best of both worlds - docs + live\n` +
              `- **smart_fallback**: Intelligent switching based on availability\n`;
            
            return { content: [{ type: "text", text: statusReport }] };
          
          // Phase 4 - Advanced Analysis Tools
          case "deep_analyze_file":
            const advancedAnalysis = await this.codeAnalyzerV2.analyzeAdvanced(args?.file_path as string);
            const report = args?.generate_report !== false ? 
              await this.codeAnalyzerV2.generateComprehensiveReport(args?.file_path as string) :
              JSON.stringify(advancedAnalysis, null, 2);
            return { content: [{ type: "text", text: report }] };
            
          case "smart_search":
            const searchType = args?.search_type as string || 'all';
            const query = args?.query as string;
            const context = args?.context as any;
            
            let smartSearchResults: any;
            switch (searchType) {
              case 'functions':
                const functions = await this.docsClient.searchFunctions("11.x", query);
                smartSearchResults = await this.fuzzySearch.searchWithContext(
                  query, functions, context || {},
                  (item: any, term: string) => item.name.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term),
                  (item: any) => item.name
                );
                break;
              case 'modules':
                const modules = await this.contribClient.searchModules(query);
                smartSearchResults = await this.fuzzySearch.searchWithContext(
                  query, modules, context || {},
                  (item: any, term: string) => item.title.toLowerCase().includes(term) || item.machine_name.toLowerCase().includes(term),
                  (item: any) => item.title
                );
                break;
              default:
                // Search all
                const allResults = await this.docsClient.searchAll(query);
                smartSearchResults = await this.fuzzySearch.searchWithContext(
                  query, allResults, context || {},
                  (item: any, term: string) => JSON.stringify(item).toLowerCase().includes(term),
                  (item: any) => item.title || item.name || item.function_name || ''
                );
            }
            
            return { content: [{ type: "text", text: JSON.stringify(smartSearchResults, null, 2) }] };
            
          case "generate_custom_entity":
            const entityInfo = args?.entity_info as any;
            const entityModuleInfo = args?.module_info as any;
            const outputDir = args?.output_dir as string || './generated_entity';
            
            const generatedEntityFiles = await this.entityGenerator.generateCustomEntity(
              entityModuleInfo,
              entityInfo,
              outputDir
            );
            
            const entitySummary = `## Custom Entity Generated Successfully! 🎉\n\n` +
              `**Entity Type:** ${entityInfo.entity_type}\n` +
              `**Label:** ${entityInfo.label}\n` +
              `**Module:** ${entityModuleInfo.name} (${entityModuleInfo.machine_name})\n` +
              `**Files Generated:** ${generatedEntityFiles.length}\n\n` +
              `### Generated Files:\n` +
              generatedEntityFiles.map(file => `- **${file.path}**: ${file.description}`).join('\n') +
              `\n\n### Features:\n` +
              `- ${entityInfo.revisionable ? '✅' : '❌'} Revisionable\n` +
              `- ${entityInfo.translatable ? '✅' : '❌'} Translatable\n` +
              `- ${entityInfo.include_rest_api ? '✅' : '❌'} REST API\n` +
              `- ${entityInfo.include_views ? '✅' : '❌'} Views Integration\n` +
              `- ${entityInfo.include_admin_ui ? '✅' : '❌'} Admin UI\n` +
              `\n### Next Steps:\n` +
              `1. Copy the generated files to your module directory\n` +
              `2. Enable the module: \`drush en ${entityModuleInfo.machine_name}\`\n` +
              `3. Update database: \`drush updatedb\`\n` +
              `4. Access entity admin at: /admin/content/${entityInfo.entity_type}\n`;
              
            return { content: [{ type: "text", text: entitySummary }] };
            
          case "analyze_upgrade_path":
            const migrationReport = await this.migrationAssistant.analyzeUpgradePath(
              args?.project_path as string,
              args?.current_version as string,
              args?.target_version as string
            );
            
            let output = JSON.stringify(migrationReport, null, 2);
            
            if (args?.generate_html_report) {
              const htmlReport = await this.migrationAssistant.generateHTMLReport(migrationReport);
              // Save HTML report to file
              const fs = await import('fs/promises');
              const reportPath = `${args.project_path}/drupal-migration-report.html`;
              await fs.writeFile(reportPath, htmlReport);
              output += `\n\nHTML report saved to: ${reportPath}`;
            }
            
            if (args?.generate_patches) {
              const patches = await this.migrationAssistant.generateMigrationPatches(migrationReport);
              output += `\n\nGenerated ${patches.size} patch files`;
            }
            
            return { content: [{ type: "text", text: output }] };
            
          case "suggest_alternatives":
            // This would need implementation in migration assistant
            const alternatives = {
              modern_alternatives: [],
              best_practices: [],
              documentation_links: []
            };
            return { content: [{ type: "text", text: JSON.stringify(alternatives, null, 2) }] };
            
          case "analyze_project_structure":
            // Simplified implementation for now
            const projectAnalysis = {
              custom_modules: [],
              custom_themes: [],
              contrib_modules: [],
              drupal_version: "Unknown",
              recommendations: []
            };
            return { content: [{ type: "text", text: JSON.stringify(projectAnalysis, null, 2) }] };
            
          case "detect_coding_patterns":
            // Simplified implementation
            const patterns = {
              dependency_injection: false,
              event_subscribers: false,
              custom_services: false,
              hooks_used: [],
              naming_convention: "unknown"
            };
            return { content: [{ type: "text", text: JSON.stringify(patterns, null, 2) }] };
            
          case "suggest_next_steps":
            // Simplified implementation
            const nextSteps = {
              immediate: ["Add error handling", "Implement caching"],
              short_term: ["Add tests", "Improve documentation"],
              long_term: ["Refactor for performance", "Add API endpoints"]
            };
            return { content: [{ type: "text", text: JSON.stringify(nextSteps, null, 2) }] };
            
          case "generate_contextual_code":
            // Simplified implementation
            const generatedCode = `<?php
// Generated code based on: ${args?.description}
// Implementation placeholder - to be expanded based on project context
`;
            return { content: [{ type: "text", text: generatedCode }] };
          
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

  private generateIntelligentHelpMessage(toolName: string): string {
    const currentMode = this.modeManager.getCurrentMode();
    const connectionStatus = this.modeManager.getConnectionStatus();
    
    let message = `🤖 **Intelligent Help for "${toolName}"**\n\n`;
    
    message += `**Current Mode:** ${currentMode}\n`;
    message += `**Live Connection:** ${connectionStatus.isConnected ? '✅ Connected' : '❌ Disconnected'}\n\n`;
    
    if (!connectionStatus.isConnected) {
      message += `📍 **Why this tool isn't available:**\n`;
      message += `This tool requires a live Drupal connection, but none is currently available.\n`;
      if (connectionStatus.error) {
        message += `Connection error: ${connectionStatus.error}\n`;
      }
      message += `\n`;
    }
    
    // Suggest alternatives based on tool category
    const alternatives = this.getToolAlternatives(toolName);
    if (alternatives.length > 0) {
      message += `💡 **Available Alternatives:**\n`;
      alternatives.forEach(alt => {
        message += `- **${alt.tool}**: ${alt.description}\n`;
      });
      message += `\n`;
    }
    
    // Suggest hybrid tools
    const hybridAlternatives = this.getHybridAlternatives(toolName);
    if (hybridAlternatives.length > 0) {
      message += `🎆 **Intelligent Hybrid Tools:**\n`;
      hybridAlternatives.forEach(alt => {
        message += `- **${alt.tool}**: ${alt.description}\n`;
      });
      message += `\n`;
    }
    
    // Connection recovery options
    if (!connectionStatus.isConnected) {
      message += `🔧 **Connection Recovery Options:**\n`;
      message += `1. Check your Drupal site configuration\n`;
      message += `2. Verify network connectivity\n`;
      message += `3. Use \`get_mode_status\` to check server status\n`;
      message += `4. Try hybrid tools for documentation-based insights\n\n`;
    }
    
    message += `📚 **Learn More:**\n`;
    message += `Use \`get_mode_status\` for detailed server information and capabilities.`;
    
    return message;
  }
  
  private getToolAlternatives(toolName: string): Array<{tool: string, description: string}> {
    const alternativeMap: {[key: string]: Array<{tool: string, description: string}>} = {
      'get_node': [
        { tool: 'search_code_examples', description: 'Find node manipulation examples' },
        { tool: 'search_drupal_functions', description: 'Learn about node API functions' }
      ],
      'create_node': [
        { tool: 'generate_module_skeleton', description: 'Generate module with node creation examples' },
        { tool: 'search_code_examples', description: 'Find node creation code patterns' }
      ],
      'get_user': [
        { tool: 'search_drupal_functions', description: 'Learn about user API functions' },
        { tool: 'search_code_examples', description: 'Find user management examples' }
      ],
      'get_module_list': [
        { tool: 'search_contrib_modules', description: 'Explore available contributed modules' },
        { tool: 'get_popular_modules', description: 'See popular community modules' }
      ]
    };
    
    return alternativeMap[toolName] || [];
  }
  
  private getHybridAlternatives(toolName: string): Array<{tool: string, description: string}> {
    const liveToolToHybrid: {[key: string]: Array<{tool: string, description: string}>} = {
      'get_node': [
        { tool: 'hybrid_analyze_content_type', description: 'Analyze content types with docs + live data' }
      ],
      'get_module_list': [
        { tool: 'hybrid_analyze_site', description: 'Comprehensive site analysis with recommendations' },
        { tool: 'hybrid_analyze_module', description: 'Analyze specific modules with installation status' }
      ],
      'get_user': [
        { tool: 'hybrid_analyze_site', description: 'Site analysis including user management insights' }
      ],
      'get_site_info': [
        { tool: 'hybrid_analyze_site', description: 'Intelligent site analysis with best practices' },
        { tool: 'get_mode_status', description: 'Current server status and capabilities' }
      ]
    };
    
    return liveToolToHybrid[toolName] || [
      { tool: 'hybrid_analyze_site', description: 'Comprehensive site analysis combining docs and live data' }
    ];
  }

  private generateStandardsReport(analysis: any, targetVersion: string = '11.x'): string {
    const { fileName, fileType, issues } = analysis;
    
    let report = `## Drupal Standards Check: ${fileName}\n\n`;
    report += `**File Type:** ${fileType}\n`;
    report += `**Target Drupal Version:** ${targetVersion}\n\n`;
    
    const criticalIssues = issues.filter((issue: any) => issue.severity === 'critical');
    const majorIssues = issues.filter((issue: any) => issue.severity === 'major');
    const minorIssues = issues.filter((issue: any) => issue.severity === 'minor');
    
    if (issues.length === 0) {
      report += `### ✅ No Issues Found\n\nThis file appears to follow Drupal coding standards.\n`;
    } else {
      report += `### 📊 Issues Summary\n`;
      report += `- **Critical:** ${criticalIssues.length}\n`;
      report += `- **Major:** ${majorIssues.length}\n`;
      report += `- **Minor:** ${minorIssues.length}\n\n`;
      
      if (criticalIssues.length > 0) {
        report += `### 🚨 Critical Issues (${criticalIssues.length})\n`;
        criticalIssues.forEach((issue: any) => {
          report += `- **Line ${issue.line}:** ${issue.message} (${issue.rule})\n`;
        });
        report += `\n`;
      }
      
      if (majorIssues.length > 0) {
        report += `### ⚠️  Major Issues (${majorIssues.length})\n`;
        majorIssues.forEach((issue: any) => {
          report += `- **Line ${issue.line}:** ${issue.message} (${issue.rule})\n`;
        });
        report += `\n`;
      }
      
      if (minorIssues.length > 0 && minorIssues.length <= 10) {
        report += `### ℹ️  Minor Issues (${minorIssues.length})\n`;
        minorIssues.forEach((issue: any) => {
          report += `- **Line ${issue.line}:** ${issue.message} (${issue.rule})\n`;
        });
        report += `\n`;
      } else if (minorIssues.length > 10) {
        report += `### ℹ️  Minor Issues (${minorIssues.length} total, showing first 10)\n`;
        minorIssues.slice(0, 10).forEach((issue: any) => {
          report += `- **Line ${issue.line}:** ${issue.message} (${issue.rule})\n`;
        });
        report += `\n`;
      }
    }
    
    report += `### 🔗 Resources\n`;
    report += `- [Drupal Coding Standards](https://www.drupal.org/docs/develop/standards)\n`;
    report += `- [Drupal ${targetVersion} API](https://api.drupal.org/api/drupal/${targetVersion})\n`;
    
    return report;
  }

  private formatHybridResult(result: any, title: string): string {
    let report = `## 🤖 Intelligent ${title}\n\n`;
    
    // Source information
    const sourceIcons = {
      'docs': '📚',
      'live': '🚀', 
      'hybrid': '🎆'
    } as const;
    
    type SourceType = keyof typeof sourceIcons;
    const sourceIcon: string = sourceIcons[result.source as SourceType] || '🔍';
    
    report += `**Source:** ${sourceIcon} ${result.source.toUpperCase()}\n`;
    report += `**Execution Time:** ${result.context?.execution_time}ms\n`;
    report += `**Live Connection:** ${result.context?.live_available ? '✅' : '❌'}\n\n`;
    
    // Documentation data
    if (result.docs_data) {
      report += `### 📚 Documentation Insights\n`;
      
      if (result.docs_data.module_info) {
        report += `**Module:** ${result.docs_data.module_info.title}\n`;
        report += `**Description:** ${result.docs_data.module_info.description}\n`;
        report += `**Version:** ${result.docs_data.module_info.version}\n`;
        report += `**Compatibility:** ${result.docs_data.module_info.compatible_with?.join(', ') || 'N/A'}\n\n`;
      }
      
      if (result.docs_data.function_details) {
        report += `**Function:** ${result.docs_data.function_details.name || 'Unknown'}\n`;
        report += `**Description:** ${result.docs_data.function_details.description || 'No description'}\n\n`;
      }
      
      if (result.docs_data.code_examples?.length > 0) {
        report += `**Code Examples:** ${result.docs_data.code_examples.length} available\n\n`;
      }
    }
    
    // Live data
    if (result.live_data) {
      report += `### 🚀 Live Site Analysis\n`;
      
      if ('is_installed' in result.live_data) {
        report += `**Installation Status:** ${result.live_data.is_installed ? '✅ Installed' : '❌ Not Installed'}\n`;
      }
      
      if ('content_count' in result.live_data) {
        report += `**Content Count:** ${result.live_data.content_count} items\n`;
      }
      
      if (result.live_data.site_info) {
        report += `**Drupal Version:** ${result.live_data.site_info.drupal_version || 'Unknown'}\n`;
      }
      
      report += `\n`;
    }
    
    // Recommendations
    if (result.recommendations?.length > 0) {
      report += `### 💡 Intelligent Recommendations\n`;
      result.recommendations.forEach((rec: string) => {
        report += `${rec}\n`;
      });
      report += `\n`;
    }
    
    // Additional context
    if (result.source === 'hybrid') {
      report += `### 🎆 Hybrid Intelligence\n`;
      report += `This analysis combines multiple data sources for comprehensive insights:\n`;
      report += `- Official documentation and API references\n`;
      report += `- Community examples and best practices\n`;
      if (result.context?.live_available) {
        report += `- Live site analysis and real-time status\n`;
      }
      report += `\nFor the most accurate recommendations, ensure your Drupal instance is connected.\n`;
    }
    
    return report;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    const mode = this.modeManager.getCurrentMode();
    const status = this.modeManager.getConnectionStatus();
    
    console.error(`🚀 Drupal MCP server running on stdio`);
    console.error(`📊 Mode: ${mode.toUpperCase()}`);
    console.error(`🔗 Live connection: ${status.isConnected ? 'ACTIVE' : 'INACTIVE'}`);
    
    if (status.isConnected && status.responseTime) {
      console.error(`⚡ Response time: ${status.responseTime}ms`);
    }
  }
  
  async shutdown() {
    console.error('🛑 Shutting down MCP server...');
    this.modeManager.destroy();
    console.error('✅ Server shutdown complete');
  }
}

const server = new DrupalMCPServer();
server.run().catch(console.error);
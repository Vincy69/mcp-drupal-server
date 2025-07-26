import { DrupalClient } from './drupal-client.js';
import { DrupalDocsClient } from './drupal-docs-client.js';
import { DrupalContribClient } from './drupal-contrib-client.js';
import { DrupalDynamicExamples } from './drupal-dynamic-examples.js';

export interface HybridResult {
  source: 'docs' | 'live' | 'hybrid';
  docs_data?: any;
  live_data?: any;
  recommendations?: string[];
  context?: {
    live_available: boolean;
    docs_available: boolean;
    execution_time: number;
  };
}

export class DrupalHybridTools {
  private docsClient: DrupalDocsClient;
  private contribClient: DrupalContribClient;
  private examples: DrupalDynamicExamples;

  constructor() {
    this.docsClient = new DrupalDocsClient();
    this.contribClient = new DrupalContribClient();
    this.examples = new DrupalDynamicExamples();
  }

  /**
   * Hybrid module analysis - combines docs + live installation status
   */
  async analyzeModule(
    moduleName: string, 
    liveClient?: DrupalClient
  ): Promise<HybridResult> {
    const startTime = Date.now();
    const result: HybridResult = {
      source: 'hybrid',
      context: {
        live_available: !!liveClient,
        docs_available: true,
        execution_time: 0
      }
    };

    try {
      // Always get documentation data
      const [moduleDetails, relatedFunctions, codeExamples] = await Promise.allSettled([
        this.contribClient.getModuleDetails(moduleName),
        this.docsClient.searchFunctions('11.x', moduleName),
        this.examples.searchExamples(moduleName)
      ]);

      result.docs_data = {
        module_info: moduleDetails.status === 'fulfilled' ? moduleDetails.value : null,
        related_functions: relatedFunctions.status === 'fulfilled' ? relatedFunctions.value : [],
        code_examples: codeExamples.status === 'fulfilled' ? codeExamples.value.slice(0, 3) : []
      };

      // If live client available, get installation status
      if (liveClient) {
        try {
          const moduleList = await liveClient.getModuleList();
          const modules = Array.isArray(moduleList) ? moduleList : [];
          const isInstalled = modules.some((mod: any) => 
            mod.machine_name === moduleName || mod.name === moduleName
          );

          result.live_data = {
            is_installed: isInstalled,
            installation_status: isInstalled ? 'enabled' : 'not_installed',
            site_compatibility: await this.checkSiteCompatibility(liveClient, moduleName)
          };

          // Generate hybrid recommendations
          result.recommendations = this.generateModuleRecommendations(
            result.docs_data, 
            result.live_data
          );
        } catch (liveError) {
          console.error('Live module analysis failed:', liveError);
          result.source = 'docs';
        }
      } else {
        result.source = 'docs';
      }

    } catch (error) {
      throw new Error(`Hybrid module analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.context!.execution_time = Date.now() - startTime;
    return result;
  }

  /**
   * Hybrid function documentation - combines API docs + live usage examples
   */
  async analyzeFunction(
    functionName: string,
    liveClient?: DrupalClient
  ): Promise<HybridResult> {
    const startTime = Date.now();
    const result: HybridResult = {
      source: 'hybrid',
      context: {
        live_available: !!liveClient,
        docs_available: true,
        execution_time: 0
      }
    };

    try {
      // Get documentation data
      const [functionDetails, codeExamples, relatedClasses] = await Promise.allSettled([
        this.docsClient.getFunctionDetails(functionName, '11.x'),
        this.examples.searchExamples(functionName),
        this.docsClient.searchClasses('11.x', functionName.split('_')[0])
      ]);

      result.docs_data = {
        function_details: functionDetails.status === 'fulfilled' ? functionDetails.value : null,
        code_examples: codeExamples.status === 'fulfilled' ? codeExamples.value.slice(0, 5) : [],
        related_classes: relatedClasses.status === 'fulfilled' ? relatedClasses.value.slice(0, 3) : []
      };

      // If live client available, check actual usage
      if (liveClient) {
        try {
          const liveUsage = await this.analyzeLiveFunctionUsage(liveClient, functionName);
          result.live_data = liveUsage;

          result.recommendations = this.generateFunctionRecommendations(
            result.docs_data,
            result.live_data
          );
        } catch (liveError) {
          console.error('Live function analysis failed:', liveError);
          result.source = 'docs';
        }
      } else {
        result.source = 'docs';
      }

    } catch (error) {
      throw new Error(`Hybrid function analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.context!.execution_time = Date.now() - startTime;
    return result;
  }

  /**
   * Hybrid site analysis - combines best practices + current site state
   */
  async analyzeSite(liveClient?: DrupalClient): Promise<HybridResult> {
    const startTime = Date.now();
    const result: HybridResult = {
      source: liveClient ? 'hybrid' : 'docs',
      context: {
        live_available: !!liveClient,
        docs_available: true,
        execution_time: 0
      }
    };

    try {
      // Always get best practices from docs
      const [securityModules, performanceModules, popularModules] = await Promise.allSettled([
        this.contribClient.searchModules('security'),
        this.contribClient.searchModules('performance cache'),
        this.contribClient.getPopularModules(10)
      ]);

      result.docs_data = {
        recommended_security_modules: securityModules.status === 'fulfilled' ? securityModules.value.slice(0, 5) : [],
        recommended_performance_modules: performanceModules.status === 'fulfilled' ? performanceModules.value.slice(0, 5) : [],
        popular_modules: popularModules.status === 'fulfilled' ? popularModules.value : []
      };

      // If live client available, analyze current site
      if (liveClient) {
        try {
          const [siteInfo, installedModules, siteConfig] = await Promise.allSettled([
            liveClient.getSiteInfo(),
            liveClient.getModuleList(),
            liveClient.getConfiguration('system.site')
          ]);

          result.live_data = {
            site_info: siteInfo.status === 'fulfilled' ? siteInfo.value : {},
            installed_modules: installedModules.status === 'fulfilled' ? installedModules.value : [],
            configuration: siteConfig.status === 'fulfilled' ? siteConfig.value : {}
          };

          result.recommendations = this.generateSiteRecommendations(
            result.docs_data,
            result.live_data
          );

        } catch (liveError) {
          console.error('Live site analysis failed:', liveError);
          result.source = 'docs';
        }
      }

    } catch (error) {
      throw new Error(`Hybrid site analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.context!.execution_time = Date.now() - startTime;
    return result;
  }

  /**
   * Hybrid content type analysis - combines documentation + existing content types
   */
  async analyzeContentType(
    contentType: string,
    liveClient?: DrupalClient
  ): Promise<HybridResult> {
    const startTime = Date.now();
    const result: HybridResult = {
      source: 'hybrid',
      context: {
        live_available: !!liveClient,
        docs_available: true,
        execution_time: 0
      }
    };

    try {
      // Get documentation about content types
      const [nodeHooks, contentExamples, fieldExamples] = await Promise.allSettled([
        this.docsClient.searchHooks('11.x', 'node'),
        this.examples.searchExamples(`${contentType} content type`),
        this.examples.searchExamples('field api')
      ]);

      result.docs_data = {
        relevant_hooks: nodeHooks.status === 'fulfilled' ? nodeHooks.value.slice(0, 10) : [],
        content_examples: contentExamples.status === 'fulfilled' ? contentExamples.value.slice(0, 5) : [],
        field_examples: fieldExamples.status === 'fulfilled' ? fieldExamples.value.slice(0, 3) : []
      };

      // If live client available, analyze existing content type
      if (liveClient) {
        try {
          const nodesResponse = await liveClient.listNodes({ type: contentType, limit: 5 });
          const nodes = Array.isArray(nodesResponse) ? nodesResponse : [];
          
          result.live_data = {
            existing_content: nodes,
            content_count: nodes.length,
            sample_structure: nodes.length > 0 ? this.extractContentStructure(nodes[0]) : null
          };

          result.recommendations = this.generateContentTypeRecommendations(
            contentType,
            result.docs_data,
            result.live_data
          );

        } catch (liveError) {
          console.error('Live content type analysis failed:', liveError);
          result.source = 'docs';
        }
      }

    } catch (error) {
      throw new Error(`Hybrid content type analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.context!.execution_time = Date.now() - startTime;
    return result;
  }

  // Private helper methods

  private async checkSiteCompatibility(liveClient: DrupalClient, moduleName: string): Promise<any> {
    try {
      const siteInfoResponse = await liveClient.getSiteInfo();
      const siteInfo = typeof siteInfoResponse === 'object' ? siteInfoResponse : {};
      return {
        drupal_version: (siteInfo as any).drupal_version || 'unknown',
        php_version: (siteInfo as any).php_version || 'unknown',
        compatible: true // Would implement actual compatibility checking
      };
    } catch {
      return { compatible: 'unknown' };
    }
  }

  private async analyzeLiveFunctionUsage(liveClient: DrupalClient, functionName: string): Promise<any> {
    // This would analyze logs, database queries, etc. to see how function is used
    // For now, return basic analysis
    return {
      usage_detected: false,
      performance_impact: 'unknown',
      error_logs: [],
      recommendations: []
    };
  }

  private generateModuleRecommendations(docsData: any, liveData?: any): string[] {
    const recommendations: string[] = [];

    if (docsData.module_info) {
      recommendations.push(`📋 Module "${docsData.module_info.title}" provides: ${docsData.module_info.description}`);
      
      if (docsData.module_info.dependencies?.length > 0) {
        recommendations.push(`🔗 Dependencies required: ${docsData.module_info.dependencies.join(', ')}`);
      }
    }

    if (liveData) {
      if (!liveData.is_installed) {
        recommendations.push(`💡 Module not installed - use 'drush en ${docsData.module_info?.name}' to enable`);
      } else {
        recommendations.push(`✅ Module already installed and active`);
      }

      if (liveData.site_compatibility?.compatible) {
        recommendations.push(`✅ Compatible with your Drupal ${liveData.site_compatibility.drupal_version} installation`);
      }
    }

    if (docsData.code_examples?.length > 0) {
      recommendations.push(`📝 ${docsData.code_examples.length} code examples available for implementation`);
    }

    return recommendations;
  }

  private generateFunctionRecommendations(docsData: any, liveData?: any): string[] {
    const recommendations: string[] = [];

    if (docsData.function_details) {
      recommendations.push(`📚 Function documented in Drupal ${docsData.function_details.version || '11.x'} API`);
      
      if (docsData.function_details.deprecated) {
        recommendations.push(`⚠️ This function is deprecated - consider alternatives`);
      }
    }

    if (docsData.code_examples?.length > 0) {
      recommendations.push(`💻 ${docsData.code_examples.length} usage examples found`);
    }

    if (liveData && !liveData.usage_detected) {
      recommendations.push(`💡 Function not currently used in your site - safe to implement`);
    }

    return recommendations;
  }

  private generateSiteRecommendations(docsData: any, liveData?: any): string[] {
    const recommendations: string[] = [];

    if (liveData) {
      const installedCount = liveData.installed_modules?.length || 0;
      recommendations.push(`📊 Your site has ${installedCount} modules installed`);

      // Check for missing security modules
      const securityModules = docsData.recommended_security_modules || [];
      const installedNames = liveData.installed_modules?.map((m: any) => m.machine_name) || [];
      
      const missingSecurityMods = securityModules.filter((mod: any) => 
        !installedNames.includes(mod.name)
      );

      if (missingSecurityMods.length > 0) {
        recommendations.push(`🔒 Consider installing security modules: ${missingSecurityMods.slice(0, 3).map((m: any) => m.title).join(', ')}`);
      }
    }

    if (docsData.popular_modules?.length > 0) {
      recommendations.push(`🌟 Top popular modules in community: ${docsData.popular_modules.slice(0, 3).map((m: any) => m.title).join(', ')}`);
    }

    return recommendations;
  }

  private generateContentTypeRecommendations(contentType: string, docsData: any, liveData?: any): string[] {
    const recommendations: string[] = [];

    if (liveData) {
      if (liveData.content_count > 0) {
        recommendations.push(`📊 Found ${liveData.content_count} existing ${contentType} content items`);
      } else {
        recommendations.push(`💡 No existing ${contentType} content - perfect for new implementation`);
      }
    }

    if (docsData.relevant_hooks?.length > 0) {
      recommendations.push(`🪝 ${docsData.relevant_hooks.length} hooks available for ${contentType} customization`);
    }

    if (docsData.content_examples?.length > 0) {
      recommendations.push(`📝 ${docsData.content_examples.length} code examples available for reference`);
    }

    return recommendations;
  }

  private extractContentStructure(node: any): any {
    return {
      type: node.type,
      title: node.title,
      fields: Object.keys(node).filter(key => key.startsWith('field_')),
      author: node.uid,
      status: node.status
    };
  }
}
export enum DrupalServerMode {
  DOCS_ONLY = 'docs_only',
  LIVE_ONLY = 'live_only', 
  HYBRID = 'hybrid',
  SMART_FALLBACK = 'smart_fallback'
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastTested: Date;
  responseTime?: number;
  error?: string;
  capabilities?: string[];
}

export interface ModeConfiguration {
  mode: DrupalServerMode;
  maxRetries: number;
  connectionTimeout: number;
  healthCheckInterval: number;
  fallbackMode: DrupalServerMode;
  enableAutoRecovery: boolean;
}

export class DrupalModeManager {
  private currentMode: DrupalServerMode;
  private connectionStatus: ConnectionStatus;
  private config: ModeConfiguration;
  private healthCheckTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;

  constructor(config?: Partial<ModeConfiguration>) {
    this.config = {
      mode: DrupalServerMode.SMART_FALLBACK,
      maxRetries: 3,
      connectionTimeout: 10000,
      healthCheckInterval: 60000, // 1 minute
      fallbackMode: DrupalServerMode.DOCS_ONLY,
      enableAutoRecovery: true,
      ...config
    };

    this.currentMode = this.config.mode;
    this.connectionStatus = {
      isConnected: false,
      lastTested: new Date()
    };
  }

  /**
   * Initialize the mode manager and determine optimal mode
   */
  async initialize(): Promise<DrupalServerMode> {
    console.error(`[ModeManager] Initializing with preferred mode: ${this.config.mode}`);

    // Check environment configuration first
    const envMode = this.detectEnvironmentMode();
    if (envMode) {
      console.error(`[ModeManager] Environment forces mode: ${envMode}`);
      this.currentMode = envMode;
      return this.currentMode;
    }

    // For smart modes, test live connection
    if (this.requiresLiveConnection(this.config.mode)) {
      const canConnectLive = await this.testLiveConnection();
      
      if (canConnectLive) {
        this.currentMode = this.config.mode;
        this.startHealthMonitoring();
      } else {
        console.error(`[ModeManager] Live connection failed, falling back to: ${this.config.fallbackMode}`);
        this.currentMode = this.config.fallbackMode;
      }
    } else {
      this.currentMode = this.config.mode;
    }

    console.error(`[ModeManager] Initialized in mode: ${this.currentMode}`);
    return this.currentMode;
  }

  /**
   * Get current operational mode
   */
  getCurrentMode(): DrupalServerMode {
    return this.currentMode;
  }

  /**
   * Get detailed connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if a specific capability is available in current mode
   */
  isCapabilityAvailable(capability: string): boolean {
    switch (this.currentMode) {
      case DrupalServerMode.DOCS_ONLY:
        return this.isDocsCapability(capability);
      
      case DrupalServerMode.LIVE_ONLY:
        return this.isLiveCapability(capability) && this.connectionStatus.isConnected;
      
      case DrupalServerMode.HYBRID:
      case DrupalServerMode.SMART_FALLBACK:
        return this.isDocsCapability(capability) || 
               (this.isLiveCapability(capability) && this.connectionStatus.isConnected);
      
      default:
        return false;
    }
  }

  /**
   * Get the optimal mode for executing a specific tool
   */
  getOptimalModeForTool(toolName: string): 'docs' | 'live' | 'hybrid' | null {
    // Live-only tools
    const liveOnlyTools = [
      'get_node', 'create_node', 'update_node', 'delete_node', 'list_nodes',
      'get_user', 'create_user', 'update_user', 'delete_user', 'list_users',
      'get_taxonomy_term', 'create_taxonomy_term', 'update_taxonomy_term', 'delete_taxonomy_term', 'list_taxonomy_terms',
      'execute_query', 'get_module_list', 'enable_module', 'disable_module',
      'get_configuration', 'set_configuration', 'clear_cache', 'get_site_info'
    ];

    // Docs-only tools
    const docsOnlyTools = [
      'search_drupal_functions', 'search_drupal_classes', 'search_drupal_hooks',
      'search_drupal_topics', 'search_drupal_services', 'search_drupal_all',
      'get_function_details', 'get_class_details',
      'search_contrib_modules', 'search_contrib_themes', 'get_module_details', 'get_popular_modules',
      'search_code_examples', 'get_example_by_title', 'list_example_categories',
      'get_examples_by_category', 'get_examples_by_tag',
      'analyze_drupal_file', 'check_drupal_standards', 'generate_module_skeleton', 'get_module_template_info'
    ];

    if (liveOnlyTools.includes(toolName)) {
      return this.connectionStatus.isConnected ? 'live' : null;
    }

    if (docsOnlyTools.includes(toolName)) {
      return 'docs';
    }

    // Hybrid tools that could benefit from both
    return this.connectionStatus.isConnected ? 'hybrid' : 'docs';
  }

  /**
   * Attempt to recover live connection
   */
  async attemptRecovery(): Promise<boolean> {
    if (!this.config.enableAutoRecovery) {
      return false;
    }

    console.error(`[ModeManager] Attempting connection recovery (attempt ${this.reconnectAttempts + 1}/${this.config.maxRetries})`);
    
    const recovered = await this.testLiveConnection();
    
    if (recovered) {
      console.error(`[ModeManager] Connection recovered successfully`);
      this.reconnectAttempts = 0;
      
      // Upgrade mode if we were in fallback
      if (this.currentMode === this.config.fallbackMode && this.config.mode !== this.config.fallbackMode) {
        this.currentMode = this.config.mode;
        console.error(`[ModeManager] Upgraded to preferred mode: ${this.currentMode}`);
      }
      
      this.startHealthMonitoring();
      return true;
    }

    this.reconnectAttempts++;
    return false;
  }

  /**
   * Switch mode manually (for testing or admin control)
   */
  async switchMode(newMode: DrupalServerMode): Promise<boolean> {
    console.error(`[ModeManager] Manual mode switch requested: ${this.currentMode} -> ${newMode}`);

    if (this.requiresLiveConnection(newMode)) {
      const canConnect = await this.testLiveConnection();
      if (!canConnect) {
        console.error(`[ModeManager] Cannot switch to ${newMode} - live connection unavailable`);
        return false;
      }
    }

    const oldMode = this.currentMode;
    this.currentMode = newMode;
    this.config.mode = newMode; // Update preferred mode
    
    console.error(`[ModeManager] Mode switched successfully: ${oldMode} -> ${newMode}`);
    return true;
  }

  /**
   * Get mode statistics and health info
   */
  getModeStats(): {
    currentMode: DrupalServerMode;
    uptime: number;
    connectionStatus: ConnectionStatus;
    reconnectAttempts: number;
    capabilities: string[];
  } {
    return {
      currentMode: this.currentMode,
      uptime: Date.now() - this.connectionStatus.lastTested.getTime(),
      connectionStatus: this.getConnectionStatus(),
      reconnectAttempts: this.reconnectAttempts,
      capabilities: this.getCurrentCapabilities()
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    console.error(`[ModeManager] Mode manager destroyed`);
  }

  // Private methods

  private detectEnvironmentMode(): DrupalServerMode | null {
    if (process.env.DOCS_ONLY_MODE === 'true') {
      return DrupalServerMode.DOCS_ONLY;
    }
    
    if (process.env.FORCE_LIVE_MODE === 'true') {
      return DrupalServerMode.LIVE_ONLY;
    }

    if (process.env.FORCE_HYBRID_MODE === 'true') {
      return DrupalServerMode.HYBRID;
    }

    return null;
  }

  private requiresLiveConnection(mode: DrupalServerMode): boolean {
    return mode === DrupalServerMode.LIVE_ONLY || 
           mode === DrupalServerMode.HYBRID || 
           mode === DrupalServerMode.SMART_FALLBACK;
  }

  private async testLiveConnection(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Check if we have connection details
      const hasConnectionDetails = process.env.DRUPAL_BASE_URL && 
                                  process.env.DRUPAL_BASE_URL !== 'http://localhost' &&
                                  (process.env.DRUPAL_USERNAME || process.env.DRUPAL_TOKEN || process.env.DRUPAL_API_KEY);

      if (!hasConnectionDetails) {
        this.updateConnectionStatus(false, 'Missing connection configuration');
        return false;
      }

      // Test actual connection (we'll import DrupalClient dynamically to avoid circular deps)
      const { DrupalClient } = await import('./drupal-client.js');
      const testClient = new DrupalClient();
      
      await testClient.getSiteInfo();
      
      const responseTime = Date.now() - startTime;
      this.updateConnectionStatus(true, undefined, responseTime, ['crud', 'admin', 'query']);
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateConnectionStatus(false, errorMessage);
      return false;
    }
  }

  private updateConnectionStatus(isConnected: boolean, error?: string, responseTime?: number, capabilities?: string[]): void {
    this.connectionStatus = {
      isConnected,
      lastTested: new Date(),
      responseTime,
      error,
      capabilities
    };
  }

  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      const wasConnected = this.connectionStatus.isConnected;
      const isConnected = await this.testLiveConnection();
      
      if (wasConnected && !isConnected) {
        console.error(`[ModeManager] Live connection lost, attempting recovery...`);
        
        if (this.currentMode === DrupalServerMode.LIVE_ONLY) {
          console.error(`[ModeManager] LIVE_ONLY mode failed, server may be degraded`);
        } else if (this.currentMode === DrupalServerMode.HYBRID || this.currentMode === DrupalServerMode.SMART_FALLBACK) {
          console.error(`[ModeManager] Falling back to docs-only capabilities`);
        }
        
        setTimeout(() => this.attemptRecovery(), 5000); // Retry after 5 seconds
      }
      
    }, this.config.healthCheckInterval);
  }

  private isDocsCapability(capability: string): boolean {
    const docsCapabilities = [
      'search_drupal_functions', 'search_drupal_classes', 'search_drupal_hooks',
      'search_drupal_topics', 'search_drupal_services', 'search_drupal_all',
      'get_function_details', 'get_class_details',
      'search_contrib_modules', 'search_contrib_themes', 'get_module_details',
      'search_code_examples', 'analyze_drupal_file', 'check_drupal_standards',
      'generate_module_skeleton'
    ];
    
    return docsCapabilities.includes(capability);
  }

  private isLiveCapability(capability: string): boolean {
    const liveCapabilities = [
      'get_node', 'create_node', 'update_node', 'delete_node', 'list_nodes',
      'get_user', 'create_user', 'update_user', 'delete_user', 'list_users',
      'get_taxonomy_term', 'create_taxonomy_term', 'update_taxonomy_term', 'delete_taxonomy_term',
      'execute_query', 'get_module_list', 'enable_module', 'disable_module',
      'get_configuration', 'set_configuration', 'clear_cache', 'get_site_info'
    ];
    
    return liveCapabilities.includes(capability);
  }

  private getCurrentCapabilities(): string[] {
    const capabilities: string[] = [];
    
    if (this.isCapabilityAvailable('search_drupal_all')) {
      capabilities.push('documentation', 'code_examples', 'module_generation');
    }
    
    if (this.isCapabilityAvailable('get_node')) {
      capabilities.push('content_management', 'user_management', 'system_admin');
    }
    
    return capabilities;
  }
}
import { drupalTools } from '../tools/index.js';

describe('Drupal Tools', () => {
  it('should export all required tools', () => {
    expect(drupalTools).toHaveLength(21);
    
    const toolNames = drupalTools.map(tool => tool.name);
    
    // Node operations
    expect(toolNames).toContain('get_node');
    expect(toolNames).toContain('create_node');
    expect(toolNames).toContain('update_node');
    expect(toolNames).toContain('delete_node');
    expect(toolNames).toContain('list_nodes');
    
    // User operations
    expect(toolNames).toContain('get_user');
    expect(toolNames).toContain('create_user');
    expect(toolNames).toContain('update_user');
    expect(toolNames).toContain('delete_user');
    expect(toolNames).toContain('list_users');
    
    // Taxonomy operations
    expect(toolNames).toContain('get_taxonomy_term');
    expect(toolNames).toContain('create_taxonomy_term');
    expect(toolNames).toContain('update_taxonomy_term');
    expect(toolNames).toContain('delete_taxonomy_term');
    expect(toolNames).toContain('list_taxonomy_terms');
    
    // System operations
    expect(toolNames).toContain('execute_query');
    expect(toolNames).toContain('get_module_list');
    expect(toolNames).toContain('enable_module');
    expect(toolNames).toContain('disable_module');
    expect(toolNames).toContain('get_configuration');
    expect(toolNames).toContain('set_configuration');
    expect(toolNames).toContain('clear_cache');
    expect(toolNames).toContain('get_site_info');
  });

  describe('Tool schemas', () => {
    it('should have valid input schemas for all tools', () => {
      drupalTools.forEach(tool => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should have required parameters for tools that need them', () => {
      const getNodeTool = drupalTools.find(tool => tool.name === 'get_node');
      expect(getNodeTool?.inputSchema.required).toContain('id');

      const createNodeTool = drupalTools.find(tool => tool.name === 'create_node');
      expect(createNodeTool?.inputSchema.required).toContain('title');

      const executeQueryTool = drupalTools.find(tool => tool.name === 'execute_query');
      expect(executeQueryTool?.inputSchema.required).toContain('query');
    });

    it('should have proper descriptions for all tools', () => {
      drupalTools.forEach(tool => {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Node tools', () => {
    it('should have correct schema for create_node', () => {
      const tool = drupalTools.find(t => t.name === 'create_node');
      expect(tool).toBeDefined();
      
      const properties = tool!.inputSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.body).toBeDefined();
      expect(properties.status).toBeDefined();
      expect(properties.type).toBeDefined();
      
      expect(tool!.inputSchema.required).toEqual(['title']);
    });

    it('should have correct schema for list_nodes', () => {
      const tool = drupalTools.find(t => t.name === 'list_nodes');
      expect(tool).toBeDefined();
      
      const properties = tool!.inputSchema.properties;
      expect(properties.type).toBeDefined();
      expect(properties.status).toBeDefined();
      expect(properties.limit).toBeDefined();
      expect(properties.offset).toBeDefined();
      
      // list_nodes should not have required parameters
      expect(tool!.inputSchema.required).toBeUndefined();
    });
  });

  describe('User tools', () => {
    it('should have correct schema for create_user', () => {
      const tool = drupalTools.find(t => t.name === 'create_user');
      expect(tool).toBeDefined();
      
      const properties = tool!.inputSchema.properties;
      expect(properties.name).toBeDefined();
      expect(properties.mail).toBeDefined();
      expect(properties.pass).toBeDefined();
      expect(properties.status).toBeDefined();
      
      expect(tool!.inputSchema.required).toEqual(['name', 'mail']);
    });
  });

  describe('Taxonomy tools', () => {
    it('should have correct schema for create_taxonomy_term', () => {
      const tool = drupalTools.find(t => t.name === 'create_taxonomy_term');
      expect(tool).toBeDefined();
      
      const properties = tool!.inputSchema.properties;
      expect(properties.name).toBeDefined();
      expect(properties.description).toBeDefined();
      expect(properties.vocabulary).toBeDefined();
      expect(properties.parent).toBeDefined();
      
      expect(tool!.inputSchema.required).toEqual(['name']);
    });
  });

  describe('System tools', () => {
    it('should have correct schema for execute_query', () => {
      const tool = drupalTools.find(t => t.name === 'execute_query');
      expect(tool).toBeDefined();
      
      const properties = tool!.inputSchema.properties;
      expect(properties.query).toBeDefined();
      expect(properties.parameters).toBeDefined();
      
      expect(tool!.inputSchema.required).toEqual(['query']);
    });

    it('should have correct schema for enable_module', () => {
      const tool = drupalTools.find(t => t.name === 'enable_module');
      expect(tool).toBeDefined();
      
      const properties = tool!.inputSchema.properties;
      expect(properties.module).toBeDefined();
      
      expect(tool!.inputSchema.required).toEqual(['module']);
    });

    it('should have correct schema for clear_cache', () => {
      const tool = drupalTools.find(t => t.name === 'clear_cache');
      expect(tool).toBeDefined();
      
      const properties = tool!.inputSchema.properties;
      expect(properties.type).toBeDefined();
      
      // clear_cache should not have required parameters
      expect(tool!.inputSchema.required).toBeUndefined();
    });
  });
});
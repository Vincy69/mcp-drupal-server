import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

const DrupalConfigSchema = z.object({
  baseUrl: z.string().url(),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  apiKey: z.string().optional(),
});

type DrupalConfig = z.infer<typeof DrupalConfigSchema>;

export class DrupalClient {
  private client: AxiosInstance;
  private config: DrupalConfig;

  constructor(config?: DrupalConfig) {
    this.config = config || {
      baseUrl: process.env.DRUPAL_BASE_URL || 'http://localhost',
      username: process.env.DRUPAL_USERNAME,
      password: process.env.DRUPAL_PASSWORD,
      token: process.env.DRUPAL_TOKEN,
      apiKey: process.env.DRUPAL_API_KEY,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupAuthentication();
  }

  private setupAuthentication() {
    if (this.config.token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.config.token}`;
    } else if (this.config.apiKey) {
      this.client.defaults.headers.common['X-API-Key'] = this.config.apiKey;
    } else if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      this.client.defaults.headers.common['Authorization'] = `Basic ${auth}`;
    }
  }

  // Node operations
  async getNode(id: string) {
    const response = await this.client.get(`/jsonapi/node/article/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async createNode(nodeData: any) {
    const response = await this.client.post('/jsonapi/node/article', {
      data: {
        type: 'node--article',
        attributes: nodeData,
      },
    });
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async updateNode(id: string, nodeData: any) {
    const response = await this.client.patch(`/jsonapi/node/article/${id}`, {
      data: {
        type: 'node--article',
        id,
        attributes: nodeData,
      },
    });
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async deleteNode(id: string) {
    await this.client.delete(`/jsonapi/node/article/${id}`);
    return { content: [{ type: "text", text: `Node ${id} deleted successfully` }] };
  }

  async listNodes(filters?: any) {
    let url = '/jsonapi/node/article';
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(`filter[${key}]`, String(value));
      });
      url += `?${params.toString()}`;
    }
    const response = await this.client.get(url);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  // User operations
  async getUser(id: string) {
    const response = await this.client.get(`/jsonapi/user/user/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async createUser(userData: any) {
    const response = await this.client.post('/jsonapi/user/user', {
      data: {
        type: 'user--user',
        attributes: userData,
      },
    });
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async updateUser(id: string, userData: any) {
    const response = await this.client.patch(`/jsonapi/user/user/${id}`, {
      data: {
        type: 'user--user',
        id,
        attributes: userData,
      },
    });
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async deleteUser(id: string) {
    await this.client.delete(`/jsonapi/user/user/${id}`);
    return { content: [{ type: "text", text: `User ${id} deleted successfully` }] };
  }

  async listUsers(filters?: any) {
    let url = '/jsonapi/user/user';
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(`filter[${key}]`, String(value));
      });
      url += `?${params.toString()}`;
    }
    const response = await this.client.get(url);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  // Taxonomy operations
  async getTaxonomyTerm(id: string) {
    const response = await this.client.get(`/jsonapi/taxonomy_term/tags/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async createTaxonomyTerm(termData: any) {
    const response = await this.client.post('/jsonapi/taxonomy_term/tags', {
      data: {
        type: 'taxonomy_term--tags',
        attributes: termData,
      },
    });
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async updateTaxonomyTerm(id: string, termData: any) {
    const response = await this.client.patch(`/jsonapi/taxonomy_term/tags/${id}`, {
      data: {
        type: 'taxonomy_term--tags',
        id,
        attributes: termData,
      },
    });
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async deleteTaxonomyTerm(id: string) {
    await this.client.delete(`/jsonapi/taxonomy_term/tags/${id}`);
    return { content: [{ type: "text", text: `Taxonomy term ${id} deleted successfully` }] };
  }

  async listTaxonomyTerms(filters?: any) {
    let url = '/jsonapi/taxonomy_term/tags';
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(`filter[${key}]`, String(value));
      });
      url += `?${params.toString()}`;
    }
    const response = await this.client.get(url);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  // Database operations
  async executeQuery(query: string, parameters?: any) {
    try {
      const response = await this.client.post('/api/database/query', {
        query,
        parameters,
      });
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Database query failed: ${error}` }] };
    }
  }

  // Module management
  async getModuleList() {
    const response = await this.client.get('/api/modules');
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async enableModule(moduleName: string) {
    const response = await this.client.post(`/api/modules/${moduleName}/enable`);
    return { content: [{ type: "text", text: `Module ${moduleName} enabled: ${JSON.stringify(response.data)}` }] };
  }

  async disableModule(moduleName: string) {
    const response = await this.client.post(`/api/modules/${moduleName}/disable`);
    return { content: [{ type: "text", text: `Module ${moduleName} disabled: ${JSON.stringify(response.data)}` }] };
  }

  // Configuration management
  async getConfiguration(configName: string) {
    const response = await this.client.get(`/api/config/${configName}`);
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  async setConfiguration(configName: string, value: any) {
    const response = await this.client.put(`/api/config/${configName}`, { value });
    return { content: [{ type: "text", text: `Configuration ${configName} updated: ${JSON.stringify(response.data)}` }] };
  }

  // Cache management
  async clearCache(cacheType?: string) {
    const endpoint = cacheType ? `/api/cache/clear/${cacheType}` : '/api/cache/clear';
    const response = await this.client.post(endpoint);
    return { content: [{ type: "text", text: `Cache cleared: ${JSON.stringify(response.data)}` }] };
  }

  // Site information
  async getSiteInfo() {
    const response = await this.client.get('/api/site/info');
    return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
  }

  // Helper methods for resources
  async getAllEntities() {
    try {
      const [nodes, users, terms] = await Promise.all([
        this.client.get('/jsonapi/node/article'),
        this.client.get('/jsonapi/user/user'),
        this.client.get('/jsonapi/taxonomy_term/tags'),
      ]);
      
      return {
        nodes: nodes.data,
        users: users.data,
        taxonomyTerms: terms.data,
      };
    } catch (error) {
      return { error: `Failed to fetch entities: ${error}` };
    }
  }

  async getSystemConfiguration() {
    try {
      const response = await this.client.get('/api/config/system');
      return response.data;
    } catch (error) {
      return { error: `Failed to fetch system configuration: ${error}` };
    }
  }
}
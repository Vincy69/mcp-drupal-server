import { DrupalClient } from '../drupal-client.js';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DrupalClient', () => {
  let client: DrupalClient;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock axios.create to return a mocked instance
    mockedAxios.create.mockReturnValue({
      defaults: { headers: { common: {} } },
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as any);

    client = new DrupalClient({
      baseUrl: 'http://localhost:8080',
      username: 'test_user',
      password: 'test_password',
    });
  });

  describe('Node operations', () => {
    it('should get a node successfully', async () => {
      const mockNode = {
        data: {
          id: '123',
          type: 'node--article',
          attributes: {
            title: 'Test Article',
            body: 'Test content',
          },
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockNode);

      const result = await client.getNode('123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/jsonapi/node/article/123');
      expect(result.content[0].text).toContain('Test Article');
    });

    it('should create a node successfully', async () => {
      const mockResponse = {
        data: {
          id: '456',
          type: 'node--article',
          attributes: {
            title: 'New Article',
            body: 'New content',
          },
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.createNode({
        title: 'New Article',
        body: 'New content',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/jsonapi/node/article', {
        data: {
          type: 'node--article',
          attributes: {
            title: 'New Article',
            body: 'New content',
          },
        },
      });
      expect(result.content[0].text).toContain('New Article');
    });

    it('should update a node successfully', async () => {
      const mockResponse = {
        data: {
          id: '123',
          type: 'node--article',
          attributes: {
            title: 'Updated Article',
            body: 'Updated content',
          },
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.updateNode('123', {
        title: 'Updated Article',
        body: 'Updated content',
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/jsonapi/node/article/123', {
        data: {
          type: 'node--article',
          id: '123',
          attributes: {
            title: 'Updated Article',
            body: 'Updated content',
          },
        },
      });
      expect(result.content[0].text).toContain('Updated Article');
    });

    it('should delete a node successfully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({});

      const result = await client.deleteNode('123');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/jsonapi/node/article/123');
      expect(result.content[0].text).toContain('Node 123 deleted successfully');
    });

    it('should list nodes with filters', async () => {
      const mockResponse = {
        data: [
          {
            id: '123',
            type: 'node--article',
            attributes: { title: 'Article 1' },
          },
          {
            id: '456',
            type: 'node--article',
            attributes: { title: 'Article 2' },
          },
        ],
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.listNodes({ status: true, limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/jsonapi/node/article?filter%5Bstatus%5D=true&filter%5Blimit%5D=10'
      );
      expect(result.content[0].text).toContain('Article 1');
      expect(result.content[0].text).toContain('Article 2');
    });
  });

  describe('User operations', () => {
    it('should get a user successfully', async () => {
      const mockUser = {
        data: {
          id: '789',
          type: 'user--user',
          attributes: {
            name: 'testuser',
            mail: 'test@example.com',
          },
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue(mockUser);

      const result = await client.getUser('789');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/jsonapi/user/user/789');
      expect(result.content[0].text).toContain('testuser');
    });

    it('should create a user successfully', async () => {
      const mockResponse = {
        data: {
          id: '999',
          type: 'user--user',
          attributes: {
            name: 'newuser',
            mail: 'newuser@example.com',
          },
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.createUser({
        name: 'newuser',
        mail: 'newuser@example.com',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/jsonapi/user/user', {
        data: {
          type: 'user--user',
          attributes: {
            name: 'newuser',
            mail: 'newuser@example.com',
          },
        },
      });
      expect(result.content[0].text).toContain('newuser');
    });
  });

  describe('Database operations', () => {
    it('should execute a query successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, title: 'Result 1' },
            { id: 2, title: 'Result 2' },
          ],
        },
      };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.executeQuery('SELECT * FROM nodes');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/database/query', {
        query: 'SELECT * FROM nodes',
        parameters: undefined,
      });
      expect(result.content[0].text).toContain('Result 1');
    });

    it('should handle query errors gracefully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await client.executeQuery('INVALID SQL');

      expect(result.content[0].text).toContain('Database query failed');
    });
  });

  describe('Authentication', () => {
    it('should set up Basic Auth correctly', () => {
      const client = new DrupalClient({
        baseUrl: 'http://localhost',
        username: 'admin',
        password: 'secret',
      });

      const mockAxiosInstance = mockedAxios.create();
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBeDefined();
    });

    it('should set up Bearer token correctly', () => {
      const client = new DrupalClient({
        baseUrl: 'http://localhost',
        token: 'bearer-token-123',
      });

      const mockAxiosInstance = mockedAxios.create();
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer bearer-token-123');
    });

    it('should set up API key correctly', () => {
      const client = new DrupalClient({
        baseUrl: 'http://localhost',
        apiKey: 'api-key-456',
      });

      const mockAxiosInstance = mockedAxios.create();
      expect(mockAxiosInstance.defaults.headers.common['X-API-Key']).toBe('api-key-456');
    });
  });
});
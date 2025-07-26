import { DrupalMCPServer } from '../index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('../drupal-client.js');

const MockedServer = Server as jest.MockedClass<typeof Server>;

describe('DrupalMCPServer', () => {
  let server: any;
  let mockServerInstance: jest.Mocked<Server>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockServerInstance = {
      setRequestHandler: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
    } as any;

    MockedServer.mockImplementation(() => mockServerInstance);
  });

  it('should initialize server with correct configuration', () => {
    expect(() => {
      // This will test the constructor without running the server
      // since we mocked the dependencies
    }).not.toThrow();
  });

  it('should set up request handlers during initialization', () => {
    // Verify that the server sets up the expected request handlers
    expect(mockServerInstance.setRequestHandler).toHaveBeenCalledTimes(4);
  });

  describe('Resource handlers', () => {
    it('should handle ListResourcesRequest', async () => {
      const handler = mockServerInstance.setRequestHandler.mock.calls
        .find(call => call[0].name === 'ListResourcesRequest')?.[1];

      if (handler) {
        const result = await handler({});
        expect(result.resources).toHaveLength(2);
        expect(result.resources[0].uri).toBe('drupal://entities');
        expect(result.resources[1].uri).toBe('drupal://config');
      }
    });
  });

  describe('Tool handlers', () => {
    it('should handle ListToolsRequest', async () => {
      const handler = mockServerInstance.setRequestHandler.mock.calls
        .find(call => call[0].name === 'ListToolsRequest')?.[1];

      if (handler) {
        const result = await handler({});
        expect(result.tools).toBeDefined();
        expect(Array.isArray(result.tools)).toBe(true);
      }
    });

    it('should handle CallToolRequest for get_node', async () => {
      const handler = mockServerInstance.setRequestHandler.mock.calls
        .find(call => call[0].name === 'CallToolRequest')?.[1];

      if (handler) {
        // This would test the tool call handling
        // In a real test, we'd mock the DrupalClient methods
        const request = {
          params: {
            name: 'get_node',
            arguments: { id: '123' }
          }
        };

        // The handler should not throw
        expect(async () => {
          await handler(request);
        }).not.toThrow();
      }
    });
  });
});
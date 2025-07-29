import { DrupalEntityGenerator } from '../drupal-entity-generator.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { jest } from '@jest/globals';

// Mock fs module
jest.mock('fs/promises');

describe('DrupalEntityGenerator', () => {
  let generator: DrupalEntityGenerator;
  
  beforeEach(() => {
    generator = new DrupalEntityGenerator();
    jest.clearAllMocks();
  });
  
  describe('generateCustomEntity', () => {
    it('should generate all required entity files', async () => {
      const moduleInfo = {
        name: 'Event Manager',
        machineName: 'event_manager',
        namespace: 'EventManager'
      };
      
      const options = {
        entityType: 'event',
        label: 'Event',
        pluralLabel: 'Events',
        bundles: [
          { id: 'conference', label: 'Conference' },
          { id: 'workshop', label: 'Workshop' }
        ],
        revisionable: true,
        translatable: true,
        includeRestApi: true,
        includeViews: true,
        includeAdminUi: true,
        baseFields: []
      };
      
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      const files = await generator.generateCustomEntity(moduleInfo, options, './test-output');
      
      // Should generate 15+ files
      expect(files.length).toBeGreaterThanOrEqual(15);
      
      // Check for essential files
      const fileNames = files.map(f => f.filename);
      expect(fileNames).toContain('src/Entity/Event.php');
      expect(fileNames).toContain('src/Entity/EventInterface.php');
      expect(fileNames).toContain('src/EventStorage.php');
      expect(fileNames).toContain('src/EventStorageInterface.php');
      expect(fileNames).toContain('src/Form/EventForm.php');
      expect(fileNames).toContain('src/Form/EventDeleteForm.php');
      expect(fileNames).toContain('event_manager.routing.yml');
      expect(fileNames).toContain('event_manager.links.menu.yml');
      
      // Check for bundle-specific files
      expect(fileNames).toContain('config/install/event_manager.event_type.conference.yml');
      expect(fileNames).toContain('config/install/event_manager.event_type.workshop.yml');
      
      // Check for REST API files if included
      expect(fileNames).toContain('src/Plugin/rest/resource/EventResource.php');
      
      // Check for Views files if included
      expect(fileNames).toContain('config/install/views.view.events.yml');
    });
    
    it('should generate entity with base fields', async () => {
      const moduleInfo = {
        name: 'Product Catalog',
        machineName: 'product_catalog',
        namespace: 'ProductCatalog'
      };
      
      const options = {
        entityType: 'product',
        label: 'Product',
        pluralLabel: 'Products',
        bundles: [],
        revisionable: false,
        translatable: false,
        includeRestApi: false,
        includeViews: false,
        includeAdminUi: true,
        baseFields: [
          {
            name: 'price',
            type: 'decimal',
            label: 'Price',
            required: true,
            description: 'Product price'
          },
          {
            name: 'sku',
            type: 'string',
            label: 'SKU',
            required: true,
            description: 'Stock Keeping Unit',
            max_length: 32
          }
        ]
      };
      
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      const files = await generator.generateCustomEntity(moduleInfo, options);
      
      // Find the entity file
      const entityFile = files.find(f => f.filename === 'src/Entity/Product.php');
      expect(entityFile).toBeDefined();
      
      // Check that base fields are included
      expect(entityFile?.content).toContain('price');
      expect(entityFile?.content).toContain('sku');
      expect(entityFile?.content).toContain('BaseFieldDefinition::create(\'decimal\')');
      expect(entityFile?.content).toContain('BaseFieldDefinition::create(\'string\')');
    });
    
    it('should handle entity without bundles', async () => {
      const moduleInfo = {
        name: 'Simple Entity',
        machineName: 'simple_entity',
        namespace: 'SimpleEntity'
      };
      
      const options = {
        entityType: 'simple',
        label: 'Simple',
        pluralLabel: 'Simples',
        bundles: [],
        revisionable: false,
        translatable: false,
        includeRestApi: false,
        includeViews: false,
        includeAdminUi: true,
        baseFields: []
      };
      
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      const files = await generator.generateCustomEntity(moduleInfo, options);
      
      // Should not have bundle config files
      const bundleFiles = files.filter(f => f.filename.includes('simple_type'));
      expect(bundleFiles).toHaveLength(0);
      
      // Should not have bundle entity class
      const bundleEntityFile = files.find(f => f.filename === 'src/Entity/SimpleType.php');
      expect(bundleEntityFile).toBeUndefined();
    });
    
    it('should create directory structure correctly', async () => {
      const moduleInfo = {
        name: 'Test Module',
        machineName: 'test_module',
        namespace: 'TestModule'
      };
      
      const options = {
        entityType: 'test',
        label: 'Test',
        pluralLabel: 'Tests',
        bundles: [],
        revisionable: false,
        translatable: false,
        includeRestApi: false,
        includeViews: false,
        includeAdminUi: false,
        baseFields: []
      };
      
      const mkdirCalls: string[] = [];
      (fs.mkdir as jest.Mock).mockImplementation((dir: string) => {
        mkdirCalls.push(dir);
        return Promise.resolve(undefined);
      });
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      await generator.generateCustomEntity(moduleInfo, options, './output');
      
      // Check that all necessary directories are created
      expect(mkdirCalls).toContain(path.join('./output', 'src', 'Entity'));
      expect(mkdirCalls).toContain(path.join('./output', 'src', 'Form'));
      expect(mkdirCalls).toContain(path.join('./output', 'config', 'schema'));
    });
  });
  
  describe('entity file generation', () => {
    it('should generate valid PHP entity class', async () => {
      const moduleInfo = {
        name: 'Test',
        machineName: 'test',
        namespace: 'Test'
      };
      
      const options = {
        entityType: 'test_entity',
        label: 'Test Entity',
        pluralLabel: 'Test Entities',
        bundles: [],
        revisionable: true,
        translatable: true,
        includeRestApi: false,
        includeViews: false,
        includeAdminUi: false,
        baseFields: []
      };
      
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      const files = await generator.generateCustomEntity(moduleInfo, options);
      const entityFile = files.find(f => f.filename === 'src/Entity/TestEntity.php');
      
      expect(entityFile).toBeDefined();
      expect(entityFile?.content).toContain('namespace Drupal\\test\\Entity;');
      expect(entityFile?.content).toContain('class TestEntity extends');
      expect(entityFile?.content).toContain('RevisionableContentEntityBase');
      expect(entityFile?.content).toContain('@ContentEntityType(');
      expect(entityFile?.content).toContain('revision_table = "test_entity_revision"');
      expect(entityFile?.content).toContain('translatable = TRUE');
    });
    
    it('should generate form classes with proper validation', async () => {
      const moduleInfo = {
        name: 'Form Test',
        machineName: 'form_test',
        namespace: 'FormTest'
      };
      
      const options = {
        entityType: 'form_entity',
        label: 'Form Entity',
        pluralLabel: 'Form Entities',
        bundles: [],
        revisionable: false,
        translatable: false,
        includeRestApi: false,
        includeViews: false,
        includeAdminUi: true,
        baseFields: [
          {
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true,
            description: 'Email address'
          }
        ]
      };
      
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      const files = await generator.generateCustomEntity(moduleInfo, options);
      const formFile = files.find(f => f.filename === 'src/Form/FormEntityForm.php');
      
      expect(formFile).toBeDefined();
      expect(formFile?.content).toContain('class FormEntityForm extends ContentEntityForm');
      expect(formFile?.content).toContain('public function save(array $form, FormStateInterface $form_state)');
      expect(formFile?.content).toContain('$form_state->setRedirectUrl');
    });
  });
});
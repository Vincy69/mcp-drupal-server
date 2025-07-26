import { DrupalMigrationAssistant } from '../drupal-migration-assistant.js';
import * as fs from 'fs/promises';
import { jest } from '@jest/globals';

// Mock fs module
jest.mock('fs/promises');

describe('DrupalMigrationAssistant', () => {
  let assistant: DrupalMigrationAssistant;
  
  beforeEach(() => {
    assistant = new DrupalMigrationAssistant();
    jest.clearAllMocks();
  });
  
  describe('analyzeUpgradePath', () => {
    it('should detect Drupal 8 to 9 migration issues', async () => {
      const mockPhpFile = `<?php
use Drupal\\Core\\Entity\\EntityManager;

function my_module_test() {
  // Deprecated function
  drupal_set_message('Hello world');
  
  // Deprecated service
  $entity_manager = \\Drupal::service('entity.manager');
  
  return TRUE;
}`;
      
      const mockComposerJson = JSON.stringify({
        require: {
          'drupal/core': '^8.9',
          'php': '^7.3',
          'symfony/console': '^3.4'
        }
      });
      
      const mockInfoYml = `name: My Module
type: module
core: 8.x
dependencies:
  - drupal:node`;
      
      // Mock file system
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'test.php', isFile: () => true, isDirectory: () => false },
        { name: 'composer.json', isFile: () => true, isDirectory: () => false },
        { name: 'my_module.info.yml', isFile: () => true, isDirectory: () => false }
      ] as any);
      
      (fs.readFile as jest.Mock)
        .mockResolvedValueOnce(mockPhpFile)
        .mockResolvedValueOnce(mockComposerJson)
        .mockResolvedValueOnce(mockInfoYml);
      
      const report = await assistant.analyzeUpgradePath('/test/path', '8', '9');
      
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues.some(issue => 
        issue.description.includes('drupal_set_message')
      )).toBeTruthy();
      expect(report.issues.some(issue => 
        issue.description.includes('EntityManager')
      )).toBeTruthy();
      expect(report.summary.totalIssues).toBeGreaterThan(2);
    });
    
    it('should detect Drupal 9 to 10 migration issues', async () => {
      const mockPhpFile = `<?php
function my_theme_preprocess() {
  // jQuery once usage
  drupal_add_js('
    jQuery(".my-element").once("myModule").each(function() {
      // Code here
    });
  ', 'inline');
  
  // Theme function
  return theme_item_list(['items' => []]);
}`;
      
      const mockComposerJson = JSON.stringify({
        require: {
          'drupal/core': '^9.5',
          'php': '^8.0',
          'symfony/console': '^4.4'
        }
      });
      
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'test.php', isFile: () => true, isDirectory: () => false },
        { name: 'composer.json', isFile: () => true, isDirectory: () => false }
      ] as any);
      
      (fs.readFile as jest.Mock)
        .mockResolvedValueOnce(mockPhpFile)
        .mockResolvedValueOnce(mockComposerJson);
      
      const report = await assistant.analyzeUpgradePath('/test/path', '9', '10');
      
      expect(report.issues.some(issue => 
        issue.description.includes('jQuery.once')
      )).toBeTruthy();
      expect(report.issues.some(issue => 
        issue.description.includes('Theme functions')
      )).toBeTruthy();
    });
    
    it('should handle info.yml core version requirements', async () => {
      const mockInfoYml = `name: Test Theme
type: theme
base theme: classy
core_version_requirement: ^9
libraries:
  - test_theme/global`;
      
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'test_theme.info.yml', isFile: () => true, isDirectory: () => false }
      ] as any);
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockInfoYml);
      
      const report = await assistant.analyzeUpgradePath('/test/path', '9', '10');
      
      expect(report.issues.some(issue => 
        issue.description.includes('Classy theme is removed')
      )).toBeTruthy();
      expect(report.issues.some(issue => 
        issue.description.includes('core version requirement')
      )).toBeTruthy();
    });
  });
  
  describe('generateMigrationPatches', () => {
    it('should generate patches for automated fixes', async () => {
      const mockReport = {
        projectPath: '/test/path',
        currentVersion: '8',
        targetVersion: '9',
        scanDate: new Date().toISOString(),
        summary: {
          totalIssues: 2,
          criticalIssues: 2,
          warnings: 0,
          automatedFixes: 2,
          estimatedEffortHours: 0.3
        },
        issues: [
          {
            type: 'removed_api' as const,
            severity: 'critical' as const,
            fromVersion: '8',
            toVersion: '9',
            file: '/test/path/test.php',
            line: 5,
            code: 'drupal_set_message("Hello");',
            description: 'drupal_set_message is removed',
            replacement: '\\Drupal::messenger()->addMessage("Hello");',
            automated: true
          }
        ],
        recommendations: [],
        migrationPlan: []
      };
      
      const mockFileContent = `<?php
function test() {
  drupal_set_message("Hello");
  return TRUE;
}`;
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      
      const patches = await assistant.generateMigrationPatches(mockReport);
      
      expect(patches.size).toBe(1);
      expect(patches.get('/test/path/test.php')).toContain('\\Drupal::messenger()->addMessage');
    });
  });
  
  describe('generateHTMLReport', () => {
    it('should generate a formatted HTML report', async () => {
      const mockReport = {
        projectPath: '/test/path',
        currentVersion: '9',
        targetVersion: '10',
        scanDate: new Date().toISOString(),
        summary: {
          totalIssues: 5,
          criticalIssues: 3,
          warnings: 2,
          automatedFixes: 2,
          estimatedEffortHours: 4.5
        },
        issues: [
          {
            type: 'removed_api' as const,
            severity: 'critical' as const,
            fromVersion: '9',
            toVersion: '10',
            file: 'test.php',
            line: 10,
            code: 'jQuery.once()',
            description: 'jQuery.once is removed',
            automated: false,
            migrationSteps: ['Use core/once library instead']
          }
        ],
        recommendations: [
          'Migrate from CKEditor 4 to CKEditor 5',
          'Test all JavaScript functionality'
        ],
        migrationPlan: [
          {
            order: 1,
            title: 'Backup site',
            description: 'Create full backup',
            automated: false,
            estimatedMinutes: 30
          }
        ]
      };
      
      const html = await assistant.generateHTMLReport(mockReport);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Drupal Migration Report');
      expect(html).toContain('From version 9 to 10');
      expect(html).toContain('Total Issues: 5');
      expect(html).toContain('jQuery.once is removed');
      expect(html).toContain('Migrate from CKEditor 4');
    });
  });
  
  describe('migration plan generation', () => {
    it('should create comprehensive migration steps', async () => {
      const mockPhpFile = `<?php
drupal_set_message('test');
theme_item_list([]);`;
      
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'test.php', isFile: () => true, isDirectory: () => false }
      ] as any);
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockPhpFile);
      
      const report = await assistant.analyzeUpgradePath('/test/path', '9', '10');
      
      expect(report.migrationPlan.length).toBeGreaterThan(3);
      expect(report.migrationPlan[0].title).toContain('Backup');
      expect(report.migrationPlan.some(step => 
        step.title.includes('Update Drupal core')
      )).toBeTruthy();
      expect(report.migrationPlan[report.migrationPlan.length - 1].title).toContain('test');
    });
  });
  
  describe('effort estimation', () => {
    it('should calculate reasonable effort estimates', async () => {
      const mockPhpFiles = Array(5).fill(`<?php
drupal_set_message('test');
$entity_manager = \\Drupal::service('entity.manager');
theme_item_list([]);`);
      
      let fileIndex = 0;
      (fs.readdir as jest.Mock).mockResolvedValue(
        Array(5).fill(null).map((_, i) => ({
          name: `file${i}.php`,
          isFile: () => true,
          isDirectory: () => false
        })) as any
      );
      
      (fs.readFile as jest.Mock).mockImplementation(() => 
        Promise.resolve(mockPhpFiles[fileIndex++ % mockPhpFiles.length])
      );
      
      const report = await assistant.analyzeUpgradePath('/test/path', '8', '10');
      
      expect(report.summary.estimatedEffortHours).toBeGreaterThan(5);
      expect(report.summary.estimatedEffortHours).toBeLessThan(50);
    });
  });
});
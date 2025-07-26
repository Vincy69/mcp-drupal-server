import { DrupalCodeAnalyzerV2 } from '../drupal-code-analyzer-v2.js';
import * as fs from 'fs/promises';
import { jest } from '@jest/globals';

// Mock fs module
jest.mock('fs/promises');

describe('DrupalCodeAnalyzerV2', () => {
  let analyzer: DrupalCodeAnalyzerV2;
  
  beforeEach(() => {
    analyzer = new DrupalCodeAnalyzerV2();
    jest.clearAllMocks();
  });
  
  describe('analyzeAdvanced', () => {
    it('should analyze a well-structured Drupal file', async () => {
      const mockFileContent = `<?php
namespace Drupal\\my_module\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;

/**
 * Provides a test controller.
 */
class TestController extends ControllerBase {
  
  /**
   * The entity type manager.
   *
   * @var \\Drupal\\Core\\Entity\\EntityTypeManagerInterface
   */
  protected $entityTypeManager;
  
  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager')
    );
  }
  
  /**
   * Constructs a TestController object.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager) {
    $this->entityTypeManager = $entity_type_manager;
  }
  
  /**
   * Returns a render array.
   */
  public function content() {
    $nodes = $this->entityTypeManager
      ->getStorage('node')
      ->loadMultiple();
    
    return [
      '#theme' => 'item_list',
      '#items' => array_map(function($node) {
        return $node->label();
      }, $nodes),
    ];
  }
}`;
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      
      const result = await analyzer.analyzeAdvanced('test.php');
      
      expect(result.qualityScore).toBeGreaterThan(70);
      expect(result.performanceIssues).toHaveLength(0);
      expect(result.securityScore.overall).toBeGreaterThan(80);
      expect(result.bestPractices.some((bp: any) => bp.followed)).toBeTruthy();
    });
    
    it('should detect performance issues', async () => {
      const mockFileContent = `<?php
function bad_performance() {
  // Loading all nodes - performance issue
  $nodes = \\Drupal::entityTypeManager()
    ->getStorage('node')
    ->loadMultiple();
  
  // Nested loops - performance issue
  foreach ($nodes as $node) {
    foreach ($node->field_tags as $tag) {
      // Database query in loop
      $result = \\Drupal::database()->query('SELECT * FROM {users} WHERE uid = :uid', [
        ':uid' => $node->getOwnerId()
      ])->fetchAll();
    }
  }
  
  return $nodes;
}`;
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      
      const result = await analyzer.analyzeAdvanced('bad_performance.php');
      
      expect(result.performanceIssues.length).toBeGreaterThan(0);
      expect(result.performanceIssues.some(issue => 
        issue.type === 'database_query_in_loop'
      )).toBeTruthy();
      expect(result.qualityScore).toBeLessThan(50);
    });
    
    it('should detect security issues', async () => {
      const mockFileContent = `<?php
function security_issues() {
  // SQL injection vulnerability
  $uid = $_GET['uid'];
  $result = \\Drupal::database()->query(
    "SELECT * FROM {users} WHERE uid = $uid"
  );
  
  // Direct superglobal usage
  $name = $_POST['name'];
  
  // Unsafe output
  print $name;
  
  return $result;
}`;
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      
      const result = await analyzer.analyzeAdvanced('security_issues.php');
      
      expect(result.securityScore.overall).toBeLessThan(50);
      expect(result.securityScore.issues.some(issue => 
        issue.type === 'sql_injection'
      )).toBeTruthy();
      expect(result.securityScore.issues.some(issue => 
        issue.type === 'direct_superglobal'
      )).toBeTruthy();
    });
    
    it('should detect deprecations', async () => {
      const mockFileContent = `<?php
function deprecated_code() {
  // Deprecated function
  drupal_set_message('This is deprecated');
  
  // Deprecated service
  $entity_manager = \\Drupal::service('entity.manager');
  
  // Old jQuery once usage
  \$('.my-element').once('myModule');
  
  return TRUE;
}`;
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      
      const result = await analyzer.analyzeAdvanced('deprecated.php');
      
      expect(result.deprecations.length).toBeGreaterThan(0);
      expect(result.deprecations.some(dep => 
        dep.deprecated === 'drupal_set_message'
      )).toBeTruthy();
      expect(result.deprecations.some(dep => 
        dep.replacement?.includes('messenger()')
      )).toBeTruthy();
    });
    
    it('should provide refactoring suggestions', async () => {
      const mockFileContent = `<?php
class LongController {
  // Method with too many parameters
  public function complexMethod($a, $b, $c, $d, $e, $f, $g) {
    // Very long method
    if ($a) {
      if ($b) {
        if ($c) {
          // Deep nesting
          if ($d) {
            // Complex logic
            $result = $e + $f + $g;
          }
        }
      }
    }
    
    // Duplicate code
    $nodes = \\Drupal::entityTypeManager()->getStorage('node')->loadMultiple();
    
    // More duplicate code
    $users = \\Drupal::entityTypeManager()->getStorage('user')->loadMultiple();
    
    return $result;
  }
}`;
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      
      const result = await analyzer.analyzeAdvanced('refactor.php');
      
      expect(result.refactoringSuggestions.length).toBeGreaterThan(0);
      expect(result.refactoringSuggestions.some(sug => 
        sug.type === 'extract_method'
      )).toBeTruthy();
      expect(result.refactoringSuggestions.some(sug => 
        sug.type === 'reduce_parameters'
      )).toBeTruthy();
    });
    
    it('should calculate code metrics', async () => {
      const mockFileContent = `<?php
/**
 * @file
 * Contains test module functions.
 */

/**
 * Test function with documentation.
 *
 * @param string $param
 *   The parameter.
 *
 * @return array
 *   The result array.
 */
function test_function($param) {
  // This is a comment
  if ($param) {
    return ['result' => TRUE];
  }
  else {
    return ['result' => FALSE];
  }
}`;
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      
      const result = await analyzer.analyzeAdvanced('metrics.php');
      
      expect(result.metrics.linesOfCode).toBeGreaterThan(0);
      expect(result.metrics.commentRatio).toBeGreaterThan(0.2);
      expect(result.metrics.cyclomaticComplexity).toBeLessThan(5);
    });
  });
  
  describe('generateQualityReport', () => {
    it('should generate a comprehensive quality report', async () => {
      const mockAnalysis = {
        file: 'test.php',
        qualityScore: 85,
        performanceIssues: [],
        securityScore: {
          overall: 90,
          issues: []
        },
        refactoringSuggestions: [],
        deprecations: [],
        bestPractices: [
          { practice: 'Dependency injection', followed: true },
          { practice: 'Type declarations', followed: true }
        ],
        metrics: {
          cyclomaticComplexity: 3,
          linesOfCode: 100,
          commentRatio: 0.3,
          testCoverage: 80
        }
      };
      
      const report = await analyzer.generateQualityReport(mockAnalysis);
      
      expect(report).toContain('Code Quality Report');
      expect(report).toContain('Overall Quality Score: 85/100');
      expect(report).toContain('Security Score: 90/100');
      expect(report).toContain('Lines of Code: 100');
      expect(report).toContain('✅ Dependency injection');
    });
  });
});
import { DrupalCodeAnalyzer } from './drupal-code-analyzer.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PerformanceIssue {
  type: 'n+1_query' | 'missing_cache' | 'heavy_computation' | 'synchronous_operation';
  severity: 'low' | 'medium' | 'high';
  location: { line: number; column: number };
  description: string;
  suggestion: string;
  estimatedImpact: string;
}

export interface RefactoringSuggestion {
  type: 'extract_method' | 'extract_service' | 'use_dependency_injection' | 'split_class' | 'use_event';
  location: { startLine: number; endLine: number };
  description: string;
  suggestedCode: string;
  benefits: string[];
}

export interface Deprecation {
  api: string;
  version: string;
  location: { line: number };
  replacement: string;
  migrationGuide: string;
}

export interface BestPractice {
  category: 'security' | 'performance' | 'maintainability' | 'testing' | 'error_handling';
  title: string;
  description: string;
  currentCode?: string;
  suggestedCode?: string;
  references: string[];
}

export interface SecurityScore {
  overall: number; // 0-100
  categories: {
    input_validation: number;
    authentication: number;
    authorization: number;
    data_protection: number;
    error_handling: number;
  };
  criticalIssues: number;
  warnings: number;
}

export interface AdvancedAnalysisResult {
  file: string;
  qualityScore: number; // 0-100
  performanceIssues: PerformanceIssue[];
  securityScore: SecurityScore;
  refactoringSuggestions: RefactoringSuggestion[];
  deprecations: Deprecation[];
  bestPractices: BestPractice[];
  metrics: {
    cyclomaticComplexity: number;
    linesOfCode: number;
    commentRatio: number;
    testCoverage?: number;
  };
}

export class DrupalCodeAnalyzerV2 extends DrupalCodeAnalyzer {
  private deprecatedAPIs: Map<string, { version: string; replacement: string; guide: string }> = new Map([
    // Drupal 8 -> 9
    ['drupal_set_message', { version: '9.0', replacement: '\\Drupal::messenger()->addMessage()', guide: 'Use the Messenger service for displaying messages' }],
    ['EntityManager', { version: '9.0', replacement: 'Use specific services like EntityTypeManager', guide: 'EntityManager is split into multiple services' }],
    ['db_query', { version: '9.0', replacement: '\\Drupal::database()->query()', guide: 'Use the database service' }],
    ['file_unmanaged_', { version: '9.0', replacement: 'Use File API service methods', guide: 'File operations should use the file.system service' }],
    
    // Drupal 9 -> 10
    ['jquery.once', { version: '10.0', replacement: 'once() from core/once', guide: 'jQuery.once is replaced by the once library' }],
    ['theme_', { version: '10.0', replacement: 'Use render arrays or Twig templates', guide: 'Theme functions are deprecated in favor of Twig' }],
    
    // Drupal 10 -> 11
    ['symfony/http-kernel 5', { version: '11.0', replacement: 'symfony/http-kernel 6', guide: 'Upgrade to Symfony 6 components' }]
  ]);

  private performancePatterns = [
    {
      pattern: /\$node\s*=\s*Node::load\([^)]+\)[\s\S]*?\$node\s*=\s*Node::load\(/,
      issue: 'n+1_query',
      description: 'Multiple entity loads detected. Consider using loadMultiple().',
      suggestion: 'Use Node::loadMultiple($nids) to load all nodes in one query.'
    },
    {
      pattern: /foreach[\s\S]*?{[\s\S]*?\\Drupal::entityTypeManager[\s\S]*?}/,
      issue: 'n+1_query',
      description: 'Entity loading inside loop detected.',
      suggestion: 'Load all entities before the loop using loadMultiple().'
    },
    {
      pattern: /\\Drupal::config\([^)]+\)->get\([^)]+\)/g,
      issue: 'missing_cache',
      description: 'Configuration loaded without caching consideration.',
      suggestion: 'Consider caching configuration values if used frequently.'
    },
    {
      pattern: /file_get_contents\s*\(\s*['"]https?:\/\//,
      issue: 'synchronous_operation',
      description: 'Synchronous HTTP request detected.',
      suggestion: 'Use Guzzle with async requests or queue the operation.'
    }
  ];

  async analyzeAdvanced(filePath: string): Promise<AdvancedAnalysisResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const basicAnalysis = await this.analyzeDrupalFile(filePath);
    
    const result: AdvancedAnalysisResult = {
      file: filePath,
      qualityScore: 0,
      performanceIssues: [],
      securityScore: this.calculateSecurityScore(basicAnalysis, content),
      refactoringSuggestions: [],
      deprecations: [],
      bestPractices: [],
      metrics: {
        cyclomaticComplexity: this.calculateCyclomaticComplexity(content),
        linesOfCode: content.split('\n').length,
        commentRatio: this.calculateCommentRatio(content),
      }
    };

    // Analyze performance issues
    result.performanceIssues = this.detectPerformanceIssues(content);
    
    // Detect deprecations
    result.deprecations = this.detectDeprecations(content);
    
    // Generate refactoring suggestions
    result.refactoringSuggestions = this.generateRefactoringSuggestions(content, basicAnalysis);
    
    // Collect best practices
    result.bestPractices = this.collectBestPractices(content, basicAnalysis);
    
    // Calculate overall quality score
    result.qualityScore = this.calculateQualityScore(result);
    
    return result;
  }

  private detectPerformanceIssues(content: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');
    
    for (const pattern of this.performancePatterns) {
      const matches = content.matchAll(pattern.pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.push({
          type: pattern.issue as any,
          severity: pattern.issue === 'n+1_query' ? 'high' : 'medium',
          location: { line: lineNumber, column: 0 },
          description: pattern.description,
          suggestion: pattern.suggestion,
          estimatedImpact: this.estimatePerformanceImpact(pattern.issue)
        });
      }
    }
    
    // Detect heavy computations in render arrays
    const renderArrayPattern = /['"]#pre_render['"]\s*=>\s*\[[\s\S]*?function/g;
    const renderMatches = content.matchAll(renderArrayPattern);
    for (const match of renderMatches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      issues.push({
        type: 'heavy_computation',
        severity: 'medium',
        location: { line: lineNumber, column: 0 },
        description: 'Heavy computation in render array detected.',
        suggestion: 'Consider moving heavy computations to a queue or cache the results.',
        estimatedImpact: '10-50ms per render'
      });
    }
    
    return issues;
  }

  private detectDeprecations(content: string): Deprecation[] {
    const deprecations: Deprecation[] = [];
    const lines = content.split('\n');
    
    for (const [api, info] of this.deprecatedAPIs) {
      lines.forEach((line, index) => {
        if (line.includes(api)) {
          deprecations.push({
            api,
            version: info.version,
            location: { line: index + 1 },
            replacement: info.replacement,
            migrationGuide: info.guide
          });
        }
      });
    }
    
    return deprecations;
  }

  private generateRefactoringSuggestions(content: string, basicAnalysis: any): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];
    
    // Detect long methods
    const methodPattern = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
    const methods = content.matchAll(methodPattern);
    
    for (const match of methods) {
      const methodStart = match.index!;
      const methodName = match[1];
      let braceCount = 1;
      let i = methodStart + match[0].length;
      
      while (i < content.length && braceCount > 0) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        i++;
      }
      
      const methodContent = content.substring(methodStart, i);
      const methodLines = methodContent.split('\n').length;
      
      if (methodLines > 50) {
        const startLine = content.substring(0, methodStart).split('\n').length;
        suggestions.push({
          type: 'extract_method',
          location: { startLine, endLine: startLine + methodLines },
          description: `Method ${methodName} is too long (${methodLines} lines)`,
          suggestedCode: this.generateExtractMethodSuggestion(methodName, methodContent),
          benefits: ['Improved readability', 'Better testability', 'Single responsibility principle']
        });
      }
    }
    
    // Detect services that could use dependency injection
    const staticServicePattern = /\\Drupal::(service|entityTypeManager|config)\(/g;
    const serviceMatches = content.matchAll(staticServicePattern);
    
    for (const match of serviceMatches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      suggestions.push({
        type: 'use_dependency_injection',
        location: { startLine: lineNumber, endLine: lineNumber },
        description: 'Static service call detected',
        suggestedCode: this.generateDependencyInjectionSuggestion(match[0]),
        benefits: ['Better testability', 'Loose coupling', 'Follows Drupal best practices']
      });
    }
    
    return suggestions;
  }

  private collectBestPractices(content: string, basicAnalysis: any): BestPractice[] {
    const practices: BestPractice[] = [];
    
    // Check for proper error handling
    if (!content.includes('try') || !content.includes('catch')) {
      practices.push({
        category: 'error_handling',
        title: 'Add error handling',
        description: 'Consider adding try-catch blocks for operations that might fail',
        suggestedCode: `try {
  // Your code here
} catch (\\Exception $e) {
  \\Drupal::logger('module_name')->error($e->getMessage());
}`,
        references: ['https://www.drupal.org/docs/drupal-apis/logger-api']
      });
    }
    
    // Check for proper caching
    if (content.includes('->query(') && !content.includes('cache')) {
      practices.push({
        category: 'performance',
        title: 'Implement caching for database queries',
        description: 'Database query results should be cached when appropriate',
        suggestedCode: `$cid = 'mymodule:data:' . $id;
if ($cache = \\Drupal::cache()->get($cid)) {
  return $cache->data;
}
// Run query
\\Drupal::cache()->set($cid, $result, Cache::PERMANENT, ['node:' . $id]);`,
        references: ['https://www.drupal.org/docs/drupal-apis/cache-api']
      });
    }
    
    return practices;
  }

  private calculateSecurityScore(basicAnalysis: any, content: string): SecurityScore {
    const score: SecurityScore = {
      overall: 100,
      categories: {
        input_validation: 100,
        authentication: 100,
        authorization: 100,
        data_protection: 100,
        error_handling: 100
      },
      criticalIssues: 0,
      warnings: 0
    };
    
    // Deduct points for security issues
    basicAnalysis.issues.forEach((issue: any) => {
      if (issue.severity === 'critical') {
        score.criticalIssues++;
        score.overall -= 20;
        
        if (issue.type === 'security') {
          score.categories.input_validation -= 25;
        }
      } else if (issue.severity === 'warning') {
        score.warnings++;
        score.overall -= 5;
      }
    });
    
    // Check for access controls
    if (!content.includes('AccessResult::') && !content.includes('->access(')) {
      score.categories.authorization -= 15;
      score.overall -= 10;
    }
    
    // Check for proper error handling
    if (!content.includes('try') || !content.includes('catch')) {
      score.categories.error_handling -= 20;
      score.overall -= 5;
    }
    
    // Ensure score doesn't go below 0
    score.overall = Math.max(0, score.overall);
    Object.keys(score.categories).forEach(key => {
      score.categories[key as keyof typeof score.categories] = Math.max(0, score.categories[key as keyof typeof score.categories]);
    });
    
    return score;
  }

  private calculateCyclomaticComplexity(content: string): number {
    let complexity = 1;
    
    // Count decision points
    const decisionPatterns = [
      /if\s*\(/g,
      /else\s*if\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /for\s*\(/g,
      /foreach\s*\(/g,
      /while\s*\(/g,
      /catch\s*\(/g,
      /\?\s*[^:]+\s*:/g, // ternary operator
    ];
    
    decisionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  private calculateCommentRatio(content: string): number {
    const lines = content.split('\n');
    let commentLines = 0;
    let inBlockComment = false;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('/*')) inBlockComment = true;
      if (inBlockComment || trimmed.startsWith('//') || trimmed.startsWith('*')) {
        commentLines++;
      }
      if (trimmed.endsWith('*/')) inBlockComment = false;
    });
    
    return (commentLines / lines.length) * 100;
  }

  private calculateQualityScore(result: AdvancedAnalysisResult): number {
    let score = 100;
    
    // Deduct for performance issues
    score -= result.performanceIssues.filter(i => i.severity === 'high').length * 10;
    score -= result.performanceIssues.filter(i => i.severity === 'medium').length * 5;
    
    // Deduct for deprecations
    score -= result.deprecations.length * 5;
    
    // Deduct for security score
    score = score * (result.securityScore.overall / 100);
    
    // Deduct for complexity
    if (result.metrics.cyclomaticComplexity > 10) {
      score -= Math.min(20, (result.metrics.cyclomaticComplexity - 10) * 2);
    }
    
    // Bonus for good comment ratio
    if (result.metrics.commentRatio > 20) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private estimatePerformanceImpact(issueType: string): string {
    const impacts: Record<string, string> = {
      'n+1_query': '50-500ms per iteration',
      'missing_cache': '10-100ms per request',
      'heavy_computation': '100-1000ms per execution',
      'synchronous_operation': '200-5000ms blocking'
    };
    return impacts[issueType] || 'Unknown impact';
  }

  private generateExtractMethodSuggestion(methodName: string, content: string): string {
    return `// Consider breaking ${methodName} into smaller methods:

private function ${methodName}Part1($params) {
  // First logical part of the method
}

private function ${methodName}Part2($params) {
  // Second logical part of the method
}

public function ${methodName}($params) {
  $result1 = $this->${methodName}Part1($params);
  $result2 = $this->${methodName}Part2($result1);
  return $result2;
}`;
  }

  private generateDependencyInjectionSuggestion(serviceCall: string): string {
    const service = serviceCall.includes('entityTypeManager') ? 'entity_type.manager' :
                   serviceCall.includes('config') ? 'config.factory' : 'unknown.service';
    
    return `// Add to your service definition:
services:
  mymodule.myservice:
    class: Drupal\\mymodule\\MyService
    arguments: ['@${service}']

// In your class:
protected $service;

public function __construct($service) {
  $this->service = $service;
}

public static function create(ContainerInterface $container) {
  return new static(
    $container->get('${service}')
  );
}`;
  }

  async generateComprehensiveReport(filePath: string): Promise<string> {
    const analysis = await this.analyzeAdvanced(filePath);
    
    let report = `# Drupal Code Analysis Report\n\n`;
    report += `**File**: ${analysis.file}\n`;
    report += `**Quality Score**: ${analysis.qualityScore}/100\n\n`;
    
    report += `## Metrics\n`;
    report += `- Lines of Code: ${analysis.metrics.linesOfCode}\n`;
    report += `- Cyclomatic Complexity: ${analysis.metrics.cyclomaticComplexity}\n`;
    report += `- Comment Ratio: ${analysis.metrics.commentRatio.toFixed(1)}%\n\n`;
    
    report += `## Security Score: ${analysis.securityScore.overall}/100\n`;
    report += `- Critical Issues: ${analysis.securityScore.criticalIssues}\n`;
    report += `- Warnings: ${analysis.securityScore.warnings}\n\n`;
    
    if (analysis.performanceIssues.length > 0) {
      report += `## Performance Issues\n`;
      analysis.performanceIssues.forEach(issue => {
        report += `### ${issue.type} (${issue.severity})\n`;
        report += `- **Location**: Line ${issue.location.line}\n`;
        report += `- **Description**: ${issue.description}\n`;
        report += `- **Suggestion**: ${issue.suggestion}\n`;
        report += `- **Impact**: ${issue.estimatedImpact}\n\n`;
      });
    }
    
    if (analysis.deprecations.length > 0) {
      report += `## Deprecations\n`;
      analysis.deprecations.forEach(dep => {
        report += `### ${dep.api}\n`;
        report += `- **Deprecated in**: Drupal ${dep.version}\n`;
        report += `- **Location**: Line ${dep.location.line}\n`;
        report += `- **Replacement**: ${dep.replacement}\n`;
        report += `- **Migration Guide**: ${dep.migrationGuide}\n\n`;
      });
    }
    
    if (analysis.refactoringSuggestions.length > 0) {
      report += `## Refactoring Suggestions\n`;
      analysis.refactoringSuggestions.forEach(suggestion => {
        report += `### ${suggestion.type}\n`;
        report += `- **Location**: Lines ${suggestion.location.startLine}-${suggestion.location.endLine}\n`;
        report += `- **Description**: ${suggestion.description}\n`;
        report += `- **Benefits**: ${suggestion.benefits.join(', ')}\n`;
        report += `\`\`\`php\n${suggestion.suggestedCode}\n\`\`\`\n\n`;
      });
    }
    
    return report;
  }
}
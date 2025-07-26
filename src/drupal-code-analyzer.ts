import { readFileSync } from 'fs';
import { extname, basename } from 'path';

interface DrupalFileAnalysis {
  filePath: string;
  fileName: string;
  fileType: 'module' | 'theme' | 'install' | 'routing' | 'services' | 'schema' | 'form' | 'controller' | 'entity' | 'plugin' | 'test' | 'other';
  drupalVersion: string[];
  hooks: string[];
  functions: string[];
  classes: string[];
  services: string[];
  dependencies: string[];
  namespaces: string[];
  issues: DrupalCodeIssue[];
  metrics: {
    lines: number;
    functions: number;
    classes: number;
    complexity: number;
  };
}

interface DrupalCodeIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  severity: 'critical' | 'major' | 'minor';
  rule: string;
}

export class DrupalCodeAnalyzer {
  private readonly hookPatterns = [
    /function\s+(\w+)_(hook_\w+)\s*\(/g,
    /function\s+(\w+_hook_\w+)\s*\(/g,
    /\*\s*Implements\s+(hook_\w+)\(\)/g,
  ];

  private readonly functionPatterns = [
    /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
  ];

  private readonly classPatterns = [
    /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /interface\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /trait\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
  ];

  private readonly servicePatterns = [
    /\$this->get\(['"]([^'"]+)['"]\)/g,
    /\\Drupal::service\(['"]([^'"]+)['"]\)/g,
    /\\Drupal::([a-zA-Z]+)\(/g,
  ];

  private readonly namespacePatterns = [
    /namespace\s+([^;]+);/g,
    /use\s+([^;]+);/g,
  ];

  /**
   * Analyze a Drupal file and return comprehensive analysis
   */
  async analyzeDrupalFile(filePath: string): Promise<DrupalFileAnalysis> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = basename(filePath);
      const fileType = this.detectFileType(filePath, content);
      
      const analysis: DrupalFileAnalysis = {
        filePath,
        fileName,
        fileType,
        drupalVersion: this.detectDrupalVersion(content),
        hooks: this.extractHooks(content),
        functions: this.extractFunctions(content),
        classes: this.extractClasses(content),
        services: this.extractServices(content),
        dependencies: this.extractDependencies(content),
        namespaces: this.extractNamespaces(content),
        issues: this.findCodeIssues(content, fileType),
        metrics: this.calculateMetrics(content),
      };

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Detect the type of Drupal file based on path and content
   */
  private detectFileType(filePath: string, content: string): DrupalFileAnalysis['fileType'] {
    const fileName = basename(filePath);
    const extension = extname(filePath);

    // File extension checks
    if (extension === '.info.yml') return 'module';
    if (extension === '.install') return 'install';
    if (extension === '.routing.yml') return 'routing';
    if (extension === '.services.yml') return 'services';
    if (extension === '.schema.yml') return 'schema';

    // File name patterns
    if (fileName.includes('.module')) return 'module';
    if (fileName.includes('.theme')) return 'theme';
    if (fileName.includes('Form.php')) return 'form';
    if (fileName.includes('Controller.php')) return 'controller';
    if (fileName.includes('Entity.php') || fileName.includes('entity.php')) return 'entity';
    if (fileName.includes('Plugin')) return 'plugin';
    if (fileName.includes('Test.php') || fileName.includes('test.php')) return 'test';

    // Content-based detection
    if (content.includes('extends FormBase') || content.includes('implements FormInterface')) return 'form';
    if (content.includes('extends ControllerBase') || content.includes('Controller')) return 'controller';
    if (content.includes('extends ContentEntityBase') || content.includes('implements EntityInterface')) return 'entity';
    if (content.includes('@Plugin(')) return 'plugin';
    if (content.includes('extends UnitTestCase') || content.includes('extends KernelTestBase')) return 'test';

    return 'other';
  }

  /**
   * Detect Drupal version from file content
   */
  private detectDrupalVersion(content: string): string[] {
    const versions: string[] = [];
    
    // Core version constraints
    if (content.includes('core_version_requirement:')) {
      const matches = content.match(/core_version_requirement:\s*([^\n]+)/);
      if (matches) {
        versions.push(matches[1].trim());
      }
    }

    // API version in hooks
    if (content.includes('hook_')) {
      if (content.includes('\\Drupal\\Core\\') || content.includes('use Drupal\\Core\\')) {
        versions.push('9.x', '10.x', '11.x');
      } else if (content.includes('drupal_get_') || content.includes('variable_get(')) {
        versions.push('7.x');
      } else {
        versions.push('8.x', '9.x', '10.x', '11.x');
      }
    }

    return versions.length > 0 ? versions : ['10.x', '11.x']; // Default to recent versions
  }

  /**
   * Extract hook implementations from file content
   */
  private extractHooks(content: string): string[] {
    const hooks = new Set<string>();

    this.hookPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[2]) {
          hooks.add(match[2]); // hook_name from function modulename_hook_name
        } else if (match[1] && match[1].startsWith('hook_')) {
          hooks.add(match[1]); // Direct hook name
        }
      }
    });

    // Extract from comments (Implements hook_xyz())
    const commentPattern = /\*\s*Implements\s+(hook_\w+)\(\)/g;
    let match;
    while ((match = commentPattern.exec(content)) !== null) {
      hooks.add(match[1]);
    }

    return Array.from(hooks);
  }

  /**
   * Extract function names from file content
   */
  private extractFunctions(content: string): string[] {
    const functions = new Set<string>();

    this.functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.add(match[1]);
      }
    });

    return Array.from(functions);
  }

  /**
   * Extract class/interface/trait names from file content
   */
  private extractClasses(content: string): string[] {
    const classes = new Set<string>();

    this.classPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        classes.add(match[1]);
      }
    });

    return Array.from(classes);
  }

  /**
   * Extract service dependencies from file content
   */
  private extractServices(content: string): string[] {
    const services = new Set<string>();

    this.servicePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          services.add(match[1]);
        }
      }
    });

    return Array.from(services);
  }

  /**
   * Extract module/library dependencies
   */
  private extractDependencies(content: string): string[] {
    const dependencies = new Set<string>();

    // YAML dependencies
    const yamlDepPattern = /dependencies:\s*\n((?:\s*-\s*[^\n]+\n?)*)/g;
    let match;
    while ((match = yamlDepPattern.exec(content)) !== null) {
      const depLines = match[1].split('\n').filter(line => line.trim());
      depLines.forEach(line => {
        const dep = line.replace(/^\s*-\s*/, '').trim();
        if (dep) dependencies.add(dep);
      });
    }

    // Use statements
    const usePattern = /use\s+Drupal\\([^\\]+)/g;
    while ((match = usePattern.exec(content)) !== null) {
      dependencies.add(match[1].toLowerCase());
    }

    return Array.from(dependencies);
  }

  /**
   * Extract namespace information
   */
  private extractNamespaces(content: string): string[] {
    const namespaces = new Set<string>();

    this.namespacePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        namespaces.add(match[1].trim());
      }
    });

    return Array.from(namespaces);
  }

  /**
   * Find code issues and violations
   */
  private findCodeIssues(content: string, fileType: DrupalFileAnalysis['fileType']): DrupalCodeIssue[] {
    const issues: DrupalCodeIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for deprecated functions
      const deprecatedFunctions = [
        'drupal_get_query_parameters', 'drupal_http_request', 'entity_load',
        'entity_save', 'entity_delete', 'node_load', 'user_load', 'variable_get'
      ];

      deprecatedFunctions.forEach(func => {
        if (line.includes(func + '(')) {
          issues.push({
            type: 'warning',
            message: `Deprecated function '${func}' found. Consider using modern alternatives.`,
            line: lineNumber,
            severity: 'major',
            rule: 'deprecated-function'
          });
        }
      });

      // Check for missing documentation
      if (line.trim().startsWith('function ') && !lines[index - 1]?.trim().startsWith('*')) {
        issues.push({
          type: 'info',
          message: 'Function lacks documentation comment.',
          line: lineNumber,
          severity: 'minor',
          rule: 'missing-docs'
        });
      }

      // Check for direct database queries without proper API
      if (line.includes('db_query(') || line.includes('SELECT ') || line.includes('INSERT ')) {
        issues.push({
          type: 'warning',
          message: 'Direct database query detected. Consider using Entity API or Query API.',
          line: lineNumber,
          severity: 'major',
          rule: 'direct-db-query'
        });
      }

      // Check for security issues
      if (line.includes('$_GET') || line.includes('$_POST') || line.includes('$_REQUEST')) {
        issues.push({
          type: 'error',
          message: 'Direct use of superglobals detected. Use Request object instead.',
          line: lineNumber,
          severity: 'critical',
          rule: 'security-superglobals'
        });
      }
    });

    return issues;
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(content: string): DrupalFileAnalysis['metrics'] {
    const lines = content.split('\n');
    const functionMatches = content.match(/function\s+[a-zA-Z_]/g) || [];
    const classMatches = content.match(/class\s+[a-zA-Z_]/g) || [];
    
    // Simple complexity calculation based on control structures
    const complexityKeywords = ['if', 'else', 'elseif', 'while', 'for', 'foreach', 'switch', 'case', 'catch'];
    let complexity = 1; // Base complexity
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return {
      lines: lines.length,
      functions: functionMatches.length,
      classes: classMatches.length,
      complexity
    };
  }

  /**
   * Get a summary report of the analysis
   */
  generateSummary(analysis: DrupalFileAnalysis): string {
    const { fileName, fileType, hooks, functions, classes, issues, metrics } = analysis;
    
    let summary = `## Drupal File Analysis: ${fileName}\n\n`;
    summary += `**File Type:** ${fileType}\n`;
    summary += `**Drupal Version:** ${analysis.drupalVersion.join(', ')}\n\n`;
    
    summary += `### Code Structure\n`;
    summary += `- **Lines of Code:** ${metrics.lines}\n`;
    summary += `- **Functions:** ${metrics.functions} (${functions.slice(0, 5).join(', ')}${functions.length > 5 ? '...' : ''})\n`;
    summary += `- **Classes:** ${metrics.classes} (${classes.slice(0, 3).join(', ')}${classes.length > 3 ? '...' : ''})\n`;
    summary += `- **Hooks:** ${hooks.length} (${hooks.slice(0, 3).join(', ')}${hooks.length > 3 ? '...' : ''})\n`;
    summary += `- **Complexity Score:** ${metrics.complexity}\n\n`;
    
    if (issues.length > 0) {
      summary += `### Issues Found (${issues.length})\n`;
      const criticalIssues = issues.filter(i => i.severity === 'critical');
      const majorIssues = issues.filter(i => i.severity === 'major');
      const minorIssues = issues.filter(i => i.severity === 'minor');
      
      if (criticalIssues.length > 0) summary += `- **Critical:** ${criticalIssues.length}\n`;
      if (majorIssues.length > 0) summary += `- **Major:** ${majorIssues.length}\n`;
      if (minorIssues.length > 0) summary += `- **Minor:** ${minorIssues.length}\n`;
      
      summary += `\n**Top Issues:**\n`;
      issues.slice(0, 5).forEach(issue => {
        summary += `- Line ${issue.line}: ${issue.message}\n`;
      });
    } else {
      summary += `### ✅ No Issues Found\n`;
    }
    
    return summary;
  }
}
import { DrupalCodeAnalyzer } from './drupal-code-analyzer.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MigrationIssue {
  type: 'removed_api' | 'deprecated_api' | 'changed_api' | 'namespace_change' | 'service_change' | 'library_change';
  severity: 'critical' | 'warning' | 'info';
  fromVersion: string;
  toVersion: string;
  file: string;
  line: number;
  code: string;
  description: string;
  replacement?: string;
  migrationSteps?: string[];
  automated: boolean;
  documentation?: string;
}

export interface MigrationReport {
  projectPath: string;
  currentVersion: string;
  targetVersion: string;
  scanDate: string;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
    automatedFixes: number;
    estimatedEffortHours: number;
  };
  issues: MigrationIssue[];
  recommendations: string[];
  migrationPlan: MigrationStep[];
}

export interface MigrationStep {
  order: number;
  title: string;
  description: string;
  automated: boolean;
  commands?: string[];
  manualSteps?: string[];
  estimatedMinutes: number;
}

export interface VersionMigrationRules {
  from: string;
  to: string;
  rules: MigrationRule[];
}

export interface MigrationRule {
  pattern: RegExp | string;
  type: MigrationIssue['type'];
  severity: MigrationIssue['severity'];
  description: string;
  replacement?: string | ((match: string) => string);
  migrationSteps?: string[];
  automated: boolean;
  documentation?: string;
}

export class DrupalMigrationAssistant {
  private analyzer: DrupalCodeAnalyzer;
  
  // Migration rules for different version upgrades
  private migrationRules: VersionMigrationRules[] = [
    {
      from: '8',
      to: '9',
      rules: [
        {
          pattern: /drupal_set_message\s*\(/g,
          type: 'removed_api',
          severity: 'critical',
          description: 'drupal_set_message() is removed in Drupal 9',
          replacement: '\\Drupal::messenger()->addMessage(',
          automated: true,
          documentation: 'https://www.drupal.org/node/2774931'
        },
        {
          pattern: /\\Drupal\\Core\\Entity\\EntityManager/g,
          type: 'deprecated_api',
          severity: 'critical',
          description: 'EntityManager is deprecated, split into separate services',
          replacement: '\\Drupal\\Core\\Entity\\EntityTypeManager',
          migrationSteps: [
            'Replace EntityManager with EntityTypeManager for entity operations',
            'Use EntityFieldManager for field-related operations',
            'Use EntityDisplayRepository for display-related operations'
          ],
          automated: false,
          documentation: 'https://www.drupal.org/node/2549139'
        },
        {
          pattern: /entity\.manager/g,
          type: 'service_change',
          severity: 'critical',
          description: 'entity.manager service is removed',
          replacement: 'entity_type.manager',
          automated: true
        },
        {
          pattern: /drupal\/core\: \^8/g,
          type: 'changed_api',
          severity: 'critical',
          description: 'Core version requirement needs update',
          replacement: 'drupal/core-recommended: ^9',
          automated: true
        },
        {
          pattern: /symfony\/(.*): \^3/g,
          type: 'library_change',
          severity: 'critical',
          description: 'Symfony 3 components need upgrade to Symfony 4',
          replacement: (match: string) => match.replace('^3', '^4'),
          automated: true
        }
      ]
    },
    {
      from: '9',
      to: '10',
      rules: [
        {
          pattern: /jquery\.once/g,
          type: 'removed_api',
          severity: 'critical',
          description: 'jQuery.once is removed in Drupal 10',
          replacement: 'once',
          migrationSteps: [
            'Add core/once as a dependency in your library',
            'Replace jQuery.once with once() function',
            'Update the callback function signature'
          ],
          automated: false,
          documentation: 'https://www.drupal.org/node/3158256'
        },
        {
          pattern: /theme_([a-z_]+)\s*\(/g,
          type: 'deprecated_api',
          severity: 'warning',
          description: 'Theme functions are deprecated',
          migrationSteps: [
            'Convert theme function to a Twig template',
            'Update render arrays to use #theme instead of #theme_wrappers'
          ],
          automated: false
        },
        {
          pattern: /drupal\/core\: \^9/g,
          type: 'changed_api',
          severity: 'critical',
          description: 'Core version requirement needs update',
          replacement: 'drupal/core-recommended: ^10',
          automated: true
        },
        {
          pattern: /symfony\/(.*): [\^~]4/g,
          type: 'library_change',
          severity: 'critical',
          description: 'Symfony 4 components need upgrade to Symfony 6',
          replacement: (match: string) => match.replace(/[\^~]4/, '^6'),
          automated: true
        },
        {
          pattern: /ckeditor(?!5)/g,
          type: 'removed_api',
          severity: 'critical',
          description: 'CKEditor 4 is removed, upgrade to CKEditor 5',
          migrationSteps: [
            'Enable CKEditor 5 module',
            'Migrate text formats to use CKEditor 5',
            'Update custom CKEditor plugins'
          ],
          automated: false,
          documentation: 'https://www.drupal.org/docs/core-modules-and-themes/core-modules/ckeditor-5-module'
        }
      ]
    },
    {
      from: '10',
      to: '11',
      rules: [
        {
          pattern: /symfony\/(.*): \^6/g,
          type: 'library_change',
          severity: 'warning',
          description: 'Consider upgrading Symfony 6 components to Symfony 7',
          replacement: (match: string) => match.replace('^6', '^7'),
          automated: true
        },
        {
          pattern: /php: \^8\.[01]/g,
          type: 'changed_api',
          severity: 'critical',
          description: 'PHP version requirement needs update',
          replacement: 'php: ^8.2',
          automated: true
        }
      ]
    }
  ];

  constructor() {
    this.analyzer = new DrupalCodeAnalyzer();
  }

  async analyzeUpgradePath(
    projectPath: string,
    currentVersion: string,
    targetVersion: string
  ): Promise<MigrationReport> {
    const issues: MigrationIssue[] = [];
    const startTime = Date.now();
    
    // Get all PHP files
    const files = await this.findPhpFiles(projectPath);
    
    // Get applicable migration rules
    const applicableRules = this.getApplicableRules(currentVersion, targetVersion);
    
    // Analyze each file
    for (const file of files) {
      const fileIssues = await this.analyzeFile(file, applicableRules, currentVersion, targetVersion);
      issues.push(...fileIssues);
    }
    
    // Analyze composer.json
    const composerIssues = await this.analyzeComposerFile(
      path.join(projectPath, 'composer.json'),
      currentVersion,
      targetVersion
    );
    issues.push(...composerIssues);
    
    // Analyze info.yml files
    const infoFiles = await this.findInfoFiles(projectPath);
    for (const infoFile of infoFiles) {
      const infoIssues = await this.analyzeInfoFile(infoFile, currentVersion, targetVersion);
      issues.push(...infoIssues);
    }
    
    // Generate report
    const report: MigrationReport = {
      projectPath,
      currentVersion,
      targetVersion,
      scanDate: new Date().toISOString(),
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        automatedFixes: issues.filter(i => i.automated).length,
        estimatedEffortHours: this.estimateEffort(issues)
      },
      issues,
      recommendations: this.generateRecommendations(issues, currentVersion, targetVersion),
      migrationPlan: this.generateMigrationPlan(issues, currentVersion, targetVersion)
    };
    
    return report;
  }

  private async analyzeFile(
    filePath: string,
    rules: MigrationRule[],
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationIssue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: MigrationIssue[] = [];
    const lines = content.split('\n');
    
    for (const rule of rules) {
      if (typeof rule.pattern === 'string') {
        // Simple string search
        lines.forEach((line, index) => {
          if (line.includes(rule.pattern as string)) {
            issues.push(this.createIssue(
              rule,
              filePath,
              index + 1,
              line.trim(),
              fromVersion,
              toVersion
            ));
          }
        });
      } else {
        // Regex pattern
        const matches = content.matchAll(rule.pattern);
        for (const match of matches) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const line = lines[lineNumber - 1];
          
          issues.push(this.createIssue(
            rule,
            filePath,
            lineNumber,
            line.trim(),
            fromVersion,
            toVersion,
            match[0]
          ));
        }
      }
    }
    
    return issues;
  }

  private createIssue(
    rule: MigrationRule,
    file: string,
    line: number,
    code: string,
    fromVersion: string,
    toVersion: string,
    matchedText?: string
  ): MigrationIssue {
    let replacement = rule.replacement;
    if (typeof replacement === 'function' && matchedText) {
      replacement = replacement(matchedText);
    }
    
    return {
      type: rule.type,
      severity: rule.severity,
      fromVersion,
      toVersion,
      file,
      line,
      code,
      description: rule.description,
      replacement: replacement as string | undefined,
      migrationSteps: rule.migrationSteps,
      automated: rule.automated,
      documentation: rule.documentation
    };
  }

  private getApplicableRules(fromVersion: string, toVersion: string): MigrationRule[] {
    const fromMajor = parseInt(fromVersion.split('.')[0]);
    const toMajor = parseInt(toVersion.split('.')[0]);
    
    const rules: MigrationRule[] = [];
    
    // Collect all rules for version jumps
    for (let version = fromMajor; version < toMajor; version++) {
      const versionRules = this.migrationRules.find(
        r => r.from === version.toString() && r.to === (version + 1).toString()
      );
      if (versionRules) {
        rules.push(...versionRules.rules);
      }
    }
    
    return rules;
  }

  private async analyzeComposerFile(
    composerPath: string,
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationIssue[]> {
    const issues: MigrationIssue[] = [];
    
    try {
      const content = await fs.readFile(composerPath, 'utf-8');
      const composer = JSON.parse(content);
      
      // Check Drupal core version
      if (composer.require?.['drupal/core'] || composer.require?.['drupal/core-recommended']) {
        const coreVersion = composer.require['drupal/core'] || composer.require['drupal/core-recommended'];
        if (!coreVersion.includes(`^${toVersion}`)) {
          issues.push({
            type: 'changed_api',
            severity: 'critical',
            fromVersion,
            toVersion,
            file: composerPath,
            line: 0,
            code: `"drupal/core": "${coreVersion}"`,
            description: 'Drupal core version needs to be updated',
            replacement: `"drupal/core-recommended": "^${toVersion}"`,
            automated: true
          });
        }
      }
      
      // Check PHP version
      if (composer.require?.php) {
        const phpVersion = composer.require.php;
        const requiredPhp = this.getRequiredPhpVersion(toVersion);
        if (!this.isPhpVersionSufficient(phpVersion, requiredPhp)) {
          issues.push({
            type: 'changed_api',
            severity: 'critical',
            fromVersion,
            toVersion,
            file: composerPath,
            line: 0,
            code: `"php": "${phpVersion}"`,
            description: `PHP version requirement needs update for Drupal ${toVersion}`,
            replacement: `"php": "${requiredPhp}"`,
            automated: true
          });
        }
      }
      
    } catch (error) {
      // File not found or invalid JSON
    }
    
    return issues;
  }

  private async analyzeInfoFile(
    infoPath: string,
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationIssue[]> {
    const issues: MigrationIssue[] = [];
    
    try {
      const content = await fs.readFile(infoPath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Check core_version_requirement
        if (line.includes('core_version_requirement:') || line.includes('core:')) {
          const coreReq = line.split(':')[1]?.trim();
          if (coreReq && !coreReq.includes(`^${toVersion}`)) {
            issues.push({
              type: 'changed_api',
              severity: 'critical',
              fromVersion,
              toVersion,
              file: infoPath,
              line: index + 1,
              code: line,
              description: 'Module/theme core version requirement needs update',
              replacement: `core_version_requirement: ^${toVersion}`,
              automated: true
            });
          }
        }
        
        // Check for deprecated base themes
        if (line.includes('base theme:')) {
          const baseTheme = line.split(':')[1]?.trim();
          if (baseTheme === 'classy' && parseInt(toVersion) >= 10) {
            issues.push({
              type: 'removed_api',
              severity: 'critical',
              fromVersion,
              toVersion,
              file: infoPath,
              line: index + 1,
              code: line,
              description: 'Classy theme is removed in Drupal 10',
              migrationSteps: [
                'Remove base theme: classy',
                'Add required Classy templates to your theme',
                'Or use contrib Classy theme'
              ],
              automated: false,
              documentation: 'https://www.drupal.org/node/3110137'
            });
          }
        }
      });
    } catch (error) {
      // File not found
    }
    
    return issues;
  }

  private async findPhpFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function walk(currentDir: string) {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          // Skip vendor and node_modules
          if (entry.name === 'vendor' || entry.name === 'node_modules') {
            continue;
          }
          
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.php')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory not accessible
      }
    }
    
    await walk(dir);
    return files;
  }

  private async findInfoFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function walk(currentDir: string) {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.name === 'vendor' || entry.name === 'node_modules') {
            continue;
          }
          
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.info.yml')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory not accessible
      }
    }
    
    await walk(dir);
    return files;
  }

  private getRequiredPhpVersion(drupalVersion: string): string {
    const major = parseInt(drupalVersion.split('.')[0]);
    switch (major) {
      case 8:
        return '^7.3';
      case 9:
        return '^7.3 || ^8.0';
      case 10:
        return '^8.1';
      case 11:
        return '^8.2';
      default:
        return '^8.2';
    }
  }

  private isPhpVersionSufficient(current: string, required: string): boolean {
    // Simple check - could be enhanced
    return current.includes(required) || 
           (required.includes('8.2') && current.includes('8.3')) ||
           (required.includes('8.1') && (current.includes('8.2') || current.includes('8.3')));
  }

  private estimateEffort(issues: MigrationIssue[]): number {
    let hours = 0;
    
    issues.forEach(issue => {
      if (issue.automated) {
        hours += 0.1; // 6 minutes for automated fixes
      } else {
        switch (issue.severity) {
          case 'critical':
            hours += 2;
            break;
          case 'warning':
            hours += 0.5;
            break;
          case 'info':
            hours += 0.25;
            break;
        }
      }
    });
    
    // Add overhead for testing
    hours *= 1.5;
    
    return Math.round(hours * 10) / 10;
  }

  private generateRecommendations(
    issues: MigrationIssue[],
    fromVersion: string,
    toVersion: string
  ): string[] {
    const recommendations: string[] = [];
    
    // Check PHP version issues
    if (issues.some(i => i.code.includes('php:'))) {
      recommendations.push('Upgrade PHP version before migrating Drupal core');
    }
    
    // Check for removed APIs
    const removedApis = issues.filter(i => i.type === 'removed_api');
    if (removedApis.length > 0) {
      recommendations.push(`Found ${removedApis.length} removed APIs that require code changes`);
    }
    
    // Check for custom modules
    const customModules = new Set(
      issues
        .filter(i => i.file.includes('/custom/'))
        .map(i => i.file.split('/custom/')[1].split('/')[0])
    );
    if (customModules.size > 0) {
      recommendations.push(`Review and test ${customModules.size} custom modules after migration`);
    }
    
    // Version-specific recommendations
    if (fromVersion.startsWith('8') && toVersion.startsWith('9')) {
      recommendations.push('Run drupal-check tool for comprehensive deprecation analysis');
      recommendations.push('Update all contributed modules to D9-compatible versions first');
    }
    
    if (fromVersion.startsWith('9') && toVersion.startsWith('10')) {
      recommendations.push('Migrate from CKEditor 4 to CKEditor 5 before upgrading');
      recommendations.push('Remove dependency on Classy theme if used');
    }
    
    // Add testing recommendation
    recommendations.push('Create comprehensive test coverage before migration');
    recommendations.push('Perform migration on a development copy first');
    
    return recommendations;
  }

  private generateMigrationPlan(
    issues: MigrationIssue[],
    fromVersion: string,
    toVersion: string
  ): MigrationStep[] {
    const steps: MigrationStep[] = [];
    let order = 1;
    
    // Pre-migration steps
    steps.push({
      order: order++,
      title: 'Backup current site',
      description: 'Create full backup of database and files',
      automated: false,
      commands: [
        'drush sql-dump --gzip > backup-$(date +%Y%m%d).sql.gz',
        'tar -czf files-backup-$(date +%Y%m%d).tar.gz sites/default/files'
      ],
      estimatedMinutes: 30
    });
    
    steps.push({
      order: order++,
      title: 'Update contributed modules',
      description: 'Update all contributed modules to versions compatible with target Drupal version',
      automated: true,
      commands: [
        'composer update --with-dependencies',
        'drush updatedb',
        'drush cache:rebuild'
      ],
      estimatedMinutes: 45
    });
    
    // Automated fixes
    const automatedIssues = issues.filter(i => i.automated);
    if (automatedIssues.length > 0) {
      steps.push({
        order: order++,
        title: 'Apply automated fixes',
        description: `Automatically fix ${automatedIssues.length} issues`,
        automated: true,
        commands: [
          'Run migration patches (generated separately)'
        ],
        estimatedMinutes: automatedIssues.length * 2
      });
    }
    
    // Manual fixes by type
    const manualIssueTypes = new Set(issues.filter(i => !i.automated).map(i => i.type));
    manualIssueTypes.forEach(type => {
      const typeIssues = issues.filter(i => !i.automated && i.type === type);
      steps.push({
        order: order++,
        title: `Fix ${type.replace('_', ' ')} issues`,
        description: `Manually fix ${typeIssues.length} ${type} issues`,
        automated: false,
        manualSteps: this.getManualStepsForType(type, typeIssues),
        estimatedMinutes: typeIssues.length * 30
      });
    });
    
    // Core update
    steps.push({
      order: order++,
      title: 'Update Drupal core',
      description: `Update from Drupal ${fromVersion} to ${toVersion}`,
      automated: true,
      commands: [
        `composer require drupal/core-recommended:^${toVersion} --update-with-dependencies`,
        'drush updatedb',
        'drush cache:rebuild'
      ],
      estimatedMinutes: 30
    });
    
    // Post-migration
    steps.push({
      order: order++,
      title: 'Run tests and verify',
      description: 'Run all tests and verify site functionality',
      automated: false,
      manualSteps: [
        'Run automated tests',
        'Perform manual testing of critical functionality',
        'Check error logs',
        'Verify configuration'
      ],
      estimatedMinutes: 120
    });
    
    return steps;
  }

  private getManualStepsForType(type: string, issues: MigrationIssue[]): string[] {
    const steps: string[] = [];
    
    switch (type) {
      case 'removed_api':
        steps.push('Replace removed functions with their modern equivalents');
        steps.push('Test each replacement thoroughly');
        break;
      case 'deprecated_api':
        steps.push('Update deprecated APIs to use new services');
        steps.push('Update dependency injection where needed');
        break;
      case 'namespace_change':
        steps.push('Update use statements to new namespaces');
        steps.push('Update class references in comments and strings');
        break;
      case 'library_change':
        steps.push('Update library definitions in .libraries.yml');
        steps.push('Update JavaScript to work with new library versions');
        break;
    }
    
    // Add specific documentation links
    const docsLinks = [...new Set(issues.map(i => i.documentation).filter(Boolean))];
    if (docsLinks.length > 0) {
      steps.push('Refer to documentation: ' + docsLinks.join(', '));
    }
    
    return steps;
  }

  async generateMigrationPatches(report: MigrationReport): Promise<Map<string, string>> {
    const patches = new Map<string, string>();
    
    // Group issues by file
    const issuesByFile = new Map<string, MigrationIssue[]>();
    report.issues.filter(i => i.automated && i.replacement).forEach(issue => {
      if (!issuesByFile.has(issue.file)) {
        issuesByFile.set(issue.file, []);
      }
      issuesByFile.get(issue.file)!.push(issue);
    });
    
    // Generate patches for each file
    for (const [filePath, fileIssues] of issuesByFile) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        let patchedContent = content;
        
        // Sort issues by line number in reverse order to avoid offset issues
        fileIssues.sort((a, b) => b.line - a.line);
        
        fileIssues.forEach(issue => {
          if (issue.replacement) {
            const lines = patchedContent.split('\n');
            const lineIndex = issue.line - 1;
            
            if (lines[lineIndex]) {
              lines[lineIndex] = lines[lineIndex].replace(
                issue.code.trim(),
                issue.replacement
              );
            }
            
            patchedContent = lines.join('\n');
          }
        });
        
        if (patchedContent !== content) {
          patches.set(filePath, patchedContent);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return patches;
  }

  async generateHTMLReport(report: MigrationReport): Promise<string> {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Drupal Migration Report - ${report.currentVersion} to ${report.targetVersion}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .critical { color: #d9534f; }
    .warning { color: #f0ad4e; }
    .info { color: #5bc0de; }
    .issue { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .automated { background: #dff0d8; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    .step { border-left: 3px solid #5bc0de; padding-left: 15px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Drupal Migration Report</h1>
  <p>From version ${report.currentVersion} to ${report.targetVersion}</p>
  <p>Generated: ${new Date(report.scanDate).toLocaleString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <ul>
      <li>Total Issues: ${report.summary.totalIssues}</li>
      <li class="critical">Critical Issues: ${report.summary.criticalIssues}</li>
      <li class="warning">Warnings: ${report.summary.warnings}</li>
      <li>Automated Fixes Available: ${report.summary.automatedFixes}</li>
      <li>Estimated Effort: ${report.summary.estimatedEffortHours} hours</li>
    </ul>
  </div>
  
  <h2>Recommendations</h2>
  <ul>
    ${report.recommendations.map(r => `<li>${r}</li>`).join('\n')}
  </ul>
  
  <h2>Migration Plan</h2>
  ${report.migrationPlan.map(step => `
    <div class="step">
      <h3>${step.order}. ${step.title}</h3>
      <p>${step.description}</p>
      <p>Estimated time: ${step.estimatedMinutes} minutes</p>
      ${step.commands ? `<pre>${step.commands.join('\n')}</pre>` : ''}
      ${step.manualSteps ? `<ul>${step.manualSteps.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('\n')}
  
  <h2>Issues by File</h2>
  ${Array.from(new Set(report.issues.map(i => i.file))).map(file => {
    const fileIssues = report.issues.filter(i => i.file === file);
    return `
      <h3>${file}</h3>
      ${fileIssues.map(issue => `
        <div class="issue ${issue.automated ? 'automated' : ''} ${issue.severity}">
          <strong>${issue.type} (${issue.severity})</strong> - Line ${issue.line}
          <p>${issue.description}</p>
          <pre>${issue.code}</pre>
          ${issue.replacement ? `<p>Replacement: <code>${issue.replacement}</code></p>` : ''}
          ${issue.migrationSteps ? `<ul>${issue.migrationSteps.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
          ${issue.documentation ? `<p><a href="${issue.documentation}">Documentation</a></p>` : ''}
        </div>
      `).join('\n')}
    `;
  }).join('\n')}
</body>
</html>`;
    
    return html;
  }
}
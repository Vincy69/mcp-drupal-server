import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

interface ModuleInfo {
  name: string;
  machineName: string;
  description: string;
  packageName: string;
  version: string;
  coreVersionRequirement: string;
  dependencies: string[];
  type: 'module' | 'theme' | 'profile';
}

interface ModuleOptions {
  includeInstall: boolean;
  includeRouting: boolean;
  includeServices: boolean;
  includeHooks: string[];
  includeController: boolean;
  includeForm: boolean;
  includeEntity: boolean;
  includePlugin: boolean;
  includePermissions: boolean;
  includeConfigSchema: boolean;
}

interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

export class DrupalModuleGenerator {
  
  /**
   * Generate a complete Drupal module skeleton
   */
  async generateModuleSkeleton(
    moduleInfo: ModuleInfo,
    options: ModuleOptions,
    outputPath: string
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const modulePath = join(outputPath, moduleInfo.machineName);

    // Create module directory
    if (!existsSync(modulePath)) {
      mkdirSync(modulePath, { recursive: true });
    }

    // Generate core files
    files.push(this.generateInfoYml(moduleInfo, modulePath));
    files.push(this.generateModuleFile(moduleInfo, options, modulePath));

    // Generate optional files based on options
    if (options.includeInstall) {
      files.push(this.generateInstallFile(moduleInfo, modulePath));
    }

    if (options.includeRouting) {
      files.push(this.generateRoutingYml(moduleInfo, modulePath));
    }

    if (options.includeServices) {
      files.push(this.generateServicesYml(moduleInfo, modulePath));
    }

    if (options.includePermissions) {
      files.push(this.generatePermissionsYml(moduleInfo, modulePath));
    }

    if (options.includeConfigSchema) {
      files.push(this.generateConfigSchema(moduleInfo, modulePath));
    }

    if (options.includeController) {
      files.push(this.generateControllerClass(moduleInfo, modulePath));
    }

    if (options.includeForm) {
      files.push(this.generateFormClass(moduleInfo, modulePath));
    }

    if (options.includeEntity) {
      files.push(this.generateEntityClass(moduleInfo, modulePath));
    }

    if (options.includePlugin) {
      files.push(this.generatePluginClass(moduleInfo, modulePath));
    }

    // Write all files to disk
    files.forEach(file => {
      writeFileSync(file.path, file.content);
    });

    return files;
  }

  /**
   * Generate module.info.yml file
   */
  private generateInfoYml(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const content = `name: '${moduleInfo.name}'
type: ${moduleInfo.type}
description: '${moduleInfo.description}'
package: '${moduleInfo.packageName}'
version: '${moduleInfo.version}'
core_version_requirement: '${moduleInfo.coreVersionRequirement}'
${moduleInfo.dependencies.length > 0 ? `dependencies:\n${moduleInfo.dependencies.map(dep => `  - ${dep}`).join('\n')}` : ''}
`;

    return {
      path: join(modulePath, `${moduleInfo.machineName}.info.yml`),
      content,
      description: 'Module information file'
    };
  }

  /**
   * Generate main .module file
   */
  private generateModuleFile(moduleInfo: ModuleInfo, options: ModuleOptions, modulePath: string): GeneratedFile {
    let content = `<?php

/**
 * @file
 * ${moduleInfo.description}
 */

use Drupal\\Core\\Routing\\RouteMatchInterface;

`;

    // Add hook_help if needed
    if (options.includeHooks.includes('hook_help')) {
      content += `/**
 * Implements hook_help().
 */
function ${moduleInfo.machineName}_help($route_name, RouteMatchInterface $route_match) {
  switch ($route_name) {
    case 'help.page.${moduleInfo.machineName}':
      $output = '';
      $output .= '<h3>' . t('About') . '</h3>';
      $output .= '<p>' . t('${moduleInfo.description}') . '</p>';
      return $output;

    default:
  }
}

`;
    }

    // Add other hooks
    options.includeHooks.forEach(hook => {
      if (hook !== 'hook_help') {
        content += this.generateHookImplementation(moduleInfo.machineName, hook);
      }
    });

    return {
      path: join(modulePath, `${moduleInfo.machineName}.module`),
      content,
      description: 'Main module file with hook implementations'
    };
  }

  /**
   * Generate .install file
   */
  private generateInstallFile(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const content = `<?php

/**
 * @file
 * Install, update and uninstall functions for the ${moduleInfo.name} module.
 */

/**
 * Implements hook_install().
 */
function ${moduleInfo.machineName}_install() {
  // Perform actions when the module is installed.
  \\Drupal::messenger()->addMessage(t('${moduleInfo.name} module has been installed.'));
}

/**
 * Implements hook_uninstall().
 */
function ${moduleInfo.machineName}_uninstall() {
  // Perform actions when the module is uninstalled.
  \\Drupal::messenger()->addMessage(t('${moduleInfo.name} module has been uninstalled.'));
}

/**
 * Implements hook_schema().
 */
function ${moduleInfo.machineName}_schema() {
  $schema = [];

  // Example table schema
  $schema['${moduleInfo.machineName}_example'] = [
    'description' => 'Example table for ${moduleInfo.name}.',
    'fields' => [
      'id' => [
        'type' => 'serial',
        'not null' => TRUE,
        'description' => 'Primary Key: Unique record ID.',
      ],
      'name' => [
        'type' => 'varchar',
        'length' => 255,
        'not null' => TRUE,
        'default' => '',
        'description' => 'Name field.',
      ],
      'created' => [
        'type' => 'int',
        'not null' => TRUE,
        'default' => 0,
        'description' => 'Timestamp for when record was created.',
      ],
    ],
    'primary key' => ['id'],
    'indexes' => [
      'name' => ['name'],
      'created' => ['created'],
    ],
  ];

  return $schema;
}
`;

    return {
      path: join(modulePath, `${moduleInfo.machineName}.install`),
      content,
      description: 'Installation and schema hooks'
    };
  }

  /**
   * Generate routing.yml file
   */
  private generateRoutingYml(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const controllerClass = this.pascalCase(moduleInfo.machineName);
    const content = `${moduleInfo.machineName}.admin:
  path: '/admin/config/system/${moduleInfo.machineName}'
  defaults:
    _controller: '\\Drupal\\${moduleInfo.machineName}\\Controller\\${controllerClass}Controller::adminPage'
    _title: '${moduleInfo.name} Settings'
  requirements:
    _permission: 'administer ${moduleInfo.machineName}'

${moduleInfo.machineName}.example:
  path: '/${moduleInfo.machineName}/example'
  defaults:
    _controller: '\\Drupal\\${moduleInfo.machineName}\\Controller\\${controllerClass}Controller::examplePage'
    _title: '${moduleInfo.name} Example'
  requirements:
    _access: 'TRUE'
`;

    return {
      path: join(modulePath, `${moduleInfo.machineName}.routing.yml`),
      content,
      description: 'Route definitions'
    };
  }

  /**
   * Generate services.yml file
   */
  private generateServicesYml(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const content = `services:
  ${moduleInfo.machineName}.manager:
    class: Drupal\\${moduleInfo.machineName}\\${this.pascalCase(moduleInfo.machineName)}Manager
    arguments: ['@entity_type.manager', '@config.factory', '@logger.channel.${moduleInfo.machineName}']

  logger.channel.${moduleInfo.machineName}:
    parent: logger.channel_base
    arguments: ['${moduleInfo.machineName}']
`;

    return {
      path: join(modulePath, `${moduleInfo.machineName}.services.yml`),
      content,
      description: 'Service definitions'
    };
  }

  /**
   * Generate permissions.yml file
   */
  private generatePermissionsYml(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const content = `administer ${moduleInfo.machineName}:
  title: 'Administer ${moduleInfo.name}'
  description: 'Perform administrative tasks for ${moduleInfo.name}.'
  restrict access: true

access ${moduleInfo.machineName} content:
  title: 'Access ${moduleInfo.name} content'
  description: 'View content created by ${moduleInfo.name}.'

create ${moduleInfo.machineName} content:
  title: 'Create ${moduleInfo.name} content'
  description: 'Create new content using ${moduleInfo.name}.'

edit ${moduleInfo.machineName} content:
  title: 'Edit ${moduleInfo.name} content'
  description: 'Edit existing content created by ${moduleInfo.name}.'

delete ${moduleInfo.machineName} content:
  title: 'Delete ${moduleInfo.name} content'
  description: 'Delete content created by ${moduleInfo.name}.'
`;

    return {
      path: join(modulePath, `${moduleInfo.machineName}.permissions.yml`),
      content,
      description: 'Permission definitions'
    };
  }

  /**
   * Generate config schema
   */
  private generateConfigSchema(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const schemaPath = join(modulePath, 'config', 'schema');
    if (!existsSync(schemaPath)) {
      mkdirSync(schemaPath, { recursive: true });
    }

    const content = `${moduleInfo.machineName}.settings:
  type: config_object
  label: '${moduleInfo.name} settings'
  mapping:
    api_key:
      type: string
      label: 'API Key'
    debug_mode:
      type: boolean
      label: 'Debug mode'
    max_items:
      type: integer
      label: 'Maximum items'
    default_message:
      type: text
      label: 'Default message'
`;

    return {
      path: join(schemaPath, `${moduleInfo.machineName}.schema.yml`),
      content,
      description: 'Configuration schema definitions'
    };
  }

  /**
   * Generate Controller class
   */
  private generateControllerClass(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const srcPath = join(modulePath, 'src', 'Controller');
    if (!existsSync(srcPath)) {
      mkdirSync(srcPath, { recursive: true });
    }

    const className = this.pascalCase(moduleInfo.machineName);
    const content = `<?php

namespace Drupal\\${moduleInfo.machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Drupal\\Core\\Config\\ConfigFactoryInterface;
use Drupal\\Core\\Logger\\LoggerChannelFactoryInterface;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;

/**
 * Controller for ${moduleInfo.name}.
 */
class ${className}Controller extends ControllerBase {

  /**
   * The entity type manager.
   *
   * @var \\Drupal\\Core\\Entity\\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The config factory.
   *
   * @var \\Drupal\\Core\\Config\\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The logger factory.
   *
   * @var \\Drupal\\Core\\Logger\\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * Constructs a new ${className}Controller object.
   *
   * @param \\Drupal\\Core\\Entity\\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \\Drupal\\Core\\Config\\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \\Drupal\\Core\\Logger\\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager, ConfigFactoryInterface $config_factory, LoggerChannelFactoryInterface $logger_factory) {
    $this->entityTypeManager = $entity_type_manager;
    $this->configFactory = $config_factory;
    $this->loggerFactory = $logger_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('config.factory'),
      $container->get('logger.factory')
    );
  }

  /**
   * Display the admin page.
   *
   * @return array
   *   A render array.
   */
  public function adminPage() {
    $config = $this->configFactory->get('${moduleInfo.machineName}.settings');
    
    $build = [
      '#theme' => 'item_list',
      '#title' => $this->t('${moduleInfo.name} Administration'),
      '#items' => [
        $this->t('Module is working correctly.'),
        $this->t('Configuration can be found at: /admin/config/system/${moduleInfo.machineName}'),
        $this->t('Current settings: @settings', [
          '@settings' => json_encode($config->getRawData())
        ]),
      ],
    ];

    return $build;
  }

  /**
   * Display an example page.
   *
   * @return array
   *   A render array.
   */
  public function examplePage() {
    return [
      '#markup' => $this->t('This is an example page from the ${moduleInfo.name} module.'),
    ];
  }

}
`;

    return {
      path: join(srcPath, `${className}Controller.php`),
      content,
      description: 'Controller class for handling HTTP requests'
    };
  }

  /**
   * Generate Form class
   */
  private generateFormClass(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const srcPath = join(modulePath, 'src', 'Form');
    if (!existsSync(srcPath)) {
      mkdirSync(srcPath, { recursive: true });
    }

    const className = this.pascalCase(moduleInfo.machineName);
    const content = `<?php

namespace Drupal\\${moduleInfo.machineName}\\Form;

use Drupal\\Core\\Form\\ConfigFormBase;
use Drupal\\Core\\Form\\FormStateInterface;

/**
 * Configuration form for ${moduleInfo.name}.
 */
class ${className}ConfigForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['${moduleInfo.machineName}.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return '${moduleInfo.machineName}_config_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('${moduleInfo.machineName}.settings');

    $form['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('API Key'),
      '#default_value' => $config->get('api_key'),
      '#description' => $this->t('Enter your API key.'),
      '#required' => TRUE,
    ];

    $form['debug_mode'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Debug mode'),
      '#default_value' => $config->get('debug_mode'),
      '#description' => $this->t('Enable debug mode for troubleshooting.'),
    ];

    $form['max_items'] = [
      '#type' => 'number',
      '#title' => $this->t('Maximum items'),
      '#default_value' => $config->get('max_items') ?: 10,
      '#description' => $this->t('Maximum number of items to process.'),
      '#min' => 1,
      '#max' => 100,
    ];

    $form['default_message'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Default message'),
      '#default_value' => $config->get('default_message'),
      '#description' => $this->t('Default message to display.'),
      '#rows' => 3,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('${moduleInfo.machineName}.settings')
      ->set('api_key', $form_state->getValue('api_key'))
      ->set('debug_mode', $form_state->getValue('debug_mode'))
      ->set('max_items', $form_state->getValue('max_items'))
      ->set('default_message', $form_state->getValue('default_message'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
`;

    return {
      path: join(srcPath, `${className}ConfigForm.php`),
      content,
      description: 'Configuration form class'
    };
  }

  /**
   * Generate Entity class
   */
  private generateEntityClass(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const srcPath = join(modulePath, 'src', 'Entity');
    if (!existsSync(srcPath)) {
      mkdirSync(srcPath, { recursive: true });
    }

    const className = this.pascalCase(moduleInfo.machineName);
    const content = `<?php

namespace Drupal\\${moduleInfo.machineName}\\Entity;

use Drupal\\Core\\Entity\\ContentEntityBase;
use Drupal\\Core\\Entity\\EntityChangedTrait;
use Drupal\\Core\\Entity\\EntityTypeInterface;
use Drupal\\Core\\Field\\BaseFieldDefinition;

/**
 * Defines the ${className} entity.
 *
 * @ContentEntityType(
 *   id = "${moduleInfo.machineName}",
 *   label = @Translation("${moduleInfo.name}"),
 *   handlers = {
 *     "view_builder" = "Drupal\\Core\\Entity\\EntityViewBuilder",
 *     "list_builder" = "Drupal\\${moduleInfo.machineName}\\${className}ListBuilder",
 *     "views_data" = "Drupal\\${moduleInfo.machineName}\\Entity\\${className}ViewsData",
 *     "form" = {
 *       "default" = "Drupal\\${moduleInfo.machineName}\\Form\\${className}Form",
 *       "add" = "Drupal\\${moduleInfo.machineName}\\Form\\${className}Form",
 *       "edit" = "Drupal\\${moduleInfo.machineName}\\Form\\${className}Form",
 *       "delete" = "Drupal\\${moduleInfo.machineName}\\Form\\${className}DeleteForm",
 *     },
 *     "access" = "Drupal\\${moduleInfo.machineName}\\${className}AccessControlHandler",
 *     "route_provider" = {
 *       "html" = "Drupal\\${moduleInfo.machineName}\\${className}HtmlRouteProvider",
 *     },
 *   },
 *   base_table = "${moduleInfo.machineName}",
 *   admin_permission = "administer ${moduleInfo.machineName}",
 *   entity_keys = {
 *     "id" = "id",
 *     "label" = "name",
 *     "uuid" = "uuid",
 *   },
 *   links = {
 *     "canonical" = "/${moduleInfo.machineName}/{${moduleInfo.machineName}}",
 *     "add-form" = "/${moduleInfo.machineName}/add",
 *     "edit-form" = "/${moduleInfo.machineName}/{${moduleInfo.machineName}}/edit",
 *     "delete-form" = "/${moduleInfo.machineName}/{${moduleInfo.machineName}}/delete",
 *     "collection" = "/admin/content/${moduleInfo.machineName}",
 *   },
 *   field_ui_base_route = "${moduleInfo.machineName}.settings"
 * )
 */
class ${className} extends ContentEntityBase {

  use EntityChangedTrait;

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields = parent::baseFieldDefinitions($entity_type);

    $fields['name'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Name'))
      ->setDescription(t('The name of the ${className} entity.'))
      ->setSettings([
        'max_length' => 50,
        'text_processing' => 0,
      ])
      ->setDefaultValue('')
      ->setDisplayOptions('view', [
        'label' => 'above',
        'type' => 'string',
        'weight' => -4,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => -4,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE)
      ->setRequired(TRUE);

    $fields['description'] = BaseFieldDefinition::create('text_long')
      ->setLabel(t('Description'))
      ->setDescription(t('A description of the ${className} entity.'))
      ->setDisplayOptions('view', [
        'label' => 'above',
        'type' => 'text_default',
        'weight' => 0,
      ])
      ->setDisplayOptions('form', [
        'type' => 'text_textarea',
        'weight' => 0,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('The time that the entity was created.'));

    $fields['changed'] = BaseFieldDefinition::create('changed')
      ->setLabel(t('Changed'))
      ->setDescription(t('The time that the entity was last edited.'));

    return $fields;
  }

}
`;

    return {
      path: join(srcPath, `${className}.php`),
      content,
      description: 'Content entity class'
    };
  }

  /**
   * Generate Plugin class
   */
  private generatePluginClass(moduleInfo: ModuleInfo, modulePath: string): GeneratedFile {
    const srcPath = join(modulePath, 'src', 'Plugin', 'Block');
    if (!existsSync(srcPath)) {
      mkdirSync(srcPath, { recursive: true });
    }

    const className = this.pascalCase(moduleInfo.machineName);
    const content = `<?php

namespace Drupal\\${moduleInfo.machineName}\\Plugin\\Block;

use Drupal\\Core\\Block\\BlockBase;
use Drupal\\Core\\Block\\BlockPluginInterface;
use Drupal\\Core\\Form\\FormStateInterface;

/**
 * Provides a '${className}' Block.
 *
 * @Block(
 *   id = "${moduleInfo.machineName}_block",
 *   admin_label = @Translation("${moduleInfo.name} Block"),
 *   category = @Translation("${moduleInfo.packageName}"),
 * )
 */
class ${className}Block extends BlockBase implements BlockPluginInterface {

  /**
   * {@inheritdoc}
   */
  public function build() {
    $config = $this->getConfiguration();
    
    return [
      '#markup' => $this->t('Hello from ${moduleInfo.name}! Message: @message', [
        '@message' => $config['block_message'] ?? 'Default message',
      ]),
      '#cache' => [
        'max-age' => 300, // Cache for 5 minutes
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    $form = parent::blockForm($form, $form_state);
    $config = $this->getConfiguration();

    $form['block_message'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Block message'),
      '#description' => $this->t('Message to display in the block.'),
      '#default_value' => $config['block_message'] ?? '',
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    parent::blockSubmit($form, $form_state);
    $this->configuration['block_message'] = $form_state->getValue('block_message');
  }

}
`;

    return {
      path: join(srcPath, `${className}Block.php`),
      content,
      description: 'Block plugin class'
    };
  }

  /**
   * Generate hook implementation
   */
  private generateHookImplementation(machineName: string, hookName: string): string {
    // Generate hook implementation dynamically based on hook name pattern
    return this.generateHookImplementationFromPattern(machineName, hookName);
  }

  /**
   * Generate hook implementation from pattern analysis
   */
  private generateHookImplementationFromPattern(machineName: string, hookName: string): string {
    const hookPatterns: { [key: string]: string } = {
      'hook_theme': `/**
 * Implements hook_theme().
 */
function ${machineName}_theme() {
  return [
    '${machineName}_item' => [
      'variables' => [
        'title' => NULL,
        'content' => NULL,
        'attributes' => [],
      ],
    ],
  ];
}

`,
      'hook_cron': `/**
 * Implements hook_cron().
 */
function ${machineName}_cron() {
  // Perform periodic tasks here.
  \\Drupal::logger('${machineName}')->info('Cron run completed.');
}

`,
      'hook_node_presave': `/**
 * Implements hook_node_presave().
 */
function ${machineName}_node_presave(\\Drupal\\node\\NodeInterface $node) {
  // Perform actions before a node is saved.
}

`,
      'hook_user_login': `/**
 * Implements hook_user_login().
 */
function ${machineName}_user_login(\\Drupal\\user\\UserInterface $account) {
  // Perform actions when a user logs in.
  \\Drupal::messenger()->addMessage(t('Welcome back, @name!', ['@name' => $account->getDisplayName()]));
}

`,
      'hook_form_alter': `/**
 * Implements hook_form_alter().
 */
function ${machineName}_form_alter(&$form, \\Drupal\\Core\\Form\\FormStateInterface $form_state, $form_id) {
  // Alter forms here.
  if ($form_id == 'node_page_form') {
    // Example: Alter the page node form.
  }
}

`
    };

    return hookPatterns[hookName] || `/**
 * Implements ${hookName}().
 */
function ${machineName}_${hookName.replace('hook_', '')}() {
  // TODO: Implement ${hookName}.
}

`;
  }

  /**
   * Convert string to PascalCase
   */
  private pascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Get available hook options dynamically from Drupal API documentation
   */
  async getAvailableHooks(): Promise<string[]> {
    try {
      // Fetch hooks from live Drupal API documentation
      const response = await fetch('https://api.drupal.org/api/drupal/11.x/search/hook_', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCP-Drupal-Server/1.2.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract hook names from API response
      if (data && Array.isArray(data)) {
        const hooks = data
          .filter((item: any) => item.title && item.title.startsWith('hook_'))
          .map((item: any) => item.title)
          .slice(0, 50); // Limit to most relevant hooks
        
        return hooks.length > 0 ? hooks : [];
      }
      
      throw new Error('No hooks found in API response');
    } catch (error) {
      console.error('Failed to fetch hooks from API:', error);
      throw new Error('Unable to fetch current hooks from Drupal API documentation');
    }
  }

  /**
   * Get recommended module structure
   */
  getRecommendedStructure(): string {
    return `
Recommended Drupal Module Structure:
├── module_name.info.yml          (Module information)
├── module_name.module            (Hook implementations)
├── module_name.install           (Installation hooks)
├── module_name.routing.yml       (Route definitions)
├── module_name.services.yml      (Service definitions)
├── module_name.permissions.yml   (Permission definitions)
├── config/
│   ├── schema/
│   │   └── module_name.schema.yml
│   └── install/
│       └── module_name.settings.yml
├── src/
│   ├── Controller/
│   │   └── ModuleNameController.php
│   ├── Form/
│   │   └── ModuleNameConfigForm.php
│   ├── Entity/
│   │   └── ModuleName.php
│   ├── Plugin/
│   │   └── Block/
│   │       └── ModuleNameBlock.php
│   └── ModuleNameManager.php
├── templates/
│   └── module-name-item.html.twig
└── tests/
    └── src/
        └── Functional/
            └── ModuleNameTest.php
`;
  }
}
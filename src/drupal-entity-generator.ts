import { DrupalModuleGenerator } from './drupal-module-generator.js';
import * as path from 'path';

export interface BaseField {
  name: string;
  type: 'string' | 'text' | 'integer' | 'boolean' | 'datetime' | 'decimal' | 'entity_reference' | 'file' | 'image';
  label: string;
  required?: boolean;
  description?: string;
  defaultValue?: any;
  cardinality?: number; // -1 for unlimited
  settings?: Record<string, any>;
}

export interface Bundle {
  id: string;
  label: string;
  description?: string;
  fields?: BaseField[];
}

export interface EntityGeneratorOptions {
  entityType: string;
  label: string;
  labelPlural?: string;
  description?: string;
  bundles?: Bundle[];
  baseFields?: BaseField[];
  revisionable?: boolean;
  translatable?: boolean;
  includeRestApi?: boolean;
  includeViews?: boolean;
  includeAdminUI?: boolean;
  includeAccessControl?: boolean;
  includeListBuilder?: boolean;
  includeViewBuilder?: boolean;
  includeStorage?: boolean;
  includeForm?: boolean;
  includeDeleteForm?: boolean;
  includeTests?: boolean;
  permissions?: string[];
}

export interface GeneratedEntityFile {
  path: string;
  content: string;
  description: string;
}

export class DrupalEntityGenerator {
  private moduleGenerator: DrupalModuleGenerator;

  constructor() {
    this.moduleGenerator = new DrupalModuleGenerator();
  }

  async generateCustomEntity(
    moduleInfo: {
      name: string;
      machineName: string;
      namespace: string;
    },
    options: EntityGeneratorOptions,
    outputDir: string = './generated_entity'
  ): Promise<GeneratedEntityFile[]> {
    const files: GeneratedEntityFile[] = [];
    const entityClass = this.toPascalCase(options.entityType);
    const namespace = moduleInfo.namespace || `Drupal\\${moduleInfo.machineName}`;

    // Generate main entity class
    files.push(this.generateEntityClass(namespace, entityClass, options));

    // Generate entity interface
    files.push(this.generateEntityInterface(namespace, entityClass, options));

    // Generate storage interface and class if requested
    if (options.includeStorage !== false) {
      files.push(this.generateStorageInterface(namespace, entityClass));
      files.push(this.generateStorageClass(namespace, entityClass, options));
    }

    // Generate list builder if requested
    if (options.includeListBuilder !== false) {
      files.push(this.generateListBuilder(namespace, entityClass, options));
    }

    // Generate view builder if requested
    if (options.includeViewBuilder !== false) {
      files.push(this.generateViewBuilder(namespace, entityClass));
    }

    // Generate forms
    if (options.includeForm !== false) {
      files.push(this.generateEntityForm(namespace, entityClass, options));
      if (options.includeDeleteForm !== false) {
        files.push(this.generateDeleteForm(namespace, entityClass));
      }
    }

    // Generate access control handler
    if (options.includeAccessControl !== false) {
      files.push(this.generateAccessControlHandler(namespace, entityClass, options));
    }

    // Generate routing file
    files.push(this.generateRouting(moduleInfo.machineName, options));

    // Generate permissions
    files.push(this.generatePermissions(moduleInfo.machineName, options));

    // Generate links tasks
    files.push(this.generateLinksTasks(moduleInfo.machineName, options));

    // Generate links actions
    files.push(this.generateLinksActions(moduleInfo.machineName, options));

    // Generate entity type definition in .module file
    files.push(this.generateModuleFile(moduleInfo.machineName, options));

    // Generate REST resource if requested
    if (options.includeRestApi) {
      files.push(this.generateRestResource(namespace, entityClass, options));
    }

    // Generate Views integration if requested
    if (options.includeViews) {
      files.push(this.generateViewsData(moduleInfo.machineName, options));
    }

    // Generate tests if requested
    if (options.includeTests) {
      files.push(...this.generateTests(namespace, entityClass, options));
    }

    // Generate config schema
    files.push(this.generateConfigSchema(moduleInfo.machineName, options));

    // Generate install file for schema
    files.push(this.generateInstallFile(moduleInfo.machineName, options));

    return files;
  }

  private generateEntityClass(namespace: string, entityClass: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace}\\Entity;

use Drupal\\Core\\Entity\\ContentEntityBase;
use Drupal\\Core\\Entity\\EntityChangedTrait;
use Drupal\\Core\\Entity\\EntityTypeInterface;
use Drupal\\Core\\Field\\BaseFieldDefinition;
${options.revisionable ? "use Drupal\\Core\\Entity\\RevisionableInterface;\nuse Drupal\\Core\\Entity\\RevisionLogEntityTrait;" : ''}
${options.translatable ? "use Drupal\\Core\\Entity\\TranslatableInterface;" : ''}
use Drupal\\user\\UserInterface;
use ${namespace}\\${entityClass}Interface;

/**
 * Defines the ${options.label} entity class.
 *
 * @ContentEntityType(
 *   id = "${options.entityType}",
 *   label = @Translation("${options.label}"),
 *   label_collection = @Translation("${options.labelPlural || options.label + 's'}"),
 *   label_singular = @Translation("${options.label.toLowerCase()}"),
 *   label_plural = @Translation("${(options.labelPlural || options.label + 's').toLowerCase()}"),
 *   label_count = @PluralTranslation(
 *     singular = "@count ${options.label.toLowerCase()}",
 *     plural = "@count ${(options.labelPlural || options.label + 's').toLowerCase()}",
 *   ),
 *   handlers = {
${options.includeStorage !== false ? `*     "storage" = "${namespace}\\${entityClass}Storage",` : '*     "storage" = "Drupal\\Core\\Entity\\Sql\\SqlContentEntityStorage",'}
${options.includeViewBuilder !== false ? `*     "view_builder" = "${namespace}\\${entityClass}ViewBuilder",` : '*     "view_builder" = "Drupal\\Core\\Entity\\EntityViewBuilder",'}
${options.includeListBuilder !== false ? `*     "list_builder" = "${namespace}\\${entityClass}ListBuilder",` : '*     "list_builder" = "Drupal\\Core\\Entity\\EntityListBuilder",'}
${options.includeViews ? '*     "views_data" = "Drupal\\views\\EntityViewsData",' : ''}
${options.includeForm !== false ? `*     "form" = {
 *       "default" = "${namespace}\\Form\\${entityClass}Form",
 *       "add" = "${namespace}\\Form\\${entityClass}Form",
 *       "edit" = "${namespace}\\Form\\${entityClass}Form",
${options.includeDeleteForm !== false ? `*       "delete" = "${namespace}\\Form\\${entityClass}DeleteForm",` : '*       "delete" = "Drupal\\Core\\Entity\\ContentEntityDeleteForm",'}
 *     },` : ''}
${options.includeAccessControl !== false ? `*     "access" = "${namespace}\\${entityClass}AccessControlHandler",` : '*     "access" = "Drupal\\Core\\Entity\\EntityAccessControlHandler",'}
 *   },
 *   base_table = "${options.entityType}",
${options.revisionable ? `*   revision_table = "${options.entityType}_revision",
 *   revision_data_table = "${options.entityType}_field_revision",` : ''}
${options.translatable ? `*   translatable = TRUE,` : ''}
 *   admin_permission = "administer ${options.entityType}",
 *   entity_keys = {
 *     "id" = "id",
 *     "label" = "title",
 *     "uuid" = "uuid",
${options.revisionable ? '*     "revision" = "revision_id",' : ''}
${options.translatable ? '*     "langcode" = "langcode",' : ''}
 *   },
${options.revisionable ? `*   revision_metadata_keys = {
 *     "revision_user" = "revision_user",
 *     "revision_created" = "revision_created",
 *     "revision_log_message" = "revision_log_message",
 *   },` : ''}
 *   links = {
 *     "canonical" = "/admin/content/${options.entityType}/{${options.entityType}}",
 *     "add-form" = "/admin/content/${options.entityType}/add",
 *     "edit-form" = "/admin/content/${options.entityType}/{${options.entityType}}/edit",
 *     "delete-form" = "/admin/content/${options.entityType}/{${options.entityType}}/delete",
 *     "collection" = "/admin/content/${options.entityType}",
 *   },
 *   field_ui_base_route = "${options.entityType}.settings",
 * )
 */
class ${entityClass} extends ContentEntityBase implements ${entityClass}Interface${options.revisionable ? ', RevisionableInterface' : ''}${options.translatable ? ', TranslatableInterface' : ''} {

  use EntityChangedTrait;
${options.revisionable ? '  use RevisionLogEntityTrait;' : ''}

  /**
   * {@inheritdoc}
   */
  public function getTitle(): string {
    return $this->get('title')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setTitle(string $title): ${entityClass}Interface {
    $this->set('title', $title);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getCreatedTime(): int {
    return $this->get('created')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setCreatedTime(int $timestamp): ${entityClass}Interface {
    $this->set('created', $timestamp);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getOwner(): UserInterface {
    return $this->get('uid')->entity;
  }

  /**
   * {@inheritdoc}
   */
  public function getOwnerId(): int {
    return $this->get('uid')->target_id;
  }

  /**
   * {@inheritdoc}
   */
  public function setOwnerId($uid): ${entityClass}Interface {
    $this->set('uid', $uid);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function setOwner(UserInterface $account): ${entityClass}Interface {
    $this->set('uid', $account->id());
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type): array {
    $fields = parent::baseFieldDefinitions($entity_type);
${options.revisionable ? '    $fields += static::revisionLogBaseFieldDefinitions($entity_type);' : ''}

    $fields['title'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Title'))
      ->setDescription(t('The title of the ${options.label} entity.'))
      ->setRequired(TRUE)
${options.revisionable ? '      ->setRevisionable(TRUE)' : ''}
      ->setSetting('max_length', 255)
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => -5,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayOptions('view', [
        'label' => 'hidden',
        'type' => 'string',
        'weight' => -5,
      ])
      ->setDisplayConfigurable('view', TRUE);

    $fields['description'] = BaseFieldDefinition::create('text_long')
      ->setLabel(t('Description'))
      ->setDescription(t('A description of the ${options.label}.'))
${options.revisionable ? '      ->setRevisionable(TRUE)' : ''}
      ->setDisplayOptions('form', [
        'type' => 'text_textarea',
        'weight' => 0,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayOptions('view', [
        'type' => 'text_default',
        'label' => 'above',
        'weight' => 0,
      ])
      ->setDisplayConfigurable('view', TRUE);

    $fields['uid'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Author'))
      ->setDescription(t('The user ID of the ${options.label} author.'))
${options.revisionable ? '      ->setRevisionable(TRUE)' : ''}
      ->setSetting('target_type', 'user')
      ->setDefaultValueCallback('Drupal\\Core\\Entity\\EntityOwnerInterface::getDefaultEntityOwner')
      ->setDisplayOptions('form', [
        'type' => 'entity_reference_autocomplete',
        'settings' => [
          'match_operator' => 'CONTAINS',
          'size' => '60',
          'placeholder' => '',
        ],
        'weight' => 15,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayOptions('view', [
        'label' => 'above',
        'type' => 'author',
        'weight' => 15,
      ])
      ->setDisplayConfigurable('view', TRUE);

    $fields['status'] = BaseFieldDefinition::create('boolean')
      ->setLabel(t('Published'))
      ->setDescription(t('A boolean indicating whether the ${options.label} is published.'))
${options.revisionable ? '      ->setRevisionable(TRUE)' : ''}
      ->setDefaultValue(TRUE)
      ->setDisplayOptions('form', [
        'type' => 'boolean_checkbox',
        'settings' => [
          'display_label' => TRUE,
        ],
        'weight' => 20,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayOptions('view', [
        'type' => 'boolean',
        'label' => 'above',
        'weight' => 0,
        'settings' => [
          'format' => 'true-false',
        ],
      ])
      ->setDisplayConfigurable('view', TRUE);

    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('The time that the ${options.label} was created.'));

    $fields['changed'] = BaseFieldDefinition::create('changed')
      ->setLabel(t('Changed'))
      ->setDescription(t('The time that the ${options.label} was last edited.'));

${this.generateBaseFieldsCode(options.baseFields || [])}

    return $fields;
  }

}
`;

    return {
      path: `src/Entity/${entityClass}.php`,
      content,
      description: `Main entity class for ${options.label}`
    };
  }

  private generateEntityInterface(namespace: string, entityClass: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace};

use Drupal\\Core\\Entity\\ContentEntityInterface;
use Drupal\\Core\\Entity\\EntityChangedInterface;
use Drupal\\user\\EntityOwnerInterface;
${options.revisionable ? 'use Drupal\\Core\\Entity\\RevisionLogInterface;' : ''}

/**
 * Provides an interface defining a ${options.label} entity type.
 */
interface ${entityClass}Interface extends ContentEntityInterface, EntityOwnerInterface, EntityChangedInterface${options.revisionable ? ', RevisionLogInterface' : ''} {

  /**
   * Gets the ${options.label} title.
   *
   * @return string
   *   The ${options.label} title.
   */
  public function getTitle(): string;

  /**
   * Sets the ${options.label} title.
   *
   * @param string $title
   *   The ${options.label} title.
   *
   * @return \\${namespace}\\${entityClass}Interface
   *   The called ${options.label} entity.
   */
  public function setTitle(string $title): ${entityClass}Interface;

  /**
   * Gets the ${options.label} creation timestamp.
   *
   * @return int
   *   Creation timestamp of the ${options.label}.
   */
  public function getCreatedTime(): int;

  /**
   * Sets the ${options.label} creation timestamp.
   *
   * @param int $timestamp
   *   The ${options.label} creation timestamp.
   *
   * @return \\${namespace}\\${entityClass}Interface
   *   The called ${options.label} entity.
   */
  public function setCreatedTime(int $timestamp): ${entityClass}Interface;

}
`;

    return {
      path: `src/${entityClass}Interface.php`,
      content,
      description: `Interface for ${options.label} entity`
    };
  }

  private generateStorageInterface(namespace: string, entityClass: string): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace};

use Drupal\\Core\\Entity\\ContentEntityStorageInterface;

/**
 * Defines the interface for ${entityClass} storage.
 */
interface ${entityClass}StorageInterface extends ContentEntityStorageInterface {

  /**
   * Gets a list of revision IDs for a specific ${entityClass}.
   *
   * @param \\${namespace}\\${entityClass}Interface $entity
   *   The ${entityClass} entity.
   *
   * @return int[]
   *   An array of revision IDs.
   */
  public function revisionIds(${entityClass}Interface $entity): array;

  /**
   * Gets a list of ${entityClass} revision IDs for a specific user.
   *
   * @param \\Drupal\\Core\\Session\\AccountInterface $account
   *   The user entity.
   *
   * @return int[]
   *   An array of ${entityClass} revision IDs.
   */
  public function userRevisionIds(AccountInterface $account): array;

}
`;

    return {
      path: `src/${entityClass}StorageInterface.php`,
      content,
      description: `Storage interface for ${entityClass}`
    };
  }

  private generateStorageClass(namespace: string, entityClass: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace};

use Drupal\\Core\\Entity\\Sql\\SqlContentEntityStorage;
use Drupal\\Core\\Session\\AccountInterface;

/**
 * Defines the storage handler class for ${options.label} entities.
 */
class ${entityClass}Storage extends SqlContentEntityStorage implements ${entityClass}StorageInterface {

  /**
   * {@inheritdoc}
   */
  public function revisionIds(${entityClass}Interface $entity): array {
    return $this->database->query(
      'SELECT revision_id FROM {${options.entityType}_revision} WHERE id = :id ORDER BY revision_id',
      [':id' => $entity->id()]
    )->fetchCol();
  }

  /**
   * {@inheritdoc}
   */
  public function userRevisionIds(AccountInterface $account): array {
    return $this->database->query(
      'SELECT revision_id FROM {${options.entityType}_field_revision} WHERE uid = :uid ORDER BY revision_id',
      [':uid' => $account->id()]
    )->fetchCol();
  }

}
`;

    return {
      path: `src/${entityClass}Storage.php`,
      content,
      description: `Storage handler for ${options.label} entities`
    };
  }

  private generateListBuilder(namespace: string, entityClass: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace};

use Drupal\\Core\\Entity\\EntityInterface;
use Drupal\\Core\\Entity\\EntityListBuilder;
use Drupal\\Core\\Link;
use Drupal\\Core\\Url;

/**
 * Provides a list controller for the ${options.label} entity type.
 */
class ${entityClass}ListBuilder extends EntityListBuilder {

  /**
   * {@inheritdoc}
   */
  public function buildHeader(): array {
    $header['id'] = $this->t('ID');
    $header['title'] = $this->t('Title');
    $header['author'] = $this->t('Author');
    $header['status'] = $this->t('Status');
    $header['created'] = $this->t('Created');
    $header['changed'] = $this->t('Updated');
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity): array {
    /** @var \\${namespace}\\${entityClass}Interface $entity */
    $row['id'] = $entity->id();
    $row['title'] = Link::createFromRoute(
      $entity->getTitle(),
      'entity.${options.entityType}.canonical',
      ['${options.entityType}' => $entity->id()]
    );
    $row['author'] = $entity->getOwner()->getDisplayName();
    $row['status'] = $entity->get('status')->value ? $this->t('Published') : $this->t('Unpublished');
    $row['created'] = \\Drupal::service('date.formatter')->format($entity->getCreatedTime(), 'short');
    $row['changed'] = \\Drupal::service('date.formatter')->format($entity->getChangedTime(), 'short');
    return $row + parent::buildRow($entity);
  }

  /**
   * {@inheritdoc}
   */
  protected function getDefaultOperations(EntityInterface $entity): array {
    $operations = parent::getDefaultOperations($entity);
    
    // Add custom operations if needed
    if ($entity->access('update') && $entity->hasLinkTemplate('edit-form')) {
      $operations['edit'] = [
        'title' => $this->t('Edit'),
        'weight' => 10,
        'url' => $this->ensureDestination($entity->toUrl('edit-form')),
      ];
    }
    
    if ($entity->access('delete') && $entity->hasLinkTemplate('delete-form')) {
      $operations['delete'] = [
        'title' => $this->t('Delete'),
        'weight' => 100,
        'url' => $this->ensureDestination($entity->toUrl('delete-form')),
      ];
    }
    
    return $operations;
  }

}
`;

    return {
      path: `src/${entityClass}ListBuilder.php`,
      content,
      description: `List builder for ${options.label} entities`
    };
  }

  private generateViewBuilder(namespace: string, entityClass: string): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace};

use Drupal\\Core\\Entity\\EntityInterface;
use Drupal\\Core\\Entity\\EntityViewBuilder;

/**
 * View builder handler for ${entityClass} entities.
 */
class ${entityClass}ViewBuilder extends EntityViewBuilder {

  /**
   * {@inheritdoc}
   */
  public function buildComponents(array &$build, array $entities, array $displays, $view_mode): void {
    parent::buildComponents($build, $entities, $displays, $view_mode);

    foreach ($entities as $id => $entity) {
      // Add custom components to the build array
      $build[$id]['#theme'] = '${entityClass.toLowerCase()}';
      $build[$id]['#${entityClass.toLowerCase()}'] = $entity;
    }
  }

}
`;

    return {
      path: `src/${entityClass}ViewBuilder.php`,
      content,
      description: `View builder for ${entityClass} entities`
    };
  }

  private generateEntityForm(namespace: string, entityClass: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace}\\Form;

use Drupal\\Core\\Entity\\ContentEntityForm;
use Drupal\\Core\\Form\\FormStateInterface;

/**
 * Form controller for the ${options.label} entity edit forms.
 */
class ${entityClass}Form extends ContentEntityForm {

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form = parent::buildForm($form, $form_state);

    /** @var \\${namespace}\\${entityClass}Interface $entity */
    $entity = $this->entity;

    // Add custom form elements here
    $form['#attached']['library'][] = '${options.entityType}/${options.entityType}_form';

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function save(array $form, FormStateInterface $form_state): int {
    $result = parent::save($form, $form_state);

    /** @var \\${namespace}\\${entityClass}Interface $entity */
    $entity = $this->entity;

    $message_args = ['%label' => $entity->getTitle()];
    $logger_args = [
      '%label' => $entity->getTitle(),
      'link' => $entity->toLink($this->t('View'))->toString(),
    ];

    switch ($result) {
      case SAVED_NEW:
        $this->messenger()->addStatus($this->t('New ${options.label} %label has been created.', $message_args));
        $this->logger('${options.entityType}')->notice('Created new ${options.label} %label', $logger_args);
        break;

      case SAVED_UPDATED:
        $this->messenger()->addStatus($this->t('The ${options.label} %label has been updated.', $message_args));
        $this->logger('${options.entityType}')->notice('Updated ${options.label} %label.', $logger_args);
        break;
    }

    $form_state->setRedirect('entity.${options.entityType}.canonical', ['${options.entityType}' => $entity->id()]);

    return $result;
  }

}
`;

    return {
      path: `src/Form/${entityClass}Form.php`,
      content,
      description: `Form for creating and editing ${options.label} entities`
    };
  }

  private generateDeleteForm(namespace: string, entityClass: string): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace}\\Form;

use Drupal\\Core\\Entity\\ContentEntityDeleteForm;

/**
 * Provides a form for deleting a ${entityClass} entity.
 */
class ${entityClass}DeleteForm extends ContentEntityDeleteForm {

  /**
   * {@inheritdoc}
   */
  public function getQuestion(): string {
    return $this->t('Are you sure you want to delete %name?', [
      '%name' => $this->entity->label(),
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function getCancelUrl() {
    return $this->entity->toUrl('collection');
  }

  /**
   * {@inheritdoc}
   */
  public function getConfirmText(): string {
    return $this->t('Delete');
  }

}
`;

    return {
      path: `src/Form/${entityClass}DeleteForm.php`,
      content,
      description: `Delete confirmation form for ${entityClass} entities`
    };
  }

  private generateAccessControlHandler(namespace: string, entityClass: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace};

use Drupal\\Core\\Access\\AccessResult;
use Drupal\\Core\\Entity\\EntityAccessControlHandler;
use Drupal\\Core\\Entity\\EntityInterface;
use Drupal\\Core\\Session\\AccountInterface;

/**
 * Defines the access control handler for the ${options.label} entity type.
 */
class ${entityClass}AccessControlHandler extends EntityAccessControlHandler {

  /**
   * {@inheritdoc}
   */
  protected function checkAccess(EntityInterface $entity, $operation, AccountInterface $account) {
    /** @var \\${namespace}\\${entityClass}Interface $entity */
    switch ($operation) {
      case 'view':
        if (!$entity->get('status')->value) {
          return AccessResult::allowedIfHasPermission($account, 'view unpublished ${options.entityType}')
            ->cachePerPermissions()
            ->addCacheableDependency($entity);
        }
        return AccessResult::allowedIfHasPermission($account, 'view ${options.entityType}')
          ->cachePerPermissions()
          ->addCacheableDependency($entity);

      case 'update':
        if ($account->hasPermission('edit any ${options.entityType}')) {
          return AccessResult::allowed()->cachePerPermissions();
        }
        return AccessResult::allowedIf(
          $account->hasPermission('edit own ${options.entityType}') &&
          $account->id() == $entity->getOwnerId()
        )->cachePerPermissions()->cachePerUser()->addCacheableDependency($entity);

      case 'delete':
        if ($account->hasPermission('delete any ${options.entityType}')) {
          return AccessResult::allowed()->cachePerPermissions();
        }
        return AccessResult::allowedIf(
          $account->hasPermission('delete own ${options.entityType}') &&
          $account->id() == $entity->getOwnerId()
        )->cachePerPermissions()->cachePerUser()->addCacheableDependency($entity);

      default:
        return AccessResult::neutral();
    }
  }

  /**
   * {@inheritdoc}
   */
  protected function checkCreateAccess(AccountInterface $account, array $context, $entity_bundle = NULL) {
    return AccessResult::allowedIfHasPermission($account, 'create ${options.entityType}')
      ->cachePerPermissions();
  }

}
`;

    return {
      path: `src/${entityClass}AccessControlHandler.php`,
      content,
      description: `Access control handler for ${options.label} entities`
    };
  }

  private generateRouting(machineName: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `entity.${options.entityType}.settings:
  path: '/admin/structure/${options.entityType}'
  defaults:
    _controller: '\\Drupal\\system\\Controller\\SystemController::systemAdminMenuBlockPage'
    _title: '${options.label} settings'
  requirements:
    _permission: 'administer ${options.entityType}'

entity.${options.entityType}.add_form:
  path: '/admin/content/${options.entityType}/add'
  defaults:
    _entity_form: '${options.entityType}.add'
    _title: 'Add ${options.label}'
  requirements:
    _permission: 'create ${options.entityType}'

entity.${options.entityType}.canonical:
  path: '/admin/content/${options.entityType}/{${options.entityType}}'
  defaults:
    _entity_view: '${options.entityType}.full'
    _title_callback: '\\Drupal\\Core\\Entity\\Controller\\EntityController::title'
  requirements:
    _entity_access: '${options.entityType}.view'
    ${options.entityType}: \\d+

entity.${options.entityType}.collection:
  path: '/admin/content/${options.entityType}'
  defaults:
    _entity_list: '${options.entityType}'
    _title: '${options.labelPlural || options.label + 's'}'
  requirements:
    _permission: 'view ${options.entityType}'

entity.${options.entityType}.edit_form:
  path: '/admin/content/${options.entityType}/{${options.entityType}}/edit'
  defaults:
    _entity_form: '${options.entityType}.edit'
    _title: 'Edit ${options.label}'
  requirements:
    _entity_access: '${options.entityType}.update'
    ${options.entityType}: \\d+

entity.${options.entityType}.delete_form:
  path: '/admin/content/${options.entityType}/{${options.entityType}}/delete'
  defaults:
    _entity_form: '${options.entityType}.delete'
    _title: 'Delete ${options.label}'
  requirements:
    _entity_access: '${options.entityType}.delete'
    ${options.entityType}: \\d+
`;

    return {
      path: `${machineName}.routing.yml`,
      content,
      description: 'Routing configuration for entity pages'
    };
  }

  private generatePermissions(machineName: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const permissions = [
      `administer ${options.entityType}:
  title: 'Administer ${options.label} settings'
  restrict access: true`,
      `create ${options.entityType}:
  title: 'Create new ${options.label} entities'`,
      `view ${options.entityType}:
  title: 'View published ${options.label} entities'`,
      `view unpublished ${options.entityType}:
  title: 'View unpublished ${options.label} entities'`,
      `edit any ${options.entityType}:
  title: 'Edit any ${options.label} entity'`,
      `edit own ${options.entityType}:
  title: 'Edit own ${options.label} entities'`,
      `delete any ${options.entityType}:
  title: 'Delete any ${options.label} entity'`,
      `delete own ${options.entityType}:
  title: 'Delete own ${options.label} entities'`
    ];

    if (options.revisionable) {
      permissions.push(
        `view ${options.entityType} revisions:
  title: 'View ${options.label} revisions'`,
        `revert ${options.entityType} revisions:
  title: 'Revert ${options.label} revisions'
  restrict access: true`,
        `delete ${options.entityType} revisions:
  title: 'Delete ${options.label} revisions'
  restrict access: true`
      );
    }

    const content = permissions.join('\n\n');

    return {
      path: `${machineName}.permissions.yml`,
      content,
      description: 'Permission definitions for entity operations'
    };
  }

  private generateLinksTasks(machineName: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `entity.${options.entityType}.collection:
  title: '${options.labelPlural || options.label + 's'}'
  route_name: entity.${options.entityType}.collection
  base_route: system.admin_content
  weight: 10

entity.${options.entityType}.view:
  title: 'View'
  route_name: entity.${options.entityType}.canonical
  base_route: entity.${options.entityType}.canonical

entity.${options.entityType}.edit_form:
  title: 'Edit'
  route_name: entity.${options.entityType}.edit_form
  base_route: entity.${options.entityType}.canonical
  weight: 10

entity.${options.entityType}.delete_form:
  title: 'Delete'
  route_name: entity.${options.entityType}.delete_form
  base_route: entity.${options.entityType}.canonical
  weight: 20
`;

    return {
      path: `${machineName}.links.task.yml`,
      content,
      description: 'Task links (tabs) for entity pages'
    };
  }

  private generateLinksActions(machineName: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `entity.${options.entityType}.add_form:
  title: 'Add ${options.label}'
  route_name: entity.${options.entityType}.add_form
  appears_on:
    - entity.${options.entityType}.collection
`;

    return {
      path: `${machineName}.links.action.yml`,
      content,
      description: 'Action links for entity pages'
    };
  }

  private generateModuleFile(machineName: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

/**
 * @file
 * Contains ${machineName}.module.
 */

use Drupal\\Core\\Routing\\RouteMatchInterface;

/**
 * Implements hook_help().
 */
function ${machineName}_help($route_name, RouteMatchInterface $route_match) {
  switch ($route_name) {
    case 'help.page.${machineName}':
      $output = '';
      $output .= '<h3>' . t('About') . '</h3>';
      $output .= '<p>' . t('The ${options.label} module provides a custom entity type for managing ${(options.labelPlural || options.label + 's').toLowerCase()}.') . '</p>';
      $output .= '<h3>' . t('Uses') . '</h3>';
      $output .= '<dl>';
      $output .= '<dt>' . t('Creating ${(options.labelPlural || options.label + 's').toLowerCase()}') . '</dt>';
      $output .= '<dd>' . t('Users with the appropriate permissions can create ${options.label} entities.') . '</dd>';
      $output .= '</dl>';
      return $output;

    case 'entity.${options.entityType}.collection':
      return '<p>' . t('${options.labelPlural || options.label + 's'} are customizable entities. You can manage the fields on the <a href=":url">field settings page</a>.', [
        ':url' => \\Drupal\\Core\\Url::fromRoute('entity.${options.entityType}.settings')->toString(),
      ]) . '</p>';
  }
}

/**
 * Implements hook_theme().
 */
function ${machineName}_theme() {
  return [
    '${options.entityType}' => [
      'render element' => 'elements',
      'template' => '${options.entityType}',
      'variables' => [
        '${options.entityType}' => NULL,
        'elements' => [],
        'view_mode' => NULL,
      ],
    ],
  ];
}

/**
 * Prepares variables for ${options.label} templates.
 *
 * Default template: ${options.entityType}.html.twig.
 *
 * @param array $variables
 *   An associative array containing:
 *   - elements: An associative array containing the ${options.label} information and any
 *     fields attached to the entity.
 *   - attributes: HTML attributes for the containing element.
 */
function template_preprocess_${options.entityType}(array &$variables) {
  $variables['${options.entityType}'] = $variables['elements']['#${options.entityType}'];
  $variables['view_mode'] = $variables['elements']['#view_mode'];
  
  // Helpful classes for theming.
  $variables['attributes']['class'][] = '${options.entityType}';
  $variables['attributes']['class'][] = '${options.entityType}--' . $variables['view_mode'];
  
  // Remove the default 'elements' variable to avoid confusion in templates.
  unset($variables['elements']);
}
`;

    return {
      path: `${machineName}.module`,
      content,
      description: 'Main module file with hooks'
    };
  }

  private generateRestResource(namespace: string, entityClass: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

namespace ${namespace}\\Plugin\\rest\\resource;

use Drupal\\rest\\Plugin\\ResourceBase;
use Drupal\\rest\\ResourceResponse;
use Drupal\\Core\\Session\\AccountProxyInterface;
use Psr\\Log\\LoggerInterface;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;
use Symfony\\Component\\HttpKernel\\Exception\\AccessDeniedHttpException;
use Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException;

/**
 * Provides a resource to get view modes by entity and bundle.
 *
 * @RestResource(
 *   id = "${options.entityType}_resource",
 *   label = @Translation("${options.label} resource"),
 *   uri_paths = {
 *     "canonical" = "/api/${options.entityType}/{${options.entityType}}",
 *     "collection" = "/api/${options.entityType}"
 *   }
 * )
 */
class ${entityClass}Resource extends ResourceBase {

  /**
   * A current user instance.
   *
   * @var \\Drupal\\Core\\Session\\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * Constructs a new ${entityClass}Resource object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param array $serializer_formats
   *   The available serialization formats.
   * @param \\Psr\\Log\\LoggerInterface $logger
   *   A logger instance.
   * @param \\Drupal\\Core\\Session\\AccountProxyInterface $current_user
   *   A current user instance.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $current_user) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);

    $this->currentUser = $current_user;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('${options.entityType}'),
      $container->get('current_user')
    );
  }

  /**
   * Responds to GET requests.
   *
   * @param int $id
   *   The ID of the ${options.label}.
   *
   * @return \\Drupal\\rest\\ResourceResponse
   *   The HTTP response object.
   *
   * @throws \\Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException
   *   Thrown when the ${options.label} was not found.
   * @throws \\Symfony\\Component\\HttpKernel\\Exception\\AccessDeniedHttpException
   *   Thrown when the user does not have permission to view the ${options.label}.
   */
  public function get($id = NULL) {
    if ($id) {
      $entity = \\Drupal::entityTypeManager()
        ->getStorage('${options.entityType}')
        ->load($id);
      
      if (!$entity) {
        throw new NotFoundHttpException("${options.label} with ID $id was not found.");
      }
      
      if (!$entity->access('view')) {
        throw new AccessDeniedHttpException();
      }
      
      return new ResourceResponse($entity, 200);
    }
    
    // Return collection
    $entities = \\Drupal::entityTypeManager()
      ->getStorage('${options.entityType}')
      ->loadMultiple();
    
    $accessible_entities = array_filter($entities, function ($entity) {
      return $entity->access('view');
    });
    
    return new ResourceResponse(array_values($accessible_entities), 200);
  }

}
`;

    return {
      path: `src/Plugin/rest/resource/${entityClass}Resource.php`,
      content,
      description: `REST resource plugin for ${options.label} entities`
    };
  }

  private generateViewsData(machineName: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `${options.entityType}:
  table:
    group: '${options.label}'
    provider: ${machineName}
    base:
      field: id
      title: '${options.label}'
      help: 'The ${options.label} entity type.'
      weight: -10
    entity_type: ${options.entityType}
    wizard_id: ${options.entityType}
  id:
    title: 'ID'
    help: 'The ${options.label} ID.'
    field:
      id: numeric
    filter:
      id: numeric
    sort:
      id: standard
    argument:
      id: ${options.entityType}_id
  title:
    title: 'Title'
    help: 'The ${options.label} title.'
    field:
      id: standard
    filter:
      id: string
    sort:
      id: standard
    argument:
      id: string
  uid:
    title: 'Author'
    help: 'The user who created the ${options.label}.'
    relationship:
      title: 'Author'
      help: 'Relate ${options.label} to the user who created it.'
      handler: standard
      base: users_field_data
      field: uid
      label: author
  created:
    title: 'Created'
    help: 'The time that the ${options.label} was created.'
    field:
      id: date
    filter:
      id: date
    sort:
      id: date
  changed:
    title: 'Updated'
    help: 'The time that the ${options.label} was last edited.'
    field:
      id: date
    filter:
      id: date
    sort:
      id: date
`;

    return {
      path: `${machineName}.views.inc`,
      content: `<?php\n\n/**\n * @file\n * Provides views data for ${options.label} entities.\n */\n\n/**\n * Implements hook_views_data().\n */\nfunction ${machineName}_views_data() {\n  return [\n${content.split('\n').map(line => '    ' + line).join('\n')}\n  ];\n}\n`,
      description: 'Views integration for entity'
    };
  }

  private generateTests(namespace: string, entityClass: string, options: EntityGeneratorOptions): GeneratedEntityFile[] {
    const files: GeneratedEntityFile[] = [];

    // Unit test
    files.push({
      path: `tests/src/Unit/${entityClass}Test.php`,
      content: `<?php

namespace Drupal\\Tests\\${options.entityType}\\Unit;

use Drupal\\Tests\\UnitTestCase;
use ${namespace}\\Entity\\${entityClass};

/**
 * @coversDefaultClass \\${namespace}\\Entity\\${entityClass}
 * @group ${options.entityType}
 */
class ${entityClass}Test extends UnitTestCase {

  /**
   * Tests the entity label.
   */
  public function testLabel() {
    $entity = $this->getMockBuilder(${entityClass}::class)
      ->disableOriginalConstructor()
      ->getMock();
    
    $entity->expects($this->once())
      ->method('getTitle')
      ->willReturn('Test Title');
    
    $this->assertEquals('Test Title', $entity->getTitle());
  }

}
`,
      description: `Unit test for ${entityClass}`
    });

    // Kernel test
    files.push({
      path: `tests/src/Kernel/${entityClass}KernelTest.php`,
      content: `<?php

namespace Drupal\\Tests\\${options.entityType}\\Kernel;

use Drupal\\KernelTests\\Core\\Entity\\EntityKernelTestBase;
use ${namespace}\\Entity\\${entityClass};

/**
 * Tests the ${options.label} entity.
 *
 * @group ${options.entityType}
 */
class ${entityClass}KernelTest extends EntityKernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['${options.entityType}'];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('${options.entityType}');
  }

  /**
   * Tests creating a ${options.label} entity.
   */
  public function testCreate() {
    $entity = ${entityClass}::create([
      'title' => 'Test ${options.label}',
      'uid' => 1,
    ]);
    
    $entity->save();
    
    $this->assertNotNull($entity->id());
    $this->assertEquals('Test ${options.label}', $entity->getTitle());
    $this->assertEquals(1, $entity->getOwnerId());
  }

  /**
   * Tests loading a ${options.label} entity.
   */
  public function testLoad() {
    $entity = ${entityClass}::create([
      'title' => 'Test ${options.label}',
    ]);
    $entity->save();
    
    $loaded = ${entityClass}::load($entity->id());
    
    $this->assertNotNull($loaded);
    $this->assertEquals($entity->id(), $loaded->id());
    $this->assertEquals('Test ${options.label}', $loaded->getTitle());
  }

}
`,
      description: `Kernel test for ${entityClass}`
    });

    return files;
  }

  private generateConfigSchema(machineName: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `${machineName}.settings:
  type: config_object
  label: '${options.label} settings'
  mapping:
    default_status:
      type: boolean
      label: 'Default publish status'
    preview_mode:
      type: string
      label: 'Preview mode'
`;

    return {
      path: `config/schema/${machineName}.schema.yml`,
      content,
      description: 'Configuration schema for entity settings'
    };
  }

  private generateInstallFile(machineName: string, options: EntityGeneratorOptions): GeneratedEntityFile {
    const content = `<?php

/**
 * @file
 * Install, update and uninstall functions for the ${options.label} module.
 */

use Drupal\\Core\\Database\\Database;

/**
 * Implements hook_install().
 */
function ${machineName}_install() {
  // Create default configuration.
  \\Drupal::messenger()->addStatus(t('The ${options.label} module has been installed.'));
}

/**
 * Implements hook_uninstall().
 */
function ${machineName}_uninstall() {
  // Clean up any remaining configuration.
  \\Drupal::messenger()->addStatus(t('The ${options.label} module has been uninstalled.'));
}

/**
 * Implements hook_schema().
 */
function ${machineName}_schema() {
  $schema['${options.entityType}_usage'] = [
    'description' => 'Track usage statistics for ${options.label} entities.',
    'fields' => [
      'id' => [
        'description' => 'The ${options.label} ID.',
        'type' => 'int',
        'unsigned' => TRUE,
        'not null' => TRUE,
      ],
      'count' => [
        'description' => 'Usage count.',
        'type' => 'int',
        'unsigned' => TRUE,
        'not null' => TRUE,
        'default' => 0,
      ],
      'last_accessed' => [
        'description' => 'Timestamp of last access.',
        'type' => 'int',
        'not null' => TRUE,
        'default' => 0,
      ],
    ],
    'primary key' => ['id'],
    'indexes' => [
      'last_accessed' => ['last_accessed'],
    ],
  ];
  
  return $schema;
}
`;

    return {
      path: `${machineName}.install`,
      content,
      description: 'Installation hooks and schema definition'
    };
  }

  private generateBaseFieldsCode(fields: BaseField[]): string {
    return fields.map(field => {
      const fieldDef = this.generateFieldDefinition(field);
      return `    $fields['${field.name}'] = ${fieldDef};`;
    }).join('\n\n');
  }

  private generateFieldDefinition(field: BaseField): string {
    let definition = `BaseFieldDefinition::create('${field.type}')
      ->setLabel(t('${field.label}'))`;
    
    if (field.description) {
      definition += `\n      ->setDescription(t('${field.description}'))`;
    }
    
    if (field.required) {
      definition += `\n      ->setRequired(TRUE)`;
    }
    
    if (field.cardinality && field.cardinality !== 1) {
      definition += `\n      ->setCardinality(${field.cardinality})`;
    }
    
    // Type-specific settings
    switch (field.type) {
      case 'string':
        definition += `\n      ->setSetting('max_length', ${field.settings?.max_length || 255})`;
        break;
      case 'entity_reference':
        definition += `\n      ->setSetting('target_type', '${field.settings?.target_type || 'node'}')`;
        if (field.settings?.bundles) {
          definition += `\n      ->setSetting('handler_settings', ['target_bundles' => ${JSON.stringify(field.settings.bundles)}])`;
        }
        break;
      case 'image':
      case 'file':
        if (field.settings?.file_extensions) {
          definition += `\n      ->setSetting('file_extensions', '${field.settings.file_extensions}')`;
        }
        break;
    }
    
    // Display options
    definition += `\n      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE)`;
    
    return definition;
  }

  private toPascalCase(str: string): string {
    return str.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('');
  }
}
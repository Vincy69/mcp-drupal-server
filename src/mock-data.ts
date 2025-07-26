// Mock data for development and fallback
export const mockDrupalFunctions = [
  {
    name: 'entity_load',
    file: 'core/includes/entity.inc',
    description: 'Loads an entity from the database.',
    signature: 'entity_load($entity_type, $ids = FALSE, $conditions = array(), $reset = FALSE)',
    parameters: ['$entity_type', '$ids', '$conditions', '$reset'],
    return_type: 'array|FALSE',
    deprecated: true,
    since: '7.x',
    examples: ['$node = entity_load("node", array(1));'],
    module: 'core',
    category: 'entity'
  },
  {
    name: 'entity_create',
    file: 'core/lib/Drupal/Core/Entity/EntityTypeManager.php',
    description: 'Creates a new entity object.',
    signature: 'entity_create($entity_type, array $values = array())',
    parameters: ['$entity_type', '$values'],
    return_type: 'EntityInterface',
    deprecated: false,
    since: '8.x',
    examples: ['$node = entity_create("node", ["type" => "article"]);'],
    module: 'core',
    category: 'entity'
  },
  {
    name: 'drupal_set_message',
    file: 'core/includes/bootstrap.inc',
    description: 'Sets a message to display to the user.',
    signature: 'drupal_set_message($message = NULL, $type = "status", $repeat = FALSE)',
    parameters: ['$message', '$type', '$repeat'],
    return_type: 'array|NULL',
    deprecated: true,
    since: '7.x',
    examples: ['drupal_set_message("Hello world!");'],
    module: 'core',
    category: 'messaging'
  },
  {
    name: '\\Drupal::messenger',
    file: 'core/lib/Drupal/Core/Messenger/Messenger.php',
    description: 'Gets the messenger service.',
    signature: '\\Drupal::messenger()',
    parameters: [],
    return_type: 'MessengerInterface',
    deprecated: false,
    since: '8.x',
    examples: ['\\Drupal::messenger()->addMessage("Hello world!");'],
    module: 'core',
    category: 'messaging'
  },
  {
    name: 'node_load',
    file: 'core/modules/node/node.module',
    description: 'Loads a node entity from the database.',
    signature: 'node_load($nid, $reset = FALSE)',
    parameters: ['$nid', '$reset'],
    return_type: 'NodeInterface|NULL',
    deprecated: true,
    since: '7.x',
    examples: ['$node = node_load(123);'],
    module: 'node',
    category: 'node'
  },
  {
    name: '\\Drupal::entityTypeManager',
    file: 'core/lib/Drupal/Core/Entity/EntityTypeManager.php',
    description: 'Gets the entity type manager.',
    signature: '\\Drupal::entityTypeManager()',
    parameters: [],
    return_type: 'EntityTypeManagerInterface',
    deprecated: false,
    since: '8.x',
    examples: ['$node = \\Drupal::entityTypeManager()->getStorage("node")->load(123);'],
    module: 'core',
    category: 'entity'
  }
];

export const mockDrupalHooks = [
  {
    name: 'hook_node_view',
    description: 'Act on a node that is being assembled before rendering.',
    signature: 'hook_node_view(array &$build, NodeInterface $node, EntityViewDisplayInterface $display, $view_mode)',
    parameters: ['$build', '$node', '$display', '$view_mode'],
    return_type: 'void',
    group: 'node',
    file: 'core/modules/node/node.api.php',
    examples: [
      'function mymodule_node_view(array &$build, NodeInterface $node, EntityViewDisplayInterface $display, $view_mode) {\n  $build["myfield"] = ["#markup" => "Custom content"];\n}'
    ]
  },
  {
    name: 'hook_form_alter',
    description: 'Perform alterations before a form is rendered.',
    signature: 'hook_form_alter(&$form, FormStateInterface $form_state, $form_id)',
    parameters: ['$form', '$form_state', '$form_id'],
    return_type: 'void',
    group: 'form',
    file: 'core/lib/Drupal/Core/Form/form.api.php',
    examples: [
      'function mymodule_form_alter(&$form, FormStateInterface $form_state, $form_id) {\n  if ($form_id == "node_article_form") {\n    $form["title"]["#description"] = "Custom description";\n  }\n}'
    ]
  },
  {
    name: 'hook_entity_presave',
    description: 'Act on an entity before it is saved.',
    signature: 'hook_entity_presave(EntityInterface $entity)',
    parameters: ['$entity'],
    return_type: 'void',
    group: 'entity',
    file: 'core/lib/Drupal/Core/Entity/entity.api.php',
    examples: [
      'function mymodule_entity_presave(EntityInterface $entity) {\n  if ($entity->getEntityTypeId() == "node") {\n    // Do something before saving\n  }\n}'
    ]
  },
  {
    name: 'hook_user_login',
    description: 'The user just logged in.',
    signature: 'hook_user_login(UserInterface $account)',
    parameters: ['$account'],
    return_type: 'void',
    group: 'user',
    file: 'core/modules/user/user.api.php',
    examples: [
      'function mymodule_user_login(UserInterface $account) {\n  \\Drupal::messenger()->addMessage("Welcome back " . $account->getDisplayName());\n}'
    ]
  }
];

export const mockDrupalClasses = [
  {
    name: 'EntityTypeManager',
    namespace: 'Drupal\\Core\\Entity',
    file: 'core/lib/Drupal/Core/Entity/EntityTypeManager.php',
    description: 'Provides an entity type manager.',
    methods: ['getStorage', 'getDefinition', 'getDefinitions', 'hasHandler'],
    properties: ['definitions', 'handlers'],
    deprecated: false,
    since: '8.x'
  },
  {
    name: 'Node',
    namespace: 'Drupal\\node\\Entity',
    file: 'core/modules/node/src/Entity/Node.php',
    description: 'Defines the node entity class.',
    methods: ['getTitle', 'setTitle', 'getType', 'isPublished', 'setPublished'],
    properties: ['title', 'type', 'status'],
    deprecated: false,
    since: '8.x'
  },
  {
    name: 'ControllerBase',
    namespace: 'Drupal\\Core\\Controller',
    file: 'core/lib/Drupal/Core/Controller/ControllerBase.php',
    description: 'Utility base class for thin controllers.',
    methods: ['redirect', 'config', 'keyValue', 'state', 'moduleHandler'],
    properties: [],
    deprecated: false,
    since: '8.x'
  }
];

export const mockCodeExamples = [
  {
    title: 'Create a custom block',
    category: 'blocks',
    tags: ['block', 'plugin', 'custom'],
    language: 'php',
    code: `<?php

namespace Drupal\\mymodule\\Plugin\\Block;

use Drupal\\Core\\Block\\BlockBase;

/**
 * Provides a 'Custom' Block.
 *
 * @Block(
 *   id = "custom_block",
 *   admin_label = @Translation("Custom Block"),
 * )
 */
class CustomBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    return [
      '#markup' => $this->t('Hello, World!'),
    ];
  }

}`,
    description: 'Example of creating a custom block plugin in Drupal 8+',
    source: 'drupal.org'
  },
  {
    title: 'Custom form with validation',
    category: 'forms',
    tags: ['form', 'validation', 'custom'],
    language: 'php',
    code: `<?php

namespace Drupal\\mymodule\\Form;

use Drupal\\Core\\Form\\FormBase;
use Drupal\\Core\\Form\\FormStateInterface;

/**
 * Implements a custom form.
 */
class CustomForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'mymodule_custom_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['email'] = [
      '#type' => 'email',
      '#title' => $this->t('Email'),
      '#required' => TRUE,
    ];

    $form['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Submit'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $email = $form_state->getValue('email');
    if (!\\Drupal::service('email.validator')->isValid($email)) {
      $form_state->setErrorByName('email', $this->t('Invalid email address.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    \\Drupal::messenger()->addMessage($this->t('Form submitted successfully!'));
  }

}`,
    description: 'Example of a custom form with validation in Drupal',
    source: 'github'
  },
  {
    title: 'Entity query example',
    category: 'entities',
    tags: ['entity', 'query', 'database'],
    language: 'php',
    code: `<?php

// Load published nodes of type 'article'
$query = \\Drupal::entityQuery('node')
  ->condition('type', 'article')
  ->condition('status', 1)
  ->sort('created', 'DESC')
  ->range(0, 10);

$nids = $query->execute();
$nodes = \\Drupal::entityTypeManager()
  ->getStorage('node')
  ->loadMultiple($nids);

foreach ($nodes as $node) {
  $title = $node->getTitle();
  $author = $node->getOwner()->getDisplayName();
  // Process each node...
}`,
    description: 'How to query entities in Drupal 8+',
    source: 'api.drupal.org'
  }
];

export const mockModuleTemplates = [
  {
    id: 'basic',
    name: 'Basic Module',
    description: 'A simple module with .info.yml and .module files',
    files: ['info.yml', 'module'],
    features: ['hooks', 'permissions']
  },
  {
    id: 'controller',
    name: 'Module with Controller',
    description: 'Module with a controller and routing',
    files: ['info.yml', 'module', 'routing.yml', 'controller'],
    features: ['hooks', 'permissions', 'routing', 'controller']
  },
  {
    id: 'block',
    name: 'Module with Block Plugin',
    description: 'Module that provides a custom block',
    files: ['info.yml', 'module', 'block-plugin'],
    features: ['hooks', 'permissions', 'block-plugin']
  },
  {
    id: 'form',
    name: 'Module with Form',
    description: 'Module with a custom form',
    files: ['info.yml', 'module', 'routing.yml', 'form', 'controller'],
    features: ['hooks', 'permissions', 'routing', 'form', 'controller']
  },
  {
    id: 'entity',
    name: 'Module with Custom Entity',
    description: 'Module that defines a custom entity type',
    files: ['info.yml', 'module', 'entity', 'storage', 'form', 'controller', 'routing.yml'],
    features: ['hooks', 'permissions', 'entity', 'storage', 'form', 'routing']
  }
];

export const exampleCategories = [
  {
    id: 'blocks',
    name: 'Blocks',
    description: 'Custom block plugins and block-related code',
    count: 15
  },
  {
    id: 'forms',
    name: 'Forms',
    description: 'Form API examples and custom forms',
    count: 23
  },
  {
    id: 'entities',
    name: 'Entities',
    description: 'Entity API, custom entities, and entity operations',
    count: 18
  },
  {
    id: 'routing',
    name: 'Routing',
    description: 'Route definitions and controllers',
    count: 12
  },
  {
    id: 'hooks',
    name: 'Hooks',
    description: 'Hook implementations and examples',
    count: 35
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Dependency injection and custom services',
    count: 20
  },
  {
    id: 'theming',
    name: 'Theming',
    description: 'Theme functions, templates, and preprocessing',
    count: 28
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Database API and query examples',
    count: 16
  }
];
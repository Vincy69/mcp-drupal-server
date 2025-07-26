export interface CodeExample {
  title: string;
  description: string;
  category: string;
  drupal_version: string[];
  code: string;
  tags: string[];
  related_functions?: string[];
  related_hooks?: string[];
}

export class DrupalExamples {
  private examples: CodeExample[] = [
    // Node manipulation examples
    {
      title: "Create a new node programmatically",
      description: "Create a new article node with title, body, and publish it",
      category: "nodes",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `use Drupal\\node\\Entity\\Node;
use Drupal\\Core\\Datetime\\DrupalDateTime;

// Create a new article node
$node = Node::create([
  'type' => 'article',
  'title' => 'My New Article',
  'body' => [
    'value' => '<p>This is the body content of my article.</p>',
    'format' => 'basic_html',
  ],
  'field_tags' => [
    ['target_id' => 1], // Reference to taxonomy term ID 1
    ['target_id' => 2], // Reference to taxonomy term ID 2
  ],
  'status' => 1, // Published
  'uid' => 1, // Author user ID
  'created' => time(),
  'changed' => time(),
]);

// Save the node
$node->save();

// Get the node ID
$nid = $node->id();
\Drupal::messenger()->addMessage('Node created with ID: ' . $nid);`,
      tags: ["node", "create", "entity", "api"],
      related_functions: ["Node::create", "Entity::save"],
    },
    {
      title: "Load and update a node",
      description: "Load an existing node and update its fields",
      category: "nodes",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `use Drupal\\node\\Entity\\Node;

// Load node by ID
$nid = 12;
$node = Node::load($nid);

if ($node) {
  // Update node fields
  $node->setTitle('Updated Title');
  $node->set('body', [
    'value' => '<p>Updated body content.</p>',
    'format' => 'basic_html',
  ]);
  
  // Set as unpublished
  $node->setUnpublished();
  
  // Save changes
  $node->save();
  
  \Drupal::messenger()->addMessage('Node updated successfully');
} else {
  \Drupal::messenger()->addError('Node not found');
}`,
      tags: ["node", "update", "load", "entity"],
      related_functions: ["Node::load", "Entity::save", "setTitle", "setUnpublished"],
    },

    // User management examples
    {
      title: "Create a new user account",
      description: "Create a new user with custom fields and roles",
      category: "users",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `use Drupal\\user\\Entity\\User;

// Create new user
$user = User::create([
  'name' => 'newuser',
  'mail' => 'newuser@example.com',
  'pass' => 'secure_password',
  'status' => 1, // Active
  'roles' => ['editor'], // Assign role
  'field_first_name' => 'John',
  'field_last_name' => 'Doe',
]);

// Save the user
$user->save();

// Send welcome email
_user_mail_notify('register_admin_created', $user);

\Drupal::messenger()->addMessage('User created: ' . $user->getAccountName());`,
      tags: ["user", "create", "account", "role"],
      related_functions: ["User::create", "_user_mail_notify"],
    },

    // Hook implementations
    {
      title: "Implement hook_node_presave",
      description: "Automatically set node author and modify content before saving",
      category: "hooks",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `/**
 * Implements hook_node_presave().
 */
function mymodule_node_presave(\\Drupal\\node\\NodeInterface $node) {
  // Auto-assign author for article nodes
  if ($node->getType() === 'article') {
    $current_user = \\Drupal::currentUser();
    $node->setOwnerId($current_user->id());
    
    // Add automatic prefix to title
    $title = $node->getTitle();
    if (!str_starts_with($title, '[Auto] ')) {
      $node->setTitle('[Auto] ' . $title);
    }
    
    // Set publish date if not set
    if ($node->isNew() && !$node->get('created')->value) {
      $node->set('created', time());
    }
  }
}`,
      tags: ["hook", "node", "presave", "automation"],
      related_hooks: ["hook_node_presave"],
      related_functions: ["getType", "setOwnerId", "setTitle"],
    },

    // Form API examples
    {
      title: "Create a custom form",
      description: "Build a custom form with validation and submit handler",
      category: "forms",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\Form;

use Drupal\\Core\\Form\\FormBase;
use Drupal\\Core\\Form\\FormStateInterface;

/**
 * Custom contact form.
 */
class CustomContactForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'custom_contact_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Your Name'),
      '#required' => TRUE,
      '#maxlength' => 100,
    ];

    $form['email'] = [
      '#type' => 'email',
      '#title' => $this->t('Email Address'),
      '#required' => TRUE,
    ];

    $form['message'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Message'),
      '#required' => TRUE,
      '#rows' => 5,
    ];

    $form['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Send Message'),
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
    $values = $form_state->getValues();
    
    // Send email or save to database
    \Drupal::logger('mymodule')->info('Contact form submitted by @name', [
      '@name' => $values['name'],
    ]);
    
    $this->messenger()->addMessage($this->t('Thank you for your message!'));
  }
}`,
      tags: ["form", "api", "validation", "custom"],
      related_functions: ["buildForm", "validateForm", "submitForm"],
    },

    // Database API examples
    {
      title: "Database queries with Entity Query",
      description: "Query entities using Drupal's Entity Query API",
      category: "database",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `// Query nodes using Entity Query
$query = \\Drupal::entityQuery('node')
  ->accessCheck(TRUE)
  ->condition('type', 'article')
  ->condition('status', 1)
  ->condition('created', strtotime('-30 days'), '>')
  ->sort('created', 'DESC')
  ->range(0, 10);

$nids = $query->execute();

// Load the nodes
$nodes = \\Drupal\\node\\Entity\\Node::loadMultiple($nids);

foreach ($nodes as $node) {
  $title = $node->getTitle();
  $author = $node->getOwner()->getDisplayName();
  echo "Title: {$title}, Author: {$author}\\n";
}

// Query with field conditions
$user_query = \\Drupal::entityQuery('user')
  ->accessCheck(TRUE)
  ->condition('status', 1)
  ->condition('field_department.target_id', [1, 2, 3], 'IN')
  ->condition('roles', 'editor')
  ->sort('created', 'DESC');

$uids = $user_query->execute();`,
      tags: ["database", "entity", "query", "api"],
      related_functions: ["entityQuery", "loadMultiple", "condition", "sort"],
    },

    // Service injection examples
    {
      title: "Using dependency injection in a service",
      description: "Create a custom service with dependency injection",
      category: "services",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\Service;

use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Drupal\\Core\\Logger\\LoggerChannelFactoryInterface;
use Drupal\\Core\\Messenger\\MessengerInterface;

/**
 * Custom service for article management.
 */
class ArticleManager {

  /**
   * The entity type manager.
   */
  protected $entityTypeManager;

  /**
   * The logger factory.
   */
  protected $loggerFactory;

  /**
   * The messenger service.
   */
  protected $messenger;

  /**
   * Constructs an ArticleManager object.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    LoggerChannelFactoryInterface $logger_factory,
    MessengerInterface $messenger
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->loggerFactory = $logger_factory;
    $this->messenger = $messenger;
  }

  /**
   * Creates a new article with given data.
   */
  public function createArticle(array $data) {
    try {
      $node_storage = $this->entityTypeManager->getStorage('node');
      
      $node = $node_storage->create([
        'type' => 'article',
        'title' => $data['title'],
        'body' => $data['body'],
        'status' => 1,
      ]);
      
      $node->save();
      
      $this->messenger->addMessage(
        $this->t('Article "@title" created successfully.', [
          '@title' => $data['title'],
        ])
      );
      
      $this->loggerFactory->get('mymodule')->info(
        'Article created: @title',
        ['@title' => $data['title']]
      );
      
      return $node;
    }
    catch (\\Exception $e) {
      $this->loggerFactory->get('mymodule')->error(
        'Error creating article: @message',
        ['@message' => $e->getMessage()]
      );
      return NULL;
    }
  }
}

// services.yml configuration:
/*
services:
  mymodule.article_manager:
    class: Drupal\\mymodule\\Service\\ArticleManager
    arguments: ['@entity_type.manager', '@logger.factory', '@messenger']
*/`,
      tags: ["service", "dependency-injection", "entity", "logger"],
      related_functions: ["getStorage", "create", "save"],
    },

    // Configuration examples
    {
      title: "Working with configuration",
      description: "Read and write configuration values",
      category: "configuration",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `// Read configuration
$config = \\Drupal::config('mymodule.settings');
$api_key = $config->get('api_key');
$timeout = $config->get('timeout') ?: 30; // Default to 30

// Write configuration
$config_factory = \\Drupal::configFactory();
$config = $config_factory->getEditable('mymodule.settings');
$config->set('api_key', 'new_api_key_value');
$config->set('timeout', 45);
$config->set('last_updated', time());
$config->save();

// Read system configuration
$site_config = \\Drupal::config('system.site');
$site_name = $site_config->get('name');
$site_mail = $site_config->get('mail');

// Working with state (temporary data)
$state = \\Drupal::state();
$last_cron = $state->get('mymodule.last_cron', 0);
$state->set('mymodule.last_cron', time());

// Delete state
$state->delete('mymodule.temporary_data');`,
      tags: ["configuration", "config", "state", "settings"],
      related_functions: ["config", "configFactory", "state", "get", "set"],
    },

    // Cache examples
    {
      title: "Working with cache",
      description: "Cache data and invalidate cache tags",
      category: "cache",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `// Get cache service
$cache = \\Drupal::cache();

// Set cache data
$data = ['key' => 'value', 'timestamp' => time()];
$cache->set('mymodule:expensive_data', $data, time() + 3600, ['mymodule:data']);

// Get cache data
$cached = $cache->get('mymodule:expensive_data');
if ($cached) {
  $data = $cached->data;
} else {
  // Rebuild data if cache miss
  $data = expensive_data_function();
  $cache->set('mymodule:expensive_data', $data, time() + 3600, ['mymodule:data']);
}

// Invalidate cache by tags
\\Drupal::service('cache_tags.invalidator')->invalidateTags(['mymodule:data']);

// Clear specific cache
$cache->delete('mymodule:expensive_data');

// Using render cache
$build = [
  '#markup' => '<p>Cached content</p>',
  '#cache' => [
    'keys' => ['mymodule', 'cached_content'],
    'contexts' => ['user', 'url.path'],
    'tags' => ['mymodule:content'],
    'max-age' => 3600,
  ],
];`,
      tags: ["cache", "performance", "tags", "render"],
      related_functions: ["cache", "get", "set", "invalidateTags"],
    },

    // Event subscriber example
    {
      title: "Create an event subscriber",
      description: "Subscribe to Drupal events and respond to them",
      category: "events",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\EventSubscriber;

use Drupal\\Core\\Config\\ConfigCrudEvent;
use Drupal\\Core\\Config\\ConfigEvents;
use Symfony\\Component\\EventDispatcher\\EventSubscriberInterface;

/**
 * Event subscriber for configuration changes.
 */
class ConfigSubscriber implements EventSubscriberInterface {

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    return [
      ConfigEvents::SAVE => ['onConfigSave'],
      ConfigEvents::DELETE => ['onConfigDelete'],
    ];
  }

  /**
   * Responds to configuration save events.
   */
  public function onConfigSave(ConfigCrudEvent $event) {
    $config = $event->getConfig();
    $config_name = $config->getName();
    
    // Log configuration changes
    \\Drupal::logger('mymodule')->info(
      'Configuration @name was saved.',
      ['@name' => $config_name]
    );
    
    // Clear cache if specific config changed
    if ($config_name === 'mymodule.settings') {
      \\Drupal::service('cache_tags.invalidator')
        ->invalidateTags(['mymodule:settings']);
    }
  }

  /**
   * Responds to configuration delete events.
   */
  public function onConfigDelete(ConfigCrudEvent $event) {
    $config = $event->getConfig();
    $config_name = $config->getName();
    
    \\Drupal::logger('mymodule')->warning(
      'Configuration @name was deleted.',
      ['@name' => $config_name]
    );
  }
}

// services.yml:
/*
services:
  mymodule.config_subscriber:
    class: Drupal\\mymodule\\EventSubscriber\\ConfigSubscriber
    tags:
      - { name: event_subscriber }
*/`,
      tags: ["event", "subscriber", "configuration", "logging"],
      related_functions: ["getSubscribedEvents", "getConfig", "getName"],
    },
  ];

  /**
   * Get all examples or filter by category
   */
  getExamples(category?: string, drupalVersion?: string): CodeExample[] {
    let filtered = this.examples;

    if (category) {
      filtered = filtered.filter(example => 
        example.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (drupalVersion) {
      filtered = filtered.filter(example =>
        example.drupal_version.includes(drupalVersion)
      );
    }

    return filtered;
  }

  /**
   * Search examples by keyword
   */
  searchExamples(query: string): CodeExample[] {
    const lowerQuery = query.toLowerCase();
    
    return this.examples.filter(example =>
      example.title.toLowerCase().includes(lowerQuery) ||
      example.description.toLowerCase().includes(lowerQuery) ||
      example.category.toLowerCase().includes(lowerQuery) ||
      example.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      example.code.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get example by title
   */
  getExampleByTitle(title: string): CodeExample | null {
    return this.examples.find(example => 
      example.title.toLowerCase() === title.toLowerCase()
    ) || null;
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    const categories = new Set(this.examples.map(example => example.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all tags
   */
  getTags(): string[] {
    const tags = new Set(this.examples.flatMap(example => example.tags));
    return Array.from(tags).sort();
  }

  /**
   * Get examples by tag
   */
  getExamplesByTag(tag: string): CodeExample[] {
    return this.examples.filter(example =>
      example.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }
}
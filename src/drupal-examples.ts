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

    // Migration examples
    {
      title: "Create a migration from CSV",
      description: "Migrate data from CSV file to Drupal content types",
      category: "migrations",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `# config/install/migrate_plus.migration.import_articles.yml
id: import_articles
label: Import Articles from CSV
migration_group: default

source:
  plugin: csv
  path: modules/custom/mymodule/data/articles.csv
  header_offset: 0
  ids:
    - id
  fields:
    0:
      name: id
      label: 'Unique ID'
    1:
      name: title
      label: 'Article Title'
    2:
      name: body
      label: 'Article Body'
    3:
      name: author_email
      label: 'Author Email'
    4:
      name: published_date
      label: 'Published Date'

process:
  title: title
  'body/value': body
  'body/format':
    plugin: default_value
    default_value: basic_html
  uid:
    plugin: migration_lookup
    migration: import_users
    source: author_email
  status:
    plugin: default_value
    default_value: 1
  created:
    plugin: format_date
    from_format: 'Y-m-d H:i:s'
    to_format: 'U'
    source: published_date

destination:
  plugin: entity:node
  default_bundle: article

migration_dependencies:
  required:
    - import_users`,
      tags: ["migration", "csv", "content", "import"],
      related_functions: ["migration_lookup", "format_date"],
    },
    {
      title: "Custom migration source plugin",
      description: "Create a custom source plugin for complex data imports",
      category: "migrations",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\Plugin\\migrate\\source;

use Drupal\\migrate\\Plugin\\migrate\\source\\SqlBase;
use Drupal\\migrate\\Row;

/**
 * Custom source plugin for legacy database.
 *
 * @MigrateSource(
 *   id = "legacy_articles",
 *   source_module = "mymodule"
 * )
 */
class LegacyArticles extends SqlBase {

  /**
   * {@inheritdoc}
   */
  public function query() {
    $query = $this->select('legacy_articles', 'la')
      ->fields('la', [
        'id',
        'title',
        'body',
        'author_id',
        'created',
        'status'
      ])
      ->condition('la.status', 1)
      ->orderBy('la.created');
    
    return $query;
  }

  /**
   * {@inheritdoc}
   */
  public function fields() {
    return [
      'id' => $this->t('Article ID'),
      'title' => $this->t('Article Title'),
      'body' => $this->t('Article Body'),
      'author_id' => $this->t('Author ID'),
      'created' => $this->t('Created timestamp'),
      'status' => $this->t('Published status'),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getIds() {
    return [
      'id' => [
        'type' => 'integer',
        'alias' => 'la',
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function prepareRow(Row $row) {
    // Custom processing before migration
    $title = $row->getSourceProperty('title');
    $row->setSourceProperty('clean_title', strip_tags($title));
    
    // Add computed fields
    $created = $row->getSourceProperty('created');
    $row->setSourceProperty('year', date('Y', $created));
    
    return parent::prepareRow($row);
  }
}`,
      tags: ["migration", "source", "plugin", "database"],
      related_functions: ["prepareRow", "getSourceProperty", "setSourceProperty"],
    },

    // Testing examples
    {
      title: "Unit test with mocks",
      description: "Create unit tests with dependency injection and mocks",
      category: "testing",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\Tests\\mymodule\\Unit\\Service;

use Drupal\\Tests\\UnitTestCase;
use Drupal\\mymodule\\Service\\ArticleManager;
use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Drupal\\Core\\Entity\\EntityStorageInterface;
use Drupal\\Core\\Logger\\LoggerChannelFactoryInterface;
use Drupal\\Core\\Logger\\LoggerChannelInterface;
use Drupal\\Core\\Messenger\\MessengerInterface;
use Drupal\\node\\Entity\\Node;

/**
 * @coversDefaultClass \\Drupal\\mymodule\\Service\\ArticleManager
 * @group mymodule
 */
class ArticleManagerTest extends UnitTestCase {

  /**
   * The entity type manager mock.
   */
  protected $entityTypeManager;

  /**
   * The logger factory mock.
   */
  protected $loggerFactory;

  /**
   * The messenger mock.
   */
  protected $messenger;

  /**
   * The article manager service.
   */
  protected $articleManager;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->entityTypeManager = $this->createMock(EntityTypeManagerInterface::class);
    $this->loggerFactory = $this->createMock(LoggerChannelFactoryInterface::class);
    $this->messenger = $this->createMock(MessengerInterface::class);

    $this->articleManager = new ArticleManager(
      $this->entityTypeManager,
      $this->loggerFactory,
      $this->messenger
    );
  }

  /**
   * @covers ::createArticle
   */
  public function testCreateArticle() {
    $article_data = [
      'title' => 'Test Article',
      'body' => 'Test body content',
    ];

    // Mock the node storage
    $node_storage = $this->createMock(EntityStorageInterface::class);
    $this->entityTypeManager
      ->expects($this->once())
      ->method('getStorage')
      ->with('node')
      ->willReturn($node_storage);

    // Mock the created node
    $node = $this->createMock(Node::class);
    $node->method('save')->willReturn(NULL);
    $node->method('id')->willReturn(123);

    $node_storage
      ->expects($this->once())
      ->method('create')
      ->with([
        'type' => 'article',
        'title' => 'Test Article',
        'body' => 'Test body content',
        'status' => 1,
      ])
      ->willReturn($node);

    // Mock the logger
    $logger = $this->createMock(LoggerChannelInterface::class);
    $this->loggerFactory
      ->expects($this->once())
      ->method('get')
      ->with('mymodule')
      ->willReturn($logger);

    $logger
      ->expects($this->once())
      ->method('info')
      ->with('Article created: @title', ['@title' => 'Test Article']);

    // Test the method
    $result = $this->articleManager->createArticle($article_data);
    $this->assertSame($node, $result);
  }
}`,
      tags: ["testing", "unit", "mock", "phpunit"],
      related_functions: ["createMock", "expects", "willReturn"],
    },
    {
      title: "Kernel test for services",
      description: "Test services with real Drupal kernel and database",
      category: "testing",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\Tests\\mymodule\\Kernel;

use Drupal\\KernelTests\\KernelTestBase;
use Drupal\\node\\Entity\\Node;
use Drupal\\node\\Entity\\NodeType;

/**
 * Tests the article manager service.
 *
 * @group mymodule
 */
class ArticleManagerKernelTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'node',
    'field',
    'text',
    'mymodule',
  ];

  /**
   * The article manager service.
   */
  protected $articleManager;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installSchema('system', ['sequences']);
    $this->installConfig(['node', 'mymodule']);

    // Create article content type
    NodeType::create([
      'type' => 'article',
      'name' => 'Article',
    ])->save();

    $this->articleManager = \\Drupal::service('mymodule.article_manager');
  }

  /**
   * Tests article creation through the service.
   */
  public function testArticleCreation() {
    $article_data = [
      'title' => 'Kernel Test Article',
      'body' => 'This is test content for kernel testing.',
    ];

    $node = $this->articleManager->createArticle($article_data);

    // Verify the node was created
    $this->assertInstanceOf(Node::class, $node);
    $this->assertEquals('Kernel Test Article', $node->getTitle());
    $this->assertEquals('article', $node->bundle());
    $this->assertTrue($node->isPublished());

    // Verify it was saved to database
    $loaded_node = Node::load($node->id());
    $this->assertNotNull($loaded_node);
    $this->assertEquals('Kernel Test Article', $loaded_node->getTitle());
  }

  /**
   * Tests article creation with validation errors.
   */
  public function testArticleCreationWithErrors() {
    $article_data = [
      'title' => '', // Empty title should cause error
      'body' => 'Test body',
    ];

    $node = $this->articleManager->createArticle($article_data);
    $this->assertNull($node);
  }
}`,
      tags: ["testing", "kernel", "service", "database"],
      related_functions: ["installEntitySchema", "installSchema", "installConfig"],
    },

    // Performance examples
    {
      title: "Cache optimization strategies",
      description: "Implement advanced caching for performance improvement",
      category: "performance",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\Service;

use Drupal\\Core\\Cache\\CacheBackendInterface;
use Drupal\\Core\\Cache\\Context\\CacheContextsManager;
use Drupal\\Core\\Entity\\EntityTypeManagerInterface;

/**
 * Optimized data service with advanced caching.
 */
class OptimizedDataService {

  /**
   * The cache backend.
   */
  protected $cache;

  /**
   * The entity type manager.
   */
  protected $entityTypeManager;

  public function __construct(
    CacheBackendInterface $cache,
    EntityTypeManagerInterface $entity_type_manager
  ) {
    $this->cache = $cache;
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * Get popular articles with multi-level caching.
   */
  public function getPopularArticles($limit = 10) {
    $cache_key = "popular_articles:{$limit}";
    
    // Check cache first
    $cached = $this->cache->get($cache_key);
    if ($cached && $cached->valid) {
      return $cached->data;
    }

    // Generate expensive query
    $query = $this->entityTypeManager
      ->getStorage('node')
      ->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'article')
      ->condition('status', 1)
      ->sort('field_view_count', 'DESC')
      ->range(0, $limit);

    $nids = $query->execute();
    $articles = [];

    if ($nids) {
      $nodes = $this->entityTypeManager
        ->getStorage('node')
        ->loadMultiple($nids);

      foreach ($nodes as $node) {
        $articles[] = [
          'id' => $node->id(),
          'title' => $node->getTitle(),
          'created' => $node->getCreatedTime(),
          'view_count' => $node->get('field_view_count')->value,
        ];
      }
    }

    // Cache with tags and contexts
    $this->cache->set($cache_key, $articles, time() + 3600, [
      'node_list',
      'node_list:article',
      'mymodule:popular_articles',
    ]);

    return $articles;
  }

  /**
   * Batch processing for large datasets.
   */
  public function processLargeDataset($data, $batch_size = 100) {
    $chunks = array_chunk($data, $batch_size);
    $results = [];

    foreach ($chunks as $chunk) {
      // Process in smaller batches to avoid memory issues
      $chunk_results = $this->processChunk($chunk);
      $results = array_merge($results, $chunk_results);

      // Clear memory between batches
      if (function_exists('gc_collect_cycles')) {
        gc_collect_cycles();
      }
    }

    return $results;
  }

  /**
   * Process a single chunk of data.
   */
  private function processChunk($chunk) {
    $results = [];
    
    foreach ($chunk as $item) {
      // Simulate expensive processing
      $result = $this->expensiveOperation($item);
      $results[] = $result;
    }

    return $results;
  }

  /**
   * Invalidate related caches.
   */
  public function invalidatePopularArticlesCache() {
    // Invalidate by tags
    \\Drupal::service('cache_tags.invalidator')
      ->invalidateTags(['mymodule:popular_articles']);

    // Clear specific cache keys
    $this->cache->deleteMultiple([
      'popular_articles:10',
      'popular_articles:20',
      'popular_articles:50',
    ]);
  }
}`,
      tags: ["performance", "cache", "optimization", "batch"],
      related_functions: ["cache", "set", "invalidateTags", "array_chunk"],
    },

    // Security examples
    {
      title: "Secure data handling and validation",
      description: "Implement proper security measures for user input and data access",
      category: "security",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Drupal\\Core\\Access\\AccessResult;
use Drupal\\Core\\Session\\AccountInterface;
use Symfony\\Component\\HttpFoundation\\Request;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Drupal\\Component\\Utility\\Html;
use Drupal\\Component\\Utility\\Xss;

/**
 * Secure controller with proper access control.
 */
class SecureApiController extends ControllerBase {

  /**
   * API endpoint with security validation.
   */
  public function apiEndpoint(Request $request) {
    // Validate CSRF token
    $csrf_token = $request->headers->get('X-CSRF-Token');
    if (!\\Drupal::csrfToken()->validate($csrf_token, 'api_endpoint')) {
      return new JsonResponse(['error' => 'Invalid CSRF token'], 403);
    }

    // Get and sanitize input
    $data = json_decode($request->getContent(), TRUE);
    
    if (!$this->validateInput($data)) {
      return new JsonResponse(['error' => 'Invalid input'], 400);
    }

    // Sanitize user input
    $clean_data = $this->sanitizeInput($data);

    // Check permissions for specific operation
    if (!$this->currentUser()->hasPermission('access mymodule api')) {
      return new JsonResponse(['error' => 'Access denied'], 403);
    }

    // Process secure data
    $result = $this->processSecureData($clean_data);

    return new JsonResponse($result);
  }

  /**
   * Validate input data structure and types.
   */
  private function validateInput($data) {
    if (!is_array($data)) {
      return FALSE;
    }

    // Required fields validation
    $required_fields = ['title', 'content', 'category'];
    foreach ($required_fields as $field) {
      if (!isset($data[$field]) || empty($data[$field])) {
        return FALSE;
      }
    }

    // Type validation
    if (!is_string($data['title']) || strlen($data['title']) > 255) {
      return FALSE;
    }

    if (!is_string($data['content']) || strlen($data['content']) > 10000) {
      return FALSE;
    }

    // Category whitelist
    $allowed_categories = ['news', 'events', 'blog'];
    if (!in_array($data['category'], $allowed_categories)) {
      return FALSE;
    }

    return TRUE;
  }

  /**
   * Sanitize input data.
   */
  private function sanitizeInput($data) {
    return [
      'title' => Html::escape($data['title']),
      'content' => Xss::filterAdmin($data['content']),
      'category' => Html::escape($data['category']),
    ];
  }

  /**
   * Access callback for sensitive operations.
   */
  public function sensitiveOperationAccess(AccountInterface $account) {
    // Multiple permission checks
    if (!$account->hasPermission('administer mymodule')) {
      return AccessResult::forbidden('Admin permission required');
    }

    // Role-based access
    if (!$account->hasRole('administrator')) {
      return AccessResult::forbidden('Administrator role required');
    }

    // IP-based restrictions (if needed)
    $client_ip = \\Drupal::request()->getClientIp();
    $allowed_ips = ['127.0.0.1', '::1']; // Admin IPs only
    
    if (!in_array($client_ip, $allowed_ips)) {
      \\Drupal::logger('security')->warning(
        'Unauthorized access attempt from IP: @ip',
        ['@ip' => $client_ip]
      );
      return AccessResult::forbidden('IP not allowed');
    }

    return AccessResult::allowed()
      ->cachePerPermissions()
      ->cachePerRole();
  }

  /**
   * Secure database query with proper access checks.
   */
  private function processSecureData($data) {
    $database = \\Drupal::database();
    
    // Use parameterized queries to prevent SQL injection
    $query = $database->select('mymodule_data', 'm')
      ->fields('m')
      ->condition('category', $data['category'])
      ->condition('status', 1)
      ->range(0, 50); // Limit results

    // Add access control to query
    $query->addTag('mymodule_access');
    $query->addMetaData('account', $this->currentUser());

    $results = $query->execute()->fetchAll();

    // Filter results based on user permissions
    $filtered_results = [];
    foreach ($results as $result) {
      if ($this->userCanAccessData($result)) {
        // Remove sensitive fields before returning
        unset($result->internal_notes);
        unset($result->private_data);
        $filtered_results[] = $result;
      }
    }

    return $filtered_results;
  }

  /**
   * Check if user can access specific data.
   */
  private function userCanAccessData($data) {
    // Implement specific access logic
    if ($data->owner_uid === $this->currentUser()->id()) {
      return TRUE; // Users can access their own data
    }

    if ($this->currentUser()->hasPermission('view all mymodule data')) {
      return TRUE;
    }

    return FALSE;
  }
}`,
      tags: ["security", "validation", "access-control", "csrf"],
      related_functions: ["Html::escape", "Xss::filterAdmin", "hasPermission", "validate"],
    },

    // Theming examples
    {
      title: "Custom theme hooks and preprocessing",
      description: "Implement custom theme hooks with preprocessing functions",
      category: "theming",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `<?php
// mymodule.module

/**
 * Implements hook_theme().
 */
function mymodule_theme($existing, $type, $theme, $path) {
  return [
    'article_card' => [
      'variables' => [
        'article' => NULL,
        'display_mode' => 'default',
        'show_author' => TRUE,
        'show_date' => TRUE,
      ],
      'template' => 'article-card',
    ],
    'article_grid' => [
      'variables' => [
        'articles' => [],
        'columns' => 3,
        'show_pagination' => TRUE,
      ],
      'template' => 'article-grid',
    ],
    'custom_page_layout' => [
      'variables' => [
        'header' => NULL,
        'content' => NULL,
        'sidebar' => NULL,
        'footer' => NULL,
        'layout_class' => 'default-layout',
      ],
      'template' => 'custom-page-layout',
    ],
  ];
}

/**
 * Implements template_preprocess_HOOK() for article_card.
 */
function template_preprocess_article_card(&$variables) {
  $article = $variables['article'];
  
  if ($article) {
    // Add processed variables
    $variables['title'] = $article->getTitle();
    $variables['url'] = $article->toUrl()->toString();
    $variables['teaser'] = $article->get('body')->summary ?: 
      substr(strip_tags($article->get('body')->value), 0, 200) . '...';
    
    // Author information
    if ($variables['show_author']) {
      $author = $article->getOwner();
      $variables['author'] = [
        'name' => $author->getDisplayName(),
        'url' => $author->toUrl()->toString(),
        'picture' => $author->user_picture->entity ? 
          $author->user_picture->entity->getFileUri() : NULL,
      ];
    }
    
    // Date formatting
    if ($variables['show_date']) {
      $variables['created_date'] = [
        'timestamp' => $article->getCreatedTime(),
        'formatted' => \\Drupal::service('date.formatter')
          ->format($article->getCreatedTime(), 'medium'),
        'ago' => \\Drupal::service('date.formatter')
          ->formatTimeDiffSince($article->getCreatedTime()),
      ];
    }
    
    // Image handling
    if ($article->hasField('field_image') && !$article->get('field_image')->isEmpty()) {
      $image = $article->get('field_image')->entity;
      $variables['image'] = [
        'url' => $image->getFileUri(),
        'alt' => $article->get('field_image')->alt,
        'title' => $article->get('field_image')->title,
      ];
    }
    
    // CSS classes
    $variables['attributes']['class'][] = 'article-card';
    $variables['attributes']['class'][] = 'article-card--' . $variables['display_mode'];
    $variables['attributes']['data-article-id'] = $article->id();
  }
}

/**
 * Implements template_preprocess_HOOK() for article_grid.
 */
function template_preprocess_article_grid(&$variables) {
  $articles = $variables['articles'];
  $columns = $variables['columns'];
  
  // Process articles into grid format
  $grid_articles = [];
  foreach ($articles as $article) {
    $grid_articles[] = [
      '#theme' => 'article_card',
      '#article' => $article,
      '#display_mode' => 'grid',
    ];
  }
  
  $variables['processed_articles'] = $grid_articles;
  $variables['attributes']['class'][] = 'article-grid';
  $variables['attributes']['class'][] = 'article-grid--' . $columns . '-col';
  
  // Add CSS Grid support
  $variables['attributes']['style'] = "display: grid; grid-template-columns: repeat({$columns}, 1fr); gap: 1rem;";
}

/**
 * Implements hook_preprocess_HOOK() for page templates.
 */
function mymodule_preprocess_page(&$variables) {
  $route_match = \\Drupal::routeMatch();
  
  // Add custom variables based on current route
  if ($route_match->getRouteName() === 'entity.node.canonical') {
    $node = $route_match->getParameter('node');
    if ($node && $node->bundle() === 'article') {
      $variables['is_article_page'] = TRUE;
      $variables['article_type'] = $node->get('field_article_type')->value;
      
      // Add reading time estimation
      $body_text = strip_tags($node->get('body')->value);
      $word_count = str_word_count($body_text);
      $variables['reading_time'] = ceil($word_count / 200); // 200 words per minute
    }
  }
  
  // Add contextual CSS classes
  $variables['attributes']['class'][] = 'page--' . 
    str_replace('_', '-', $route_match->getRouteName());
}

/**
 * Implements hook_theme_suggestions_HOOK_alter().
 */
function mymodule_theme_suggestions_page_alter(array &$suggestions, array $variables) {
  // Add theme suggestions based on content type
  if ($node = \\Drupal::routeMatch()->getParameter('node')) {
    $suggestions[] = 'page__node__' . $node->bundle();
    $suggestions[] = 'page__node__' . $node->id();
  }
  
  // Add suggestions based on user role
  $user = \\Drupal::currentUser();
  if ($user->isAuthenticated()) {
    $suggestions[] = 'page__user_authenticated';
    
    foreach ($user->getRoles() as $role) {
      $suggestions[] = 'page__role__' . str_replace(' ', '_', $role);
    }
  }
}`,
      tags: ["theming", "preprocessing", "templates", "twig"],
      related_functions: ["hook_theme", "template_preprocess", "theme_suggestions_alter"],
    },

    // API examples
    {
      title: "REST API with custom endpoints",
      description: "Create custom REST endpoints with proper serialization",
      category: "api",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\Plugin\\rest\\resource;

use Drupal\\rest\\Plugin\\ResourceBase;
use Drupal\\rest\\ResourceResponse;
use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Drupal\\Core\\Session\\AccountProxyInterface;
use Symfony\\Component\\DependencyInjection\\ContainerInterface;
use Symfony\\Component\\HttpFoundation\\Request;
use Symfony\\Component\\HttpKernel\\Exception\\BadRequestHttpException;
use Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException;
use Psr\\Log\\LoggerInterface;

/**
 * Provides a REST resource for articles.
 *
 * @RestResource(
 *   id = "article_resource",
 *   label = @Translation("Article Resource"),
 *   uri_paths = {
 *     "canonical" = "/api/articles/{id}",
 *     "create" = "/api/articles"
 *   }
 * )
 */
class ArticleResource extends ResourceBase {

  /**
   * The entity type manager.
   */
  protected $entityTypeManager;

  /**
   * The current user.
   */
  protected $currentUser;

  /**
   * Constructs a new ArticleResource object.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    EntityTypeManagerInterface $entity_type_manager,
    AccountProxyInterface $current_user
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->entityTypeManager = $entity_type_manager;
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
      $container->get('logger.factory')->get('mymodule'),
      $container->get('entity_type.manager'),
      $container->get('current_user')
    );
  }

  /**
   * Responds to GET requests.
   */
  public function get($id = NULL) {
    if ($id) {
      return $this->getSingleArticle($id);
    }
    return $this->getArticleList();
  }

  /**
   * Get a single article.
   */
  private function getSingleArticle($id) {
    $node = $this->entityTypeManager->getStorage('node')->load($id);
    
    if (!$node || $node->bundle() !== 'article') {
      throw new NotFoundHttpException('Article not found');
    }

    if (!$node->access('view', $this->currentUser)) {
      throw new AccessDeniedHttpException('Access denied');
    }

    $response_data = [
      'id' => $node->id(),
      'title' => $node->getTitle(),
      'body' => $node->get('body')->processed,
      'summary' => $node->get('body')->summary,
      'author' => [
        'id' => $node->getOwnerId(),
        'name' => $node->getOwner()->getDisplayName(),
      ],
      'created' => date('c', $node->getCreatedTime()),
      'updated' => date('c', $node->getChangedTime()),
      'published' => $node->isPublished(),
      'url' => $node->toUrl('canonical', ['absolute' => TRUE])->toString(),
    ];

    // Add image if present
    if ($node->hasField('field_image') && !$node->get('field_image')->isEmpty()) {
      $image = $node->get('field_image')->entity;
      $response_data['image'] = [
        'url' => file_create_url($image->getFileUri()),
        'alt' => $node->get('field_image')->alt,
        'title' => $node->get('field_image')->title,
      ];
    }

    return new ResourceResponse($response_data);
  }

  /**
   * Get list of articles with pagination.
   */
  private function getArticleList() {
    $request = \\Drupal::request();
    $page = $request->query->get('page', 0);
    $limit = min($request->query->get('limit', 10), 50); // Max 50 items
    $offset = $page * $limit;

    $query = $this->entityTypeManager->getStorage('node')->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'article')
      ->condition('status', 1)
      ->sort('created', 'DESC')
      ->range($offset, $limit);

    $nids = $query->execute();
    $nodes = $this->entityTypeManager->getStorage('node')->loadMultiple($nids);

    $articles = [];
    foreach ($nodes as $node) {
      $articles[] = [
        'id' => $node->id(),
        'title' => $node->getTitle(),
        'summary' => $node->get('body')->summary ?: 
          substr(strip_tags($node->get('body')->value), 0, 200) . '...',
        'author' => $node->getOwner()->getDisplayName(),
        'created' => date('c', $node->getCreatedTime()),
        'url' => $node->toUrl('canonical', ['absolute' => TRUE])->toString(),
      ];
    }

    // Add pagination metadata
    $total_count = $this->entityTypeManager->getStorage('node')->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'article')
      ->condition('status', 1)
      ->count()
      ->execute();

    $response_data = [
      'articles' => $articles,
      'pagination' => [
        'page' => (int) $page,
        'limit' => $limit,
        'total' => (int) $total_count,
        'pages' => ceil($total_count / $limit),
      ],
    ];

    return new ResourceResponse($response_data);
  }

  /**
   * Responds to POST requests.
   */
  public function post(Request $request) {
    if (!$this->currentUser->hasPermission('create article content')) {
      throw new AccessDeniedHttpException('Insufficient permissions');
    }

    $data = json_decode($request->getContent(), TRUE);
    
    if (!$this->validatePostData($data)) {
      throw new BadRequestHttpException('Invalid data provided');
    }

    try {
      $node = $this->entityTypeManager->getStorage('node')->create([
        'type' => 'article',
        'title' => $data['title'],
        'body' => [
          'value' => $data['body'],
          'format' => 'basic_html',
        ],
        'status' => $data['published'] ?? 1,
        'uid' => $this->currentUser->id(),
      ]);

      $node->save();

      $response_data = [
        'id' => $node->id(),
        'title' => $node->getTitle(),
        'created' => date('c', $node->getCreatedTime()),
        'url' => $node->toUrl('canonical', ['absolute' => TRUE])->toString(),
        'message' => 'Article created successfully',
      ];

      return new ResourceResponse($response_data, 201);
    }
    catch (\\Exception $e) {
      $this->logger->error('Error creating article: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw new BadRequestHttpException('Failed to create article');
    }
  }

  /**
   * Validate POST data.
   */
  private function validatePostData($data) {
    if (!is_array($data)) {
      return FALSE;
    }

    // Required fields
    if (empty($data['title']) || empty($data['body'])) {
      return FALSE;
    }

    // Title length
    if (strlen($data['title']) > 255) {
      return FALSE;
    }

    // Body length
    if (strlen($data['body']) > 50000) {
      return FALSE;
    }

    return TRUE;
  }
}`,
      tags: ["api", "rest", "json", "endpoints"],
      related_functions: ["ResourceResponse", "getQuery", "json_decode"],
    },

    // Media examples
    {
      title: "File upload and media handling",
      description: "Handle file uploads and media entity creation",
      category: "media",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\Service;

use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Drupal\\Core\\File\\FileSystemInterface;
use Drupal\\file\\Entity\\File;
use Drupal\\media\\Entity\\Media;
use Drupal\\image\\Entity\\ImageStyle;
use Symfony\\Component\\HttpFoundation\\File\\UploadedFile;

/**
 * Service for handling file uploads and media operations.
 */
class MediaHandlerService {

  /**
   * The entity type manager.
   */
  protected $entityTypeManager;

  /**
   * The file system service.
   */
  protected $fileSystem;

  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    FileSystemInterface $file_system
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->fileSystem = $file_system;
  }

  /**
   * Handle file upload and create media entity.
   */
  public function handleFileUpload(UploadedFile $uploaded_file, $bundle = 'image') {
    try {
      // Validate file
      if (!$this->validateUploadedFile($uploaded_file, $bundle)) {
        throw new \\InvalidArgumentException('Invalid file upload');
      }

      // Prepare upload directory
      $upload_dir = "public://uploads/{$bundle}/" . date('Y-m');
      $this->fileSystem->prepareDirectory($upload_dir, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);

      // Generate unique filename
      $filename = $this->generateUniqueFilename($uploaded_file->getClientOriginalName(), $upload_dir);
      $destination = $upload_dir . '/' . $filename;

      // Move uploaded file
      $uploaded_file->move($this->fileSystem->realpath($upload_dir), $filename);

      // Create file entity
      $file = File::create([
        'filename' => $filename,
        'uri' => $destination,
        'status' => 1,
        'uid' => \\Drupal::currentUser()->id(),
      ]);
      $file->save();

      // Create media entity
      $media = Media::create([
        'bundle' => $bundle,
        'name' => pathinfo($filename, PATHINFO_FILENAME),
        'field_media_' . $bundle => [
          'target_id' => $file->id(),
          'alt' => $bundle === 'image' ? pathinfo($filename, PATHINFO_FILENAME) : '',
          'title' => pathinfo($filename, PATHINFO_FILENAME),
        ],
        'status' => 1,
        'uid' => \\Drupal::currentUser()->id(),
      ]);
      $media->save();

      // Generate image styles for images
      if ($bundle === 'image') {
        $this->generateImageStyles($file);
      }

      return [
        'media' => $media,
        'file' => $file,
        'message' => 'File uploaded successfully',
      ];

    } catch (\\Exception $e) {
      \\Drupal::logger('mymodule')->error('File upload failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw $e;
    }
  }

  /**
   * Validate uploaded file.
   */
  private function validateUploadedFile(UploadedFile $file, $bundle) {
    // Check file size (10MB max)
    if ($file->getSize() > 10 * 1024 * 1024) {
      return FALSE;
    }

    // Check file extensions based on bundle
    $allowed_extensions = $this->getAllowedExtensions($bundle);
    $file_extension = strtolower(pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION));
    
    if (!in_array($file_extension, $allowed_extensions)) {
      return FALSE;
    }

    // Additional validation for images
    if ($bundle === 'image') {
      $image_info = getimagesize($file->getPathname());
      if (!$image_info) {
        return FALSE; // Not a valid image
      }

      // Check image dimensions (max 4000x4000)
      if ($image_info[0] > 4000 || $image_info[1] > 4000) {
        return FALSE;
      }
    }

    return TRUE;
  }

  /**
   * Get allowed file extensions for bundle.
   */
  private function getAllowedExtensions($bundle) {
    $extensions = [
      'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      'document' => ['pdf', 'doc', 'docx', 'txt', 'rtf'],
      'video' => ['mp4', 'avi', 'mov', 'wmv'],
      'audio' => ['mp3', 'wav', 'ogg', 'flac'],
    ];

    return $extensions[$bundle] ?? [];
  }

  /**
   * Generate unique filename to avoid conflicts.
   */
  private function generateUniqueFilename($original_name, $directory) {
    $filename = $original_name;
    $counter = 1;

    while (file_exists($directory . '/' . $filename)) {
      $pathinfo = pathinfo($original_name);
      $filename = $pathinfo['filename'] . '_' . $counter . '.' . $pathinfo['extension'];
      $counter++;
    }

    return $filename;
  }

  /**
   * Generate image styles for uploaded image.
   */
  private function generateImageStyles(File $file) {
    $image_styles = ['thumbnail', 'medium', 'large'];
    
    foreach ($image_styles as $style_name) {
      $style = ImageStyle::load($style_name);
      if ($style) {
        $derivative_uri = $style->buildUri($file->getFileUri());
        if (!file_exists($derivative_uri)) {
          $style->createDerivative($file->getFileUri(), $derivative_uri);
        }
      }
    }
  }

  /**
   * Get media entity with processed URLs.
   */
  public function getMediaWithUrls($media_id) {
    $media = Media::load($media_id);
    if (!$media) {
      return NULL;
    }

    $bundle = $media->bundle();
    $field_name = 'field_media_' . $bundle;
    
    if (!$media->hasField($field_name) || $media->get($field_name)->isEmpty()) {
      return NULL;
    }

    $file = $media->get($field_name)->entity;
    if (!$file) {
      return NULL;
    }

    $result = [
      'id' => $media->id(),
      'name' => $media->getName(),
      'bundle' => $bundle,
      'created' => $media->getCreatedTime(),
      'file' => [
        'id' => $file->id(),
        'filename' => $file->getFilename(),
        'filesize' => format_size($file->getSize()),
        'mime_type' => $file->getMimeType(),
        'url' => file_create_url($file->getFileUri()),
      ],
    ];

    // Add image-specific data
    if ($bundle === 'image') {
      $result['image'] = [
        'alt' => $media->get($field_name)->alt,
        'title' => $media->get($field_name)->title,
        'styles' => $this->getImageStyleUrls($file),
      ];
    }

    return $result;
  }

  /**
   * Get URLs for all image styles.
   */
  private function getImageStyleUrls(File $file) {
    $style_urls = [];
    $image_styles = ImageStyle::loadMultiple();
    
    foreach ($image_styles as $style_name => $style) {
      $style_urls[$style_name] = $style->buildUrl($file->getFileUri());
    }

    return $style_urls;
  }
}`,
      tags: ["media", "file-upload", "image", "validation"],
      related_functions: ["File::create", "Media::create", "ImageStyle::load", "prepareDirectory"],
    },

    // Multilingual examples
    {
      title: "Multilingual content and translations",
      description: "Handle multilingual content and translation workflows",
      category: "multilingual",
      drupal_version: ["9.x", "10.x", "11.x"],
      code: `namespace Drupal\\mymodule\\Service;

use Drupal\\Core\\Entity\\EntityTypeManagerInterface;
use Drupal\\Core\\Language\\LanguageManagerInterface;
use Drupal\\content_translation\\ContentTranslationManagerInterface;
use Drupal\\Core\\Session\\AccountInterface;

/**
 * Service for handling multilingual content operations.
 */
class MultilingualService {

  /**
   * The entity type manager.
   */
  protected $entityTypeManager;

  /**
   * The language manager.
   */
  protected $languageManager;

  /**
   * The content translation manager.
   */
  protected $contentTranslationManager;

  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    LanguageManagerInterface $language_manager,
    ContentTranslationManagerInterface $content_translation_manager
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->languageManager = $language_manager;
    $this->contentTranslationManager = $content_translation_manager;
  }

  /**
   * Create multilingual content with translations.
   */
  public function createMultilingualContent($data) {
    $default_langcode = $this->languageManager->getDefaultLanguage()->getId();
    
    // Create the original content in default language
    $node = $this->entityTypeManager->getStorage('node')->create([
      'type' => 'article',
      'title' => $data['title'][$default_langcode],
      'body' => [
        'value' => $data['body'][$default_langcode],
        'format' => 'basic_html',
      ],
      'status' => 1,
      'langcode' => $default_langcode,
    ]);
    $node->save();

    // Add translations for other languages
    foreach ($data['title'] as $langcode => $title) {
      if ($langcode === $default_langcode) {
        continue; // Skip default language
      }

      if ($this->contentTranslationManager->isSupported('node', 'article')) {
        // Check if translation already exists
        if (!$node->hasTranslation($langcode)) {
          $translation = $node->addTranslation($langcode, [
            'title' => $title,
            'body' => [
              'value' => $data['body'][$langcode],
              'format' => 'basic_html',
            ],
            'status' => 1,
          ]);
          $translation->save();
        }
      }
    }

    return $node;
  }

  /**
   * Get content in user's preferred language.
   */
  public function getLocalizedContent($entity_id, $entity_type = 'node', AccountInterface $account = NULL) {
    $entity = $this->entityTypeManager->getStorage($entity_type)->load($entity_id);
    if (!$entity) {
      return NULL;
    }

    // Get user's preferred language
    $preferred_language = $account ? 
      $this->languageManager->getLanguage($account->getPreferredLangcode()) :
      $this->languageManager->getCurrentLanguage();

    // Return translation if available
    if ($entity->hasTranslation($preferred_language->getId())) {
      return $entity->getTranslation($preferred_language->getId());
    }

    // Fallback to original language
    return $entity;
  }

  /**
   * Get translation status for content.
   */
  public function getTranslationStatus($entity) {
    if (!$this->contentTranslationManager->isEnabled($entity->getEntityTypeId(), $entity->bundle())) {
      return ['translation_enabled' => FALSE];
    }

    $available_languages = $this->languageManager->getLanguages();
    $translation_status = [
      'translation_enabled' => TRUE,
      'original_language' => $entity->language()->getId(),
      'translations' => [],
    ];

    foreach ($available_languages as $langcode => $language) {
      $translation_status['translations'][$langcode] = [
        'language_name' => $language->getName(),
        'exists' => $entity->hasTranslation($langcode),
        'published' => $entity->hasTranslation($langcode) ? 
          $entity->getTranslation($langcode)->isPublished() : FALSE,
        'outdated' => $entity->hasTranslation($langcode) ? 
          $this->contentTranslationManager->isOutdated($entity->getTranslation($langcode)) : FALSE,
      ];
    }

    return $translation_status;
  }

  /**
   * Bulk translate content using translation services.
   */
  public function bulkTranslateContent(array $entity_ids, $target_language, $source_language = NULL) {
    $source_language = $source_language ?: $this->languageManager->getDefaultLanguage()->getId();
    $results = [];

    foreach ($entity_ids as $entity_id) {
      try {
        $entity = $this->entityTypeManager->getStorage('node')->load($entity_id);
        if (!$entity) {
          continue;
        }

        // Check if entity supports translation
        if (!$this->contentTranslationManager->isEnabled($entity->getEntityTypeId(), $entity->bundle())) {
          $results[$entity_id] = ['status' => 'error', 'message' => 'Translation not enabled'];
          continue;
        }

        // Skip if translation already exists
        if ($entity->hasTranslation($target_language)) {
          $results[$entity_id] = ['status' => 'skipped', 'message' => 'Translation already exists'];
          continue;
        }

        // Get source translation
        $source_entity = $entity->hasTranslation($source_language) ? 
          $entity->getTranslation($source_language) : $entity;

        // Create translation (in real implementation, you'd use translation service)
        $translated_data = $this->translateContent([
          'title' => $source_entity->getTitle(),
          'body' => $source_entity->get('body')->value,
        ], $source_language, $target_language);

        $translation = $entity->addTranslation($target_language, [
          'title' => $translated_data['title'],
          'body' => [
            'value' => $translated_data['body'],
            'format' => $source_entity->get('body')->format,
          ],
          'status' => 0, // Save as unpublished for review
        ]);
        $translation->save();

        $results[$entity_id] = [
          'status' => 'success',
          'message' => 'Translation created',
          'translation_id' => $translation->id(),
        ];

      } catch (\\Exception $e) {
        $results[$entity_id] = [
          'status' => 'error',
          'message' => $e->getMessage(),
        ];
      }
    }

    return $results;
  }

  /**
   * Mock translation service (replace with real service).
   */
  private function translateContent($content, $source_lang, $target_lang) {
    // In real implementation, integrate with translation services like:
    // - Google Translate API
    // - Microsoft Translator
    // - DeepL API
    // - Custom translation service
    
    return [
      'title' => '[' . strtoupper($target_lang) . '] ' . $content['title'],
      'body' => '[' . strtoupper($target_lang) . '] ' . $content['body'],
    ];
  }

  /**
   * Get language-specific URL for content.
   */
  public function getLocalizedUrl($entity, $langcode = NULL) {
    $langcode = $langcode ?: $this->languageManager->getCurrentLanguage()->getId();
    
    if ($entity->hasTranslation($langcode)) {
      $translation = $entity->getTranslation($langcode);
      return $translation->toUrl('canonical', [
        'language' => $this->languageManager->getLanguage($langcode),
        'absolute' => TRUE,
      ]);
    }

    return $entity->toUrl('canonical', ['absolute' => TRUE]);
  }

  /**
   * Generate language switcher data.
   */
  public function getLanguageSwitcherData($entity = NULL) {
    $languages = $this->languageManager->getNativeLanguages();
    $current_language = $this->languageManager->getCurrentLanguage();
    $switcher_data = [];

    foreach ($languages as $langcode => $language) {
      $switcher_item = [
        'langcode' => $langcode,
        'name' => $language->getName(),
        'native_name' => $language->getName(),
        'is_current' => $langcode === $current_language->getId(),
        'available' => TRUE,
      ];

      if ($entity) {
        $switcher_item['available'] = $entity->hasTranslation($langcode);
        $switcher_item['url'] = $switcher_item['available'] ? 
          $this->getLocalizedUrl($entity, $langcode)->toString() : NULL;
      }

      $switcher_data[] = $switcher_item;
    }

    return $switcher_data;
  }
}`,
      tags: ["multilingual", "translation", "i18n", "localization"],
      related_functions: ["addTranslation", "hasTranslation", "getTranslation", "getCurrentLanguage"],
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
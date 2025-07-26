# 🚀 Drupal Development with MCP God Mod

You have access to the **MCP Drupal God Mod** server - the ultimate Drupal development assistant. This server provides dynamic, real-time access to Drupal documentation, code examples, module analysis, and intelligent code generation.

## 🎯 Core Principles

When working on Drupal projects, **ALWAYS** use these MCP tools instead of relying on general knowledge. The server provides:
- Real-time data from official Drupal APIs
- Dynamic code examples from GitHub and Drupal.org
- Intelligent analysis with security checks
- Context-aware recommendations

## 🛠️ Essential Workflows

### 1. Starting Any Drupal Task
```
1. search_drupal_all("your topic") - Get overview
2. search_code_examples("implementation") - See real examples
3. search_contrib_modules("functionality") - Find existing solutions
4. Generate or analyze code based on findings
```

### 2. Creating New Modules
```
1. search_contrib_modules() - Check if it already exists
2. get_module_template_info() - See available options
3. generate_module_skeleton() - Create complete structure
4. analyze_drupal_file() - Verify generated code
```

### 3. Analyzing Existing Code
```
1. analyze_drupal_file("path/to/file.php") - Full analysis
2. check_drupal_standards("path/to/file.php") - Standards check
3. Get recommendations for improvements
```

### 4. Finding Documentation
```
1. search_drupal_functions("function_name") - API reference
2. get_function_details("exact_function_name") - Detailed info
3. search_drupal_hooks("hook_name") - Hook documentation
4. search_code_examples("usage") - Implementation examples
```

## 📋 Tool Reference

### Search & Discovery
- `search_drupal_all` - Universal search (start here!)
- `search_drupal_functions` - Find specific functions
- `search_drupal_hooks` - Discover hooks
- `search_drupal_services` - Service container
- `search_drupal_classes` - Classes and interfaces
- `search_drupal_topics` - Conceptual topics
- `search_contrib_modules` - Community modules
- `search_contrib_themes` - Community themes
- `search_code_examples` - Real-world code
- `get_examples_by_category` - Categorized examples
- `get_examples_by_tag` - Tagged examples

### Detailed Information
- `get_function_details` - Complete function docs
- `get_class_details` - Complete class docs
- `get_hook_details` - Hook implementation details
- `get_service_details` - Service container details
- `get_module_details` - Module information
- `get_popular_modules` - Top modules by category

### Code Analysis & Generation
- `analyze_drupal_file` - Comprehensive file analysis
- `check_drupal_standards` - Coding standards check
- `generate_module_skeleton` - Create module structure
- `get_module_template_info` - Template options
- `generate_custom_entity` - Complete entity generation (15+ files)

### Hybrid Mode (if connected to live site)
- `hybrid_analyze_module` - Module + installation status
- `hybrid_analyze_function` - Function + usage analysis
- `hybrid_analyze_site` - Full site recommendations
- `hybrid_analyze_content_type` - Content type analysis
- `get_mode_status` - Check connection status

## 💡 Best Practices

### Always Start with Search
```
# Good: Search first, then implement
search_drupal_all("user authentication")
search_code_examples("custom authentication")
search_contrib_modules("two factor")

# Bad: Jumping straight to code without research
```

### Check for Existing Solutions
```
# Good: Look for contrib modules first
search_contrib_modules("workflow")
get_module_details("workflow")

# Bad: Building custom without checking
```

### Analyze Generated Code
```
# Good: Verify generated code
generate_module_skeleton(...)
analyze_drupal_file("generated_file.php")
check_drupal_standards("generated_file.php")

# Bad: Using generated code without review
```

### Use Dynamic Examples
```
# Good: Get current examples
search_code_examples("entity query")
get_examples_by_category("database")

# Bad: Using outdated patterns
```

## 🚨 Important Notes

1. **Version Awareness**: The server defaults to Drupal 11.x. Specify version if different.

2. **Security First**: Always check analysis results for security issues.

3. **Performance**: Use caching wisely - the server caches results for 15-30 minutes.

4. **Error Handling**: If a tool returns no results, try:
   - Broader search terms
   - Different tool (e.g., search_drupal_all instead of search_drupal_functions)
   - Check spelling and formatting

5. **Mode Status**: Use `get_mode_status()` to check if hybrid features are available.

## 📊 Example Scenarios

### "How do I create a custom form?"
```
1. search_drupal_topics("form api")
2. search_drupal_functions("form")
3. search_code_examples("custom form")
4. get_examples_by_category("forms")
5. search_contrib_modules("form builder")
```

### "Analyze my custom module"
```
1. analyze_drupal_file("my_module/my_module.module")
2. check_drupal_standards("my_module/src/Controller/MyController.php")
3. Review security issues and recommendations
```

### "Generate an event management module"
```
1. search_contrib_modules("event")
2. generate_module_skeleton({
     name: "Event Manager",
     machineName: "event_manager",
     includeEntity: true
   })
3. analyze_drupal_file("event_manager/event_manager.module")
```

## 🔧 Configuration Tips

- **DOCS_ONLY_MODE**: Default, no Drupal instance needed
- **HYBRID_MODE**: Best experience with live site connection
- **Cache**: Results cached 15-30 min for performance
- **Timeout**: API calls timeout after 45 seconds

## ⚡ Performance Optimization

1. Batch related searches together
2. Use specific tools rather than general search when possible
3. Cache results locally when doing repeated operations
4. Use `get_mode_status()` before hybrid operations

---

## 🚀 Phase 4 - Advanced Intelligence Features

### Deep Code Analysis
```
# Analyze file with quality score, security audit, and refactoring suggestions
deep_analyze_file("path/to/module.php")

# Returns:
- Quality score (0-100)
- Performance issues with impact estimates
- Security score breakdown
- Refactoring suggestions with code
- Deprecation warnings
- Best practice recommendations
```

### Smart Search with Fuzzy Matching
```
# Search with typo tolerance and suggestions
smart_search("entitiy managr")  # Will find "entity manager"

# Features:
- Typo correction
- Abbreviation expansion (D10 → Drupal 10)
- Synonym matching (node ↔ content)
- Contextual suggestions
- "Did you mean..." functionality
```

### Custom Entity Generator
```
# Generate complete custom entity
generate_custom_entity({
  entity_info: {
    entity_type: "event",
    label: "Event",
    bundles: ["conference", "workshop"],
    revisionable: true,
    translatable: true,
    include_rest_api: true
  },
  module_info: {
    name: "Event Manager",
    machine_name: "event_manager"
  }
})

# Generates 15+ files including:
- Entity classes and interfaces
- Storage handlers
- Forms and controllers
- Views integration
- REST resources
- Admin UI
- Tests
```

### Migration Assistant
```
# Analyze upgrade path
analyze_upgrade_path("./project", "9", "10")

# Features:
- Detects all deprecated APIs
- Generates migration report
- Creates automated patches
- Estimates effort (hours)
- Step-by-step migration plan
- HTML report generation
```

### Example Advanced Workflows

#### Complete Module Analysis
```
1. deep_analyze_file("my_module.module")
2. Review quality score and issues
3. Apply automated refactoring suggestions
4. Run standards check again
```

#### Smart Development Flow
```
1. smart_search("how to create form")
2. Get corrected search + suggestions
3. Review fuzzy matches and examples
4. Generate code based on best match
```

#### Entity Development
```
1. search_contrib_modules("entity")
2. generate_custom_entity() with your specs
3. deep_analyze_file() on generated code
4. Customize based on analysis
```

---

**Remember**: This is God Mode for Drupal - use it wisely and always verify critical code!
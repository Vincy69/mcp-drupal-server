# 🚀 MCP Drupal God Mod

[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/Vincy69/mcp-drupal-god-mod)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

The **Ultimate MCP Server for Drupal CMS** - A powerhouse combining dynamic data aggregation, hybrid architecture, and intelligent analysis tools. This isn't just another MCP server; it's the God Mode for Drupal development.

## 🎯 Why God Mod?

- **100% Dynamic Architecture** - No hardcoded data, everything from live APIs
- **Hybrid Intelligence** - Seamlessly combines documentation with live Drupal instances
- **Multi-Source Aggregation** - GitHub, Drupal.org, API docs, and your Drupal site
- **Smart Fallback System** - Never fails, gracefully degrades when sources are unavailable
- **Advanced Analysis Tools** - AI-powered code analyzer v2, module generator, standards checker
- **AI Intelligence** - Fuzzy search with typo tolerance, migration assistant, quality scoring
- **Blazing Fast Cache** - Intelligent caching with automatic invalidation

## ✨ Features

### 🔍 Core Search & Discovery
- **Universal Search** - Search across all Drupal APIs, functions, hooks, and services
- **Smart Module Discovery** - Find contrib modules with statistics and compatibility info
- **Code Examples** - Real-world examples from GitHub, Drupal.org, and official docs
- **Hook Documentation** - Complete hook reference with usage examples

### 🛠️ Development Tools
- **Code Analyzer v2** - AI-powered analysis with quality scoring (0-100), security audit, and refactoring suggestions
- **Module Generator** - Generate complete module skeletons with 15+ file types
- **Standards Checker** - Ensure your code follows Drupal coding standards
- **Custom Entity Generator** - Create custom entities with all necessary files (15+ files per entity)
- **Migration Assistant** - Analyze and automate Drupal version upgrades (8→9→10→11)

### 🧠 Advanced Intelligence Features (v1.5.0)
- **Deep Code Analysis** - Quality scoring, performance detection, security audit, refactoring suggestions
- **Smart Fuzzy Search** - Typo tolerance, abbreviation expansion, synonym matching, "Did you mean..." suggestions
- **Migration Intelligence** - Automated upgrade path analysis, patch generation, effort estimation
- **Entity Generation** - Complete custom entity with forms, storage, REST API, Views integration

### 🎭 Hybrid Mode Features
- **4 Operational Modes**:
  - `DOCS_ONLY` - Pure documentation mode (default)
  - `LIVE_ONLY` - Connected to live Drupal instance only
  - `HYBRID` - Best of both worlds
  - `SMART_FALLBACK` - Intelligent mode switching
- **Live Site Analysis** - Analyze modules, content types, and configurations
- **Contextual Recommendations** - Get suggestions based on your actual setup

## 🚀 Quick Start

### Installation

#### Option 1: Interactive Installation Wizard (Recommended)
```bash
# Clone the repository
git clone https://github.com/Vincy69/mcp-drupal-god-mod.git
cd mcp-drupal-god-mod

# Run the installation wizard
npm run install:wizard
```

The wizard will:
- ✅ Check prerequisites (Node.js 18+, npm 8+)
- ✅ Configure environment variables
- ✅ Install dependencies and build
- ✅ Set up Claude Desktop integration automatically
- ✅ Create startup scripts

#### Option 2: Manual Installation
```bash
# Clone the repository
git clone https://github.com/Vincy69/mcp-drupal-god-mod.git
cd mcp-drupal-god-mod

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Drupal connection details
# Build the project
npm run build

# Start the server
npm start
```

### Claude Desktop Configuration

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drupal-god-mod": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-drupal-god-mod/dist/index.js"],
      "env": {
        "DRUPAL_BASE_URL": "https://your-site.com",
        "DRUPAL_USERNAME": "admin",
        "DRUPAL_PASSWORD": "your-password"
      }
    }
  }
}
```

## 📖 Usage with Claude

### Basic Usage

Create a `CLAUDE.md` file in your Drupal project root:

```markdown
# 🚀 Drupal Development with MCP God Mod

You have access to the **MCP Drupal God Mod** server - the ultimate Drupal development assistant.

## 🛠️ Essential Tools

### Search & Discovery
- `search_drupal_all` - Universal search (start here!)
- `search_drupal_functions` - Find specific functions
- `search_drupal_hooks` - Discover hooks
- `search_drupal_services` - Service container
- `search_contrib_modules` - Community modules
- `search_code_examples` - Real-world code

### Code Analysis & Generation
- `analyze_drupal_file` - Comprehensive file analysis
- `check_drupal_standards` - Coding standards check
- `generate_module_skeleton` - Create module structure
- `generate_custom_entity` - Complete entity generation (15+ files)

### 🧠 Advanced Intelligence (v1.5.0)
- `deep_analyze_file` - AI analysis with quality score (0-100)
- `smart_search` - Fuzzy search with typo tolerance
- `analyze_upgrade_path` - Migration analysis (D8→D9→D10→D11)
- `generate_migration_patches` - Automated migration fixes
- `generate_migration_report` - HTML migration reports

### Hybrid Features (if connected to live site)
- `hybrid_analyze_module` - Module + installation status
- `hybrid_analyze_site` - Full site recommendations
- `get_mode_status` - Check connection status

## 💡 Example Workflows

### Starting Any Task:
1. search_drupal_all("your topic")
2. search_code_examples("implementation")
3. search_contrib_modules("functionality")
4. Generate or analyze code

### Advanced Analysis:
1. deep_analyze_file("my_module.module")
2. Review quality score and security issues
3. Apply refactoring suggestions

### Migration Planning:
1. analyze_upgrade_path("./project", "9", "10")
2. generate_migration_patches(report)
3. Review HTML report

## ✅ Best Practices
- Always search before implementing
- Check for contrib modules first
- Use deep_analyze_file for quality assurance
- Let smart_search correct your typos

When asked about Drupal, ALWAYS use these tools rather than general knowledge.
```

### Example Prompts

```
"Find all hooks related to user authentication"
"Generate a custom module for managing events"
"Analyze my custom module for security issues"
"What contrib modules can help with SEO?"
"Show me examples of creating custom entities"
```

## 🔧 Configuration

### Environment Variables

```bash
# Mode Configuration (optional)
DOCS_ONLY_MODE=true          # Force documentation mode
FORCE_LIVE_MODE=true         # Force live mode
FORCE_HYBRID_MODE=true       # Force hybrid mode

# Drupal Connection (for hybrid features)
DRUPAL_BASE_URL=https://example.com
DRUPAL_USERNAME=admin
DRUPAL_PASSWORD=password
# OR use token/API key
DRUPAL_TOKEN=your_oauth_token
DRUPAL_API_KEY=your_api_key

# Performance Tuning
CACHE_TIMEOUT=900000         # Cache timeout in ms (default: 15 min)
API_TIMEOUT=45000           # API timeout in ms (default: 45 sec)
MAX_RETRIES=3               # Maximum retry attempts
```

## 📊 Available Tools

### Search Tools
| Tool | Description | Mode |
|------|-------------|------|
| `search_drupal_all` | Universal search across all Drupal APIs | Docs |
| `search_drupal_functions` | Search for specific functions | Docs |
| `search_drupal_hooks` | Find hooks and implementations | Docs |
| `search_drupal_services` | Discover services and containers | Docs |
| `search_drupal_classes` | Search PHP classes and interfaces | Docs |
| `search_contrib_modules` | Find contributed modules | Docs |
| `search_code_examples` | Get implementation examples | Dynamic |

### Analysis Tools
| Tool | Description | Mode |
|------|-------------|------|
| `analyze_drupal_file` | Analyze PHP file structure | Local |
| `check_drupal_standards` | Check coding standards | Local |
| `generate_module_skeleton` | Create module structure | Local |
| `generate_custom_entity` | Generate complete custom entities | Local |

### Advanced Intelligence Tools (v1.5.0)
| Tool | Description | Mode |
|------|-------------|------|
| `deep_analyze_file` | Advanced code analysis with quality scoring | Local |
| `smart_search` | Fuzzy search with typo tolerance | Local |
| `analyze_upgrade_path` | Drupal version migration analysis | Local |
| `generate_migration_patches` | Generate automated migration patches | Local |
| `generate_migration_report` | Create HTML migration reports | Local |

### Hybrid Tools
| Tool | Description | Mode |
|------|-------------|------|
| `hybrid_analyze_module` | Analyze module with live data | Hybrid |
| `hybrid_analyze_function` | Function usage analysis | Hybrid |
| `hybrid_analyze_site` | Full site analysis | Hybrid |
| `hybrid_analyze_content_type` | Content type analysis | Hybrid |
| `get_mode_status` | Check server mode status | System |

## 📚 Documentation

- **[API.md](API.md)** - Complete API reference with examples
- **[CLAUDE.md](CLAUDE.md)** - Usage guide for Claude
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

## 🏗️ Architecture

### Dynamic Data Sources
- **GitHub API** - Real code examples from Drupal repos
- **Drupal.org API** - Modules, themes, documentation
- **API.Drupal.org** - Official API documentation
- **Live Drupal Instance** - Your actual site data (optional)

### Intelligent Caching
- Multi-level cache with TTL management
- Automatic invalidation on errors
- Configurable timeout periods
- Memory-efficient storage

### Robust Error Handling
- Retry logic with exponential backoff
- Graceful degradation
- Detailed error logging
- No silent failures

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Install dev dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check

# Run with Docker
docker build -t mcp-drupal-god-mod .
docker run -it mcp-drupal-god-mod
```

### CI/CD

The project includes GitHub Actions workflows for:
- ✅ Automated testing (Node.js 18, 20)
- ✅ Security scanning (npm audit, Snyk)
- ✅ Code quality checks (ESLint, TypeScript)
- ✅ Automated releases (semantic-release)
- ✅ Docker builds
- ✅ Documentation generation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Drupal Community for the amazing CMS
- Anthropic for the MCP protocol
- All contributors and testers

## 📞 Support

- 🐛 [Report Issues](https://github.com/Vincy69/mcp-drupal-god-mod/issues)
- 💬 [Discussions](https://github.com/Vincy69/mcp-drupal-god-mod/discussions)
- 📧 Contact: Via GitHub Issues

---

**Made with ❤️ for the Drupal Community**

*"Not just a tool, it's God Mode for Drupal development"*
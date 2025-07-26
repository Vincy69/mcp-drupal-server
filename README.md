# 🚀 MCP Drupal God Mod

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/mcp-drupal-god-mod)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

The **Ultimate MCP Server for Drupal CMS** - A powerhouse combining dynamic data aggregation, hybrid architecture, and intelligent analysis tools. This isn't just another MCP server; it's the God Mode for Drupal development.

## 🎯 Why God Mod?

- **100% Dynamic Architecture** - No hardcoded data, everything from live APIs
- **Hybrid Intelligence** - Seamlessly combines documentation with live Drupal instances
- **Multi-Source Aggregation** - GitHub, Drupal.org, API docs, and your Drupal site
- **Smart Fallback System** - Never fails, gracefully degrades when sources are unavailable
- **Advanced Analysis Tools** - Code analyzer, module generator, standards checker
- **Blazing Fast Cache** - Intelligent caching with automatic invalidation

## ✨ Features

### 🔍 Core Search & Discovery
- **Universal Search** - Search across all Drupal APIs, functions, hooks, and services
- **Smart Module Discovery** - Find contrib modules with statistics and compatibility info
- **Code Examples** - Real-world examples from GitHub, Drupal.org, and official docs
- **Hook Documentation** - Complete hook reference with usage examples

### 🛠️ Development Tools
- **Code Analyzer** - Analyze Drupal files for structure, security issues, and standards
- **Module Generator** - Generate complete module skeletons with 15+ file types
- **Standards Checker** - Ensure your code follows Drupal coding standards
- **Custom Entity Generator** - Create custom entities with all necessary files

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

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-drupal-god-mod.git
cd mcp-drupal-god-mod

# Install dependencies
npm install

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
# Drupal Development with God Mod

You have access to the MCP Drupal God Mod server. Use these tools for all Drupal-related tasks:

## Search & Discovery
- Use `search_drupal_all` for general searches
- Use `search_drupal_functions` for specific function lookups
- Use `search_code_examples` for implementation examples
- Use `search_contrib_modules` to find community modules

## Code Analysis & Generation
- Use `analyze_drupal_file` to analyze any Drupal PHP file
- Use `check_drupal_standards` to verify coding standards
- Use `generate_module_skeleton` to create new modules
- Use `generate_custom_entity` for entity generation

## Hybrid Features (if connected to live site)
- Use `hybrid_analyze_module` for module analysis
- Use `hybrid_analyze_site` for site-wide recommendations
- Use `get_mode_status` to check connection status

## Best Practices
1. Always search documentation before implementing
2. Check for existing contrib modules before custom code
3. Analyze generated code for security issues
4. Follow Drupal coding standards

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
| `generate_custom_entity` | Generate entity classes | Local |

### Hybrid Tools
| Tool | Description | Mode |
|------|-------------|------|
| `hybrid_analyze_module` | Analyze module with live data | Hybrid |
| `hybrid_analyze_function` | Function usage analysis | Hybrid |
| `hybrid_analyze_site` | Full site analysis | Hybrid |
| `hybrid_analyze_content_type` | Content type analysis | Hybrid |
| `get_mode_status` | Check server mode status | System |

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
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Drupal Community for the amazing CMS
- Anthropic for the MCP protocol
- All contributors and testers

## 📞 Support

- 🐛 [Report Issues](https://github.com/yourusername/mcp-drupal-god-mod/issues)
- 💬 [Discussions](https://github.com/yourusername/mcp-drupal-god-mod/discussions)
- 📧 Email: support@example.com

---

**Made with ❤️ for the Drupal Community**

*"Not just a tool, it's God Mode for Drupal development"*
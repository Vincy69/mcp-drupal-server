# 📦 Installation Guide - MCP Drupal God Mod

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- **Claude Desktop** app installed

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mcp-drupal-god-mod.git
cd mcp-drupal-god-mod
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Build the Project

```bash
npm run build
# or
yarn build
```

### 4. Configure Claude Desktop

Find your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the MCP server configuration:

```json
{
  "mcpServers": {
    "drupal-god-mod": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-drupal-god-mod/dist/index.js"]
    }
  }
}
```

### 5. Restart Claude Desktop

After saving the configuration, restart Claude Desktop to load the MCP server.

## 🎯 Configuration Options

### Documentation-Only Mode (Default)

No additional configuration needed! The server works out of the box with:
- Full Drupal API documentation
- Code examples from GitHub
- Module/theme discovery
- Code analysis tools

### Hybrid Mode (Advanced)

To connect to a live Drupal instance, add environment variables:

```json
{
  "mcpServers": {
    "drupal-god-mod": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-drupal-god-mod/dist/index.js"],
      "env": {
        "DRUPAL_BASE_URL": "https://your-drupal-site.com",
        "DRUPAL_USERNAME": "admin",
        "DRUPAL_PASSWORD": "your-secure-password"
      }
    }
  }
}
```

#### Authentication Options

**Option 1: Username/Password**
```json
"env": {
  "DRUPAL_BASE_URL": "https://your-site.com",
  "DRUPAL_USERNAME": "admin",
  "DRUPAL_PASSWORD": "password"
}
```

**Option 2: OAuth Token**
```json
"env": {
  "DRUPAL_BASE_URL": "https://your-site.com",
  "DRUPAL_TOKEN": "your-oauth-token"
}
```

**Option 3: API Key**
```json
"env": {
  "DRUPAL_BASE_URL": "https://your-site.com",
  "DRUPAL_API_KEY": "your-api-key"
}
```

### Performance Tuning

```json
"env": {
  "CACHE_TIMEOUT": "1800000",    // 30 minutes in milliseconds
  "API_TIMEOUT": "60000",        // 60 seconds
  "MAX_RETRIES": "5",            // Retry attempts
  "FORCE_HYBRID_MODE": "true"    // Force hybrid mode
}
```

## 🔍 Verify Installation

1. Open Claude Desktop
2. Start a new conversation
3. Type: "What MCP servers are available?"
4. You should see "drupal-god-mod" in the list

### Test Commands

```
# Test basic functionality
"Search for Drupal cache functions"

# Test code examples
"Show me examples of creating custom blocks"

# Test module search
"Find modules for SEO optimization"

# Check server status
"What is the current MCP Drupal server mode?"
```

## 🚨 Troubleshooting

### Server Not Appearing

1. Check the configuration file path is correct
2. Ensure the absolute path to index.js is accurate
3. Verify Node.js is in your system PATH
4. Check Claude Desktop logs for errors

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm run build

# Check TypeScript errors
npm run type-check
```

### Connection Issues (Hybrid Mode)

1. Verify Drupal site URL is accessible
2. Check authentication credentials
3. Ensure Drupal REST/JSON:API modules are enabled
4. Test with curl:

```bash
curl -X GET https://your-site.com/jsonapi/node/article \
  -H "Authorization: Basic $(echo -n username:password | base64)"
```

## 🔧 Development Mode

For development and debugging:

```bash
# Run in development mode with hot reload
npm run dev

# Run with debug logging
DEBUG=mcp:* npm start
```

## 📱 Quick Setup Script

Create `setup.sh`:

```bash
#!/bin/bash
echo "🚀 Setting up MCP Drupal God Mod..."

# Clone and install
git clone https://github.com/yourusername/mcp-drupal-god-mod.git
cd mcp-drupal-god-mod
npm install
npm run build

# Get absolute path
INSTALL_PATH=$(pwd)

echo "✅ Installation complete!"
echo "📋 Add this to your Claude Desktop config:"
echo ""
echo '  "drupal-god-mod": {'
echo '    "command": "node",'
echo "    \"args\": [\"$INSTALL_PATH/dist/index.js\"]"
echo '  }'
```

## 🎉 You're Ready!

Once configured, create a `CLAUDE.md` file in your Drupal projects to enable intelligent assistance. See the main README for usage examples.

Need help? Check our [troubleshooting guide](https://github.com/yourusername/mcp-drupal-god-mod/wiki/Troubleshooting) or [open an issue](https://github.com/yourusername/mcp-drupal-god-mod/issues).
# 🚀 Quick MCP Ecosystem Setup Guide

This is a condensed setup guide for getting the complete MCP Drupal development environment running quickly.

## ⚡ 5-Minute Setup

### 1. Prerequisites Check
```bash
node --version  # Should be 18+
npm --version   # Should be 8+
git --version   # Any recent version
```

### 2. Install MCP Ecosystem
```bash
# Clone and setup the main server
git clone https://github.com/Vincy69/mcp-drupal-server.git
cd mcp-drupal-server
npm install && npm run build

# Install additional MCP servers automatically
./install_mcp_ecosystem.sh
```

### 3. Test Everything
```bash
# Verify all servers work
./test_mcp_ecosystem.js
```

### 4. Configure Claude Code
```bash
# Copy example configuration
mkdir -p ~/.config/claude-code
cp claude_mcp_config.json ~/.config/claude-code/mcp_config.json

# Edit configuration with your paths and tokens
nano ~/.config/claude-code/mcp_config.json
```

### 5. Start Developing
```bash
# Navigate to your Drupal project
cd /path/to/your/drupal/project

# Start Claude Code (will auto-detect MCP servers)
claude
```

## 🎯 Essential Commands

```bash
# Claude Code with MCP ecosystem
claude "Search for user authentication hooks in Drupal 11"
claude "Generate a custom event management module"
claude "Analyze this PHP file for security issues"
claude "Show me the database schema for node tables"
claude "Create a git commit for these changes"
```

## 🛠️ Troubleshooting

**MCP server not found?**
```bash
# Check if servers are installed
npm list -g @modelcontextprotocol/server-filesystem
which mcp-alchemy
```

**Configuration issues?**
```bash
# Test configuration
./test_mcp_ecosystem.js

# Check Claude Code configuration
cat ~/.config/claude-code/mcp_config.json
```

**Database connection issues?**
```bash
# Update database URL in configuration
nano ~/.config/claude-code/mcp_config.json
# Find: "YOUR_DATABASE_URL_HERE"
# Replace with: "postgresql://user:pass@localhost/drupal"
```

## 📚 Full Documentation

For complete details, see:
- **[MCP_ECOSYSTEM.md](MCP_ECOSYSTEM.md)** - Complete ecosystem guide
- **[CLAUDE.md](CLAUDE.md)** - Usage guide with examples
- **[API.md](API.md)** - API reference documentation
- **[README.md](README.md)** - Project overview and features

---

**🎉 You're ready to develop Drupal with AI superpowers!**
# 🛠️ MCP Drupal Server Development

Development environment for the **MCP Drupal Server** project.

## 🎯 Project Context

Serveur MCP qui fournit 35+ outils Drupal pour Claude Code.

### Configuration MCP
```json
{
  "mcpServers": {
    "drupal-server": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "DOCS_ONLY_MODE": "false",
        "CACHE_TIMEOUT": "900000"
      }
    }
  }
}
```

## 🚀 Commandes Essentielles

```bash
# Build et test
npm run build
npm test

# Vérifier le serveur MCP
get_mode_status()
```

## 📁 Structure

- `src/` - Code TypeScript
- `dist/` - Code compilé 
- `docs/` - Documentation
- `config/` - Configuration

## 🧪 Tests

Utiliser les outils MCP directement dans Claude Code pour valider les fonctionnalités.

## 📋 Outils MCP Disponibles

35+ outils pour le développement Drupal :
- Recherche universelle
- Génération de code
- Analyse de fichiers
- Documentation dynamique
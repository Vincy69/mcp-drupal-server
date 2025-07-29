# ⚙️ Configuration

Ce dossier contient les fichiers de configuration pour le serveur MCP Drupal.

## 📁 Fichiers

### [claude.md](./claude.md)
**Instructions pour Claude Code** - Documentation intégrée qui guide Claude Code dans l'utilisation optimale du serveur MCP Drupal.

**Contient :**
- Principes d'utilisation des outils MCP
- Workflows recommandés pour le développement Drupal
- Référence rapide des 35+ outils disponibles
- Bonnes pratiques et exemples d'usage

### [claude_mcp_config.json](./claude_mcp_config.json)
**Configuration MCP** - Fichier de configuration pour Claude Code définissant les serveurs MCP à charger.

**Contient :**
- Configuration du serveur MCP Drupal
- Serveurs MCP complémentaires (filesystem, git)
- Variables d'environnement
- Paramètres de performance

## 🎯 Installation

### Configuration automatique
```bash
# Copie la configuration vers Claude Code
cp claude_mcp_config.json ~/.config/claude-code/mcp_config.json
```

### Configuration manuelle
1. Copiez `claude_mcp_config.json` vers `~/.config/claude-code/mcp_config.json`
2. Ajustez les chemins selon votre installation
3. Redémarrez Claude Code

## 🔧 Personnalisation

### Variables d'environnement
```json
{
  "DOCS_ONLY_MODE": "false",
  "CACHE_TIMEOUT": "900000", 
  "API_TIMEOUT": "45000",
  "MAX_RETRIES": "3"
}
```

### Serveurs MCP additionnels
Consultez [../docs/deployment/MCP_ECOSYSTEM.md](../docs/deployment/MCP_ECOSYSTEM.md) pour la configuration complète de l'écosystème.
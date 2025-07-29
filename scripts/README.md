# 🔧 Scripts

Ce dossier contient les scripts utilitaires pour l'installation, la configuration et la maintenance du serveur MCP Drupal.

## 📁 Structure

### Scripts principaux
- **[configure-claude.js](./configure-claude.js)** - Configuration automatique de Claude Code
- **[install.js](./install.js)** - Script d'installation du serveur MCP
- **[test-connection.js](./test-connection.js)** - Test de connexion et validation

### [ecosystem/](./ecosystem/)
Scripts pour configurer l'écosystème MCP complet :
- **[install_mcp_ecosystem.sh](./ecosystem/install_mcp_ecosystem.sh)** - Installation automatique de tous les serveurs MCP recommandés

## 🚀 Utilisation

### Installation rapide
```bash
# Installation complète automatique
node scripts/install.js

# Configuration Claude Code
node scripts/configure-claude.js

# Test de fonctionnement
node scripts/test-connection.js
```

### Écosystème complet
```bash
# Installation de tous les serveurs MCP
bash scripts/ecosystem/install_mcp_ecosystem.sh

# Test de l'écosystème
node test_mcp_ecosystem.js
```

## 🎯 Scripts de test

À la racine du projet :
- **test_mock_fallback.js** - Test du fallback mock data
- **test_all_tools.js** - Test de tous les outils MCP
- **test_mcp_ecosystem.js** - Test de l'écosystème complet
- **test_examples_fix.js** - Test des corrections d'exemples

## 📋 Maintenance

### Mise à jour
```bash
# Recompilation
npm run build

# Tests complets  
npm test

# Validation de l'installation
node scripts/test-connection.js
```

### Débogage
```bash
# Mode verbose
DEBUG=mcp:* node scripts/test-connection.js

# Logs détaillés
node dist/index.js --verbose
```
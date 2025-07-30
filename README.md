# 🚀 MCP Drupal Server

[![Version](https://img.shields.io/badge/version-1.0.0--beta-blue.svg)](https://github.com/Vincy69/mcp-drupal-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

**Le serveur MCP ultime pour le développement Drupal avec Claude Code.**

Transforme Claude Code en expert Drupal avec 35+ outils spécialisés pour la recherche, génération de code, analyse et développement Drupal.

## 🎯 Installation Rapide

```bash
# 1. Cloner et installer
git clone <repository>
cd "MCP Drupal"
npm install && npm run build

# 2. Configurer Claude Code  
cp config/claude_mcp_config.json ~/.config/claude-code/mcp_config.json

# 3. Redémarrer Claude Code
# ✅ Tous les outils Drupal sont maintenant disponibles !
```

## 🎯 Fonctionnalités

- **🔍 Recherche universelle** dans la documentation Drupal officielle
- **🛠️ Génération de modules** complets avec structure avancée
- **📊 Analyse de code** avec scoring qualité et recommendations
- **🔄 Assistant de migration** entre versions Drupal
- **🧠 Recherche intelligente** avec suggestions contextuelles
- **📖 Exemples de code** dynamiques et à jour

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [**Quick Start**](docs/QUICK_START.md) | Premiers pas et usage de base |
| [**API Reference**](docs/API.md) | Documentation complète des outils |
| [**Contributing**](docs/CONTRIBUTING.md) | Guide de contribution |

## 🚀 Utilisation

```bash
# Recherche dans la documentation Drupal
search_drupal_all("entity form validation")

# Génération d'un module complet
generate_module_skeleton("my_module", "My Custom Module")

# Analyse d'un fichier Drupal
analyze_drupal_file("modules/custom/my_module/my_module.module")
```

## 📄 Licence

MIT License - voir [LICENSE](LICENSE) pour les détails.

---

⭐ **Star le projet** si vous trouvez ce serveur MCP utile pour votre développement Drupal !
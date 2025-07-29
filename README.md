# 🚀 MCP Drupal Server

[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/Vincy69/mcp-drupal-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

**Le serveur MCP ultime pour le développement Drupal avec Claude Code.**

Transforme Claude Code en expert Drupal avec 35+ outils spécialisés, accès en temps réel aux APIs officielles, génération de code intelligente et analyse avancée.

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

## 📁 Structure du Projet

```
MCP Drupal/
├── 📚 docs/              # Documentation complète
│   ├── development/      # Guides de développement
│   ├── deployment/       # Installation et déploiement  
│   ├── examples/         # Tutoriels et comparaisons
│   └── api/             # Documentation API
├── ⚙️ config/           # Configuration Claude Code
├── 🔧 scripts/          # Scripts d'installation et maintenance
├── 🧪 tests/            # Tests (actifs et désactivés)
├── 💻 src/              # Code source TypeScript
└── 📦 dist/             # Code compilé (serveur MCP)
```

## 🎯 Fonctionnalités Principales

### 🔍 Recherche et Découverte
- **35+ Outils MCP** pour le développement Drupal
- **Recherche universelle** dans toutes les APIs Drupal
- **Exemples de code réels** depuis GitHub et Drupal.org
- **Documentation dynamique** toujours à jour

### 🛠️ Génération et Analyse
- **Générateur de modules** complets avec structure avancée
- **Analyseur de code IA** avec scoring qualité (0-100)
- **Vérificateur de standards** Drupal automatique
- **Assistant de migration** entre versions Drupal

### 🧠 Intelligence Avancée  
- **Recherche floue** avec tolérance aux erreurs de frappe
- **Suggestions contextuelles** basées sur votre projet
- **4 modes opérationnels** : DOCS_ONLY, HYBRID, LIVE_ONLY, SMART_FALLBACK
- **Cache intelligent** avec invalidation automatique

## 📚 Documentation

| Section | Description |
|---------|-------------|
| 🚀 **[Installation](docs/deployment/INSTALLATION.md)** | Guide d'installation détaillé |
| 📖 **[Tutoriels](docs/examples/TUTORIALS.md)** | Tutoriels step-by-step |
| 🔌 **[API Reference](docs/api/API.md)** | Documentation complète des 35+ outils |
| 📊 **[Comparaisons](docs/examples/EXAMPLES_COMPARISON.md)** | Avant/après Claude Code vanilla |
| 🏗️ **[Écosystème MCP](docs/deployment/MCP_ECOSYSTEM.md)** | Configuration multi-serveurs |

## 🎯 Cas d'Usage

### Pour les Développeurs Drupal
```bash
# Recherche universelle
search_drupal_all("custom forms")

# Génération de module
generate_module_skeleton("my_module", "My Custom Module")

# Analyse de code
analyze_drupal_file("path/to/file.php")
```

### Pour les Architectes
```bash
# Modules contrib populaires
search_contrib_modules("workflow", ["11.x"])

# Génération d'entités complètes
generate_custom_entity(entity_config)

# Analyse de migration
analyze_upgrade_path("./project", "10", "11")
```

## 🚀 Écosystème Complet

Le serveur MCP Drupal fonctionne encore mieux avec l'écosystème complet :

```bash
# Installation automatique de tous les serveurs MCP
bash scripts/ecosystem/install_mcp_ecosystem.sh
```

**Serveurs MCP inclus :**
- **Filesystem** - Gestion de fichiers
- **Git** - Contrôle de version
- **Database** - Accès aux bases de données
- **Docker** - Containerisation
- **GitHub** - Intégration repository

## 🤝 Contribution

Consultez [docs/development/CONTRIBUTING.md](docs/development/CONTRIBUTING.md) pour contribuer au projet.

## 📄 Licence

MIT License - voir [LICENSE](LICENSE) pour les détails.

---

⭐ **Star le projet** si vous trouvez ce serveur MCP utile pour votre développement Drupal !
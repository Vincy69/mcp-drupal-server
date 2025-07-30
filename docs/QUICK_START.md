# 🚀 Quick Start Guide

Guide rapide pour commencer avec le serveur MCP Drupal.

## 📦 Installation

### Prérequis
- Node.js 18+
- Claude Code installé
- Git

### Installation automatique
```bash
git clone <repository>
cd "MCP Drupal"
./install.sh
```

### Installation manuelle
```bash
# 1. Installer les dépendances
npm install && npm run build

# 2. Configurer Claude Code
cp config/claude_mcp_config.json ~/.config/claude-code/mcp_config.json

# 3. Redémarrer Claude Code
```

## 🎯 Premiers pas

### 1. Vérifier l'installation
```bash
# Dans Claude Code, tester un outil
get_mode_status()
```

### 2. Recherche de base
```bash
# Rechercher dans la documentation Drupal
search_drupal_all("form validation")

# Rechercher des fonctions spécifiques
search_drupal_functions("entity_load")

# Chercher des exemples de code
search_code_examples("custom form")
```

### 3. Génération de code
```bash
# Créer un module basique
generate_module_skeleton({
  "name": "Mon Module",
  "machine_name": "mon_module", 
  "description": "Description du module"
})

# Analyser un fichier existant
analyze_drupal_file("path/to/module.php")
```

## 🔧 Configuration avancée

### Modes disponibles
- **docs_only** : Documentation et exemples uniquement
- **live_only** : Connexion directe à Drupal
- **hybrid** : Combine docs + live
- **smart_fallback** : Bascule automatique

### Personnalisation
Éditer `config/claude_mcp_config.json` pour :
- Modifier les chemins de projet
- Configurer la connexion base de données  
- Ajuster les paramètres de cache

## 📚 Prochaines étapes

- **[API Reference](API.md)** - Documentation complète des outils
- **[Contributing](CONTRIBUTING.md)** - Comment contribuer
- **Configuration Claude Code** - `config/claude.md`

## 🆘 Dépannage

### Problèmes courants
- **Outils non disponibles** : Redémarrer Claude Code
- **Erreurs de configuration** : Vérifier `claude_mcp_config.json`
- **Tests échouent** : Vérifier Node.js 18+

### Support
- Ouvrir une issue sur GitHub
- Consulter la documentation API
- Vérifier les logs de Claude Code
# 🔌 Documentation API

## 📋 Contenu

### [API.md](./API.md)
Documentation complète de tous les outils MCP disponibles dans le serveur Drupal.

**Contient :**
- **35+ outils MCP** avec syntaxe et exemples
- **Paramètres détaillés** pour chaque outil
- **Exemples de réponses** avec structure des données
- **Codes d'erreur** et gestion des exceptions
- **Modes de fonctionnement** (DOCS_ONLY vs HYBRID)

## 🎯 Navigation rapide

### Outils de recherche
- `search_drupal_all` - Recherche universelle
- `search_drupal_functions` - Fonctions API Drupal
- `search_drupal_hooks` - Hooks et événements
- `search_contrib_modules` - Modules communautaires

### Génération de code
- `generate_module_skeleton` - Squelette de module
- `generate_custom_entity` - Entités personnalisées  
- `get_module_template_info` - Templates disponibles

### Analyse et qualité
- `analyze_drupal_file` - Analyse de fichiers
- `check_drupal_standards` - Standards de codage
- `deep_analyze_file` - Analyse approfondie

### Exemples et apprentissage
- `search_code_examples` - Exemples de code
- `get_examples_by_category` - Exemples par catégorie
- `get_examples_by_tag` - Exemples par tag

## 🔧 Utilisation

### Dans Claude Code
```
search_drupal_all("custom forms")
generate_module_skeleton("my_module", "My Custom Module")
analyze_drupal_file("path/to/file.php")
```

### Réponses structurées
Tous les outils retournent des données JSON structurées avec :
- Métadonnées (version, source, timestamp)
- Données principales (résultats de recherche, code généré, etc.)
- Informations contextuelles (suggestions, liens, bonnes pratiques)

## 🔗 Voir aussi

- **Exemples d'usage** → [../examples/TUTORIALS.md](../examples/TUTORIALS.md)
- **Configuration** → [../../config/claude.md](../../config/claude.md)
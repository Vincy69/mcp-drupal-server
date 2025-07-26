# MCP Drupal Server

[![NPM Version](https://img.shields.io/npm/v/mcp-drupal-server?style=flat-square)](https://www.npmjs.com/package/mcp-drupal-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![CI Status](https://img.shields.io/github/actions/workflow/status/vincenttournaud/mcp-drupal-server/ci.yml?branch=main&style=flat-square)](https://github.com/vincenttournaud/mcp-drupal-server/actions)

Un serveur MCP (Model Context Protocol) pour Drupal qui fournit un accès à la documentation Drupal, aux modules contrib, aux exemples de code, et optionnellement à une instance Drupal live.

## 🎯 Modes de Fonctionnement

### 📚 Mode Documentation (Recommandé)
- ✅ **Aucune configuration Drupal requise**
- ✅ Recherche dans l'API Drupal (fonctions, classes, hooks)
- ✅ Documentation officielle Drupal
- ✅ Recherche de modules et thèmes contrib
- ✅ Exemples de code pratiques
- ✅ Fonctionne immédiatement après installation

### 🚀 Mode Complet (Drupal Live)
- 🔧 **Toutes les fonctionnalités de documentation +**
- 🔧 Gestion des nœuds (création, lecture, mise à jour, suppression)
- 🔧 Gestion des utilisateurs
- 🔧 Gestion des termes de taxonomie
- 🔧 Administration des modules
- 🔧 Configuration système
- 🔧 Gestion du cache
- ⚠️ **Nécessite une instance Drupal configurée**

## 🚀 Fonctionnalités

### 🗃️ Gestion des entités
- **Nodes** : CRUD complet pour les contenus (articles, pages, types personnalisés)
- **Users** : Gestion complète des utilisateurs et leurs profils
- **Taxonomy Terms** : Gestion des vocabulaires et termes de taxonomie

### ⚙️ Administration système
- **Modules** : Activation/désactivation/liste des modules Drupal
- **Configuration** : Lecture/écriture de la configuration système
- **Cache** : Gestion et vidage des différents caches
- **Base de données** : Exécution sécurisée de requêtes SQL personnalisées

### 📊 Ressources MCP
- Accès en temps réel aux entités Drupal
- Configuration système complète
- Métadonnées des modules et extensions

## 📦 Installation

### Prérequis
- Node.js 18.0.0 ou supérieur
- Site Drupal 9.x ou 10.x avec JSON:API activé
- Permissions administrateur sur Drupal

### Installation rapide
```bash
git clone https://github.com/vincenttournaud/mcp-drupal-server.git
cd mcp-drupal-server
npm install
npm run build
```

### Via npm
```bash
npm install -g mcp-drupal-server
```

## ⚡ Configuration

Le serveur détecte automatiquement le mode de fonctionnement et bascule en mode documentation si aucune connexion Drupal n'est disponible.

### 🔧 Scripts de Configuration

#### Configuration automatique pour Claude Desktop
```bash
# Mode documentation seule (recommandé)
node scripts/configure-claude.js docs

# Mode complet avec instance Drupal
node scripts/configure-claude.js full --base-url https://example.com --username admin --password secret

# Les deux modes disponibles simultanément
node scripts/configure-claude.js both
```

#### Test de connexion Drupal
```bash
node scripts/test-connection.js
```

### 📋 Configuration Manuelle

#### Mode Documentation Seule
```bash
# Variable d'environnement
DOCS_ONLY_MODE=true

# Configuration Claude Desktop
{
  "mcpServers": {
    "drupal-docs": {
      "command": "node",
      "args": ["/chemin/vers/MCP Drupal/dist/index.js"],
      "env": {
        "DOCS_ONLY_MODE": "true"
      }
    }
  }
}
```

#### Mode Complet (avec Drupal Live)
```bash
# Variables d'environnement
DRUPAL_BASE_URL=https://your-drupal-site.com
DRUPAL_USERNAME=your_admin_username
DRUPAL_PASSWORD=your_admin_password

# OU avec token (recommandé)
DRUPAL_BASE_URL=https://your-drupal-site.com
DRUPAL_TOKEN=your_jwt_or_oauth_token

# Configuration Claude Desktop
{
  "mcpServers": {
    "drupal-full": {
      "command": "node",
      "args": ["/chemin/vers/MCP Drupal/dist/index.js"],
      "env": {
        "DRUPAL_BASE_URL": "https://your-drupal-site.com",
        "DRUPAL_USERNAME": "admin",
        "DRUPAL_PASSWORD": "password"
      }
    }
  }
}
```

### 🔍 Prérequis pour le Mode Complet

#### Configuration Drupal
- Modules activés : `jsonapi`, `rest`, `basic_auth`
- API REST activée
- CORS configuré si nécessaire

#### Permissions utilisateur
- `access content`
- `administer nodes` 
- `administer users`
- `administer taxonomy`
- `administer modules`
- `administer site configuration`

## 🎯 Utilisation

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm run build
npm start
```

### Avec Claude Code
Ajoutez le serveur à votre configuration MCP dans `~/.claude/mcp_settings.json` :

```json
{
  "mcpServers": {
    "drupal": {
      "command": "node",
      "args": ["/path/to/mcp-drupal-server/dist/index.js"],
      "env": {
        "DRUPAL_BASE_URL": "https://your-drupal-site.com",
        "DRUPAL_TOKEN": "your_bearer_token"
      }
    }
  }
}
```

## 🛠️ Outils disponibles (34+ au total)

### 📝 Gestion des contenus (Nodes)
| Outil | Description | Paramètres |
|-------|-------------|------------|
| `get_node` | Récupérer un contenu par ID | `id` |
| `create_node` | Créer un nouveau contenu | `title`, `body`, `type`, `status` |
| `update_node` | Mettre à jour un contenu | `id`, `title?`, `body?`, `status?` |
| `delete_node` | Supprimer un contenu | `id` |
| `list_nodes` | Lister les contenus avec filtres | `type?`, `status?`, `limit?`, `offset?` |

### 👥 Gestion des utilisateurs
| Outil | Description | Paramètres |
|-------|-------------|------------|
| `get_user` | Récupérer un utilisateur par ID | `id` |
| `create_user` | Créer un nouvel utilisateur | `name`, `mail`, `pass?`, `status?` |
| `update_user` | Mettre à jour un utilisateur | `id`, `name?`, `mail?`, `status?` |
| `delete_user` | Supprimer un utilisateur | `id` |
| `list_users` | Lister les utilisateurs | `status?`, `limit?`, `offset?` |

### 🏷️ Gestion de la taxonomie
| Outil | Description | Paramètres |
|-------|-------------|------------|
| `get_taxonomy_term` | Récupérer un terme par ID | `id` |
| `create_taxonomy_term` | Créer un terme | `name`, `description?`, `vocabulary?`, `parent?` |
| `update_taxonomy_term` | Mettre à jour un terme | `id`, `name?`, `description?` |
| `delete_taxonomy_term` | Supprimer un terme | `id` |
| `list_taxonomy_terms` | Lister les termes | `vocabulary?`, `limit?`, `offset?` |

### ⚙️ Administration système
| Outil | Description | Paramètres |
|-------|-------------|------------|
| `execute_query` | Exécuter une requête SQL | `query`, `parameters?` |
| `get_module_list` | Lister tous les modules | - |
| `enable_module` | Activer un module | `module` |
| `disable_module` | Désactiver un module | `module` |
| `get_configuration` | Lire une configuration | `name` |
| `set_configuration` | Écrire une configuration | `name`, `value` |
| `clear_cache` | Vider le cache | `type?` |
| `get_site_info` | Informations du site | - |

### 📚 Documentation Drupal officielle
| Outil | Description | Paramètres |
|-------|-------------|------------|
| `search_drupal_functions` | Rechercher fonctions Drupal core | `query?`, `version?` |
| `search_drupal_classes` | Rechercher classes Drupal core | `query?`, `version?` |
| `search_drupal_hooks` | Rechercher hooks Drupal | `query?`, `version?` |
| `search_drupal_topics` | Rechercher guides et topics | `query?`, `version?` |
| `search_drupal_services` | Rechercher services Drupal | `query?`, `version?` |
| `search_drupal_all` | Recherche globale documentation | `query`, `version?` |
| `get_function_details` | Détails d'une fonction spécifique | `function_name`, `version?` |
| `get_class_details` | Détails d'une classe spécifique | `class_name`, `version?` |

### 🔌 Modules et thèmes contrib
| Outil | Description | Paramètres |
|-------|-------------|------------|
| `search_contrib_modules` | Rechercher modules contrib | `query`, `core_compatibility?`, `category?`, `limit?` |
| `search_contrib_themes` | Rechercher thèmes contrib | `query`, `core_compatibility?`, `limit?` |
| `get_module_details` | Détails d'un module spécifique | `machine_name` |
| `get_popular_modules` | Lister modules populaires | `limit?`, `category?` |

### 💻 Exemples de code
| Outil | Description | Paramètres |
|-------|-------------|------------|
| `search_code_examples` | Rechercher exemples de code | `query`, `category?`, `drupal_version?` |
| `get_example_by_title` | Exemple par titre exact | `title` |
| `list_example_categories` | Lister catégories d'exemples | - |
| `get_examples_by_category` | Exemples par catégorie | `category`, `drupal_version?` |
| `get_examples_by_tag` | Exemples par tag | `tag` |

## 💡 Exemples d'utilisation

### Avec Claude Code
```bash
# Créer un nouvel article
claude: "Crée un nouvel article Drupal avec le titre 'Mon super article' et le contenu 'Ceci est le contenu de mon article'"

# Lister tous les utilisateurs actifs
claude: "Montre-moi tous les utilisateurs actifs sur mon site Drupal"

# Vider le cache
claude: "Vide tout le cache de mon site Drupal"

# Créer un terme de taxonomie
claude: "Crée un nouveau tag 'Technology' dans la taxonomie"

# Lister les modules installés
claude: "Quels modules sont installés sur mon site Drupal ?"

# Rechercher dans la documentation Drupal
claude: "Comment utiliser la fonction node_load dans Drupal 11 ?"

# Trouver des modules contrib
claude: "Recherche-moi des modules pour le e-commerce compatible Drupal 10"

# Obtenir des exemples de code
claude: "Montre-moi un exemple de création de formulaire custom en Drupal"
```

### Appels directs d'outils
```javascript
// Créer un article
{
  "tool": "create_node",
  "arguments": {
    "title": "Mon article",
    "body": "Contenu de l'article",
    "type": "article",
    "status": true
  }
}

// Lister les utilisateurs
{
  "tool": "list_users",
  "arguments": {
    "status": true,
    "limit": 10
  }
}

// Rechercher une fonction Drupal
{
  "tool": "search_drupal_functions",
  "arguments": {
    "query": "node_load",
    "version": "11.x"
  }
}

// Trouver des modules e-commerce
{
  "tool": "search_contrib_modules",
  "arguments": {
    "query": "commerce",
    "core_compatibility": ["10.x", "11.x"],
    "limit": 5
  }
}
```

## 🤖 Guide d'utilisation avec Claude Code

### Instructions optimales pour Claude (CLAUDE.md)

Pour maximiser l'efficacité avec Claude Code, copiez ces instructions dans votre fichier `CLAUDE.md` :

```markdown
# Instructions pour utiliser le MCP Drupal

Vous êtes un expert développeur Drupal avec accès au serveur MCP Drupal. Utilisez systématiquement ces outils pour fournir des réponses précises et à jour :

## 🎯 Workflow recommandé

**Avant de répondre à toute question Drupal :**
1. Cherchez d'abord dans la documentation officielle 
2. Vérifiez les fonctions/classes mentionnées
3. Proposez des modules contrib pertinents
4. Donnez des exemples de code concrets

## 🛠️ Outils à utiliser systématiquement

### Pour les questions générales
- `search_drupal_topics` - Vue d'ensemble des concepts
- `search_drupal_functions` - Fonctions API disponibles
- `search_drupal_hooks` - Hooks pour l'extensibilité
- `search_code_examples` - Exemples pratiques

### Pour des éléments spécifiques
- `get_function_details` - Détails exacts d'une fonction
- `get_class_details` - Détails exacts d'une classe
- `search_contrib_modules` - Modules communautaires
- `get_module_details` - Informations détaillées sur un module

## 💡 Exemples d'usage

**Question : "Comment créer un formulaire custom ?"**

1. search_drupal_topics avec "form"
2. search_drupal_functions avec "form"  
3. search_code_examples avec "custom form"
4. search_contrib_modules avec "form builder"


**Question : "Comment utiliser EntityTypeManager ?"**

1. get_class_details avec "EntityTypeManager"
2. search_code_examples avec "EntityTypeManager"
3. search_drupal_functions avec "entity"
``

## ✅ Bonnes pratiques

- Toujours vérifier la version Drupal (11.x par défaut)
- Commencer large puis affiner les recherches
- Donner des URLs de documentation officielles
- Proposer plusieurs approches quand possible
- Inclure des exemples de code réels et testés

**Utilisez ces outils à chaque réponse pour garantir l'exactitude et la pertinence de vos conseils Drupal.**
```

### Avantages de cette approche
- ✅ **Réponses vérifiées** : Claude recherche toujours dans la documentation officielle
- ✅ **Exemples concrets** : Code et modules réels plutôt que théoriques
- ✅ **Information à jour** : Documentation Drupal 11.x directement depuis api.drupal.org
- ✅ **Workflow optimisé** : Processus structuré pour chaque type de question
- ✅ **Modules pertinents** : Suggestions de modules contrib appropriées

## 🔐 Sécurité et authentification

### Méthodes supportées
1. **Basic Authentication** : Simple mais moins sécurisé
2. **Bearer Token** : JWT ou OAuth2 (recommandé)
3. **API Key** : Clé personnalisée dans l'en-tête

### Bonnes pratiques
- Utilisez HTTPS en production
- Préférez les tokens Bearer aux mots de passe
- Limitez les permissions de l'utilisateur API
- Surveillez les logs d'accès

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les détails.

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 🎉 Nouvelles fonctionnalités (v1.2.0)

### ✅ Améliorations critiques
- **🪝 Hooks révolutionnés** : 5 stratégies de recherche pour 200+ hooks uniques
  - Extraction depuis les implémentations de fonctions
  - Documentation dédiée et groupes API
  - Fallback intelligent avec searchAll
  - Base de données de hooks populaires intégrée
  - Classification automatique par groupes (Node, User, Form, etc.)

- **🎯 get_class_details ultra-robuste** : 6 stratégies de recherche
  - Cache local intelligent avec validation temporelle
  - Recherche exacte sur 15 pages (750+ classes)
  - Matching flou (case-insensitive, partial, namespace)
  - Recherche dans searchAll comme fallback
  - Variations namespace automatiques (Core, Entity, Field, etc.)
  - Patterns communs (Interface, Manager, Service, etc.)

- **⚡ searchFunctions enrichi** : Couverture exhaustive
  - 4 stratégies : Core API, fonctions dépréciées, modules spécifiques, utilitaires
  - 20 pages de pagination (1000+ fonctions)
  - Fonctions dépréciées avec avertissements ⚠️
  - Modules core spécifiques (node, user, field, system, etc.)
  - Catégorisation automatique et extraction de métadonnées
  - Exemples d'usage pour fonctions communes

- **📚 Exemples de code étendus** : 8 nouvelles catégories
  - **Migrations** : CSV import, plugins source personnalisés
  - **Testing** : Unit tests avec mocks, kernel tests
  - **Performance** : Cache avancé, optimisation batch
  - **Sécurité** : Validation, access control, CSRF
  - **Theming** : Hooks thème, preprocessing, Twig
  - **API** : REST endpoints, sérialisation JSON
  - **Media** : Upload fichiers, gestion médias, styles d'image
  - **Multilingual** : Traductions, i18n, langue switcher

### 📊 Statistiques v1.2.0
- **+1200 lignes de code** ajoutées/améliorées depuis v1.1.0
- **10x plus de hooks** : De ~20 à 200+ hooks uniques
- **6 stratégies de recherche** pour classes ultra-robustes
- **8 nouvelles catégories** d'exemples de code complets
- **Fonctions dépréciées** avec avertissements intégrés
- **Cache intelligent** pour performance optimale

## 📋 Roadmap

- [x] ~~Support Drupal 11~~ ✅ **Fait**
- [x] ~~Pagination intelligente~~ ✅ **Fait** 
- [x] ~~Recherche exacte robuste~~ ✅ **Fait**
- [ ] Interface web d'administration
- [ ] Gestion des fichiers et médias
- [ ] Support des vues personnalisées
- [ ] Webhooks pour les événements
- [ ] Interface GraphQL

## 🐛 Problèmes connus

### Erreur de connexion
- Vérifiez l'URL de base Drupal
- Confirmez que JSON:API est activé
- Vérifiez les permissions utilisateur

### Erreurs d'authentification
- Validez vos identifiants
- Vérifiez la méthode d'auth configurée
- Consultez les logs Drupal

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Anthropic](https://www.anthropic.com/) pour le Model Context Protocol
- [Drupal Community](https://www.drupal.org/) pour l'excellent CMS
- Tous les contributeurs du projet

## 📞 Support

- 🐛 [Issues GitHub](https://github.com/vincenttournaud/mcp-drupal-server/issues)
- 💬 [Discussions](https://github.com/vincenttournaud/mcp-drupal-server/discussions)
- 📧 Email : vince69290@gmail.com

---

<p align="center">
  Fait avec ❤️ pour la communauté Drupal et MCP
</p>

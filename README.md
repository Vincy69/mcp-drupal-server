# MCP Drupal Server

[![NPM Version](https://img.shields.io/npm/v/mcp-drupal-server?style=flat-square)](https://www.npmjs.com/package/mcp-drupal-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![CI Status](https://img.shields.io/github/actions/workflow/status/vincenttournaud/mcp-drupal-server/ci.yml?branch=main&style=flat-square)](https://github.com/vincenttournaud/mcp-drupal-server/actions)

Un serveur MCP (Model Context Protocol) complet pour Drupal CMS qui permet l'interaction avec toutes les fonctionnalités principales de Drupal via des agents IA comme Claude.

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

### 1. Variables d'environnement
Copiez `.env.example` vers `.env` et configurez :

```bash
# URL de base de votre site Drupal
DRUPAL_BASE_URL=https://your-drupal-site.com

# Méthode 1: Authentification Basic Auth
DRUPAL_USERNAME=your_admin_username
DRUPAL_PASSWORD=your_admin_password

# Méthode 2: Token Bearer (recommandé)
DRUPAL_TOKEN=your_jwt_or_oauth_token

# Méthode 3: Clé API personnalisée
DRUPAL_API_KEY=your_custom_api_key
```

### 2. Configuration Drupal
Assurez-vous que les modules suivants sont activés :
- `jsonapi` - API JSON:API de Drupal
- `rest` - Services REST (optionnel)
- `basic_auth` - Si vous utilisez Basic Auth

### 3. Permissions utilisateur
L'utilisateur Drupal doit avoir les permissions :
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

## 📋 Roadmap

- [ ] Support Drupal 11
- [ ] Interface web d'administration
- [ ] Gestion des fichiers et médias
- [ ] Support des vues personnalisées
- [ ] Webhooks pour les événements
- [ ] Cache intelligent des requêtes
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
- 📧 Email : vincent.tournaud@example.com

---

<p align="center">
  Fait avec ❤️ pour la communauté Drupal et MCP
</p>
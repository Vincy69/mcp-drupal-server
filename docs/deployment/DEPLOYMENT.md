# Guide de déploiement GitHub

Ce guide vous accompagne pas à pas pour déployer le serveur MCP Drupal sur GitHub.

## 🚀 Étapes de déploiement

### 1. Préparation du repository local

#### Initialiser Git
```bash
cd "/Users/vincenttournaud/DEV/MCP Drupal"
git init
git add .
git commit -m "feat: initial commit with complete MCP Drupal server

- Complete MCP server implementation with 21 tools
- Support for nodes, users, taxonomy, modules, configuration
- Multiple authentication methods (Basic Auth, Bearer Token, API Key)  
- Full test suite with Jest
- CI/CD pipeline with GitHub Actions
- Comprehensive documentation and contribution guide
- TypeScript support with ESLint and Prettier"
```

### 2. Créer le repository GitHub

#### Option A: Via interface GitHub
1. Allez sur [GitHub](https://github.com)
2. Cliquez sur "New repository"
3. Nom: `mcp-drupal-server`
4. Description: `Model Context Protocol server for Drupal CMS`
5. Public repository
6. Ne pas initialiser avec README (nous avons déjà nos fichiers)

#### Option B: Via GitHub CLI
```bash
gh repo create mcp-drupal-server --public --description "Model Context Protocol server for Drupal CMS"
```

### 3. Connecter et pousser le code

```bash
# Ajouter l'origine remote
git remote add origin https://github.com/votre-username/mcp-drupal-server.git

# Pousser le code
git branch -M main
git push -u origin main
```

### 4. Configuration des secrets GitHub

Allez dans Settings > Secrets and variables > Actions et ajoutez :

#### Secrets requis pour CI/CD
- `CODECOV_TOKEN` : Token pour Codecov (optionnel)
- `NPM_TOKEN` : Token npm pour publier le package
- `GITHUB_TOKEN` : Automatiquement fourni par GitHub

#### Comment obtenir NPM_TOKEN
```bash
# Se connecter à npm
npm login

# Créer un token d'accès
npm token create --access public
```

### 5. Activation des fonctionnalités GitHub

#### GitHub Pages (optionnel)
- Settings > Pages
- Source: GitHub Actions
- Permet d'héberger la documentation

#### Protection de branche
- Settings > Branches
- Add rule pour `main`
- Require pull request reviews
- Require status checks (CI)

#### Issues et Discussions
- Settings > General
- Features: ✅ Issues, ✅ Discussions

### 6. Badges et monitoring

#### Badges automatiques (déjà dans README.md)
- [![NPM Version](https://img.shields.io/npm/v/mcp-drupal-server)](https://www.npmjs.com/package/mcp-drupal-server)
- [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
- [![CI Status](https://github.com/votre-username/mcp-drupal-server/actions/workflows/ci.yml/badge.svg)](https://github.com/votre-username/mcp-drupal-server/actions)

#### Services tiers (optionnels)
- **Codecov** : Couverture de code
- **Dependabot** : Mises à jour automatiques des dépendances
- **CodeQL** : Analyse de sécurité

### 7. Publication sur npm

#### Première publication
```bash
# Vérifier le package
npm pack --dry-run

# Publier
npm publish --access public
```

#### Publications automatiques
Les releases sont automatiques via semantic-release quand vous poussez sur `main` avec des commits conventionnels.

## 📋 Checklist de déploiement

### ✅ Avant de pousser
- [ ] Tests passent : `npm test`
- [ ] Build réussit : `npm run build`  
- [ ] Linting OK : `npm run lint`
- [ ] Types OK : `npm run type-check`
- [ ] README.md complet et à jour
- [ ] .env.example configuré
- [ ] Version dans package.json correcte

### ✅ Après déploiement
- [ ] CI/CD pipeline vert
- [ ] NPM package publié
- [ ] Documentation accessible
- [ ] Issues template configurés
- [ ] Contribution guide accessible
- [ ] Badges fonctionnels

### ✅ Promotion et communication
- [ ] Annonce sur les réseaux sociaux
- [ ] Post sur les forums Drupal
- [ ] Soumission aux registres MCP
- [ ] Documentation Claude Code mise à jour

## 🛠️ Maintenance continue

### Mises à jour régulières
```bash
# Mettre à jour les dépendances
npm update

# Vérifier les failles de sécurité
npm audit

# Tests automatiques sur plusieurs versions Node
# (configuré dans .github/workflows/ci.yml)
```

### Monitoring
- Surveiller les Issues GitHub
- Répondre aux Pull Requests  
- Maintenir la documentation à jour
- Suivre les téléchargements npm

### Releases
Les releases suivent [Semantic Versioning](https://semver.org/) :
- `fix:` → version patch (1.0.1)
- `feat:` → version minor (1.1.0)  
- `BREAKING CHANGE:` → version major (2.0.0)

## 🤝 Après déploiement

### Issues Templates
Créez `.github/ISSUE_TEMPLATE/` avec :
- `bug_report.md`
- `feature_request.md`
- `question.md`

### Pull Request Template
Créez `.github/pull_request_template.md`

### Community Health
- `CODE_OF_CONDUCT.md`
- `SECURITY.md` 
- `SUPPORT.md`

## 📞 Support post-déploiement

Si vous rencontrez des problèmes :

1. Vérifiez les Actions GitHub pour les erreurs CI/CD
2. Consultez les logs npm pour les erreurs de publication
3. Vérifiez la configuration des secrets GitHub
4. Testez localement avec `npm link` avant de publier

---

**Votre serveur MCP Drupal est maintenant prêt pour la communauté ! 🚀**
# Guide de contribution

Merci de votre intérêt pour contribuer au serveur MCP Drupal ! Ce guide vous aidera à commencer.

## 🚀 Comment contribuer

### Signaler un bug
1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/vincenttournaud/mcp-drupal-server/issues)
2. Créez une nouvelle issue avec le template "Bug Report"
3. Incluez le maximum d'informations :
   - Version de Drupal utilisée
   - Version du serveur MCP
   - Version de Node.js
   - Étapes pour reproduire le problème
   - Comportement attendu vs comportement observé
   - Logs d'erreur complets

### Proposer une nouvelle fonctionnalité
1. Ouvrez d'abord une Discussion GitHub pour discuter de votre idée
2. Une fois approuvée, créez une issue avec le template "Feature Request"
3. Détaillez le cas d'usage et l'implémentation proposée

### Contribuer au code

#### Prérequis
- Node.js 18.0.0 ou supérieur
- npm 9.0.0 ou supérieur
- Git
- Un site Drupal de test (optionnel mais recommandé)

#### Configuration de l'environnement de développement

1. **Fork et clone le repository**
   ```bash
   git clone https://github.com/votre-username/mcp-drupal-server.git
   cd mcp-drupal-server
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   ```bash
   cp .env.example .env
   # Éditez .env avec vos paramètres de test Drupal
   ```

4. **Lancer les tests**
   ```bash
   npm test
   ```

5. **Démarrer en mode développement**
   ```bash
   npm run dev
   ```

#### Workflow de développement

1. **Créer une branche**
   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   # ou
   git checkout -b fix/correction-bug
   ```

2. **Faire vos modifications**
   - Suivez les conventions de code existantes
   - Ajoutez des tests pour les nouvelles fonctionnalités
   - Mettez à jour la documentation si nécessaire

3. **Tester vos modifications**
   ```bash
   # Lancer tous les tests
   npm test
   
   # Vérifier le linting
   npm run lint
   
   # Vérifier les types TypeScript
   npm run type-check
   
   # Build le projet
   npm run build
   ```

4. **Commit vos changements**
   ```bash
   git add .
   git commit -m "feat: ajouter support pour les champs personnalisés"
   ```
   
   Utilisez [Conventional Commits](https://www.conventionalcommits.org/) :
   - `feat:` pour les nouvelles fonctionnalités
   - `fix:` pour les corrections de bugs
   - `docs:` pour la documentation
   - `test:` pour les tests
   - `refactor:` pour le refactoring
   - `chore:` pour les tâches de maintenance

5. **Push et créer une Pull Request**
   ```bash
   git push origin feature/ma-nouvelle-fonctionnalite
   ```
   
   Créez ensuite une Pull Request sur GitHub avec :
   - Un titre descriptif
   - Une description détaillée des changements
   - Des captures d'écran si applicable
   - La référence aux issues fermées (ex: "Closes #123")

## 📝 Standards de code

### Style de code
- Utilisez TypeScript pour tout nouveau code
- Suivez les règles ESLint configurées
- Utilisez Prettier pour le formatage automatique
- Documentez les fonctions publiques avec JSDoc

### Tests
- Écrivez des tests unitaires pour toute nouvelle fonctionnalité
- Maintenez une couverture de code > 80%
- Utilisez Jest pour les tests
- Moquez les appels externes à Drupal

### Documentation
- Mettez à jour le README.md si nécessaire
- Documentez les nouveaux outils dans `src/tools/index.ts`
- Ajoutez des exemples d'utilisation
- Commentez le code complexe

## 🧪 Tests

### Lancer les tests
```bash
# Tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec coverage
npm run test:coverage

# Tests d'un fichier spécifique
npm test -- drupal-client.test.ts
```

### Structure des tests
```
tests/
├── unit/           # Tests unitaires
├── integration/    # Tests d'intégration
├── fixtures/       # Données de test
└── helpers/        # Utilitaires de test
```

### Écrire un test
```typescript
describe('DrupalClient', () => {
  it('should create a node successfully', async () => {
    const mockResponse = { data: { id: '123', title: 'Test' } };
    axios.post.mockResolvedValue(mockResponse);
    
    const client = new DrupalClient();
    const result = await client.createNode({ title: 'Test Article' });
    
    expect(result.content[0].text).toContain('Test');
  });
});
```

## 🔍 Revue de code

Toutes les contributions passent par une revue de code. Voici ce que nous vérifions :

### Code
- ✅ Respect des conventions de style
- ✅ Tests unitaires présents et passants
- ✅ Pas de régression introduite
- ✅ Performance acceptable
- ✅ Sécurité (pas de failles évidentes)

### Documentation
- ✅ README.md à jour si nécessaire
- ✅ Commentaires dans le code complexe
- ✅ JSDoc pour les fonctions publiques

### Compatibilité
- ✅ Compatible avec Node.js 18+
- ✅ Compatible avec Drupal 9 et 10
- ✅ Tests passent sur toutes les versions supportées

## 📦 Release

Le projet utilise [Semantic Release](https://semantic-release.gitbook.io/) pour automatiser les releases :

- Les commits sur `main` déclenchent automatiquement une release
- La version est calculée basée sur les commits conventionnels
- Le CHANGELOG.md est généré automatiquement
- Le package npm est publié automatiquement

## 🤝 Code de conduite

Ce projet adhère au [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). En participant, vous acceptez de respecter ce code.

### Nos engagements
- Être accueillant envers tous
- Respecter les différents points de vue
- Accepter les critiques constructives
- Se concentrer sur ce qui est le mieux pour la communauté

## ❓ Questions

Si vous avez des questions :

1. 📖 Consultez d'abord la documentation
2. 🔍 Cherchez dans les issues existantes
3. 💬 Ouvrez une Discussion GitHub
4. 📧 Contactez les mainteneurs

## 🏆 Reconnaissance

Tous les contributeurs sont listés dans le README.md et les release notes. Merci pour votre aide !

### Types de contributions reconnues
- 💻 Code
- 📖 Documentation  
- 🐛 Rapport de bugs
- 💡 Idées et suggestions
- 🎨 Design
- 🔧 Infrastructure
- 🌍 Traductions
- ❓ Support utilisateur

---

**Merci de contribuer au serveur MCP Drupal ! 🚀**
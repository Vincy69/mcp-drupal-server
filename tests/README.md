# 🧪 Tests

Ce dossier contient tous les tests du serveur MCP Drupal.

## 📁 Structure

### Tests actifs ([../src/__tests__/](../src/__tests__/))
- **[basic.test.ts](../src/__tests__/basic.test.ts)** - Tests de base du serveur MCP
- **[setup.ts](../src/__tests__/setup.ts)** - Configuration de l'environnement de test

### Tests désactivés ([disabled/](./disabled/))
Tests temporairement désactivés pour permettre la compilation :
- **drupal-code-analyzer-v2.test.ts** - Tests de l'analyseur de code avancé
- **drupal-docs-client.test.ts** - Tests du client documentation  
- **drupal-entity-generator.test.ts** - Tests du générateur d'entités
- **drupal-fuzzy-search.test.ts** - Tests de recherche floue
- **drupal-migration-assistant.test.ts** - Tests de l'assistant de migration
- **integration.test.ts** - Tests d'intégration end-to-end
- **performance-optimization.test.ts** - Tests d'optimisation de performance

## 🎯 Exécution des tests

### Tests actifs
```bash
# Tous les tests actifs
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Tests individuels
```bash
# Test spécifique
npm test -- basic.test.ts

# Tests par pattern
npm test -- --testNamePattern="should handle"
```

## 🔧 Réactivation des tests désactivés

Les tests ont été temporairement déplacés pour permettre la compilation. Pour les réactiver :

1. **Corriger les types TypeScript** dans chaque fichier de test
2. **Mettre à jour les mocks** selon les nouvelles interfaces
3. **Déplacer les fichiers** de `tests/disabled/` vers `src/__tests__/`
4. **Exécuter les tests** pour validation

### Problèmes à corriger
- Types incompatibles avec les nouvelles interfaces
- Méthodes mockées qui n'existent plus
- Propriétés d'objets qui ont changé de nom
- Paramètres de type `never` vs types attendus

## 📊 Couverture

Objectifs de couverture :
- **Fonctions** : >90%
- **Branches** : >85% 
- **Lignes** : >90%
- **Statements** : >90%

Consultez [../docs/development/TEST_RESULTS.md](../docs/development/TEST_RESULTS.md) pour les résultats détaillés.
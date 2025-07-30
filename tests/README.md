# 🧪 Tests

Tests du serveur MCP Drupal.

## 📁 Structure

### Tests actifs ([../src/__tests__/](../src/__tests__/))
- **[basic.test.ts](../src/__tests__/basic.test.ts)** - Tests de base du serveur MCP
- **[setup.ts](../src/__tests__/setup.ts)** - Configuration de l'environnement de test

### Tests désactivés ([disabled/](./disabled/))
Tests temporairement désactivés pour permettre la compilation.

## 🎯 Exécution

```bash
# Tous les tests actifs
npm test

# Tests avec couverture
npm run test:coverage

# Test spécifique
npm test -- basic.test.ts
```

## 🔧 Réactivation des tests désactivés

Pour réactiver les tests désactivés :
1. Corriger les types TypeScript
2. Déplacer de `tests/disabled/` vers `src/__tests__/`
3. Exécuter pour validation
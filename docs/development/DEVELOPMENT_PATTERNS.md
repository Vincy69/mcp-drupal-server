# 🏗️ Patterns de Développement Drupal avec MCP

Guide des meilleures pratiques et patterns de développement pour maximiser l'efficacité du MCP Drupal Server avec Claude Code.

## 📚 Table des Matières

1. [🎯 Philosophy & Principes](#-philosophy--principes)
2. [🔍 Patterns de Recherche](#-patterns-de-recherche)
3. [🛠️ Patterns de Génération](#️-patterns-de-génération)
4. [🧪 Patterns d'Analyse](#-patterns-danalyse)
5. [🏗️ Patterns d'Architecture](#️-patterns-darchitecture)
6. [⚡ Patterns de Performance](#-patterns-de-performance)
7. [🔒 Patterns de Sécurité](#-patterns-de-sécurité)
8. [📦 Patterns de Déploiement](#-patterns-de-déploiement)

---

## 🎯 Philosophy & Principes

### Principe Central : "Search First, Build Smart"

**Toujours rechercher avant de créer** - Le MCP Drupal contient la connaissance collective de la communauté Drupal. Utilisez-la avant de réinventer.

### Les 5 Piliers du Développement MCP Drupal

#### 1. **Data-Driven Development**
```bash
# ✅ Bon : Décisions basées sur des données réelles
claude "search_contrib_modules('workflow') + get_module_details() pour comparer les options"

# ❌ Mauvais : Décision basée sur l'intuition
"Je vais utiliser X parce que ça me semble bien"
```

#### 2. **Quality-First Approach**
```bash
# ✅ Bon : Toujours analyser le code généré
claude "generate_module_skeleton() puis deep_analyze_file() pour vérifier la qualité"

# ❌ Mauvais : Utiliser le code généré sans vérification
```

#### 3. **Context-Aware Solutions**
```bash
# ✅ Bon : Solutions adaptées au contexte
claude "hybrid_analyze_site() pour comprendre l'écosystème avant de proposer"

# ❌ Mauvais : Solutions génériques sans contexte
```

#### 4. **Performance by Design**
```bash
# ✅ Bon : Optimisation dès la conception
claude "deep_analyze_file() avec focus performance sur chaque composant"

# ❌ Mauvais : Optimisation en afterthought
```

#### 5. **Standards Compliance**
```bash
# ✅ Bon : Respect automatique des standards
claude "check_drupal_standards() sur tous les fichiers avant commit"

# ❌ Mauvais : Standards vérifiés manuellement ou pas du tout
```

---

## 🔍 Patterns de Recherche

### Pattern 1: "Entonnoir de Recherche"

**Principe :** Aller du général au spécifique pour obtenir une compréhension complète.

```bash
# Étape 1 : Vue d'ensemble
claude "search_drupal_all('user management')"

# Étape 2 : Spécialisation par type
claude "search_drupal_functions('user_') + search_drupal_hooks('user')"

# Étape 3 : Exemples concrets
claude "search_code_examples('user registration custom') + get_examples_by_tag('user')"

# Étape 4 : Solutions existantes
claude "search_contrib_modules('user registration') + get_popular_modules(category='User Management')"
```

### Pattern 2: "Recherche Contextuelle"

**Principe :** Adapter la recherche au contexte du projet actuel.

```bash
# Contexte inclus dans la recherche
claude "smart_search('form validation', context={
  current_file: './modules/custom/registration/src/Form/RegisterForm.php',  
  project_type: 'e-commerce'
})"
```

### Pattern 3: "Recherche Progressive"

**Principe :** Construire la connaissance progressivement avec des recherches liées.

```bash
# Recherche initiale
claude "search_drupal_all('custom entity')"

# Approfondissement basé sur les résultats
claude "get_function_details('EntityInterface') basé sur le résultat précédent"

# Exploration des patterns connexes  
claude "search_code_examples('entity bundle') pour voir les implémentations"
```

### Pattern 4: "Recherche Comparative"

**Principe :** Comparer les options avant de choisir.

```bash
# Comparaison de modules contrib
claude "Compare ces modules pour la gestion d'événements :
- search_contrib_modules('event') 
- get_module_details('calendar')
- get_module_details('event')
Analyse leurs forces/faiblesses et recommande"
```

---

## 🛠️ Patterns de Génération

### Pattern 1: "Generate → Analyze → Refine"

**Principe :** Générer, analyser la qualité, puis raffiner.

```bash
# 1. Génération initiale
claude "generate_module_skeleton({
  module_info: { name: 'Event Manager', machine_name: 'event_manager' },
  options: { include_entity: true, include_controller: true }
})"

# 2. Analyse qualité
claude "deep_analyze_file('./modules/custom/event_manager/event_manager.module')"

# 3. Raffinement basé sur l'analyse
claude "Améliore le code basé sur l'analyse précédente, focus sur les points < 80/100"
```

### Pattern 2: "Contextual Code Generation"

**Principe :** Générer du code qui s'adapte au style existant.

```bash
# Analyse du style existant
claude "detect_coding_patterns('./modules/custom') pour comprendre les conventions"

# Génération adaptée
claude "generate_contextual_code(
  description: 'Service de notification email',
  context_file: './modules/custom/user_manager/src/UserService.php',
  target_location: './modules/custom/notification/src/NotificationService.php'
)"
```

### Pattern 3: "Multi-Layer Generation"

**Principe :** Générer l'architecture complète couche par couche.

```bash
# Couche 1 : Entité + Repository
claude "generate_custom_entity() avec repository pattern"

# Couche 2 : Services métier
claude "Génère les services basés sur l'entité créée précédemment"

# Couche 3 : Controllers + Forms
claude "Génère les controllers et forms pour l'entité et services"

# Couche 4 : Tests
claude "Génère les tests unitaires pour toutes les couches"
```

### Pattern 4: "Template-Based Customization"

**Principe :** Partir d'un template et le personnaliser selon les besoins.

```bash
# 1. Comprendre les templates disponibles
claude "get_module_template_info() pour voir les options"

# 2. Génération basée sur template
claude "generate_module_skeleton() avec template 'advanced_entity'"

# 3. Customisation post-génération
claude "Customize l'entité générée pour ajouter workflow states et transitions"
```

---

## 🧪 Patterns d'Analyse

### Pattern 1: "Multi-Level Analysis"

**Principe :** Analyser à différents niveaux de granularité.

```bash
# Niveau architectural
claude "analyze_project_structure('./') pour vue d'ensemble"

# Niveau module  
claude "hybrid_analyze_module('custom_events') pour analyse spécifique"

# Niveau fichier
claude "deep_analyze_file('./src/Controller/EventController.php') pour détails"

# Niveau fonction
claude "suggest_alternatives() pour optimiser une fonction spécifique"
```

### Pattern 2: "Continuous Quality Monitoring"

**Principe :** Intégrer l'analyse qualité dans le workflow de développement.

```bash
# Hook pré-commit
# .git/hooks/pre-commit
#!/bin/bash
claude "check_drupal_standards() sur les fichiers modifiés"
if [ $? -ne 0 ]; then
  echo "Standards Drupal non respectés"
  exit 1
fi
```

### Pattern 3: "Performance-Driven Analysis"

**Principe :** Prioriser l'analyse de performance dans chaque composant.

```bash
# Analyse avec focus performance
claude "deep_analyze_file('./src/Service/SearchService.php') avec métriques :
- Complexité algorithmique
- Requêtes DB par opération  
- Usage mémoire estimé
- Temps de réponse cible"
```

### Pattern 4: "Security-First Analysis"

**Principe :** Intégrer l'audit de sécurité dès le développement.

```bash
# Audit sécurité systématique
claude "hybrid_analyze_site() avec audit sécurité complet :
- Validation des inputs
- Protection XSS/CSRF  
- Contrôle d'accès
- Injection SQL
- Exposition de données sensibles"
```

---

## 🏗️ Patterns d'Architecture

### Pattern 1: "Domain-Driven Design with MCP"

**Principe :** Organiser le code selon les domaines métier avec validation MCP.

```bash
# 1. Identifier les domaines
claude "analyze_project_structure('./') et identifie les domaines métier"

# 2. Générer l'architecture par domaine
claude "Pour le domaine 'User Management', génère :
- UserRepository (accès données)
- UserService (logique métier)  
- UserController (interface web)
- UserValidator (validation)
- UserEventSubscriber (événements)"

# 3. Valider l'architecture
claude "detect_coding_patterns('./src/User/') pour vérifier la cohérence"
```

### Pattern 2: "Microservice-Ready Modules"

**Principe :** Créer des modules découplés prêts pour une architecture microservices.

```bash
# Module avec API complète
claude "generate_module_skeleton() avec options :
- include_rest_api: true
- include_services: true  
- include_events: true
- loosely_coupled: true"

# Validation du découplage
claude "analyze_drupal_file() et vérifie les dépendances circulaires"
```

### Pattern 3: "Event-Driven Architecture"

**Principe :** Utiliser les événements Drupal pour découpler les composants.

```bash
# Génération avec événements
claude "Crée un système d'événements pour :
- UserRegisteredEvent
- OrderCompletedEvent  
- ProductUpdatedEvent
Avec subscribers correspondants"

# Analyse de l'architecture événementielle
claude "Vérifie que les événements respectent les patterns Drupal/Symfony"
```

### Pattern 4: "Testable Architecture"

**Principe :** Concevoir pour la testabilité dès le départ.

```bash
# Architecture avec injection de dépendances
claude "generate_custom_entity() avec :
- Interfaces pour tous les services
- Injection de dépendances explicite
- Mocks fournis pour les tests
- Couverture de tests > 90%"
```

---

## ⚡ Patterns de Performance

### Pattern 1: "Cache-First Development"

**Principe :** Intégrer le cache dès la conception, pas en optimisation tardive.

```bash
# Service avec cache intégré
claude "Génère un service de recherche avec :
- Cache multi-niveaux (L1: memory, L2: database)
- Invalidation intelligente  
- Cache tags pour granularité
- Monitoring des hit ratios"

# Validation performance
claude "deep_analyze_file() avec focus cache pour valider l'implémentation"
```

### Pattern 2: "Database Query Optimization"

**Principe :** Optimiser les requêtes dès l'écriture.

```bash
# Génération avec requêtes optimisées
claude "generate_contextual_code() pour un service de recherche avec :
- Entity Query optimisée (pas de SQL brut)
- Eager loading des relations
- Pagination native
- Index database hints"

# Analyse des requêtes
claude "deep_analyze_file() et identifie les requêtes N+1 potentielles"
```

### Pattern 3: "Lazy Loading Patterns"

**Principe :** Charger les données uniquement quand nécessaire.

```bash
# Entité avec lazy loading
claude "generate_custom_entity() avec :
- Relations lazy-loaded par défaut
- Computed fields en lazy loading
- Cache per-entity intelligent
- Stratégie de préchargement configurable"
```

### Pattern 4: "Performance Monitoring"

**Principe :** Intégrer le monitoring de performance dans le code.

```bash
# Code avec monitoring intégré
claude "Ajoute à ce service des métriques de performance :
- Temps d'exécution par méthode
- Compteur de requêtes DB
- Usage mémoire  
- Cache hit/miss ratios
Avec logging structuré"
```

---

## 🔒 Patterns de Sécurité

### Pattern 1: "Security by Design"

**Principe :** Intégrer la sécurité dès la conception.

```bash
# Génération sécurisée
claude "generate_module_skeleton() avec focus sécurité :
- Validation stricte des inputs
- Sanitization automatique des outputs
- Contrôle d'accès granulaire
- Audit trail des actions sensibles"

# Validation sécurité
claude "hybrid_analyze_site() avec audit sécurité complet"
```

### Pattern 2: "Input Validation Patterns"

**Principe :** Valider et sanitiser tous les inputs utilisateur.

```bash
# Service de validation centralisé
claude "Crée un ValidationService avec :
- Validation par type de donnée
- Règles métier configurables
- Messages d'erreur i18n
- Log des tentatives d'injection"
```

### Pattern 3: "Access Control Patterns"

**Principe :** Contrôle d'accès précis et vérifiable.

```bash
# Système de permissions granulaire
claude "Génère un système de permissions avec :
- Permissions par entité et opération
- Rôles hiérarchiques
- Conditions contextuelles
- Audit des accès"
```

### Pattern 4: "Data Protection Patterns"

**Principe :** Protéger les données sensibles.

```bash
# Entité avec protection des données
claude "generate_custom_entity() avec :
- Chiffrement des données sensibles
- Anonymisation pour GDPR
- Masquage des données en dev/test
- Purge automatique des données expirées"
```

---

## 📦 Patterns de Déploiement

### Pattern 1: "Environment-Aware Configuration"

**Principe :** Configuration adaptée à chaque environnement.

```bash
# Configuration multi-environnements
claude "Génère la configuration pour :
- settings.local.php par environnement
- Variables d'environnement sécurisées  
- Feature flags configurables
- Configuration overrides par environment"
```

### Pattern 2: "CI/CD Integration"

**Principe :** Intégrer MCP dans le pipeline CI/CD.

```bash
# Pipeline avec MCP
# .github/workflows/drupal.yml
claude "Crée un workflow CI/CD avec :
- check_drupal_standards() sur chaque PR
- deep_analyze_file() pour quality gates
- Tests automatisés avec couverture
- Déploiement conditionnel basé sur qualité"
```

### Pattern 3: "Migration-Safe Deployments"

**Principe :** Déploiements sécurisés avec rollback possible.

```bash
# Stratégie de déploiement
claude "analyze_upgrade_path() avant chaque déploiement pour :
- Détecter les breaking changes
- Générer les scripts de migration
- Préparer les rollback procedures
- Valider sur environnement staging"
```

### Pattern 4: "Monitoring and Alerting"

**Principe :** Surveillance proactive de la qualité en production.

```bash
# Monitoring intégré
claude "Génère un système de monitoring avec :
- Métriques de performance temps réel
- Alertes sur dégradation qualité
- Dashboards de santé du code
- Rapports automatiques de régression"
```

---

## 🎯 Anti-Patterns à Éviter

### ❌ Anti-Pattern 1: "Generate Without Analysis"
```bash
# Mauvais : Générer sans analyser
claude "generate_module_skeleton()" # et l'utiliser directement

# ✅ Bon : Toujours analyser après génération
claude "generate_module_skeleton() puis deep_analyze_file() pour validation"
```

### ❌ Anti-Pattern 2: "Search Without Context"
```bash
# Mauvais : Recherche générique
claude "search_drupal_all('forms')"

# ✅ Bon : Recherche contextuelle
claude "search_drupal_all('custom validation forms Drupal 11') avec contexte du projet"
```

### ❌ Anti-Pattern 3: "Manual Standards Checking"
```bash
# Mauvais : Vérification manuelle des standards
# Reviewer le code manuellement pour les standards

# ✅ Bon : Automatisation des vérifications
claude "check_drupal_standards() sur tous les fichiers avant commit"
```

### ❌ Anti-Pattern 4: "Performance Afterthought"
```bash
# Mauvais : Optimisation en fin de projet
# Développer puis optimiser

# ✅ Bon : Performance dès la conception
claude "deep_analyze_file() avec focus performance à chaque étape"
```

---

## 📋 Checklists de Qualité

### Checklist : Avant Génération de Code
- [ ] `search_drupal_all()` pour comprendre le domaine
- [ ] `search_contrib_modules()` pour éviter la duplication
- [ ] `get_module_template_info()` pour choisir la bonne approche
- [ ] `analyze_project_structure()` pour respecter l'architecture existante

### Checklist : Après Génération de Code
- [ ] `deep_analyze_file()` sur tous les fichiers générés
- [ ] `check_drupal_standards()` pour conformité
- [ ] `hybrid_analyze_site()` pour impact sur l'écosystème
- [ ] Tests automatisés passants

### Checklist : Avant Déploiement
- [ ] `analyze_upgrade_path()` si applicable
- [ ] `hybrid_analyze_site()` avec audit sécurité
- [ ] Performance validée sur environnement staging
- [ ] Documentation mise à jour

---

## 🚀 Métriques de Succès

### Métriques de Développement
- **Temps de développement** : Réduction de 60-80% vs développement traditionnel
- **Qualité du code** : Score moyen > 85/100 sur `deep_analyze_file()`
- **Couverture de tests** : > 90% sur code généré
- **Conformité standards** : 100% avec `check_drupal_standards()`

### Métriques Opérationnelles  
- **Performance** : Amélioration de 300-500% après optimisations MCP
- **Sécurité** : 0 vulnérabilité critique détectée par `hybrid_analyze_site()`
- **Maintenabilité** : Code documentation > 80%
- **Évolutivité** : Architecture modulaire validée

---

**💡 Conclusion :** Ces patterns transforment le développement Drupal en processus industrialisé, prévisible et de haute qualité. L'intégration du MCP Drupal Server avec Claude Code permet d'atteindre un niveau de professionnalisme et d'efficacité inégalé dans l'écosystème Drupal.
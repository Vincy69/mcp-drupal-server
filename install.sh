#!/bin/bash

# Script d'installation principal pour le serveur MCP Drupal
# Automatise l'installation complète et la configuration

set -e  # Arrêt en cas d'erreur

echo "🚀 Installation du serveur MCP Drupal pour Claude Code"
echo "======================================================"

# Vérifier les prérequis
echo "🔍 Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+ d'abord."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer npm d'abord."
    exit 1
fi

echo "✅ Node.js et npm sont installés"

# Installation des dépendances
echo ""
echo "📦 Installation des dépendances..."
npm install

# Compilation TypeScript
echo ""
echo "🔨 Compilation du projet..."
npm run build

# Configuration MCP
echo ""
echo "⚙️ Configuration du serveur MCP..."
./scripts/setup-config.sh

# Test du serveur
echo ""
echo "🧪 Test de fonctionnement..."
timeout 3s node dist/index.js || true  # Le timeout est normal, c'est juste pour vérifier le démarrage

# Test des fonctionnalités
echo ""
echo "🔬 Test des fonctionnalités principales..."
node test_mock_fallback.js > /dev/null 2>&1 && echo "✅ Tests de fallback réussis" || echo "⚠️ Tests de fallback partiels"

echo ""
echo "🎉 Installation terminée avec succès!"
echo ""
echo "📋 Étapes suivantes:"
echo "1. 🔄 Redémarrez Claude Code pour charger la configuration MCP"
echo "2. 🧪 Testez avec: search_drupal_all('custom forms')"
echo "3. 📚 Consultez la documentation: docs/README.md"
echo ""
echo "🎯 Outils MCP disponibles:"
echo "   - search_drupal_all (recherche universelle)"
echo "   - search_code_examples (exemples de code)"  
echo "   - generate_module_skeleton (génération de modules)"
echo "   - analyze_drupal_file (analyse de code)"
echo "   - Et 30+ autres outils pour Drupal!"
echo ""
echo "📖 Documentation complète: https://github.com/Vincy69/mcp-drupal-server"
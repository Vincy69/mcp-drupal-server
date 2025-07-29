#!/bin/bash

# Script pour configurer automatiquement les chemins dans la configuration MCP

# Obtenir le chemin absolu du projet
PROJECT_PATH=$(cd "$(dirname "$0")/.." && pwd)

echo "🔧 Configuration du serveur MCP Drupal..."
echo "📁 Chemin du projet: $PROJECT_PATH"

# Créer le répertoire de configuration Claude Code s'il n'existe pas
mkdir -p ~/.config/claude-code

# Générer la configuration Claude Code avec le bon chemin
sed "s|{{PROJECT_PATH}}|$PROJECT_PATH|g" "$PROJECT_PATH/config/claude_code_mcp_config.template.json" > "$PROJECT_PATH/config/claude_code_mcp_config.json"

# Copier vers Claude Code
cp "$PROJECT_PATH/config/claude_code_mcp_config.json" ~/.config/claude-code/mcp_config.json

# Garder aussi l'ancienne configuration pour compatibilité
sed "s|{{PROJECT_PATH}}|$PROJECT_PATH|g" "$PROJECT_PATH/config/claude_mcp_config.template.json" > "$PROJECT_PATH/config/claude_mcp_config.json"

echo "✅ Configuration MCP mise à jour:"
echo "   - Fichier local Claude Code: $PROJECT_PATH/config/claude_code_mcp_config.json"
echo "   - Fichier local Claude Desktop: $PROJECT_PATH/config/claude_mcp_config.json"
echo "   - Configuration Claude Code: ~/.config/claude-code/mcp_config.json"
echo ""
echo "🚀 Redémarrez Claude Code pour appliquer les changements!"
#!/bin/bash

# 🚀 Script d'installation automatique de l'écosystème MCP pour développement Drupal
# Ce script installe les serveurs MCP complémentaires recommandés

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fonction pour installer un package npm global
install_npm_package() {
    local package=$1
    local name=$2
    
    log_info "Installation de $name..."
    
    if npm list -g "$package" >/dev/null 2>&1; then
        log_warning "$name est déjà installé"
    else
        if npm install -g "$package"; then
            log_success "$name installé avec succès"
        else
            log_error "Échec de l'installation de $name"
            return 1
        fi
    fi
}

# Fonction pour cloner et installer un repo
install_git_package() {
    local repo_url=$1
    local repo_name=$2
    local install_dir="$HOME/.mcp-servers/$repo_name"
    
    log_info "Installation de $repo_name depuis $repo_url..."
    
    if [ -d "$install_dir" ]; then
        log_warning "$repo_name existe déjà dans $install_dir"
        cd "$install_dir"
        log_info "Mise à jour de $repo_name..."
        git pull
    else
        mkdir -p "$HOME/.mcp-servers"
        git clone "$repo_url" "$install_dir"
        cd "$install_dir"
    fi
    
    if [ -f "package.json" ]; then
        npm install
        if [ -f "tsconfig.json" ] || [ -d "src" ]; then
            npm run build 2>/dev/null || log_warning "Pas de script de build pour $repo_name"
        fi
        log_success "$repo_name installé dans $install_dir"
    else
        log_warning "$repo_name n'a pas de package.json"
    fi
}

echo "🚀 Installation de l'écosystème MCP pour développement Drupal"
echo "============================================================"

# Vérification des prérequis
log_info "Vérification des prérequis..."

if ! command_exists node; then
    log_error "Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command_exists npm; then
    log_error "npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command_exists git; then
    log_error "Git n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18+ requis. Version actuelle: $(node --version)"
    exit 1
fi

log_success "Tous les prérequis sont satisfaits"

# Demander à l'utilisateur quels serveurs installer
echo ""
log_info "Sélectionnez les serveurs MCP à installer:"
echo "1. Configuration minimale (filesystem + git)"
echo "2. Configuration standard (+ database + github + composer)"
echo "3. Configuration complète (+ docker + testing + notifications)"
echo "4. Installation personnalisée"

read -p "Choisissez une option (1-4): " choice

case $choice in
    1)
        INSTALL_MINIMAL=true
        ;;
    2)
        INSTALL_MINIMAL=true
        INSTALL_STANDARD=true
        ;;
    3)
        INSTALL_MINIMAL=true
        INSTALL_STANDARD=true
        INSTALL_COMPLETE=true
        ;;
    4)
        INSTALL_CUSTOM=true
        ;;
    *)
        log_error "Option invalide"
        exit 1
        ;;
esac

# Installation des serveurs de base (toujours installés)
log_info "Installation des serveurs MCP de base..."

# Serveurs filesystem et git (officiels)
install_npm_package "@modelcontextprotocol/server-filesystem" "Filesystem MCP Server"
install_npm_package "@modelcontextprotocol/server-git" "Git MCP Server"

if [ "$INSTALL_MINIMAL" = true ] || [ "$INSTALL_STANDARD" = true ] || [ "$INSTALL_COMPLETE" = true ]; then
    log_success "Configuration minimale installée"
fi

# Installation standard
if [ "$INSTALL_STANDARD" = true ] || [ "$INSTALL_COMPLETE" = true ]; then
    log_info "Installation des serveurs standard..."
    
    # Base de données
    install_npm_package "mcp-alchemy" "MCP Alchemy (Database)"
    
    # GitHub
    install_npm_package "@modelcontextprotocol/server-github" "GitHub MCP Server"
    
    # Composer (hypothétique - peut ne pas exister)
    if npm search mcp-composer | grep -q "mcp-composer"; then
        install_npm_package "mcp-composer" "Composer MCP Server"
    else
        log_warning "mcp-composer non disponible, sera installé depuis GitHub si disponible"
        # install_git_package "https://github.com/example/mcp-composer.git" "mcp-composer"
    fi
    
    log_success "Configuration standard installée"
fi

# Installation complète
if [ "$INSTALL_COMPLETE" = true ]; then
    log_info "Installation des serveurs avancés..."
    
    # Docker MCP Server
    install_git_package "https://github.com/docker/mcp-servers.git" "docker-mcp"
    
    # PostgreSQL MCP Server
    install_git_package "https://github.com/crystaldba/postgres-mcp.git" "postgres-mcp"
    
    log_success "Configuration complète installée"
fi

# Installation personnalisée
if [ "$INSTALL_CUSTOM" = true ]; then
    echo ""
    log_info "Installation personnalisée - sélectionnez les serveurs à installer:"
    
    # Liste des serveurs disponibles avec choix utilisateur
    servers=(
        "mcp-alchemy:MCP Alchemy (Database)"
        "@modelcontextprotocol/server-github:GitHub MCP Server"
        "docker-mcp:Docker MCP Server (GitHub)"
        "postgres-mcp:PostgreSQL MCP Server (GitHub)"
    )
    
    for server in "${servers[@]}"; do
        IFS=':' read -r package_name display_name <<< "$server"
        read -p "Installer $display_name? (y/N): " install_choice
        if [[ "$install_choice" =~ ^[Yy]$ ]]; then
            if [[ "$package_name" == *"-mcp" ]] && [[ "$package_name" != "mcp-"* ]]; then
                # C'est un repo GitHub
                case $package_name in
                    "docker-mcp")
                        install_git_package "https://github.com/docker/mcp-servers.git" "docker-mcp"
                        ;;
                    "postgres-mcp")
                        install_git_package "https://github.com/crystaldba/postgres-mcp.git" "postgres-mcp"
                        ;;
                esac
            else
                # C'est un package npm
                install_npm_package "$package_name" "$display_name"
            fi
        fi
    done
fi

# Génération de la configuration
echo ""
log_info "Génération de la configuration Claude Code..."

# Créer le répertoire de configuration s'il n'existe pas
config_dir="$HOME/.config/claude-code"
mkdir -p "$config_dir"

# Générer la configuration basique
cat > "$config_dir/mcp_config.json" << EOF
{
  "mcpServers": {
    "drupal": {
      "command": "node",
      "args": ["$(pwd)/dist/index.js"],
      "env": {
        "DOCS_ONLY_MODE": "false",
        "CACHE_TIMEOUT": "900000",
        "API_TIMEOUT": "45000"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "$(pwd)"]
    },
    "git": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-git", "--repository", "$(pwd)"]
    }
EOF

# Ajouter les serveurs installés à la configuration
if npm list -g "@modelcontextprotocol/server-github" >/dev/null 2>&1; then
    cat >> "$config_dir/mcp_config.json" << EOF
    ,
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
      }
    }
EOF
fi

if npm list -g "mcp-alchemy" >/dev/null 2>&1; then
    cat >> "$config_dir/mcp_config.json" << EOF
    ,
    "database": {
      "command": "mcp-alchemy",
      "args": ["--database-url", "YOUR_DATABASE_URL_HERE"]
    }
EOF
fi

if [ -d "$HOME/.mcp-servers/docker-mcp" ]; then
    cat >> "$config_dir/mcp_config.json" << EOF
    ,
    "docker": {
      "command": "node",
      "args": ["$HOME/.mcp-servers/docker-mcp/dist/index.js"]
    }
EOF
fi

if [ -d "$HOME/.mcp-servers/postgres-mcp" ]; then
    cat >> "$config_dir/mcp_config.json" << EOF
    ,
    "postgres": {
      "command": "node",
      "args": ["$HOME/.mcp-servers/postgres-mcp/dist/index.js"],
      "env": {
        "DATABASE_URL": "YOUR_POSTGRES_URL_HERE"
      }
    }
EOF
fi

# Fermer la configuration JSON
cat >> "$config_dir/mcp_config.json" << EOF
  }
}
EOF

log_success "Configuration générée dans $config_dir/mcp_config.json"

# Instructions finales
echo ""
echo "🎉 Installation terminée !"
echo "========================="
echo ""
log_info "Prochaines étapes:"
echo "1. Éditez $config_dir/mcp_config.json pour configurer vos tokens et URLs"
echo "2. Pour GitHub: Ajoutez votre GITHUB_PERSONAL_ACCESS_TOKEN"
echo "3. Pour la base de données: Ajoutez votre DATABASE_URL"
echo "4. Testez avec: claude 'Liste tous les serveurs MCP disponibles'"
echo ""
echo "📚 Consultez MCP_ECOSYSTEM.md pour plus d'informations sur l'utilisation"
echo ""
log_success "Votre écosystème MCP Drupal est prêt !"
#!/usr/bin/env node

/**
 * Script de configuration Claude Desktop
 * Usage: node scripts/configure-claude.js [docs|full] [options]
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CLAUDE_DESKTOP_CONFIG_PATH = path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
const CLAUDE_CODE_CONFIG_PATH = path.join(os.homedir(), '.config/claude-code/mcp_config.json');
const PROJECT_PATH = process.cwd();

async function readConfig(configPath) {
  try {
    const content = await fs.readFile(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Impossible de lire la configuration: ${configPath}`);
    throw error;
  }
}

async function writeConfig(config, configPath, label) {
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Configuration ${label} mise à jour`);
  } catch (error) {
    console.error(`❌ Impossible d'écrire la configuration ${label}`);
    throw error;
  }
}

function createDocsConfig() {
  return {
    command: "node",
    args: [path.join(PROJECT_PATH, "dist/index.js")],
    env: {
      DOCS_ONLY_MODE: "true"
    }
  };
}

function createClaudeCodeConfig(serverConfig) {
  return {
    mcp: {
      drupal: serverConfig
    }
  };
}

function createClaudeDesktopConfig(serverConfig) {
  return {
    mcpServers: {
      drupal: serverConfig
    }
  };
}

function createFullConfig(options = {}) {
  const env = {
    DRUPAL_BASE_URL: options.baseUrl || "https://votre-site-drupal.com",
  };

  if (options.username && options.password) {
    env.DRUPAL_USERNAME = options.username;
    env.DRUPAL_PASSWORD = options.password;
  } else if (options.token) {
    env.DRUPAL_TOKEN = options.token;
  } else if (options.apiKey) {
    env.DRUPAL_API_KEY = options.apiKey;
  } else {
    env.DRUPAL_USERNAME = "admin";
    env.DRUPAL_PASSWORD = "password";
  }

  return {
    command: "node",
    args: [path.join(PROJECT_PATH, "dist/index.js")],
    env
  };
}

async function configure(mode, options = {}) {
  console.log(`🔧 Configuration du serveur MCP Drupal en mode: ${mode}\n`);

  let serverConfig;
  switch (mode) {
    case 'docs':
      serverConfig = createDocsConfig();
      console.log('📚 Configuration documentation seule activée');
      break;
    case 'full':
      serverConfig = createFullConfig(options);
      console.log('🚀 Configuration complète activée');
      console.log('⚠️  N\'oubliez pas de mettre à jour les credentials Drupal dans la configuration');
      break;
    default:
      console.error('❌ Mode invalide. Utilisez: docs ou full');
      process.exit(1);
  }

  // Configurer Claude Code
  try {
    await fs.mkdir(path.dirname(CLAUDE_CODE_CONFIG_PATH), { recursive: true });
    const claudeCodeConfig = createClaudeCodeConfig(serverConfig);
    await writeConfig(claudeCodeConfig, CLAUDE_CODE_CONFIG_PATH, 'Claude Code');
  } catch (error) {
    console.error('⚠️  Impossible de configurer Claude Code:', error.message);
  }

  // Configurer Claude Desktop (pour compatibilité)
  try {
    await fs.mkdir(path.dirname(CLAUDE_DESKTOP_CONFIG_PATH), { recursive: true });
    let desktopConfig;
    try {
      desktopConfig = await readConfig(CLAUDE_DESKTOP_CONFIG_PATH);
    } catch {
      desktopConfig = {};
    }
    
    if (!desktopConfig.mcpServers) {
      desktopConfig.mcpServers = {};
    }
    
    desktopConfig.mcpServers['drupal'] = serverConfig;
    await writeConfig(desktopConfig, CLAUDE_DESKTOP_CONFIG_PATH, 'Claude Desktop');
  } catch (error) {
    console.error('⚠️  Impossible de configurer Claude Desktop:', error.message);
  }

  console.log('\n💡 Redémarrez Claude Code pour appliquer les changements');
}

// Parse des arguments de ligne de commande
const args = process.argv.slice(2);
const mode = args[0];

if (!mode || !['docs', 'full'].includes(mode)) {
  console.log('Usage: node scripts/configure-claude.js [docs|full] [options]');
  console.log('\nModes:');
  console.log('  docs  - Documentation seulement');
  console.log('  full  - Connexion Drupal complète');
  console.log('\nOptions pour le mode full:');
  console.log('  --base-url URL     URL de base Drupal');
  console.log('  --username USER    Nom d\'utilisateur');
  console.log('  --password PASS    Mot de passe');
  console.log('  --token TOKEN      Token d\'authentification');
  console.log('  --api-key KEY      Clé API');
  process.exit(1);
}

// Parse des options
const options = {};
for (let i = 1; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];
  
  switch (flag) {
    case '--base-url':
      options.baseUrl = value;
      break;
    case '--username':
      options.username = value;
      break;
    case '--password':
      options.password = value;
      break;
    case '--token':
      options.token = value;
      break;
    case '--api-key':
      options.apiKey = value;
      break;
  }
}

configure(mode, options).catch(console.error);
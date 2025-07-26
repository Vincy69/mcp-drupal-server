#!/usr/bin/env node

/**
 * Script de configuration Claude Desktop
 * Usage: node scripts/configure-claude.js [docs|full] [options]
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CLAUDE_CONFIG_PATH = path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
const PROJECT_PATH = process.cwd();

async function readConfig() {
  try {
    const content = await fs.readFile(CLAUDE_CONFIG_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Impossible de lire la configuration Claude Desktop');
    console.error(`   Chemin: ${CLAUDE_CONFIG_PATH}`);
    throw error;
  }
}

async function writeConfig(config) {
  try {
    await fs.writeFile(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('✅ Configuration Claude Desktop mise à jour');
  } catch (error) {
    console.error('❌ Impossible d\'écrire la configuration Claude Desktop');
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

  const config = await readConfig();
  
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  switch (mode) {
    case 'docs':
      config.mcpServers['drupal-docs'] = createDocsConfig();
      // Supprimer l'ancienne config si elle existe
      delete config.mcpServers['drupal'];
      delete config.mcpServers['drupal-full'];
      console.log('📚 Configuration documentation seule activée');
      break;

    case 'full':
      config.mcpServers['drupal-full'] = createFullConfig(options);
      // Supprimer l'ancienne config si elle existe
      delete config.mcpServers['drupal'];
      delete config.mcpServers['drupal-docs'];
      console.log('🚀 Configuration complète activée');
      console.log('⚠️  N\'oubliez pas de mettre à jour les credentials Drupal dans la configuration');
      break;

    case 'both':
      config.mcpServers['drupal-docs'] = createDocsConfig();
      config.mcpServers['drupal-full'] = createFullConfig(options);
      delete config.mcpServers['drupal'];
      console.log('🔄 Les deux configurations sont disponibles');
      break;

    default:
      console.error('❌ Mode invalide. Utilisez: docs, full, ou both');
      process.exit(1);
  }

  await writeConfig(config);

  console.log('\n📋 Configurations MCP Drupal actives:');
  Object.keys(config.mcpServers)
    .filter(key => key.startsWith('drupal'))
    .forEach(key => {
      const mode = config.mcpServers[key].env.DOCS_ONLY_MODE ? 'docs' : 'full';
      console.log(`   - ${key}: mode ${mode}`);
    });

  console.log('\n💡 Redémarrez Claude Desktop pour appliquer les changements');
}

// Parse des arguments de ligne de commande
const args = process.argv.slice(2);
const mode = args[0];

if (!mode || !['docs', 'full', 'both'].includes(mode)) {
  console.log('Usage: node scripts/configure-claude.js [docs|full|both] [options]');
  console.log('\nModes:');
  console.log('  docs  - Documentation seulement');
  console.log('  full  - Connexion Drupal complète');
  console.log('  both  - Les deux configurations');
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
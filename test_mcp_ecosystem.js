#!/usr/bin/env node

// 🧪 Script de test de compatibilité de l'écosystème MCP
// Vérifie que tous les serveurs MCP installés fonctionnent correctement

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour les messages
const colors = {
  reset: '\033[0m',
  red: '\033[0;31m',
  green: '\033[0;32m',
  yellow: '\033[1;33m',
  blue: '\033[0;34m',
  cyan: '\033[0;36m',
  magenta: '\033[0;35m'
};

function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

function logInfo(message) { log('blue', 'ℹ️ ', message); }
function logSuccess(message) { log('green', '✅', message); }
function logWarning(message) { log('yellow', '⚠️ ', message); }
function logError(message) { log('red', '❌', message); }
function logTest(message) { log('cyan', '🔍', message); }

// Fonction pour vérifier si une commande existe
async function commandExists(command) {
  return new Promise((resolve) => {
    const process = spawn('which', [command], { stdio: 'ignore' });
    process.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Fonction pour vérifier si un package npm est installé globalement
async function npmPackageExists(packageName) {
  return new Promise((resolve) => {
    const process = spawn('npm', ['list', '-g', packageName], { stdio: 'ignore' });
    process.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Fonction pour vérifier si un répertoire existe
async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// Fonction pour tester un serveur MCP en mode basic (vérifier qu'il démarre)
async function testMcpServer(serverName, command, args = []) {
  return new Promise((resolve) => {
    logTest(`Test de démarrage de ${serverName}...`);
    
    const process = spawn(command, args, { 
      stdio: 'ignore',
      timeout: 5000
    });
    
    let resolved = false;
    
    // Si le processus démarre et reste actif pendant 2 secondes, c'est bon
    const successTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        process.kill();
        resolve({ success: true, message: 'Serveur démarre correctement' });
      }
    }, 2000);
    
    process.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(successTimer);
        resolve({ success: false, message: `Erreur: ${error.message}` });
      }
    });
    
    process.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(successTimer);
        if (code === 0) {
          resolve({ success: true, message: 'Serveur s\'est fermé proprement' });
        } else {
          resolve({ success: false, message: `Code de sortie: ${code}` });
        }
      }
    });
    
    // Timeout général
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(successTimer);
        process.kill();
        resolve({ success: false, message: 'Timeout - le serveur ne répond pas' });
      }
    }, 8000);
  });
}

// Configuration des serveurs à tester
const serverConfigs = [
  {
    name: 'MCP Drupal Server',
    type: 'local',
    command: 'node',
    args: [path.join(__dirname, 'dist', 'index.js')],
    required: true,
    checkMethod: async () => {
      const distExists = await directoryExists(path.join(__dirname, 'dist'));
      const indexExists = await fs.access(path.join(__dirname, 'dist', 'index.js')).then(() => true).catch(() => false);
      return distExists && indexExists;
    }
  },
  {
    name: 'Filesystem MCP Server',
    type: 'npm',
    package: '@modelcontextprotocol/server-filesystem',
    command: 'npx',
    args: ['@modelcontextprotocol/server-filesystem', __dirname],
    required: false,
    checkMethod: async () => await npmPackageExists('@modelcontextprotocol/server-filesystem')
  },
  {
    name: 'Git MCP Server',
    type: 'npm',
    package: '@modelcontextprotocol/server-git',
    command: 'npx',
    args: ['@modelcontextprotocol/server-git', '--repository', __dirname],
    required: false,
    checkMethod: async () => await npmPackageExists('@modelcontextprotocol/server-git')
  },
  {
    name: 'GitHub MCP Server',
    type: 'npm',
    package: '@modelcontextprotocol/server-github',
    command: 'npx',
    args: ['@modelcontextprotocol/server-github'],
    required: false,
    checkMethod: async () => await npmPackageExists('@modelcontextprotocol/server-github')
  },
  {
    name: 'MCP Alchemy (Database)',
    type: 'npm',
    package: 'mcp-alchemy',
    command: 'mcp-alchemy',
    args: ['--help'], // Test avec help pour éviter les erreurs de config
    required: false,
    checkMethod: async () => await npmPackageExists('mcp-alchemy')
  },
  {
    name: 'Docker MCP Server',
    type: 'local',
    command: 'node',
    args: [path.join(process.env.HOME, '.mcp-servers', 'docker-mcp', 'dist', 'index.js')],
    required: false,
    checkMethod: async () => await directoryExists(path.join(process.env.HOME, '.mcp-servers', 'docker-mcp'))
  },
  {
    name: 'PostgreSQL MCP Server',
    type: 'local',
    command: 'node',
    args: [path.join(process.env.HOME, '.mcp-servers', 'postgres-mcp', 'dist', 'index.js')],
    required: false,
    checkMethod: async () => await directoryExists(path.join(process.env.HOME, '.mcp-servers', 'postgres-mcp'))
  }
];

async function testMcpEcosystem() {
  console.log('🧪 Test de compatibilité de l\'écosystème MCP Drupal');
  console.log('=====================================================\n');
  
  const results = {
    total: 0,
    installed: 0,
    working: 0,
    failed: 0,
    servers: []
  };
  
  // Vérification des prérequis
  logInfo('Vérification des prérequis...');
  
  const prerequisites = [
    { name: 'Node.js', command: 'node' },
    { name: 'npm', command: 'npm' },
    { name: 'npx', command: 'npx' },
    { name: 'git', command: 'git' }
  ];
  
  for (const prereq of prerequisites) {
    if (await commandExists(prereq.command)) {
      logSuccess(`${prereq.name} est disponible`);
    } else {
      logError(`${prereq.name} n'est pas installé`);
      process.exit(1);
    }
  }
  
  console.log('');
  
  // Test des serveurs MCP
  logInfo('Test des serveurs MCP installés...\n');
  
  for (const server of serverConfigs) {
    results.total++;
    
    console.log(`🔍 Test de ${server.name}:`);
    
    // Vérifier si le serveur est installé
    const isInstalled = await server.checkMethod();
    
    if (!isInstalled) {
      if (server.required) {
        logError(`  ${server.name} est requis mais n'est pas installé`);
        results.failed++;
        results.servers.push({
          name: server.name,
          status: 'required_missing',
          message: 'Serveur requis manquant'
        });
      } else {
        logWarning(`  ${server.name} n'est pas installé (optionnel)`);
        results.servers.push({
          name: server.name,
          status: 'not_installed',
          message: 'Serveur optionnel non installé'
        });
      }
      console.log('');
      continue;
    }
    
    results.installed++;
    logSuccess(`  ${server.name} est installé`);
    
    // Tester le démarrage du serveur
    const testResult = await testMcpServer(server.name, server.command, server.args);
    
    if (testResult.success) {
      logSuccess(`  ${server.name} fonctionne: ${testResult.message}`);
      results.working++;
      results.servers.push({
        name: server.name,
        status: 'working',
        message: testResult.message
      });
    } else {
      logError(`  ${server.name} a échoué: ${testResult.message}`);
      results.failed++;
      results.servers.push({
        name: server.name,
        status: 'failed',
        message: testResult.message
      });
    }
    
    console.log('');
  }
  
  // Vérification de la configuration Claude Code
  logInfo('Vérification de la configuration Claude Code...');
  
  const configPaths = [
    path.join(process.env.HOME, '.config', 'claude-code', 'mcp_config.json'),
    path.join(__dirname, 'claude_mcp_config.json'),
    path.join(process.env.HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
  ];
  
  let configFound = false;
  for (const configPath of configPaths) {
    try {
      await fs.access(configPath);
      logSuccess(`Configuration trouvée: ${configPath}`);
      configFound = true;
      
      // Valider le JSON
      const configContent = await fs.readFile(configPath, 'utf8');
      try {
        const config = JSON.parse(configContent);
        if (config.mcpServers) {
          logSuccess(`  Configuration valide avec ${Object.keys(config.mcpServers).length} serveurs configurés`);
        } else {
          logWarning('  Configuration trouvée mais pas de section mcpServers');
        }
      } catch (error) {
        logError(`  Configuration invalide (JSON malformé): ${error.message}`);
      }
      break;
    } catch {
      // Fichier n'existe pas
    }
  }
  
  if (!configFound) {
    logWarning('Aucune configuration Claude Code trouvée');
    logInfo('Utilisez le script install_mcp_ecosystem.sh pour générer une configuration');
  }
  
  console.log('');
  
  // Rapport final
  console.log('📊 RAPPORT DE COMPATIBILITÉ ÉCOSYSTÈME MCP');
  console.log('==========================================');
  console.log(`📦 Serveurs total: ${results.total}`);
  console.log(`✅ Serveurs installés: ${results.installed}`);
  console.log(`🚀 Serveurs fonctionnels: ${results.working}`);
  console.log(`❌ Serveurs en échec: ${results.failed}`);
  console.log(`📊 Taux de réussite: ${Math.round((results.working / results.installed) * 100)}%`);
  
  console.log('\n📋 Détail par serveur:');
  console.log('======================');
  
  for (const server of results.servers) {
    const statusIcons = {
      'working': '✅',
      'failed': '❌',
      'not_installed': '⏸️ ',
      'required_missing': '🚨'
    };
    
    console.log(`${statusIcons[server.status]} ${server.name}: ${server.message}`);
  }
  
  console.log('');
  
  // Recommandations
  if (results.failed > 0) {
    logWarning('RECOMMANDATIONS:');
    console.log('1. Vérifiez les logs d\'erreur ci-dessus');
    console.log('2. Réinstallez les serveurs en échec avec install_mcp_ecosystem.sh');
    console.log('3. Vérifiez les variables d\'environnement et tokens d\'accès');
    console.log('4. Consultez MCP_ECOSYSTEM.md pour la configuration détaillée');
  } else if (results.working === results.installed && results.installed > 0) {
    logSuccess('PARFAIT ! Tous les serveurs installés fonctionnent correctement !');
    console.log('🎉 Votre écosystème MCP Drupal est entièrement opérationnel.');
    console.log('💡 Vous pouvez maintenant utiliser Claude Code avec tous vos serveurs MCP.');
  } else if (results.installed === 0) {
    logInfo('PREMIERS PAS:');
    console.log('1. Lancez ./install_mcp_ecosystem.sh pour installer les serveurs MCP');
    console.log('2. Relancez ce test pour vérifier l\'installation');
    console.log('3. Consultez MCP_ECOSYSTEM.md pour les guides d\'utilisation');
  }
  
  console.log('');
  
  // Code de sortie
  const hasRequiredFailed = results.servers.some(s => s.status === 'required_missing');
  const hasWorkingServers = results.working > 0;
  
  if (hasRequiredFailed) {
    process.exit(2); // Serveurs requis manquants
  } else if (results.failed > 0 && !hasWorkingServers) {
    process.exit(1); // Tous les serveurs installés ont échoué
  } else {
    process.exit(0); // Succès ou succès partiel
  }
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  logError(`Erreur inattendue: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Promesse rejetée: ${reason}`);
  process.exit(1);
});

// Lancer le test
testMcpEcosystem().catch(error => {
  logError(`Erreur lors du test: ${error.message}`);
  process.exit(1);
});
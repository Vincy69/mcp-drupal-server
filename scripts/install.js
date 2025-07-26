#!/usr/bin/env node

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import * as readline from 'readline';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function print(message, color = '') {
  console.log(color + message + COLORS.reset);
}

function printHeader() {
  console.clear();
  print('╔═══════════════════════════════════════════════════════════╗', COLORS.cyan);
  print('║          MCP Drupal God Mod - Installation Wizard         ║', COLORS.cyan);
  print('╚═══════════════════════════════════════════════════════════╝', COLORS.cyan);
  print('');
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(COLORS.yellow + prompt + COLORS.reset, resolve);
  });
}

async function confirm(prompt) {
  const answer = await question(`${prompt} (y/N): `);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

async function checkPrerequisites() {
  print('Checking prerequisites...', COLORS.cyan);
  
  const checks = {
    node: { 
      command: 'node --version',
      minVersion: '18.0.0',
      name: 'Node.js'
    },
    npm: {
      command: 'npm --version',
      minVersion: '8.0.0',
      name: 'npm'
    }
  };
  
  const results = [];
  
  for (const [key, check] of Object.entries(checks)) {
    try {
      const version = await execCommand(check.command);
      const versionNumber = version.trim().replace(/^v/, '');
      const isValid = compareVersions(versionNumber, check.minVersion) >= 0;
      
      results.push({
        name: check.name,
        version: versionNumber,
        required: check.minVersion,
        status: isValid ? 'pass' : 'fail'
      });
    } catch (error) {
      results.push({
        name: check.name,
        version: 'Not installed',
        required: check.minVersion,
        status: 'fail'
      });
    }
  }
  
  print('\nPrerequisites Check:', COLORS.bright);
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✓' : '✗';
    const color = result.status === 'pass' ? COLORS.green : COLORS.red;
    print(`  ${icon} ${result.name}: ${result.version} (required: ${result.required})`, color);
  });
  
  return results.every(r => r.status === 'pass');
}

async function getClaudeConfigPath() {
  const platform = os.platform();
  let configPath;
  
  switch (platform) {
    case 'darwin':
      configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      break;
    case 'win32':
      configPath = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
      break;
    case 'linux':
      configPath = path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json');
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  
  return configPath;
}

async function setupEnvironment() {
  print('\n📝 Environment Configuration', COLORS.cyan);
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env already exists
  if (await fileExists(envPath)) {
    print('.env file already exists.', COLORS.yellow);
    if (await confirm('Do you want to reconfigure it?')) {
      await fs.rename(envPath, `${envPath}.backup.${Date.now()}`);
      print('Existing .env backed up.', COLORS.green);
    } else {
      return;
    }
  }
  
  // Copy .env.example to .env
  try {
    await fs.copyFile(envExamplePath, envPath);
    print('Created .env file from template.', COLORS.green);
  } catch (error) {
    print('Error creating .env file: ' + error.message, COLORS.red);
    return;
  }
  
  // Configure Drupal connection
  if (await confirm('\nDo you want to configure Drupal connection now?')) {
    const config = {};
    
    config.DRUPAL_BASE_URL = await question('Drupal site URL (e.g., https://example.com): ');
    
    const authMethod = await question('\nAuthentication method (1: Basic Auth, 2: Token, 3: API Key): ');
    
    switch (authMethod) {
      case '1':
        config.DRUPAL_USERNAME = await question('Drupal username: ');
        config.DRUPAL_PASSWORD = await question('Drupal password: ');
        break;
      case '2':
        config.DRUPAL_TOKEN = await question('Bearer token: ');
        break;
      case '3':
        config.DRUPAL_API_KEY = await question('API key: ');
        break;
    }
    
    // Update .env file
    let envContent = await fs.readFile(envPath, 'utf-8');
    
    for (const [key, value] of Object.entries(config)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }
    
    await fs.writeFile(envPath, envContent);
    print('\n✅ Environment configuration saved.', COLORS.green);
  }
}

async function installDependencies() {
  print('\n📦 Installing Dependencies', COLORS.cyan);
  
  const commands = [
    { cmd: 'npm ci', desc: 'Installing production dependencies...' },
    { cmd: 'npm run build', desc: 'Building project...' }
  ];
  
  for (const { cmd, desc } of commands) {
    print(desc, COLORS.yellow);
    try {
      await execCommandWithOutput(cmd);
      print(`✅ ${desc.replace('...', '')} completed.`, COLORS.green);
    } catch (error) {
      print(`❌ Failed: ${error.message}`, COLORS.red);
      throw error;
    }
  }
}

async function configureClaudeDesktop() {
  print('\n🤖 Claude Desktop Configuration', COLORS.cyan);
  
  const configPath = await getClaudeConfigPath();
  const projectPath = process.cwd();
  
  print(`Config path: ${configPath}`, COLORS.blue);
  
  // Create config directory if it doesn't exist
  const configDir = path.dirname(configPath);
  await fs.mkdir(configDir, { recursive: true });
  
  // Read existing config or create new one
  let config = {};
  if (await fileExists(configPath)) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
      print('Found existing Claude configuration.', COLORS.yellow);
    } catch (error) {
      print('Error reading existing config, creating new one.', COLORS.yellow);
    }
  }
  
  // Ensure mcpServers object exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Configure MCP server
  const serverName = await question('\nServer name in Claude (default: drupal-god-mod): ') || 'drupal-god-mod';
  
  config.mcpServers[serverName] = {
    command: 'node',
    args: [path.join(projectPath, 'dist', 'index.js')],
    env: {}
  };
  
  // Add environment variables from .env if they exist
  const envPath = path.join(projectPath, '.env');
  if (await fileExists(envPath)) {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const envVars = envContent
      .split('\n')
      .filter(line => line.includes('=') && !line.startsWith('#'))
      .reduce((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        acc[key.trim()] = valueParts.join('=').trim();
        return acc;
      }, {});
    
    // Add Drupal-related env vars to Claude config
    const drupalVars = Object.keys(envVars).filter(key => key.startsWith('DRUPAL_'));
    if (drupalVars.length > 0 && await confirm('\nInclude Drupal configuration in Claude?')) {
      drupalVars.forEach(key => {
        config.mcpServers[serverName].env[key] = envVars[key];
      });
    }
  }
  
  // Write config
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  print('\n✅ Claude Desktop configuration saved.', COLORS.green);
  print('\nPlease restart Claude Desktop to load the new configuration.', COLORS.yellow);
}

async function createStartupScripts() {
  print('\n📜 Creating Startup Scripts', COLORS.cyan);
  
  // Create a simple start script
  const startScript = `#!/bin/bash
# MCP Drupal God Mod - Start Script

echo "🚀 Starting MCP Drupal God Mod..."

# Check if dist exists
if [ ! -d "dist" ]; then
  echo "📦 Building project..."
  npm run build
fi

# Start the server
echo "✨ Server ready!"
node dist/index.js
`;

  const scriptPath = path.join(process.cwd(), 'start.sh');
  await fs.writeFile(scriptPath, startScript);
  await fs.chmod(scriptPath, '755');
  
  print('✅ Created start.sh script', COLORS.green);
}

async function showCompletionMessage() {
  print('\n' + '═'.repeat(60), COLORS.green);
  print('🎉 Installation Complete!', COLORS.green + COLORS.bright);
  print('═'.repeat(60), COLORS.green);
  
  print('\nNext steps:', COLORS.cyan);
  print('1. Restart Claude Desktop', COLORS.yellow);
  print('2. In Claude, you should see the MCP server available', COLORS.yellow);
  print('3. Start using Drupal tools in your conversations!', COLORS.yellow);
  
  print('\nUseful commands:', COLORS.cyan);
  print('  npm start        - Start the MCP server manually', COLORS.blue);
  print('  npm test         - Run tests', COLORS.blue);
  print('  npm run dev      - Run in development mode', COLORS.blue);
  print('  ./start.sh       - Quick start script', COLORS.blue);
  
  print('\nDocumentation:', COLORS.cyan);
  print('  README.md        - General documentation', COLORS.blue);
  print('  API.md           - API reference', COLORS.blue);
  print('  CLAUDE.md        - Usage with Claude', COLORS.blue);
}

// Utility functions
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function execCommand(command) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { shell: true });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed: ${command}`));
      }
    });
  });
}

async function execCommandWithOutput(command) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { shell: true, stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command}`));
      }
    });
  });
}

function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

// Main installation flow
async function main() {
  try {
    printHeader();
    
    // Check prerequisites
    if (!await checkPrerequisites()) {
      print('\n❌ Prerequisites check failed. Please install required dependencies.', COLORS.red);
      process.exit(1);
    }
    
    print('\n✅ All prerequisites met!', COLORS.green);
    
    if (!await confirm('\nDo you want to continue with the installation?')) {
      print('Installation cancelled.', COLORS.yellow);
      process.exit(0);
    }
    
    // Run installation steps
    await setupEnvironment();
    await installDependencies();
    await createStartupScripts();
    
    if (await confirm('\nDo you want to configure Claude Desktop integration?')) {
      await configureClaudeDesktop();
    }
    
    await showCompletionMessage();
    
  } catch (error) {
    print('\n❌ Installation failed: ' + error.message, COLORS.red);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the installer
main();
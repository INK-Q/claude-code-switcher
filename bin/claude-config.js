#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

// Config file paths
const CONFIG_DIR = path.join(os.homedir(), '.claude-config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'configs.json');

// Default configurations
const DEFAULT_CONFIGS = {
  official: {
    ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
    ANTHROPIC_AUTH_TOKEN: 'YOUR_OFFICIAL_TOKEN_HERE',
    description: 'Official Anthropic API'
  },
  openai: {
    ANTHROPIC_BASE_URL: 'https://api.openai.com/v1',
    ANTHROPIC_AUTH_TOKEN: 'YOUR_OPENAI_TOKEN_HERE',
    description: 'OpenAI API (compatible)'
  },
  azure: {
    ANTHROPIC_BASE_URL: 'https://your-azure-openai.openai.azure.com',
    ANTHROPIC_AUTH_TOKEN: 'YOUR_AZURE_TOKEN_HERE',
    description: 'Azure OpenAI Service'
  },
  custom: {
    ANTHROPIC_BASE_URL: 'https://your-custom-endpoint.com',
    ANTHROPIC_AUTH_TOKEN: 'YOUR_CUSTOM_TOKEN_HERE',
    description: 'Custom API endpoint'
  },
  local: {
    ANTHROPIC_BASE_URL: 'http://localhost:8080',
    ANTHROPIC_AUTH_TOKEN: 'local_token_or_empty',
    description: 'Local development server'
  }
};

// Test API connectivity and measure latency
async function testConnectivity(url, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: '/',
      method: 'HEAD',
      timeout: timeout
    };
    
    const req = client.request(options, (res) => {
      const latency = Date.now() - startTime;
      req.destroy();
      resolve({
        success: true,
        latency: latency,
        status: res.statusCode,
        statusMessage: res.statusMessage
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
        latency: timeout
      });
    });
    
    req.on('error', (err) => {
      const latency = Date.now() - startTime;
      req.destroy();
      resolve({
        success: false,
        error: err.message,
        latency: latency
      });
    });
    
    req.end();
  });
}

// Test all configurations connectivity
async function testAllConfigs() {
  const configs = await loadConfigs();
  console.log(chalk.cyan('\n🌐 Testing API Connectivity...\n'));
  
  const results = [];
  
  for (const [name, config] of Object.entries(configs)) {
    process.stdout.write(chalk.gray(`Testing ${name}... `));
    
    const result = await testConnectivity(config.ANTHROPIC_BASE_URL, 3000);
    results.push({ name, config, ...result });
    
    if (result.success) {
      const latencyColor = result.latency < 200 ? 'green' : 
                          result.latency < 500 ? 'yellow' : 'red';
      console.log(chalk.green('✓') + ' ' + chalk[latencyColor](`${result.latency}ms`));
    } else {
      console.log(chalk.red('✗') + ' ' + chalk.red(result.error));
    }
  }
  
  console.log('');
  return results;
}

// Show connectivity test results
function showConnectivityResults(results) {
  console.log(chalk.cyan('📊 Connectivity Report:\n'));
  
  // Sort by success first, then by latency
  const sorted = results.sort((a, b) => {
    if (a.success && !b.success) return -1;
    if (!a.success && b.success) return 1;
    if (a.success && b.success) return a.latency - b.latency;
    return 0;
  });
  
  sorted.forEach((result, index) => {
    const rank = result.success ? `${index + 1}.` : '✗';
    const status = result.success ? chalk.green('Online') : chalk.red('Offline');
    const latency = result.success ? 
      (result.latency < 200 ? chalk.green(`${result.latency}ms`) :
       result.latency < 500 ? chalk.yellow(`${result.latency}ms`) :
       chalk.red(`${result.latency}ms`)) : 
      chalk.gray('N/A');
    
    console.log(chalk.white(`  ${rank.padEnd(3)} ${result.name.padEnd(12)} ${status.padEnd(15)} ${latency}`));
    console.log(chalk.gray(`      ${result.config.description}`));
    
    if (!result.success && result.error !== 'Timeout') {
      console.log(chalk.gray(`      Error: ${result.error}`));
    }
    console.log('');
  });
}

// Initialize config directory and file
async function initConfig() {
  try {
    await fs.ensureDir(CONFIG_DIR);
    
    if (!await fs.pathExists(CONFIG_FILE)) {
      await fs.writeJson(CONFIG_FILE, DEFAULT_CONFIGS, { spaces: 2 });
      console.log(chalk.green('✓ Config file created:'), CONFIG_FILE);
      console.log(chalk.yellow('⚠ Please edit the config file to add your actual tokens'));
    }
  } catch (error) {
    console.error(chalk.red('✗ Failed to initialize config:'), error.message);
    process.exit(1);
  }
}

// Load configurations
async function loadConfigs() {
  try {
    if (!await fs.pathExists(CONFIG_FILE)) {
      await initConfig();
    }
    return await fs.readJson(CONFIG_FILE);
  } catch (error) {
    console.error(chalk.red('✗ Failed to load config:'), error.message);
    process.exit(1);
  }
}

// Set environment variable (Windows)
function setWindowsEnvVar(name, value) {
  const { execSync } = require('child_process');
  try {
    // Set user-level environment variable
    execSync(`setx ${name} "${value}"`, { encoding: 'utf8' });
    // Set current process environment variable
    process.env[name] = value;
    return true;
  } catch (error) {
    console.error(chalk.red(`✗ Failed to set env var: ${name}`), error.message);
    return false;
  }
}

// Set environment variable (Unix/Linux/macOS)
function setUnixEnvVar(name, value) {
  const { execSync } = require('child_process');
  const shell = process.env.SHELL || '/bin/bash';
  const shellConfig = shell.includes('zsh') ? '~/.zshrc' : '~/.bashrc';
  
  try {
    // Set current process environment variable
    process.env[name] = value;
    
    // Add to shell config file
    const exportLine = `export ${name}="${value}"`;
    execSync(`echo '${exportLine}' >> ${shellConfig}`, { encoding: 'utf8' });
    
    console.log(chalk.yellow(`Added to ${shellConfig}, please reload terminal or run: source ${shellConfig}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`✗ Failed to set env var: ${name}`), error.message);
    return false;
  }
}

// Cross-platform set environment variable
function setEnvVar(name, value) {
  if (os.platform() === 'win32') {
    return setWindowsEnvVar(name, value);
  } else {
    return setUnixEnvVar(name, value);
  }
}

// Display temporary environment variable commands
function showTempCommands(baseUrl, token) {
  console.log(chalk.cyan('\n💡 To use immediately in current terminal:'));
  
  if (os.platform() === 'win32') {
    // Windows commands for different terminal types
    console.log(chalk.white('Command Prompt (CMD):'));
    console.log(chalk.yellow(`set ANTHROPIC_BASE_URL=${baseUrl}`));
    console.log(chalk.yellow(`set ANTHROPIC_AUTH_TOKEN=${token}`));
    
    console.log(chalk.white('\nPowerShell:'));
    console.log(chalk.yellow(`$env:ANTHROPIC_BASE_URL="${baseUrl}"`));
    console.log(chalk.yellow(`$env:ANTHROPIC_AUTH_TOKEN="${token}"`));
    
    console.log(chalk.white('\nGit Bash / WSL:'));
    console.log(chalk.yellow(`export ANTHROPIC_BASE_URL="${baseUrl}"`));
    console.log(chalk.yellow(`export ANTHROPIC_AUTH_TOKEN="${token}"`));
  } else {
    // Unix/Linux/macOS commands
    console.log(chalk.white('Bash/Zsh:'));
    console.log(chalk.yellow(`export ANTHROPIC_BASE_URL="${baseUrl}"`));
    console.log(chalk.yellow(`export ANTHROPIC_AUTH_TOKEN="${token}"`));
    
    console.log(chalk.white('\nFish:'));
    console.log(chalk.yellow(`set -x ANTHROPIC_BASE_URL "${baseUrl}"`));
    console.log(chalk.yellow(`set -x ANTHROPIC_AUTH_TOKEN "${token}"`));
  }
}

// Switch configuration
async function switchConfig(configName) {
  const configs = await loadConfigs();
  
  if (!configs[configName]) {
    console.error(chalk.red('✗ Configuration not found:'), configName);
    console.log(chalk.yellow('Available configs:'), Object.keys(configs).join(', '));
    return;
  }
  
  const config = configs[configName];
  console.log(chalk.blue(`\n🔄 Switching to config: ${configName}`));
  console.log(chalk.gray(`Description: ${config.description}`));
  
  const success1 = setEnvVar('ANTHROPIC_BASE_URL', config.ANTHROPIC_BASE_URL);
  const success2 = setEnvVar('ANTHROPIC_AUTH_TOKEN', config.ANTHROPIC_AUTH_TOKEN);
  
  if (success1 && success2) {
    console.log(chalk.green('✓ Configuration switched successfully!'));
    console.log(chalk.gray(`BASE_URL: ${config.ANTHROPIC_BASE_URL}`));
    console.log(chalk.gray(`TOKEN: ${config.ANTHROPIC_AUTH_TOKEN.substring(0, 20)}...`));
    
    // Show temporary commands for immediate use
    showTempCommands(config.ANTHROPIC_BASE_URL, config.ANTHROPIC_AUTH_TOKEN);
  } else {
    console.log(chalk.red('✗ Configuration switch partially failed'));
  }
}

// Show current configuration
function showCurrent() {
  console.log(chalk.cyan('\n📋 Current Environment Variables:'));
  console.log(chalk.white('ANTHROPIC_BASE_URL:'), chalk.green(process.env.ANTHROPIC_BASE_URL || 'Not set'));
  console.log(chalk.white('ANTHROPIC_AUTH_TOKEN:'), chalk.green(
    process.env.ANTHROPIC_AUTH_TOKEN ? 
    process.env.ANTHROPIC_AUTH_TOKEN.substring(0, 20) + '...' : 
    'Not set'
  ));
}

// List all configurations
async function listConfigs() {
  const configs = await loadConfigs();
  console.log(chalk.cyan('\n📁 Available Configurations:'));
  
  Object.entries(configs).forEach(([name, config]) => {
    console.log(chalk.green(`  ${name}`));
    console.log(chalk.gray(`    Description: ${config.description}`));
    console.log(chalk.gray(`    URL: ${config.ANTHROPIC_BASE_URL}`));
    console.log('');
  });
}

// Interactive configuration selection with connectivity test
async function interactiveSelect(skipTest = false) {
  let testResults = null;
  
  if (!skipTest) {
    // Ask user if they want to test connectivity
    const { shouldTest } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldTest',
        message: 'Test connectivity before selection?',
        default: true
      }
    ]);
    
    if (shouldTest) {
      testResults = await testAllConfigs();
      showConnectivityResults(testResults);
    }
  }
  
  const configs = await loadConfigs();
  let choices;
  
  if (testResults) {
    // Create choices with connectivity status
    choices = testResults.map((result) => {
      const statusIcon = result.success ? '🟢' : '🔴';
      const latencyText = result.success ? 
        ` (${result.latency}ms)` : 
        ` (${result.error})`;
      
      return {
        name: `${statusIcon} ${result.name} - ${result.config.description}${latencyText}`,
        value: result.name
      };
    });
  } else {
    // Create simple choices without connectivity status
    choices = Object.entries(configs).map(([name, config]) => ({
      name: `${name} - ${config.description}`,
      value: name
    }));
  }
  
  // Add separator and options
  choices.push(
    new inquirer.Separator(),
    {
      name: '🔄 Test connectivity',
      value: '__test__'
    },
    {
      name: '📝 Edit configuration file',
      value: '__edit__'
    }
  );
  
  const { selectedConfig } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedConfig',
      message: 'Select configuration to switch to:',
      choices: choices
    }
  ]);
  
  if (selectedConfig === '__test__') {
    return await interactiveSelect(false); // Force show test prompt
  } else if (selectedConfig === '__edit__') {
    await editConfig();
    return await interactiveSelect(skipTest); // Return to menu after editing
  } else {
    await switchConfig(selectedConfig);
  }
}

// Edit configuration file
async function editConfig() {
  const { spawn } = require('child_process');
  const editor = process.env.EDITOR || (os.platform() === 'win32' ? 'notepad' : 'nano');
  
  console.log(chalk.blue(`📝 Opening config file: ${CONFIG_FILE}`));
  
  const child = spawn(editor, [CONFIG_FILE], {
    stdio: 'inherit'
  });
  
  child.on('exit', () => {
    console.log(chalk.green('✓ Config file editing completed'));
  });
}

// Main program
async function main() {
  console.log(chalk.bold.cyan('\n🔧 Claude Code Configuration Switcher\n'));
  
  program
    .name('claude-config')
    .description('Claude Code environment variable configuration switcher')
    .version('1.1.0');
  
  program
    .argument('[config]', 'Configuration name to switch to')
    .option('-l, --list', 'List all available configurations')
    .option('-c, --current', 'Show current configuration')
    .option('-i, --interactive', 'Interactive configuration selection')
    .option('-e, --edit', 'Edit configuration file')
    .option('-t, --test', 'Test connectivity for all configurations')
    .option('--no-test', 'Skip connectivity test in interactive mode')
    .option('-q, --quick', 'Quick mode - skip connectivity test (alias for --no-test)')
    .action(async (config, options) => {
      await initConfig();
      
      if (options.list) {
        await listConfigs();
      } else if (options.current) {
        showCurrent();
      } else if (options.interactive) {
        const skipTest = options.noTest || options.quick;
        await interactiveSelect(skipTest);
      } else if (options.edit) {
        await editConfig();
      } else if (options.test) {
        const results = await testAllConfigs();
        showConnectivityResults(results);
      } else if (config) {
        await switchConfig(config);
      } else {
        // Default to interactive menu
        const skipTest = options.noTest || options.quick;
        await interactiveSelect(skipTest);
      }
    });
  
  program.parse();
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n✗ Uncaught exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n✗ Unhandled promise rejection:'), reason);
  process.exit(1);
});

// Start
main().catch(console.error);
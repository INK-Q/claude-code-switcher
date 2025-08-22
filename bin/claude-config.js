#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const clipboardy = require('clipboardy');

// Config file paths
const CONFIG_DIR = path.join(os.homedir(), '.claude-config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'configs.json');

// Claude Code global config paths
const CLAUDE_CODE_CONFIG_DIR = path.join(os.homedir(), '.claude');
const CLAUDE_CODE_SETTINGS_FILE = path.join(CLAUDE_CODE_CONFIG_DIR, 'settings.json');

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

// Load Claude Code configuration
async function loadClaudeCodeConfig() {
  try {
    if (!await fs.pathExists(CLAUDE_CODE_SETTINGS_FILE)) {
      return null;
    }
    return await fs.readJson(CLAUDE_CODE_SETTINGS_FILE);
  } catch (error) {
    console.error(chalk.red('✗ Failed to load Claude Code settings:'), error.message);
    return null;
  }
}

// Save Claude Code configuration
async function saveClaudeCodeConfig(config) {
  try {
    await fs.ensureDir(CLAUDE_CODE_CONFIG_DIR);
    await fs.writeJson(CLAUDE_CODE_SETTINGS_FILE, config, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(chalk.red('✗ Failed to save Claude Code settings:'), error.message);
    return false;
  }
}

// Update Claude Code environment variables
async function updateClaudeCodeConfig(baseUrl, authToken) {
  const claudeSettings = await loadClaudeCodeConfig();
  
  if (!claudeSettings) {
    console.log(chalk.yellow('⚠ Claude Code settings not found, creating new configuration...'));
    const newSettings = {
      env: {
        ANTHROPIC_BASE_URL: baseUrl,
        ANTHROPIC_AUTH_TOKEN: authToken,
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
        DISABLE_TELEMETRY: 1
      }
    };
    
    const saved = await saveClaudeCodeConfig(newSettings);
    if (saved) {
      console.log(chalk.green('✓ Claude Code settings created and updated'));
    }
    return saved;
  }
  
  // Update existing settings
  if (!claudeSettings.env) {
    claudeSettings.env = {};
  }
  
  claudeSettings.env.ANTHROPIC_BASE_URL = baseUrl;
  claudeSettings.env.ANTHROPIC_AUTH_TOKEN = authToken;
  
  // Add privacy/performance settings if not present
  if (!claudeSettings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    claudeSettings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = 1;
  }
  if (!claudeSettings.env.DISABLE_TELEMETRY) {
    claudeSettings.env.DISABLE_TELEMETRY = 1;
  }
  
  const saved = await saveClaudeCodeConfig(claudeSettings);
  if (saved) {
    console.log(chalk.green('✓ Claude Code global settings updated'));
    console.log(chalk.gray(`Settings file: ${CLAUDE_CODE_SETTINGS_FILE}`));
  }
  
  return saved;
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


// Clear environment variable (Windows)
function clearWindowsEnvVar(name) {
  const { execSync } = require('child_process');
  try {
    // Remove user-level environment variable using PowerShell (more reliable)
    const psCommand = `Remove-ItemProperty -Path 'HKCU:\\Environment' -Name '${name}' -ErrorAction SilentlyContinue`;
    execSync(`powershell -Command "${psCommand}"`, { encoding: 'utf8', stdio: 'pipe' });
    
    // Also try the old reg delete method as backup
    try {
      execSync(`powershell -Command "& {[Environment]::SetEnvironmentVariable('${name}', $null, 'User')}"`, 
               { encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
      // Ignore errors from backup method
    }
    
    // Clear current process environment variable
    delete process.env[name];
    
    // Broadcast environment change to notify other processes
    try {
      execSync(`powershell -Command "& {Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\"user32.dll\\", SetLastError = true, CharSet = CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult); }'; $HWND_BROADCAST = [IntPtr]0xffff; $WM_SETTINGCHANGE = 0x1a; $result = [UIntPtr]::Zero; [Win32]::SendMessageTimeout($HWND_BROADCAST, $WM_SETTINGCHANGE, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$result)}"`, 
               { encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
      // Broadcast might fail, but that's okay
    }
    
    return true;
  } catch (error) {
    // Clear current process environment variable anyway
    delete process.env[name];
    console.log(chalk.yellow(`⚠ Failed to remove ${name} from registry, but cleared from current session`));
    return true;
  }
}

// Clear environment variable (Unix/Linux/macOS) 
function clearUnixEnvVar(name) {
  const { execSync } = require('child_process');
  const shell = process.env.SHELL || '/bin/bash';
  const shellConfig = shell.includes('zsh') ? '~/.zshrc' : '~/.bashrc';
  
  try {
    // Clear current process environment variable
    delete process.env[name];
    
    // Remove from shell config file (remove export lines)
    const sedCommand = shell.includes('zsh') ? 
      `sed -i '' '/^export ${name}=/d' ~/.zshrc` :
      `sed -i '/^export ${name}=/d' ~/.bashrc`;
    
    execSync(sedCommand, { encoding: 'utf8', stdio: 'pipe' });
    
    console.log(chalk.yellow(`Removed from ${shellConfig}, please reload terminal or run: source ${shellConfig}`));
    return true;
  } catch (error) {
    // Clear current process environment variable anyway
    delete process.env[name];
    console.log(chalk.yellow(`Cleared from current session, manual cleanup may be needed for ${shellConfig}`));
    return true;
  }
}

// Cross-platform clear environment variable
function clearEnvVar(name) {
  if (os.platform() === 'win32') {
    return clearWindowsEnvVar(name);
  } else {
    return clearUnixEnvVar(name);
  }
}

// Clear both environment variables
function clearBothEnvVars() {
  const success1 = clearEnvVar('ANTHROPIC_BASE_URL');
  const success2 = clearEnvVar('ANTHROPIC_AUTH_TOKEN');
  
  if (success1 && success2) {
    console.log(chalk.green('✓ Environment variables cleared from system registry'));
    console.log(chalk.blue('ℹ Configuration will now be read from Claude Code settings.json'));
    
    if (os.platform() === 'win32') {
      console.log(chalk.yellow('⚠ Windows Note: New terminals will use the cleared values immediately.'));
      console.log(chalk.yellow('   Current terminal may still show old values until restarted.'));
    }
    
    return true;
  } else {
    console.log(chalk.yellow('⚠ Environment variable clearing partially failed'));
    return false;
  }
}

// Switch configuration
async function switchConfig(configName, options = {}) {
  const configs = await loadConfigs();
  
  if (!configs[configName]) {
    console.error(chalk.red('✗ Configuration not found:'), configName);
    console.log(chalk.yellow('Available configs:'), Object.keys(configs).join(', '));
    return;
  }
  
  const config = configs[configName];
  console.log(chalk.blue(`\n🔄 Switching to config: ${configName}`));
  console.log(chalk.gray(`Description: ${config.description}`));
  
  // Clear environment variables if requested
  if (options.clearEnv) {
    console.log(chalk.blue('🧹 Clearing system environment variables...'));
    clearBothEnvVars();
  }
  
  // Update Claude Code settings.json
  const success = await updateClaudeCodeConfig(config.ANTHROPIC_BASE_URL, config.ANTHROPIC_AUTH_TOKEN);
  
  if (success) {
    console.log(chalk.green('✓ Claude Code settings updated successfully!'));
    console.log(chalk.gray(`BASE_URL: ${config.ANTHROPIC_BASE_URL}`));
    console.log(chalk.gray(`AUTH_TOKEN: ${config.ANTHROPIC_AUTH_TOKEN.substring(0, 20)}...`));
    console.log(chalk.blue('ℹ Configuration applied to Claude Code settings.json'));
    
    if (options.clearEnv) {
      console.log(chalk.green('✓ Environment variables cleared - configuration will be read from settings.json'));
    }
  } else {
    console.log(chalk.red('✗ Failed to update Claude Code settings'));
  }
}

// Show current configuration
async function showCurrent() {
  const claudeSettings = await loadClaudeCodeConfig();
  console.log(chalk.cyan('\n🔧 Claude Code Configuration:'));
  
  if (claudeSettings && claudeSettings.env) {
    console.log(chalk.white('ANTHROPIC_BASE_URL:'), chalk.green(claudeSettings.env.ANTHROPIC_BASE_URL || 'Not set'));
    console.log(chalk.white('ANTHROPIC_AUTH_TOKEN:'), chalk.green(
      claudeSettings.env.ANTHROPIC_AUTH_TOKEN ? 
      claudeSettings.env.ANTHROPIC_AUTH_TOKEN.substring(0, 20) + '...' : 
      'Not set'
    ));
    
    if (claudeSettings.model) {
      console.log(chalk.white('Model:'), chalk.green(claudeSettings.model));
    }
    
    // Show privacy settings
    if (claudeSettings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
      console.log(chalk.white('Disable Nonessential Traffic:'), chalk.green('Yes'));
    }
    if (claudeSettings.env.DISABLE_TELEMETRY) {
      console.log(chalk.white('Disable Telemetry:'), chalk.green('Yes'));
    }
  } else {
    console.log(chalk.gray('No configuration found in Claude Code settings'));
  }
  
  console.log(chalk.gray(`\nSettings file: ${CLAUDE_CODE_SETTINGS_FILE}`));
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
    .version('1.2.0');
  
  program
    .argument('[config]', 'Configuration name to switch to')
    .option('-l, --list', 'List all available configurations')
    .option('-c, --current', 'Show current configuration')
    .option('-i, --interactive', 'Interactive configuration selection')
    .option('-e, --edit', 'Edit configuration file')
    .option('-t, --test', 'Test connectivity for all configurations')
    .option('--no-test', 'Skip connectivity test in interactive mode')
    .option('-q, --quick', 'Quick mode - skip connectivity test (alias for --no-test)')
    .option('--clear-env', 'Clear system environment variables to avoid override')
    .action(async (config, options) => {
      await initConfig();
      
      if (options.list) {
        await listConfigs();
      } else if (options.current) {
        await showCurrent();
      } else if (options.interactive) {
        const skipTest = options.noTest || options.quick;
        await interactiveSelect(skipTest);
      } else if (options.edit) {
        await editConfig();
      } else if (options.test) {
        const results = await testAllConfigs();
        showConnectivityResults(results);
      } else if (config) {
        await switchConfig(config, options);
      } else {
        // Default to interactive menu
        const skipTest = options.noTest || options.quick;
        await interactiveSelect(skipTest);
      }
    });
  
  // Add a separate command for clearing environment variables
  program
    .command('clear-env')
    .description('Clear system environment variables (ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN)')
    .action(async () => {
      console.log(chalk.bold.cyan('\n🧹 Clearing Environment Variables\n'));
      clearBothEnvVars();
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
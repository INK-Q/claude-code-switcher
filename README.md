# Claude Code Switcher

🚀 一个全局可用的 Node.js CLI 工具，用于快速切换 Claude Code 环境变量配置。

## ✨ 功能特性

- 🌍 **全局命令** - 一次安装，随处使用
- 🔄 **快速切换** - 支持多个 API 端点配置
- 💾 **持久保存** - 自动保存环境变量设置
- 🎨 **交互界面** - 美观的命令行交互体验
- 🔧 **跨平台** - 支持 Windows、macOS、Linux
- ⚡ **简短命令** - 支持 `cc` 快捷命令
- 🌐 **连通性测试** - 自动测试API端点连通性和延迟
- 📊 **性能排序** - 按响应速度智能排序配置

## 📦 安装

### 全局安装
```bash
# 克隆或下载项目后，在项目目录运行：
npm install
npm install -g .
```

### 一键安装脚本 (Unix/Linux/macOS)
```bash
chmod +x install.sh && ./install.sh
```

## 🚀 使用方法

### 基本用法
```bash
# 交互式选择配置（自动测试连通性）
cc

# 快捷命令，等同于 claude-config
claude-config

# 直接切换到指定配置
cc official
cc custom
```

### 命令选项
```bash
# 交互式选择 (默认，会询问是否测试连通性)
cc

# 快速模式 - 跳过连通性测试
cc --quick
cc -q

# 跳过连通性测试 (程序化使用)
cc --no-test

# 仅测试所有配置的连通性
cc --test
cc -t

# 列出所有配置
cc --list
cc -l

# 显示当前配置
cc --current
cc -c

# 编辑配置文件
cc --edit
cc -e

# 显示帮助
cc --help
cc -h
```

## 💡 临时环境变量命令

每次切换配置后，工具会显示适合当前系统的临时环境变量设置命令，让你无需重启终端即可立即使用：

### Windows 示例
```
🔄 Switching to config: custom
Description: Custom API endpoint
✓ Configuration switched successfully!

💡 To use immediately in current terminal:
Command Prompt (CMD):
set ANTHROPIC_BASE_URL=https://api.example.com
set ANTHROPIC_AUTH_TOKEN=your-token-here

PowerShell:
$env:ANTHROPIC_BASE_URL="https://api.example.com"
$env:ANTHROPIC_AUTH_TOKEN="your-token-here"

Git Bash / WSL:
export ANTHROPIC_BASE_URL="https://api.example.com"
export ANTHROPIC_AUTH_TOKEN="your-token-here"
```

### Unix/Linux/macOS 示例
```
💡 To use immediately in current terminal:
Bash/Zsh:
export ANTHROPIC_BASE_URL="https://api.example.com"
export ANTHROPIC_AUTH_TOKEN="your-token-here"

Fish:
set -x ANTHROPIC_BASE_URL "https://api.example.com"
set -x ANTHROPIC_AUTH_TOKEN "your-token-here"
```

## 🌐 连通性测试功能

### 可选自动测试
运行 `cc` 时，会询问是否要测试连通性（默认为是）：

```
🔧 Claude Code Configuration Switcher

? Test connectivity before selection? (Y/n) 
```

选择 "Yes" 后进行连通性测试：

```
🌐 Testing API Connectivity...

Testing official... ✓ 245ms
Testing custom... ✗ Timeout
Testing azure... ✓ 892ms

📊 Connectivity Report:

  1.  official     Online          245ms
      Official Anthropic API

  ✗   custom       Offline         N/A
      Custom API endpoint
      Error: Timeout

  2.  azure        Online          892ms  
      Azure OpenAI Service
```

### 快速模式
使用 `--quick` 或 `-q` 参数跳过连通性测试，直接显示配置列表：

```bash
# 快速模式，无连通性测试
cc --quick

# 或使用短参数
cc -q
```

输出示例：
```
🔧 Claude Code Configuration Switcher

? Select configuration to switch to:
❯ official - Official Anthropic API
  custom - Custom API endpoint  
  azure - Azure OpenAI Service
  ──────────────
  🔄 Test connectivity
  📝 Edit configuration file
```

### 手动测试连通性
在交互式菜单中，你可以选择 "🔄 Test connectivity" 来手动测试连通性。

### 智能排序
- 🟢 **在线服务** 按延迟从低到高排序
- 🔴 **离线服务** 显示在底部
- **延迟指标**：绿色(<200ms) / 黄色(<500ms) / 红色(>500ms)

### 交互式界面
选择菜单会显示实时状态和延迟：

```
? Select configuration to switch to:
❯ 🟢 official - Official Anthropic API (245ms)
  🟢 azure - Azure OpenAI Service (892ms)  
  🔴 custom - Custom API endpoint (Timeout)
  ──────────────
  🔄 Re-test connectivity
  📝 Edit configuration file
```

## 📁 配置文件

首次运行会在用户目录创建配置：
```
~/.claude-config/configs.json
```

默认包含以下配置：
- **official** - Anthropic 官方 API
- **openai** - OpenAI API 兼容
- **azure** - Azure OpenAI 服务  
- **custom** - 自定义端点
- **local** - 本地开发服务器

## ⚙️ 环境变量

管理以下环境变量：
- `ANTHROPIC_BASE_URL` - API 基础 URL
- `ANTHROPIC_AUTH_TOKEN` - 认证 Token

## 🔧 自定义配置

编辑 `~/.claude-config/configs.json`：

```json
{
  "my-config": {
    "ANTHROPIC_BASE_URL": "https://my-endpoint.com",
    "ANTHROPIC_AUTH_TOKEN": "your-token-here",
    "description": "我的自定义配置"
  }
}
```

## 🎯 快速开始示例

```bash
# 1. 安装 CLI 工具
npm install
npm install -g .

# 2. 首次运行（自动创建配置文件并测试连通性）
cc

# 3. 编辑配置文件添加真实 Token
cc -e

# 4. 重新测试连通性
cc -t

# 5. 切换到最优配置（基于延迟排序）
cc

# 6. 直接切换到指定配置
cc official

# 7. 查看当前设置
cc -c
```

## 🔧 配置文件管理

### 配置文件位置
```
~/.claude-config/configs.json
```

### 添加自定义配置
编辑配置文件：

```json
{
  "my-config": {
    "ANTHROPIC_BASE_URL": "https://my-endpoint.com",
    "ANTHROPIC_AUTH_TOKEN": "your-token-here", 
    "description": "我的自定义配置"
  },
  "backup-api": {
    "ANTHROPIC_BASE_URL": "https://backup.example.com",
    "ANTHROPIC_AUTH_TOKEN": "backup-token",
    "description": "备用API服务"
  }
}
```

### 默认配置模板
首次运行会创建包含以下模板的配置：
- **official** - Anthropic 官方 API
- **openai** - OpenAI API 兼容
- **azure** - Azure OpenAI 服务  
- **custom** - 自定义端点
- **local** - 本地开发服务器

## 📊 性能优化

### 连通性测试特性
- **并发测试** - 同时测试多个端点，提高速度
- **超时控制** - 3秒超时，避免长时间等待
- **智能缓存** - 可选择重新测试或使用缓存结果
- **详细报告** - 显示延迟、状态码、错误信息

### 推荐使用方式
1. **日常使用** - 直接运行 `cc`，选择延迟最低的配置
2. **故障排除** - 使用 `cc -t` 单独测试连通性
3. **配置管理** - 使用 `cc -e` 编辑和添加新配置
4. **快速切换** - 使用 `cc [配置名]` 直接切换

## ⚙️ 环境变量

管理以下环境变量：
- `ANTHROPIC_BASE_URL` - API 基础 URL
- `ANTHROPIC_AUTH_TOKEN` - 认证 Token

### 变量作用域
- **当前会话** - 立即生效
- **用户级持久** - 重启后依然有效（Windows: 注册表，Unix: shell配置文件）

## 🔍 故障排除

### npm 权限问题
```bash
# macOS/Linux
sudo npm install -g .

# Windows (以管理员身份运行)
npm install -g .
```

### 环境变量未生效
- **Windows**: 重启命令行或重新登录
- **macOS/Linux**: 运行 `source ~/.bashrc` 或 `source ~/.zshrc`

### 连通性测试失败
```bash
# 检查网络连接
ping api.anthropic.com

# 检查防火墙设置
# 确保允许 Node.js 访问网络

# 调试单个配置
cc -t
```

### 卸载
```bash
npm uninstall -g claude-config-cli
# 手动删除配置文件
rm -rf ~/.claude-config
```

## 📋 系统要求

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0
- **网络连接** - 用于连通性测试

## 🎨 使用截图

### 启动时的连通性测试
```
🔧 Claude Code Configuration Switcher

🌐 Testing API Connectivity...

Testing official... ✓ 245ms
Testing custom... ✗ Timeout  
Testing azure... ✓ 892ms

📊 Connectivity Report:

  1.  official     Online          245ms
      Official Anthropic API

  ✗   custom       Offline         N/A
      Custom API endpoint
      Error: Timeout

  2.  azure        Online          892ms
      Azure OpenAI Service
```

### 交互式选择界面
```
? Select configuration to switch to: (Use arrow keys)
❯ 🟢 official - Official Anthropic API (245ms)
  🟢 azure - Azure OpenAI Service (892ms)
  🔴 custom - Custom API endpoint (Timeout)
  ──────────────
  🔄 Re-test connectivity
  📝 Edit configuration file
```

### 配置切换成功
```
🔄 Switching to config: official
Description: Official Anthropic API
✓ Configuration switched successfully!
BASE_URL: https://api.anthropic.com
TOKEN: sk-ant-api03-xxx...
```

## 🔗 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/claude/docs)
- [Node.js 官网](https://nodejs.org/)
- [npm 包管理器](https://www.npmjs.com/)

## 📝 更新日志

### v1.2.0 - 临时命令和可选连通性测试
- 💡 新增临时环境变量命令显示
  - Windows支持：CMD、PowerShell、Git Bash/WSL
  - Unix/Linux支持：Bash/Zsh、Fish
  - 无需重启终端即可立即使用新配置
- ⚡ 可选连通性测试功能
  - 启动时询问是否测试连通性（默认：是）
  - 添加 `--quick/-q` 快速模式跳过测试
  - 添加 `--no-test` 程序化跳过测试
  - 菜单中可手动触发连通性测试
- 🎨 改善用户体验
  - 更灵活的连通性测试工作流
  - 更快的启动选项
  - 更好的终端类型检测

### v1.1.0 - 连通性测试功能
- ✨ 新增自动连通性测试
- 📊 添加延迟测量和性能排序
- 🎨 优化交互式界面显示
- 🔄 支持重新测试连通性
- 📝 集成配置文件编辑功能

### v1.0.0 - 基础功能
- 🌍 全局 CLI 工具
- 🔄 配置快速切换
- 💾 环境变量持久化
- 🎨 交互式命令行界面
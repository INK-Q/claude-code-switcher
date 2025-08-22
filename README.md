# Claude Code Switcher

🚀 一个简洁的 CLI 工具，用于快速切换 Claude Code 的 API 配置。

## ✨ 主要特性

- 🎯 **专注核心** - 直接管理 Claude Code 的 settings.json 文件
- 🔄 **快速切换** - 支持多个 API 端点配置
- 🧹 **环境清理** - 自动清理环境变量避免配置冲突
- 🔒 **隐私保护** - 自动禁用遥测和非必要流量
- 🎨 **交互界面** - 美观的命令行交互体验
- 🌐 **连通性测试** - 自动测试 API 端点连通性和延迟
- ⚡ **简短命令** - 支持 `cc` 快捷命令

## 📦 安装

### 全局安装
```bash
# 克隆或下载项目后，在项目目录运行：
npm install
npm install -g .
```

## 🚀 使用方法

### 基本用法
```bash
# 交互式选择配置
cc

# 直接切换到指定配置
cc your_config_name

# 清理环境变量并切换配置（推荐）
cc your_config_name --clear-env
```

### 命令选项
```bash
# 查看当前配置
cc --current
cc -c

# 列出所有可用配置
cc --list  
cc -l

# 测试所有配置的连通性
cc --test
cc -t

# 编辑配置文件
cc --edit
cc -e

# 清理系统环境变量
cc clear-env

# 快速模式（跳过连通性测试）
cc --quick
cc -q

# 显示帮助
cc --help
```

## 🔧 配置管理

### 配置文件位置
```
~/.claude-config/configs.json    # 您的API配置
~/.claude/settings.json          # Claude Code配置文件
```

### 添加自定义配置
编辑 `~/.claude-config/configs.json`：

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

## 🌐 连通性测试

### 自动测试功能
```bash
# 测试所有配置并显示延迟报告
cc --test

# 输出示例：
🌐 Testing API Connectivity...

Testing official... ✓ 245ms
Testing custom... ✗ Timeout
Testing backup... ✓ 892ms

📊 Connectivity Report:
  1.  official     Online          245ms
      Official Anthropic API
  
  ✗   custom       Offline         N/A  
      Custom API endpoint
      Error: Timeout
      
  2.  backup       Online          892ms
      Backup API Service
```

### 交互式选择
智能排序显示配置（按延迟排序）：
```
? Select configuration to switch to:
❯ 🟢 official - Official Anthropic API (245ms)
  🟢 backup - Backup API Service (892ms)
  🔴 custom - Custom API endpoint (Timeout)
  ──────────────
  🔄 Test connectivity
  📝 Edit configuration file
```

## 🔑 Claude Code 集成

### 配置格式
工具会在 `~/.claude/settings.json` 中创建以下格式的配置：

```json
{
  "model": "claude-sonnet-3-5",
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_AUTH_TOKEN": "your-token-here",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1,
    "DISABLE_TELEMETRY": 1
  }
}
```

### 环境变量优先级
Claude Code 读取配置的优先级：
1. **系统环境变量** (最高优先级)
2. **settings.json 中的 env 字段**

如果系统中存在 `ANTHROPIC_BASE_URL` 或 `ANTHROPIC_AUTH_TOKEN` 环境变量，它们会覆盖 settings.json 中的配置。

### 清理环境变量
```bash
# 清理系统环境变量，让 Claude Code 使用 settings.json
cc clear-env

# 或在切换配置时同时清理
cc your_config --clear-env
```

## 🎯 快速开始

```bash
# 1. 安装工具
npm install && npm install -g .

# 2. 首次运行（创建默认配置）
cc

# 3. 编辑配置文件，添加您的真实 token
cc --edit

# 4. 测试连通性
cc --test

# 5. 清理环境变量并切换到最优配置
cc your_config --clear-env

# 6. 验证配置已生效
cc --current
```

## 🔍 故障排除

### Claude Code 仍显示 "Missing API key"
```bash
# 检查是否有环境变量覆盖
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_AUTH_TOKEN

# 清理环境变量
cc clear-env

# 重新切换配置
cc your_config
```

### 配置不生效
```bash
# 检查 Claude Code 配置文件
cc --current

# 重启 Claude Code 应用
# 配置修改后需要重启 Claude Code 才能生效
```

### 连通性测试失败
```bash
# 检查网络连接
ping your-api-endpoint.com

# 检查配置文件中的 URL 和 token
cc --edit

# 单独测试连通性  
cc --test
```

## 📊 配置状态显示

```bash
# 查看当前配置状态
cc --current

# 输出示例：
🔧 Claude Code Configuration:
ANTHROPIC_BASE_URL: https://api.anthropic.com
ANTHROPIC_AUTH_TOKEN: sk-ant-api03-xxx...
Model: claude-sonnet-3-5
Disable Nonessential Traffic: Yes
Disable Telemetry: Yes

Settings file: /Users/username/.claude/settings.json
```

## 📝 更新日志

### v1.2.0 - 专注配置管理
- 🎯 简化功能：专注于 Claude Code settings.json 管理
- 🧹 新增环境变量清理功能，避免配置冲突  
- 🔒 自动配置隐私设置（禁用遥测和非必要流量）
- ✅ 使用正确的 Claude Code 配置格式 (env 字段 + ANTHROPIC_AUTH_TOKEN)
- 📦 移除复杂的环境变量设置功能
- 🎨 优化用户体验和命令行界面

### v1.1.0 - 连通性测试功能  
- ✨ 新增自动连通性测试
- 📊 添加延迟测量和性能排序
- 🎨 优化交互式界面显示

### v1.0.0 - 基础功能
- 🌍 全局 CLI 工具
- 🔄 配置快速切换  
- 🎨 交互式命令行界面

## 📋 系统要求

- **Node.js** >= 14.0.0
- **Claude Code** 应用
- **网络连接** - 用于连通性测试

## 🔗 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/claude/docs)
- [Anthropic API 文档](https://docs.anthropic.com/api)
- [Node.js 官网](https://nodejs.org/)

## 📄 许可证

MIT License
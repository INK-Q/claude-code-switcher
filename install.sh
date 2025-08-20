#!/bin/bash

echo "🚀 Claude Config CLI 安装脚本"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "请先安装 Node.js (>= 14.0.0): https://nodejs.org/"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 安装依赖
echo "📦 正在安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"
echo ""

# 全局安装
echo "🌍 正在全局安装 claude-config..."
npm install -g .

if [ $? -ne 0 ]; then
    echo "❌ 全局安装失败"
    echo "尝试使用 sudo: sudo npm install -g ."
    exit 1
fi

echo "✅ 全局安装完成!"
echo ""

# 测试安装
echo "🔍 测试安装..."
if command -v claude-config &> /dev/null; then
    echo "✅ claude-config 命令可用"
else
    echo "⚠️  claude-config 命令不可用，可能需要重新加载终端"
fi

if command -v cc &> /dev/null; then
    echo "✅ cc 快捷命令可用"
else
    echo "⚠️  cc 快捷命令不可用，可能需要重新加载终端"
fi

echo ""
echo "🎉 安装完成!"
echo ""
echo "使用方法:"
echo "  claude-config      # 交互式选择配置"
echo "  cc                 # 快捷命令"
echo "  cc --help          # 查看帮助"
echo ""
echo "首次使用请运行: cc"
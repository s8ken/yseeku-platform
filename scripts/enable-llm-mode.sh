#!/bin/bash

# Enable LLM Evaluation Mode Setup Script
# This script helps configure LLM-based trust evaluation

set -e

echo "=========================================="
echo "YSEUKU LLM Evaluation Mode Setup"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || touch .env
fi

# Prompt for Anthropic API key
echo "Step 1: Anthropic API Key"
echo "-------------------------"
echo "You need an Anthropic API key to enable LLM evaluation."
echo "Get one at: https://console.anthropic.com/"
echo ""
read -p "Enter your Anthropic API key: " ANTHROPIC_API_KEY

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Error: API key cannot be empty"
    exit 1
fi

# Prompt for model selection
echo ""
echo "Step 2: Model Selection"
echo "----------------------"
echo "Available models:"
echo "1. claude-3-5-sonnet-20241022 (Recommended - Best accuracy)"
echo "2. claude-3-haiku-20240307 (Faster, cheaper)"
echo ""
read -p "Select model (1 or 2, default: 1): " MODEL_CHOICE

case $MODEL_CHOICE in
    2)
        ANTHROPIC_MODEL="claude-3-haiku-20240307"
        ;;
    *)
        ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
        ;;
esac

# Prompt for fallback option
echo ""
echo "Step 3: Fallback Configuration"
echo "------------------------------"
echo "Enable fallback to heuristic mode if LLM fails?"
echo "Recommended: yes (for production reliability)"
echo ""
read -p "Enable fallback? (y/n, default: y): " FALLBACK_CHOICE

case $FALLBACK_CHOICE in
    n|N)
        LLM_FALLBACK="false"
        ;;
    *)
        LLM_FALLBACK="true"
        ;;
esac

# Update .env file
echo ""
echo "Step 4: Updating Configuration"
echo "------------------------------"

# Remove existing LLM configuration if present
sed -i '/USE_LLM_TRUST_EVALUATION/d' .env 2>/dev/null || true
sed -i '/ANTHROPIC_API_KEY/d' .env 2>/dev/null || true
sed -i '/ANTHROPIC_MODEL/d' .env 2>/dev/null || true
sed -i '/LLM_FALLBACK_TO_HEURISTIC/d' .env 2>/dev/null || true

# Add new configuration
cat >> .env << EOF

# LLM Evaluation Mode Configuration
USE_LLM_TRUST_EVALUATION=true
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ANTHROPIC_MODEL=$ANTHROPIC_MODEL
LLM_FALLBACK_TO_HEURISTIC=$LLM_FALLBACK
EOF

echo "✓ Configuration updated in .env"

# Verify configuration
echo ""
echo "Step 5: Verification"
echo "-------------------"
echo "Configuration summary:"
echo "  - LLM Mode: ENABLED"
echo "  - Model: $ANTHROPIC_MODEL"
echo "  - Fallback: $LLM_FALLBACK"
echo ""

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart your backend service"
echo "2. Check logs for 'Using LLM-based trust evaluation'"
echo "3. Test with a conversation"
echo "4. Verify trust receipts show 'evaluatedBy: llm'"
echo ""
echo "Documentation: docs/LLM_EVALUATION_MODE.md"
echo "=========================================="
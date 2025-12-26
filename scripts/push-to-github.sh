#!/bin/bash

# Push yseeku-platform to GitHub
# Run this script locally where you have GitHub authentication

echo "🚀 Pushing yseeku-platform to GitHub..."
echo ""

cd /home/user/yseeku-platform

# Check if remote exists
if git remote | grep -q origin; then
    echo "✅ Remote 'origin' already configured"
else
    echo "📌 Adding remote..."
    git remote add origin https://github.com/s8ken/yseeku-platform.git
fi

# Ensure we're on main branch
echo "📌 Setting branch to 'main'..."
git branch -M main

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Repository pushed to GitHub"
    echo ""
    echo "🔗 View at: https://github.com/s8ken/yseeku-platform"
    echo ""
    echo "Next steps:"
    echo "1. Add repository topics: typescript, monorepo, ai-governance"
    echo "2. Configure branch protection for 'main'"
    echo "3. Add deprecation notices to old repos"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. You have push access to github.com/s8ken/yseeku-platform"
    echo "2. Your GitHub credentials are configured"
    echo "3. Run: gh auth login (if using GitHub CLI)"
    echo "   OR: git config --global credential.helper store"
fi

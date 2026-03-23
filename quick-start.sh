#!/bin/bash

# jest-gen Quick Start Script
# This demonstrates how to use jest-gen with the deepwiki-open repository

set -e

echo "🧪 jest-gen Quick Start"
echo "======================="
echo ""

# Check if DeepWiki is running
echo "1️⃣  Checking if DeepWiki is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ DeepWiki is running at http://localhost:3000"
else
    echo "✗ DeepWiki is not running!"
    echo ""
    echo "To start DeepWiki, run in another terminal:"
    echo "  cd ../deepwiki-open"
    echo "  docker compose up -d"
    echo ""
    exit 1
fi

echo ""
echo "2️⃣  jest-gen is ready to use!"
echo ""
echo "Example use cases:"
echo ""
echo "  # Generate tests for a repository"
echo "  npx tsx src/cli.ts AsyncFuncAI deepwiki-open"
echo ""
echo "  # Test only specific files"
echo "  npx tsx src/cli.ts AsyncFuncAI deepwiki-open 'src/utils/**/*.ts'"
echo ""
echo "  # Dry run (preview without writing files)"
echo "  npx tsx src/cli.ts AsyncFuncAI deepwiki-open --dry-run"
echo ""
echo "  # Use a specific AI provider"
echo "  npx tsx src/cli.ts AsyncFuncAI deepwiki-open --provider openai --model gpt-4"
echo ""
echo "  # Get help"
echo "  npx tsx src/cli.ts --help"
echo ""
echo "For full documentation, see README.md"

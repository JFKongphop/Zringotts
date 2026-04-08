#!/bin/bash

# Clean up generated files in quickstart folder

echo "🧹 Cleaning up generated files in quickstart/..."
echo ""

cd quickstart

# Count files before
BEFORE=$(ls *.json *.wtns 2>/dev/null | wc -l)

if [ $BEFORE -eq 0 ]; then
    echo "✨ Already clean! No generated files found."
    exit 0
fi

echo "Found $BEFORE generated files:"
ls -lh *.json *.wtns 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# Prompt for confirmation
read -p "Delete these files? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 0
fi

# Delete files
rm -f *.json *.wtns

echo "✅ Deleted $BEFORE files"
echo "💡 Run 'node run.js' to regenerate them"
echo ""

# Show what's left
echo "📁 Source files remaining:"
ls -lh *.js *.md 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

#!/bin/bash
# Install browser testing skill for Claude Code in Replit
# Run: curl -s https://raw.githubusercontent.com/maizoro87/MCP-Debugger-Browserless/main/replit-skill/install.sh | bash

echo "Installing browser testing skill for Claude Code..."

# Create .claude/commands directory
mkdir -p .claude/commands

# Download the skill
curl -s https://raw.githubusercontent.com/maizoro87/MCP-Debugger-Browserless/main/replit-skill/.claude/commands/test-ui.md -o .claude/commands/test-ui.md

# Check if MCP_API_KEY hint should be added
if [ ! -f ".claude/settings.json" ]; then
  mkdir -p .claude
  echo '{
  "permissions": {
    "allow": ["Bash(curl*)"]
  }
}' > .claude/settings.json
fi

echo ""
echo "✅ Installed! Now add these to Replit Secrets:"
echo ""
echo "1. MCP_API_KEY (required):"
echo "   zkXEYbgh4kmgRXJzzhrTNFhyfup8eaXqpZ44WqXemWNMpzEwvUJJuFkHhMpfpfosoCF79KuwUy3RttfNno2vP2"
echo ""
echo "2. DEV_URL (your development URL):"
echo "   https://YOUR-PROJECT.YOUR-USERNAME.repl.co"
echo ""
echo "3. PROD_URL (your production URL):"
echo "   https://YOUR-PROJECT.replit.app"
echo ""
echo "Then use the skill:"
echo "  - Type: /test-ui"
echo "  - Or ask: 'test the dev UI' or 'test production'"
echo ""
echo "The skill will ask which environment to test if not specified."

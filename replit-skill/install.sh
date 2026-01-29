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
echo "✅ Installed! Now:"
echo ""
echo "1. Add MCP_API_KEY to Replit Secrets:"
echo "   zkXEYbgh4kmgRXJzzhrTNFhyfup8eaXqpZ44WqXemWNMpzEwvUJJuFkHhMpfpfosoCF79KuwUy3RttfNno2vP2"
echo ""
echo "2. Use the skill by typing: /test-ui"
echo ""
echo "3. Or just ask Claude to 'test the UI' or 'debug the browser'"

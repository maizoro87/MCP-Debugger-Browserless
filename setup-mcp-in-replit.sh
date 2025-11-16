#!/bin/bash
# Setup MCP-Debugger for Claude Code in Replit
# Run this in your sm-innovation-hub Replit project

echo "🔧 Setting up MCP-Debugger for Claude Code..."
echo ""

# Step 1: Create .claude directory
echo "📁 Creating .claude directory..."
mkdir -p .claude

# Step 2: Create MCP configuration
echo "⚙️  Creating MCP configuration..."
cat > .claude/mcp.json << 'EOF'
{
  "mcpServers": {
    "mcp-debugger": {
      "url": "https://mcp-debugger-online-production.up.railway.app/sse",
      "transport": "sse",
      "headers": {
        "X-API-Key": "zkXEYbgh4kmgRXJzzhrTNFhyfup8eaXqpZ44WqXemWNMpzEwvUJJuFkHhMpfpfosoCF79KuwUy3RttfNno2vP2"
      }
    }
  }
}
EOF

# Step 3: Download universal testing guide
echo "📚 Downloading universal testing guide..."
curl -s -o .claude/TESTING_GUIDE.md https://raw.githubusercontent.com/maizoro87/MCP-Debugger-Browserless/claude/verify-browserless-deployment-01Hbc3rwgrGDpUs6ujFxtWJR/MCP_TESTING_GUIDE_UNIVERSAL.md

# Step 4: Verify files
echo ""
echo "✅ Setup complete! Files created:"
echo ""

if [ -f .claude/mcp.json ]; then
  echo "  ✓ .claude/mcp.json (MCP server configuration)"
  echo "    Endpoint: https://mcp-debugger-online-production.up.railway.app/sse"
else
  echo "  ✗ .claude/mcp.json - FAILED TO CREATE"
fi

if [ -f .claude/TESTING_GUIDE.md ]; then
  FILE_SIZE=$(wc -c < .claude/TESTING_GUIDE.md)
  echo "  ✓ .claude/TESTING_GUIDE.md (${FILE_SIZE} bytes)"
else
  echo "  ✗ .claude/TESTING_GUIDE.md - FAILED TO DOWNLOAD"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ⚠️  RESTART CLAUDE CODE (this is critical!)"
echo "   - Exit Claude Code completely"
echo "   - Start a new Claude Code session"
echo ""
echo "2. Verify MCP connection by asking:"
echo "   \"List available MCP tools\""
echo ""
echo "3. Expected: 9 tools starting with 'mcp-debugger__'"
echo ""
echo "4. If tools don't appear:"
echo "   - Make sure you FULLY restarted Claude Code"
echo "   - Check .claude/mcp.json exists"
echo "   - Check for typos in the configuration"
echo ""
echo "5. Once connected, test with:"
echo "   \"Navigate to https://sm-innovation-hub.replit.app"
echo "    using mcp-debugger__debug_navigate and report"
echo "    the page title\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 For detailed testing patterns, ask Claude Code to:"
echo "   \"Read .claude/TESTING_GUIDE.md\""
echo ""

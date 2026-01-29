#!/bin/bash
# Simple browser debugger for Replit
# Usage: source debug.sh && test_url "https://your-app.repl.co"

SERVER="https://mcp-debugger-online-production.up.railway.app"

_call() {
  curl -s -X POST "$SERVER/mcp" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $MCP_API_KEY" \
    -d "$1"
}

# Navigate to URL and show console errors
test_url() {
  echo "Testing: $1"
  _call "{\"method\": \"navigate\", \"params\": {\"url\": \"$1\"}}"
  echo ""
  echo "Console errors:"
  _call '{"method": "get_console_messages", "params": {}}' | grep -o '"text":"[^"]*"' | head -5
}

# Get page structure
test_inspect() {
  _call '{"method": "inspect", "params": {"focus": "all"}}'
}

# Click something
test_click() {
  _call "{\"method\": \"interact\", \"params\": {\"action\": \"click\", \"selector\": \"$1\"}}"
}

# Type into field
test_type() {
  _call "{\"method\": \"interact\", \"params\": {\"action\": \"type\", \"selector\": \"$1\", \"value\": \"$2\"}}"
}

# Check if element visible
test_visible() {
  _call "{\"method\": \"verify\", \"params\": {\"checks\": [{\"type\": \"element_visible\", \"selector\": \"$1\"}]}}"
}

# Get console messages
test_console() {
  _call '{"method": "get_console_messages", "params": {}}'
}

# Get network requests
test_network() {
  _call '{"method": "get_network_requests", "params": {}}'
}

echo "Browser debugger loaded. Commands: test_url, test_inspect, test_click, test_type, test_visible, test_console, test_network"

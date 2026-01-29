#!/bin/bash
# =============================================================================
# MCP-Debugger Helper Script for Claude Code in Replit
# =============================================================================
# Usage: Copy this script to your Replit project and source it
#        source ./replit-debug-helper.sh
#
# Then Claude Code can use these functions:
#        debug_url "https://your-app.repl.co"
#        debug_screenshot
#        debug_console
#        debug_network
#        debug_test "login-test.json"
# =============================================================================

# Configuration - Set these in Replit Secrets or here
export MCP_SERVER="${MCP_SERVER:-https://mcp-debugger-online-production.up.railway.app}"
export MCP_API_KEY="${MCP_API_KEY:-YOUR_API_KEY_HERE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Helper function for API calls
# -----------------------------------------------------------------------------
_mcp_call() {
    local method="$1"
    local params="$2"

    curl -s -X POST "${MCP_SERVER}/mcp" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: ${MCP_API_KEY}" \
        -d "{\"method\": \"${method}\", \"params\": ${params}}"
}

# -----------------------------------------------------------------------------
# Navigate to a URL and get page info
# -----------------------------------------------------------------------------
debug_url() {
    local url="$1"
    if [ -z "$url" ]; then
        echo -e "${RED}Usage: debug_url <url>${NC}"
        return 1
    fi

    echo -e "${YELLOW}Navigating to: ${url}${NC}"
    _mcp_call "navigate" "{\"url\": \"${url}\"}" | python3 -m json.tool 2>/dev/null || cat
}

# -----------------------------------------------------------------------------
# Take a screenshot (returns base64 - pipe to file or view URL)
# -----------------------------------------------------------------------------
debug_screenshot() {
    local url="$1"
    local params="{\"fullPage\": true}"

    if [ -n "$url" ]; then
        params="{\"url\": \"${url}\", \"fullPage\": true}"
        echo -e "${YELLOW}Taking screenshot of: ${url}${NC}"
    else
        echo -e "${YELLOW}Taking screenshot of current page${NC}"
    fi

    local result=$(_mcp_call "screenshot" "$params")

    # Extract just the metadata (not the huge base64)
    echo "$result" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(json.dumps({
    'success': data.get('success'),
    'url': data.get('url'),
    'title': data.get('title'),
    'screenshot_length': len(data.get('screenshot', '')),
    'timestamp': data.get('timestamp')
}, indent=2))
" 2>/dev/null || echo "$result"
}

# -----------------------------------------------------------------------------
# Save screenshot to file
# -----------------------------------------------------------------------------
debug_screenshot_save() {
    local filename="${1:-screenshot.png}"
    local url="$2"
    local params="{\"fullPage\": true}"

    if [ -n "$url" ]; then
        params="{\"url\": \"${url}\", \"fullPage\": true}"
    fi

    echo -e "${YELLOW}Saving screenshot to: ${filename}${NC}"

    _mcp_call "screenshot" "$params" | python3 -c "
import sys, json, base64
data = json.load(sys.stdin)
if data.get('success') and data.get('screenshot'):
    with open('${filename}', 'wb') as f:
        f.write(base64.b64decode(data['screenshot']))
    print('Screenshot saved to ${filename}')
else:
    print('Error:', data.get('error', 'Unknown error'))
"
}

# -----------------------------------------------------------------------------
# Get console messages (errors, warnings, logs)
# -----------------------------------------------------------------------------
debug_console() {
    echo -e "${YELLOW}Fetching console messages...${NC}"
    _mcp_call "get_console_messages" "{}" | python3 -m json.tool 2>/dev/null || cat
}

# -----------------------------------------------------------------------------
# Get network requests
# -----------------------------------------------------------------------------
debug_network() {
    echo -e "${YELLOW}Fetching network requests...${NC}"
    _mcp_call "get_network_requests" "{}" | python3 -m json.tool 2>/dev/null || cat
}

# -----------------------------------------------------------------------------
# Clear console/network logs
# -----------------------------------------------------------------------------
debug_clear() {
    echo -e "${YELLOW}Clearing logs...${NC}"
    _mcp_call "clear_console_messages" "{}" > /dev/null
    _mcp_call "clear_network_requests" "{}" > /dev/null
    echo -e "${GREEN}Console and network logs cleared${NC}"
}

# -----------------------------------------------------------------------------
# Run a multi-step test
# Usage: debug_test '{"url": "...", "steps": [...]}'
#    or: debug_test test-file.json
# -----------------------------------------------------------------------------
debug_test() {
    local input="$1"

    if [ -z "$input" ]; then
        echo -e "${RED}Usage: debug_test '<json>' or debug_test <file.json>${NC}"
        echo ""
        echo "Example JSON:"
        echo '{
  "url": "https://your-app.repl.co",
  "steps": [
    {"action": "type", "selector": "#email", "text": "test@example.com"},
    {"action": "type", "selector": "#password", "text": "password123"},
    {"action": "click", "selector": "#login-button"},
    {"action": "wait", "duration": 2000},
    {"action": "is_visible", "selector": ".dashboard"}
  ]
}'
        return 1
    fi

    # Check if it's a file
    if [ -f "$input" ]; then
        input=$(cat "$input")
    fi

    echo -e "${YELLOW}Running multi-step test...${NC}"

    # Parse and send
    local url=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))")
    local steps=$(echo "$input" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin).get('steps',[])))")

    _mcp_call "multi_step_test" "{\"url\": \"${url}\", \"steps\": ${steps}}" | python3 -m json.tool 2>/dev/null || cat
}

# -----------------------------------------------------------------------------
# AI-powered screenshot analysis (requires Gemini API key)
# -----------------------------------------------------------------------------
debug_analyze() {
    local url="$1"
    local prompt="${2:-Analyze this page for bugs, UI issues, or accessibility problems}"

    if [ -z "$url" ]; then
        echo -e "${RED}Usage: debug_analyze <url> [prompt]${NC}"
        return 1
    fi

    echo -e "${YELLOW}Analyzing: ${url}${NC}"
    echo -e "${YELLOW}Prompt: ${prompt}${NC}"

    _mcp_call "analyze_screenshot" "{\"url\": \"${url}\", \"prompt\": \"${prompt}\"}" | python3 -m json.tool 2>/dev/null || cat
}

# -----------------------------------------------------------------------------
# Quick health check
# -----------------------------------------------------------------------------
debug_health() {
    echo -e "${YELLOW}Checking MCP-Debugger health...${NC}"
    curl -s "${MCP_SERVER}/health" | python3 -m json.tool 2>/dev/null || echo -e "${RED}Server not responding${NC}"
}

# -----------------------------------------------------------------------------
# Show available commands
# -----------------------------------------------------------------------------
debug_help() {
    echo -e "${GREEN}MCP-Debugger Helper Commands${NC}"
    echo ""
    echo "  debug_health                     - Check if server is running"
    echo "  debug_url <url>                  - Navigate to URL"
    echo "  debug_screenshot [url]           - Take screenshot (shows metadata)"
    echo "  debug_screenshot_save <file> [url] - Save screenshot to file"
    echo "  debug_console                    - Get console messages"
    echo "  debug_network                    - Get network requests"
    echo "  debug_clear                      - Clear console/network logs"
    echo "  debug_test '<json>'              - Run multi-step test"
    echo "  debug_test <file.json>           - Run test from JSON file"
    echo "  debug_analyze <url> [prompt]     - AI analysis of page"
    echo ""
    echo "Configuration:"
    echo "  MCP_SERVER=${MCP_SERVER}"
    echo "  MCP_API_KEY=${MCP_API_KEY:0:10}..."
}

# Show help on load
echo -e "${GREEN}MCP-Debugger Helper loaded!${NC} Type ${YELLOW}debug_help${NC} for commands."

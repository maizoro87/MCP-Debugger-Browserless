#!/bin/bash
# Test script for MCP-Debugger-Browserless deployment
# Usage: ./test-deployment.sh <your-api-key>

set -e

# Configuration
RAILWAY_URL="https://mcp-debugger-online-production.up.railway.app"
API_KEY="${1:-}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "MCP-Debugger-Browserless Deployment Test"
echo "=========================================="
echo ""

# Test 1: Health Check (Public)
echo -e "${YELLOW}Test 1: Health Check (should be public)${NC}"
echo "GET $RAILWAY_URL/health"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RAILWAY_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$BODY" | jq '.'

    # Check for Firebase and Browserless status
    if echo "$BODY" | jq -e '.authenticated' > /dev/null; then
        AUTH_STATUS=$(echo "$BODY" | jq -r '.authenticated')
        echo "  - Authentication enabled: $AUTH_STATUS"
    fi
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    echo ""
    echo "This suggests Railway has access restrictions enabled."
    echo "Please check Railway dashboard → Settings → Private Networking"
    exit 1
fi
echo ""

# Test 2: MCP Info (Public)
echo -e "${YELLOW}Test 2: MCP Info Endpoint${NC}"
echo "GET $RAILWAY_URL/mcp/info"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$RAILWAY_URL/mcp/info")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ MCP info retrieved${NC}"
    echo "$BODY" | jq '{name, version, protocol, tools, capabilities}'
else
    echo -e "${RED}✗ MCP info failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Check if API key provided
if [ -z "$API_KEY" ]; then
    echo -e "${YELLOW}Skipping authenticated tests (no API key provided)${NC}"
    echo "Usage: $0 <your-api-key>"
    exit 0
fi

echo "Using API Key: ${API_KEY:0:10}..."
echo ""

# Test 3: Create Session and Navigate
echo -e "${YELLOW}Test 3: Create Session & Test Browserless Connection${NC}"
SESSION_ID="test-$(date +%s)"
echo "Creating session: $SESSION_ID"

PAYLOAD=$(cat <<EOF
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "debug_navigate",
    "arguments": {
      "url": "https://example.com"
    }
  }
}
EOF
)

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$RAILWAY_URL/mcp/message" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Navigation successful${NC}"
    echo "$BODY" | jq '.'

    # Check if response mentions Browserless
    if echo "$BODY" | grep -q "Browserless"; then
        echo -e "${GREEN}✓ Browserless connection confirmed${NC}"
    fi
else
    echo -e "${RED}✗ Navigation failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 4: Screenshot with Firebase Upload
echo -e "${YELLOW}Test 4: Screenshot → Firebase Storage Upload${NC}"
echo "Taking screenshot and uploading to Firebase..."

PAYLOAD=$(cat <<EOF
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "debug_screenshot",
    "arguments": {}
  }
}
EOF
)

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$RAILWAY_URL/mcp/message" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Screenshot taken${NC}"

    # Check for Firebase URL
    if echo "$BODY" | grep -q "storage.googleapis.com"; then
        SCREENSHOT_URL=$(echo "$BODY" | jq -r '.result.content[] | select(.type=="text") | .text' | grep -oP 'https://storage.googleapis.com[^"]*' | head -1)
        echo -e "${GREEN}✓ Screenshot uploaded to Firebase!${NC}"
        echo "  URL: $SCREENSHOT_URL"

        # Verify URL is accessible
        if curl -s --head "$SCREENSHOT_URL" | grep "200 OK" > /dev/null; then
            echo -e "${GREEN}✓ Screenshot URL is publicly accessible${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Screenshot taken but might be using base64 (not Firebase)${NC}"
        echo "$BODY" | jq -r '.result.content[] | select(.type=="text") | .text' | head -c 200
    fi
else
    echo -e "${RED}✗ Screenshot failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 5: Get Session Stats
echo -e "${YELLOW}Test 5: Check Session Statistics${NC}"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X GET "$RAILWAY_URL/stats" \
  -H "X-API-Key: $API_KEY")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Stats retrieved${NC}"
    echo "$BODY" | jq '{
      mcp_connections: .mcp.activeConnections,
      active_sessions: .sessions.activeSessions,
      total_sessions: .sessions.totalSessions,
      tool_count: (.tools | length)
    }'
else
    echo -e "${RED}✗ Stats failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}Testing Complete!${NC}"
echo "=========================================="
echo ""
echo "Expected behavior when fully configured:"
echo "  ✓ Health endpoint accessible without auth"
echo "  ✓ Browserless connection established"
echo "  ✓ Firebase Storage receiving screenshots"
echo "  ✓ Screenshots available via public URLs"
echo "  ✓ 9 debug tools registered"
echo ""
echo "Next steps:"
echo "  1. Check Railway logs for Browserless connection messages"
echo "  2. Verify Firebase uploads in Firebase Console"
echo "  3. Test session replay feature on Browserless.io"

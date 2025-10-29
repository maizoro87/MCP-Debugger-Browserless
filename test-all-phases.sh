#!/bin/bash

# Comprehensive MCP Debugger Test Suite (Phases 1-5)
# Tests all features on Railway production deployment

BASE_URL="https://mcp-debugger-production.up.railway.app"
TEST_PAGE="https://example.com"

echo "=========================================="
echo "MCP DEBUGGER COMPREHENSIVE TEST SUITE"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

# Test function
test_endpoint() {
    local test_name="$1"
    local expected="$2"
    local response="$3"

    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        ((pass_count++))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        echo "  Expected: $expected"
        echo "  Got: $response"
        ((fail_count++))
    fi
}

# PHASE 0: Health Check
echo -e "${YELLOW}PHASE 0: Health Check${NC}"
echo "=========================================="
response=$(curl -s "$BASE_URL/health")
test_endpoint "Health endpoint" '"status":"ok"' "$response"
echo ""

# PHASE 1: Console & Network Monitoring
echo -e "${YELLOW}PHASE 1: Console & Network Monitoring${NC}"
echo "=========================================="

# Navigate to test page
echo "Navigating to $TEST_PAGE..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{\"method\":\"navigate\",\"params\":{\"url\":\"$TEST_PAGE\"}}")
test_endpoint "Navigate" '"success":true' "$response"

# Get network requests
echo "Fetching network requests..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"get_network_requests","params":{}}')
test_endpoint "Get network requests" '"success":true' "$response"
test_endpoint "Network requests captured" '"count":' "$response"

# Get console messages
echo "Fetching console messages..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"get_console_messages","params":{}}')
test_endpoint "Get console messages" '"success":true' "$response"

# Clear monitoring data
echo "Clearing console messages..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"clear_console_messages","params":{}}')
test_endpoint "Clear console messages" '"success":true' "$response"

echo "Clearing network requests..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"clear_network_requests","params":{}}')
test_endpoint "Clear network requests" '"success":true' "$response"
echo ""

# PHASE 2: Network Interception & Mocking
echo -e "${YELLOW}PHASE 2: Network Interception & Mocking${NC}"
echo "=========================================="

# Mock API response
echo "Setting up API mock..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"mock_api_response","params":{"url":"https://api.example.com/test","mockData":{"test":"data"},"status":200}}')
test_endpoint "Mock API response" '"success":true' "$response"

# Block resources
echo "Setting up resource blocking..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"block_resources","params":{"resourceTypes":["image","font"]}}')
test_endpoint "Block resources" '"success":true' "$response"
echo ""

# PHASE 3: Cookie & Storage Management
echo -e "${YELLOW}PHASE 3: Cookie & Storage Management${NC}"
echo "=========================================="

# Set cookie
echo "Setting test cookie..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"set_cookie","params":{"cookie":{"name":"test_cookie","value":"test_value","domain":"example.com","path":"/"}}}')
test_endpoint "Set cookie" '"success":true' "$response"

# Get cookies
echo "Getting cookies..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"get_cookies","params":{}}')
test_endpoint "Get cookies" '"success":true' "$response"

# Set localStorage
echo "Setting localStorage..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"set_local_storage","params":{"key":"test_key","value":"test_value"}}')
test_endpoint "Set localStorage" '"success":true' "$response"

# Get localStorage
echo "Getting localStorage..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method":"get_local_storage","params":{"key":"test_key"}}')
test_endpoint "Get localStorage" '"success":true' "$response"
echo ""

# PHASE 4: Multi-step Test
echo -e "${YELLOW}PHASE 4: Multi-step Test${NC}"
echo "=========================================="

echo "Running multi-step test sequence..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\":\"multi_step_test\",
    \"params\":{
      \"url\":\"$TEST_PAGE\",
      \"steps\":[
        {\"action\":\"wait\",\"duration\":1000},
        {\"action\":\"is_visible\",\"selector\":\"h1\"},
        {\"action\":\"dom_state\"},
        {\"action\":\"evaluate\",\"script\":\"document.title\"}
      ]
    }
  }")
test_endpoint "Multi-step test" '"success":true' "$response"
test_endpoint "All steps completed" '"completedSteps":4' "$response"
echo ""

# PHASE 5: Gemini Vision Analysis
echo -e "${YELLOW}PHASE 5: Gemini Vision Analysis${NC}"
echo "=========================================="

echo "Testing Gemini 2.5 Flash screenshot analysis..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\":\"analyze_screenshot\",
    \"params\":{
      \"url\":\"$TEST_PAGE\",
      \"prompt\":\"What is the main heading on this page? Answer in one sentence.\",
      \"fullPage\":false
    }
  }" | head -c 500)
test_endpoint "Gemini Vision analysis" '"success":true' "$response"
test_endpoint "Analysis contains result" '"analysis":' "$response"

echo ""
echo "Testing analyze_image endpoint..."
# Create a small test image (1x1 red pixel PNG in base64)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\":\"analyze_image\",
    \"params\":{
      \"imageBase64\":\"$TEST_IMAGE\",
      \"prompt\":\"What color is this image?\"
    }
  }" | head -c 500)
test_endpoint "Analyze image" '"success":true' "$response"
echo ""

# PHASE 6: Advanced Features
echo -e "${YELLOW}PHASE 6: Advanced Features${NC}"
echo "=========================================="

# Screenshot with full page
echo "Taking full-page screenshot..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{\"method\":\"screenshot\",\"params\":{\"url\":\"$TEST_PAGE\",\"fullPage\":true}}" | head -c 200)
test_endpoint "Screenshot" '"success":true' "$response"

# Get page content
echo "Getting page content..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{\"method\":\"get_content\",\"params\":{\"url\":\"$TEST_PAGE\"}}" | head -c 200)
test_endpoint "Get content" '"success":true' "$response"
test_endpoint "Content has HTML" '"html":' "$response"

# Evaluate JavaScript
echo "Evaluating JavaScript..."
response=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{\"method\":\"evaluate\",\"params\":{\"url\":\"$TEST_PAGE\",\"script\":\"document.title\"}}")
test_endpoint "Evaluate script" '"success":true' "$response"
test_endpoint "Script returned result" '"result":' "$response"

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "MCP Debugger is fully operational with:"
    echo "  • Phase 1: Console & Network Monitoring ✓"
    echo "  • Phase 2: Network Interception & Mocking ✓"
    echo "  • Phase 3: Cookie & Storage Management ✓"
    echo "  • Phase 4: Multi-step Testing ✓"
    echo "  • Phase 5: Gemini 2.5 Flash Vision ✓"
    echo ""
    echo "Production URL: $BASE_URL"
    echo "Total Endpoints: 21 (19 automation + 2 AI vision)"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Please review the failures above."
    exit 1
fi

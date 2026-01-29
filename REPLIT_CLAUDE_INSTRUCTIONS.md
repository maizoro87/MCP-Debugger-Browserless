# Claude Code Browser Debugging in Replit

When working in Replit and you need to visually debug a web app, use the MCP-Debugger API.

## Server Details
- **URL**: https://mcp-debugger-online-production.up.railway.app
- **API Key**: Set in Replit Secrets as `MCP_API_KEY`

## How to Debug

### 🚀 FASTEST: One command to debug everything
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "full_debug", "params": {"url": "https://your-app.repl.co"}}'
```
This returns: navigation status, JS errors, failed network requests, page structure, AI vision analysis, and a summary verdict. **Start here.**

---

### Individual commands (if you need to dig deeper):

### 1. Navigate to a page and check for errors
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "navigate", "params": {"url": "https://your-app.repl.co"}}'
```

### 2. Get console errors (after navigating)
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "get_console_messages", "params": {}}'
```

### 3. Get network requests (check for failed API calls)
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "get_network_requests", "params": {}}'
```

### 4. Take a screenshot (save to file)
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "screenshot", "params": {"url": "https://your-app.repl.co", "fullPage": true}}' \
  | python3 -c "import sys,json,base64; d=json.load(sys.stdin); open('screenshot.png','wb').write(base64.b64decode(d['screenshot'])) if d.get('screenshot') else print(d)"
```

### 5. Run a multi-step test (login flow, form submission, etc.)
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{
    "method": "multi_step_test",
    "params": {
      "url": "https://your-app.repl.co/login",
      "steps": [
        {"action": "type", "selector": "#email", "text": "test@example.com"},
        {"action": "type", "selector": "#password", "text": "password123"},
        {"action": "click", "selector": "button[type=submit]"},
        {"action": "wait", "duration": 2000},
        {"action": "is_visible", "selector": ".dashboard"}
      ]
    }
  }'
```

### 6. AI-powered visual analysis (requires GEMINI_API_KEY on server)
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{
    "method": "analyze_screenshot",
    "params": {
      "url": "https://your-app.repl.co",
      "prompt": "Check for UI bugs, broken layouts, or accessibility issues"
    }
  }'
```

## Available Methods

| Method | Purpose |
|--------|---------|
| `full_debug` | **ONE COMMAND** - navigation + errors + network + page + AI vision |
| `navigate` | Go to URL, loads page |
| `screenshot` | Take PNG screenshot |
| `interact` | Click, type, select, hover, clear elements |
| `inspect` | Get page structure (forms, buttons, links, inputs) |
| `verify` | Check element visibility, text content, URL |
| `get_console_messages` | Get console.log/error output |
| `get_network_requests` | Get all HTTP requests/responses |
| `clear_console_messages` | Clear console buffer |
| `clear_network_requests` | Clear network buffer |
| `multi_step_test` | Run automated test flow |
| `analyze_screenshot` | AI analysis with Gemini |

### NEW: interact - Click, type, hover on elements
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{
    "method": "interact",
    "params": {
      "action": "click",
      "selector": "#submit-button"
    }
  }'

# Actions: click, type, select, hover, clear
# For type: {"action": "type", "selector": "#email", "value": "test@example.com"}
# For select: {"action": "select", "selector": "#country", "value": "USA"}
```

### NEW: inspect - Get page structure without screenshots
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{
    "method": "inspect",
    "params": {
      "focus": "all"
    }
  }'

# Focus options: all, forms, buttons, links, inputs
# Returns selectors you can use with interact!
```

### NEW: verify - Check page state (no screenshots needed)
```bash
curl -s -X POST "https://mcp-debugger-online-production.up.railway.app/mcp" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{
    "method": "verify",
    "params": {
      "checks": [
        {"type": "element_visible", "selector": ".success-message"},
        {"type": "url_contains", "value": "/dashboard"},
        {"type": "no_console_errors"}
      ]
    }
  }'

# Check types: element_visible, element_exists, text_contains, url_contains, no_console_errors
```

## Step Actions for multi_step_test

| Action | Parameters | Example |
|--------|------------|---------|
| `click` | selector | `{"action": "click", "selector": "#submit"}` |
| `type` | selector, text | `{"action": "type", "selector": "#email", "text": "test@test.com"}` |
| `wait` | duration (ms) | `{"action": "wait", "duration": 2000}` |
| `is_visible` | selector | `{"action": "is_visible", "selector": ".success-message"}` |
| `evaluate` | script | `{"action": "evaluate", "script": "document.title"}` |

## Tips

1. **Always navigate first** - Other methods need an active page
2. **Clear logs before tests** - Get clean console/network data
3. **Use is_visible** - Verify elements appeared after actions
4. **Check network for API failures** - Filter by status 4xx/5xx
5. **Screenshots show current state** - Take before and after actions

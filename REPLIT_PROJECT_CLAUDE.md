# Browser Testing Instructions

**IMPORTANT:** This project runs on Replit which cannot run headless browsers locally.
When you need to test the UI, check for visual bugs, or debug browser issues, use the remote debugger.

## Remote Browser Debugger

**Server:** `https://mcp-debugger-online-production.up.railway.app`
**API Key:** Use `$MCP_API_KEY` from Replit Secrets

## When to Use This

Use the browser debugger when:
- Testing if a page loads correctly
- Checking if elements are visible
- Testing form submissions or button clicks
- Looking for JavaScript errors
- Checking network requests (API calls)
- Debugging why something doesn't work in the browser

## Quick Commands

### 1. Test if a page loads and check for errors
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "navigate", "params": {"url": "YOUR_URL_HERE"}}'

# Then check console errors:
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "get_console_messages", "params": {}}'
```

### 2. Get all interactive elements (forms, buttons, inputs)
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "inspect", "params": {"focus": "all"}}'
```

### 3. Click a button or link
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "interact", "params": {"action": "click", "selector": "#button-id"}}'
```

### 4. Fill a form field
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "interact", "params": {"action": "type", "selector": "#email", "value": "test@example.com"}}'
```

### 5. Verify something works
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "verify", "params": {"checks": [
    {"type": "element_visible", "selector": ".success-message"},
    {"type": "no_console_errors"}
  ]}}'
```

### 6. Run a full test flow (login, navigate, verify)
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "multi_step_test", "params": {
    "url": "YOUR_LOGIN_URL",
    "steps": [
      {"action": "type", "selector": "#email", "text": "test@example.com"},
      {"action": "type", "selector": "#password", "text": "password123"},
      {"action": "click", "selector": "button[type=submit]"},
      {"action": "wait", "duration": 2000},
      {"action": "is_visible", "selector": ".dashboard"}
    ]
  }}'
```

### 7. Check network requests (API calls)
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "get_network_requests", "params": {}}'
```

## Available Methods

| Method | What it does |
|--------|--------------|
| `navigate` | Go to a URL |
| `inspect` | Get page structure (forms, buttons, links, inputs with selectors) |
| `interact` | Click, type, select, hover, clear elements |
| `verify` | Check if elements exist, are visible, contain text |
| `screenshot` | Take a screenshot (returns base64 PNG) |
| `get_console_messages` | Get JavaScript console output |
| `get_network_requests` | Get all HTTP requests the page made |
| `multi_step_test` | Run multiple actions in sequence |
| `analyze_screenshot` | AI analysis of the page (needs Gemini key) |

## Pro Tips

1. **Always navigate first** before other commands
2. **Use inspect** to find the right selectors before clicking/typing
3. **Check console messages** when something doesn't work
4. **Use verify** instead of screenshots when possible (faster, less tokens)
5. **Clear logs** before tests: `{"method": "clear_console_messages", "params": {}}`

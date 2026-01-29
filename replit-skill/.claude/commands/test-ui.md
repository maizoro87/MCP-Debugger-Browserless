# Browser UI Testing

Use this skill to test your web application's UI using a remote headless browser.

## Configuration

- **Server:** `https://mcp-debugger-online-production.up.railway.app`
- **API Key:** `$MCP_API_KEY` (must be set in Replit Secrets)

## Instructions

When the user asks to test the UI, debug the browser, check if something works visually, or verify the frontend:

1. **First, navigate to the URL:**
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "navigate", "params": {"url": "URL_HERE"}}'
```

2. **Check for JavaScript errors:**
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "get_console_messages", "params": {}}'
```

3. **Get page structure (find selectors for buttons, forms, inputs):**
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "inspect", "params": {"focus": "all"}}'
```

4. **Interact with elements:**
```bash
# Click
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "interact", "params": {"action": "click", "selector": "SELECTOR"}}'

# Type
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "interact", "params": {"action": "type", "selector": "SELECTOR", "value": "TEXT"}}'
```

5. **Verify results:**
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "verify", "params": {"checks": [
    {"type": "element_visible", "selector": "SELECTOR"},
    {"type": "url_contains", "value": "expected-path"},
    {"type": "no_console_errors"}
  ]}}'
```

6. **Check network requests (API calls):**
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "get_network_requests", "params": {}}'
```

## Available Methods

| Method | Purpose | Key Params |
|--------|---------|------------|
| `navigate` | Go to URL | `url` |
| `inspect` | Get page structure | `focus`: all/forms/buttons/links/inputs |
| `interact` | Click/type/select/hover | `action`, `selector`, `value` |
| `verify` | Check element states | `checks` array |
| `screenshot` | Take screenshot | `fullPage`: true/false |
| `get_console_messages` | JS console output | - |
| `get_network_requests` | HTTP requests | - |
| `multi_step_test` | Run test sequence | `url`, `steps` array |

## Workflow

1. Ask user for the URL to test (or use the app's URL)
2. Navigate and check for errors first
3. Use inspect to find selectors
4. Interact with elements as needed
5. Verify the expected outcome
6. Report results clearly

## Example Test Flow

```bash
# 1. Go to login page
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "navigate", "params": {"url": "https://myapp.repl.co/login"}}'

# 2. Find the form fields
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "inspect", "params": {"focus": "inputs"}}'

# 3. Fill email
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "interact", "params": {"action": "type", "selector": "#email", "value": "test@example.com"}}'

# 4. Fill password
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "interact", "params": {"action": "type", "selector": "#password", "value": "password123"}}'

# 5. Click submit
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "interact", "params": {"action": "click", "selector": "button[type=submit]"}}'

# 6. Verify login worked
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "verify", "params": {"checks": [{"type": "url_contains", "value": "/dashboard"}, {"type": "no_console_errors"}]}}'
```

## Important Notes

- Always run `navigate` first before other commands
- The browser session persists between calls (login stays active)
- Use `inspect` to find the right CSS selectors
- Check `get_console_messages` when debugging issues
- The `$MCP_API_KEY` must be set in Replit Secrets

# Browser UI Testing (with AI Vision)

Use this skill to test your web application's UI using a remote headless browser **with Gemini AI vision**.

## Configuration

- **Server:** `https://mcp-debugger-online-production.up.railway.app`
- **API Key:** `$MCP_API_KEY` (must be set in Replit Secrets)

## Dev vs Production URLs

**IMPORTANT:** Replit has two different URLs for your app:

| Environment | URL Pattern | When to Use |
|-------------|-------------|-------------|
| **Development** | `https://PROJECT.USERNAME.repl.co` | Testing unpublished changes |
| **Production** | `https://PROJECT.replit.app` | Testing deployed/live version |

**Before testing, ask the user:**
> "Should I test the **dev** version (unpublished changes) or the **production** version (deployed)?"

**Setting up URL environment variables in Replit Secrets:**
```
DEV_URL=https://your-project.your-username.repl.co
PROD_URL=https://your-project.replit.app
```

Then use `$DEV_URL` or `$PROD_URL` in commands instead of hardcoding.

**Quick check - which URL to use:**
- User says "test my changes" → Use DEV_URL
- User says "test production" or "test the live site" → Use PROD_URL
- User doesn't specify → ASK which one they want

## 🚀 ONE COMMAND TO DEBUG EVERYTHING (USE THIS FIRST!)

**The `full_debug` method does EVERYTHING in one call:**
- Navigates to URL
- Checks for JavaScript errors
- Checks for failed network requests
- Gets page structure (forms, buttons, inputs)
- Runs AI vision analysis
- Returns a complete debug report

```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "full_debug", "params": {"url": "URL_HERE"}}'
```

**With custom vision prompt:**
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "full_debug", "params": {"url": "URL_HERE", "vision_prompt": "Is the login form showing correctly?"}}'
```

**Response includes:**
- `navigation`: Did the page load?
- `console`: JavaScript errors (count + messages)
- `network`: Failed HTTP requests
- `page`: Element counts (forms, buttons, inputs, etc.)
- `vision`: AI analysis of what's on screen
- `summary`: Quick verdict - "PAGE LOOKS GOOD ✓" or "FOUND X ISSUE(S)"

**START HERE.** Only use individual commands if you need to dig deeper.

---

## 🔥 AI Vision Analysis (for deeper visual inspection)

**Use this for specific visual questions:**

```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "analyze_screenshot", "params": {"url": "URL_HERE", "prompt": "YOUR_QUESTION"}}'
```

**Example prompts:**
- "What elements are visible? Any layout issues?"
- "Is the login form displayed correctly?"
- "Are there any visual bugs or broken elements?"
- "Describe what you see and identify any problems"
- "Is the button visible and properly styled?"
- "Does the page look correct for a dashboard?"

This uses Gemini AI to analyze screenshots and tell you what it sees - giving you **actual visual feedback** even though you can't see the browser!

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
2. **USE AI VISION FIRST** - `analyze_screenshot` to see what's on the page
3. Check console errors if vision reports issues
4. Use inspect to find selectors for interaction
5. Interact with elements as needed
6. Use AI vision again to verify the visual result
7. Report results clearly

## When to Use AI Vision vs Programmatic Checks

**Use AI Vision (`analyze_screenshot`) when:**
- You need to see what the page actually looks like
- Checking layout, styling, visual bugs
- Verifying complex UI (dashboards, forms, etc.)
- User says "it doesn't look right" or "something's wrong"
- Debugging visual issues

**Use Programmatic Checks (`inspect`, `verify`) when:**
- You know exactly what element to check
- Checking if specific elements exist/are visible
- Running automated test flows
- Checking console/network for errors

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

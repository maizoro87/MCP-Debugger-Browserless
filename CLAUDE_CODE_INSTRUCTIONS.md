# MCP-Debugger - Instructions for Claude Code

**Version:** 3.0.0
**Protocol:** MCP 2024-11-05 over Server-Sent Events (SSE)
**Production URL:** https://mcp-debugger-production.up.railway.app

---

## 🎯 What is MCP-Debugger?

MCP-Debugger is a **remote browser automation service** that lets you debug web applications by interacting with them like a real user. It runs Playwright in a headless browser and exposes 8 powerful debugging tools through the Model Context Protocol (MCP).

**Key Benefits:**
- ✅ **No local browser needed** - Runs on Railway, accessible anywhere
- ✅ **Session persistence** - Login once, test multiple flows
- ✅ **Token optimized** - Returns summaries, not raw HTML (80-90% token savings)
- ✅ **Real user simulation** - Click, type, navigate just like a person would
- ✅ **AI-powered analysis** - Gemini Vision when you need visual inspection

---

## 🔌 Connection Information

### MCP Connection (Recommended)
```
Protocol: MCP 2024-11-05
Transport: Server-Sent Events (SSE)
SSE Endpoint: GET https://mcp-debugger-production.up.railway.app/sse
Message Endpoint: POST https://mcp-debugger-production.up.railway.app/mcp/message
Authentication: X-API-Key header
API Key: 352368f9afffa3387a76561a062458d09834a26f9140f8a5e9bc88a08b571cf1
```

### HTTP Connection (Legacy)
```
Endpoint: POST https://mcp-debugger-production.up.railway.app/mcp
Authentication: X-API-Key header
API Key: 352368f9afffa3387a76561a062458d09834a26f9140f8a5e9bc88a08b571cf1
Status: Maintained for backward compatibility
```

---

## 🛠️ Available Tools

You have access to **9 debugging tools**, optimized for efficiency:

### 1. **debug_navigate** - Smart Navigation
Navigate to a URL and get a page summary (NOT full HTML - saves tokens!)

**When to use:** Starting debugging, checking if a page loads

**Parameters:**
- `url` (required): URL to navigate to
- `waitForSelector` (optional): CSS selector to wait for
- `timeout` (optional): Navigation timeout in ms (default: 30000)

**Returns:** Page title, URL, element counts, console errors

**Example:**
```json
{
  "name": "debug_navigate",
  "arguments": {
    "url": "https://sm-innovation-hub.replit.app/admin/login",
    "waitForSelector": "#login-form"
  }
}
```

**Response format:**
```json
{
  "navigation": {
    "url": "https://...",
    "title": "Login Page",
    "status": "loaded"
  },
  "page": {
    "elements": {
      "total": 142,
      "buttons": 3,
      "inputs": 2,
      "forms": 1
    },
    "interactive": {
      "clickable": 8,
      "editable": 2
    }
  },
  "issues": {
    "consoleErrors": [],
    "errorCount": 0
  }
}
```

---

### 2. **debug_interact** - Element Interaction
Click, type, or interact with page elements efficiently.

**When to use:** Clicking buttons, filling forms, hovering elements

**Parameters:**
- `action` (required): "click", "type", "select", "hover", "clear"
- `selector` (required): CSS selector
- `value` (optional): Text to type or option to select
- `waitAfter` (optional): Wait time after action (default: 500ms)

**Returns:** Action result, URL changes, new errors

**Examples:**
```json
// Click a button
{
  "name": "debug_interact",
  "arguments": {
    "action": "click",
    "selector": "#submit-button"
  }
}

// Type in an input
{
  "name": "debug_interact",
  "arguments": {
    "action": "type",
    "selector": "input[type='email']",
    "value": "user@example.com"
  }
}
```

---

### 3. **debug_inspect** - Page Inspection
Get organized summaries of page elements (forms, buttons, links, inputs).

**When to use:** Understanding page structure, finding elements, analyzing forms

**Parameters:**
- `focus` (optional): "all", "forms", "buttons", "links", "inputs", "errors"
- `selector` (optional): Limit scope to this element

**Returns:** Structured element lists (NOT raw HTML!)

**Example:**
```json
{
  "name": "debug_inspect",
  "arguments": {
    "focus": "forms"
  }
}
```

**Response format:**
```json
{
  "inspection": {
    "forms": [
      {
        "index": 0,
        "action": "/api/login",
        "method": "post",
        "fields": [
          {
            "name": "email",
            "type": "email",
            "required": true
          },
          {
            "name": "password",
            "type": "password",
            "required": true
          }
        ]
      }
    ]
  }
}
```

---

### 4. **debug_test_flow** - Multi-Step Testing
Execute complete test flows in ONE call (login → navigate → test → verify).

**When to use:** Testing authenticated flows, complex user journeys

**Why it's important:** Session persists across ALL steps - login once, test everything!

**Parameters:**
- `startUrl` (required): Starting URL
- `steps` (required): Array of steps

**Step actions:** "navigate", "click", "type", "wait", "verify_visible", "verify_text", "verify_url"

**Returns:** Detailed results for each step, final state

**Example - Complete Login Flow:**
```json
{
  "name": "debug_test_flow",
  "arguments": {
    "startUrl": "https://sm-innovation-hub.replit.app/admin/login",
    "steps": [
      {
        "action": "type",
        "selector": "input[type='email']",
        "value": "test@admin.com"
      },
      {
        "action": "type",
        "selector": "input[type='password']",
        "value": "password123"
      },
      {
        "action": "click",
        "selector": "button[type='submit']"
      },
      {
        "action": "wait",
        "duration": 2000
      },
      {
        "action": "verify_url",
        "value": "/admin/dashboard"
      },
      {
        "action": "verify_visible",
        "selector": "#welcome-message"
      }
    ]
  }
}
```

---

### 5. **debug_verify** - State Verification
Check page state without taking screenshots (element visibility, text, URLs).

**When to use:** Verifying test results, checking conditions

**Parameters:**
- `checks` (required): Array of checks to perform

**Check types:** "element_visible", "element_exists", "text_contains", "url_contains", "no_console_errors"

**Returns:** Pass/fail for each check

**Example:**
```json
{
  "name": "debug_verify",
  "arguments": {
    "checks": [
      {
        "type": "element_visible",
        "selector": "#dashboard"
      },
      {
        "type": "text_contains",
        "selector": ".welcome-message",
        "value": "Welcome back"
      },
      {
        "type": "no_console_errors"
      }
    ]
  }
}
```

---

### 6. **debug_screenshot** - Visual Verification
Capture screenshot of current page and return it directly to Claude for visual inspection.

**When to use:** Verify visual state, check if elements are visible, inspect layout - BEFORE using Gemini Vision

**Why this is powerful:** Claude (you!) can SEE the screenshot directly and analyze what's happening visually without needing external AI services. Use this to verify your actions succeeded!

**Parameters:**
- `fullPage` (optional): Capture full page (default: false, viewport only)
- `selector` (optional): Capture only this element instead of full page
- `description` (optional): What you want to check in the screenshot

**Returns:** Screenshot as base64 data URL that Claude can see and analyze

**Example:**
```json
{
  "name": "debug_screenshot",
  "arguments": {
    "description": "Check if the login form is visible after navigation"
  }
}
```

**Response format:**
```json
{
  "success": true,
  "url": "https://...",
  "title": "Login Page",
  "screenshot": "data:image/png;base64,iVBORw0KGgo...",
  "description": "Check if the login form is visible after navigation",
  "note": "Claude can see this screenshot directly and analyze what's happening visually"
}
```

**Pro tip:** Use this to verify your actions! After clicking a button or navigating, take a screenshot to SEE if it worked. You can self-correct based on what you see.

---

### 7. **debug_analyze_visual** - Gemini Vision Analysis
Take screenshot and analyze with Gemini Vision AI.

**When to use:** Complex visual analysis that requires detailed interpretation (use SPARINGLY - token intensive!)

**Note:** Try `debug_screenshot` FIRST - you can analyze screenshots yourself! Only use Gemini Vision when you need a second opinion or very detailed analysis.

**Important:** Only use when text-based inspection isn't enough. Most debugging can be done without screenshots.

**Parameters:**
- `prompt` (optional): Specific question about visual appearance
- `fullPage` (optional): Capture full page (default: false)
- `selector` (optional): Capture only this element

**Returns:** AI analysis of screenshot

**Example:**
```json
{
  "name": "debug_analyze_visual",
  "arguments": {
    "prompt": "Is the login button visible and properly styled? Are there any layout issues?"
  }
}
```

---

### 8. **debug_console_errors** - Error Monitoring
Get console errors from the page (errors only, not all logs).

**When to use:** Checking for JavaScript errors, debugging issues

**Parameters:**
- `action` (optional): "get", "clear", "get_and_clear" (default: "get")
- `limit` (optional): Max errors to return (default: 10)

**Returns:** Console errors

**Example:**
```json
{
  "name": "debug_console_errors",
  "arguments": {
    "action": "get_and_clear",
    "limit": 10
  }
}
```

---

### 9. **debug_network_analyze** - Network Inspection
Analyze network requests (failed requests, slow requests, API calls).

**When to use:** Debugging API issues, checking network failures

**Parameters:**
- `filter` (optional): "failed", "slow", "all", "api_only" (default: "failed")
- `slowThresholdMs` (optional): Threshold for slow requests (default: 3000)
- `action` (optional): "get", "clear", "get_and_clear"

**Returns:** Filtered network requests

**Example:**
```json
{
  "name": "debug_network_analyze",
  "arguments": {
    "filter": "failed"
  }
}
```

---

## 🎯 Common Debugging Workflows

### Workflow 1: Simple Page Check
**Goal:** Check if a page loads correctly

```
1. debug_navigate → Navigate to URL, get summary
2. debug_inspect → Check page structure
3. debug_console_errors → Check for errors
```

### Workflow 2: Form Testing
**Goal:** Test a form submission

```
1. debug_navigate → Go to form page
2. debug_inspect → Understand form fields
3. debug_interact (type) → Fill email field
4. debug_interact (type) → Fill password field
5. debug_interact (click) → Click submit button
6. debug_verify → Verify success message
```

### Workflow 3: Authenticated Flow (BEST PRACTICE!)
**Goal:** Test feature behind login

**Use debug_test_flow for this - it maintains session!**

```
Single call to debug_test_flow with all steps:
1. Navigate to login page
2. Type email
3. Type password
4. Click submit
5. Wait for redirect
6. Navigate to protected page (still logged in!)
7. Interact with feature
8. Verify result
```

**Why this works:** All steps share the same browser context, so cookies/session persist!

### Workflow 4: Visual Verification
**Goal:** Check if UI looks correct

```
1. debug_navigate → Load page
2. debug_screenshot → SEE what the page looks like
3. debug_inspect → Check elements exist (if needed)
4. debug_verify → Verify visible elements
5. debug_analyze_visual → ONLY if complex visual analysis needed
```

**Pro tip:** Use `debug_screenshot` liberally - you can SEE the browser and adapt!

---

## ⚡ Best Practices

### DO ✅
1. **Use `debug_screenshot` to verify your actions** - SEE what the browser looks like!
2. **Use `debug_test_flow` for authenticated flows** - Session persists!
3. **Inspect before interacting** - Use `debug_inspect` to find selectors
4. **Verify with screenshots when uncertain** - You can SEE and self-correct
5. **Clear logs between tests** - Use `action: "clear"` to reset state
6. **Use specific selectors** - `#id` or `[data-testid="..."]` are best

### DON'T ❌
1. **Don't assume actions worked** - Use `debug_screenshot` to verify!
2. **Don't use `debug_analyze_visual` by default** - Try `debug_screenshot` first
3. **Don't split authenticated flows** - Session will be lost!
4. **Don't fetch full HTML** - Tools return summaries for efficiency
5. **Don't ignore console errors** - They often reveal the problem
6. **Don't forget to wait** - Pages need time to load

---

## 🔧 Token Optimization Tips

The MCP-Debugger is designed to minimize token usage:

1. **Summaries, not dumps** - Returns element counts, not full HTML
2. **Structured responses** - JSON formatted for efficiency
3. **Incremental updates** - Only new errors/requests since last check
4. **Smart screenshots** - Use visual analysis only when truly needed
5. **Combined operations** - One `debug_test_flow` instead of 10 separate calls

**Expected savings:** 80-90% fewer tokens vs. traditional screenshot-based debugging

---

## 🐛 Troubleshooting

### "Element not found"
1. Use `debug_inspect` to see what elements exist
2. Check selector syntax (CSS selector format)
3. Wait for page load with `waitForSelector` or `wait` step

### "Session lost / Not authenticated"
1. **Use `debug_test_flow` for entire flow** - don't split into separate tool calls
2. Ensure login steps complete before navigating
3. Add `wait` steps after login (2-3 seconds)

### "Page timeout"
1. Increase `timeout` parameter
2. Check if URL is accessible
3. Use `waitForSelector` for dynamic content

### "Console errors found"
1. Use `debug_console_errors` to see details
2. Check if errors affect functionality
3. Clear errors with `action: "clear"` after fixing

---

## 📊 Session Persistence

**Important:** Each MCP connection gets a persistent browser session:

- ✅ Cookies persist across tool calls
- ✅ localStorage persists
- ✅ Authentication state maintained
- ✅ Session lasts until disconnect or 30 min idle
- ✅ Multiple connections supported (separate sessions)

**This means:**
- Login once, test many pages
- No need to re-authenticate
- Faster testing cycles
- Real user experience

---

## 🔐 Security Notes

- API Key required: `X-API-Key` header
- HTTPS enforced by Railway
- Sessions are isolated per connection
- Automatic cleanup after 30 minutes idle

---

## 📈 Performance

- **Navigation:** 2-5 seconds
- **Interaction:** 0.5-2 seconds
- **Inspection:** 0.5-1 second
- **Test Flow (5 steps):** 5-15 seconds
- **Visual Analysis:** 10-15 seconds (use sparingly!)

---

## 🎓 Examples

### Example 1: Check if login page works
```
Tool: debug_navigate
Args: {"url": "https://myapp.com/login", "waitForSelector": "#login-form"}

Tool: debug_inspect
Args: {"focus": "forms"}

Tool: debug_console_errors
Args: {"action": "get"}
```

### Example 2: Test login flow
```
Tool: debug_test_flow
Args: {
  "startUrl": "https://myapp.com/login",
  "steps": [
    {"action": "type", "selector": "input[name='email']", "value": "test@example.com"},
    {"action": "type", "selector": "input[name='password']", "value": "password123"},
    {"action": "click", "selector": "button[type='submit']"},
    {"action": "wait", "duration": 3000},
    {"action": "verify_url", "value": "/dashboard"},
    {"action": "verify_visible", "selector": "#welcome-message"}
  ]
}
```

### Example 3: Debug a specific button
```
Tool: debug_navigate
Args: {"url": "https://myapp.com/admin/tools"}

Tool: debug_inspect
Args: {"focus": "buttons"}

Tool: debug_interact
Args: {"action": "click", "selector": "#my-button"}

Tool: debug_verify
Args: {
  "checks": [
    {"type": "element_visible", "selector": "#result-message"},
    {"type": "no_console_errors"}
  ]
}
```

---

## 🔗 Additional Resources

- **GitHub:** https://github.com/maizoro87/MCP-Debugger
- **Implementation Plan:** IMPLEMENTATION_PLAN.md
- **Health Check:** https://mcp-debugger-production.up.railway.app/health
- **MCP Info:** https://mcp-debugger-production.up.railway.app/mcp/info

---

## 💡 Quick Reference

**Most Common Tools:**
1. `debug_navigate` - Start here (go to URL, get summary)
2. `debug_screenshot` - SEE what the browser looks like (use liberally!)
3. `debug_test_flow` - Use for authenticated flows
4. `debug_verify` - Check if something worked
5. `debug_console_errors` - Check for errors
6. `debug_inspect` - Understand page structure

**Less Common:**
7. `debug_interact` - Usually included in test_flow
8. `debug_network_analyze` - For API debugging
9. `debug_analyze_visual` - Last resort (Gemini Vision, very token intensive)

---

**Built for Claude Code with ❤️ - Optimized for efficiency, power, and developer happiness!**

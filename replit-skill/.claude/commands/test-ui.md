# Browser UI Testing (with AI Vision & Smart Auth)

Test your web application's UI using a remote headless browser with Gemini AI vision and smart authentication handling.

## Configuration

- **Server:** `https://mcp-debugger-online-production.up.railway.app`
- **API Key:** `$MCP_API_KEY` (required - set in Replit Secrets)
- **Test Bypass Key:** `$TEST_BYPASS_KEY` (optional - for auth bypass)
- **Dev URL:** `$DEV_URL` (your dev environment)
- **Prod URL:** `$PROD_URL` (your production environment)

## Dev vs Production URLs

| Environment | URL Pattern | When to Use |
|-------------|-------------|-------------|
| **Development** | `https://PROJECT.USERNAME.repl.co` | Testing unpublished changes |
| **Production** | `https://PROJECT.replit.app` | Testing deployed/live version |

**Always ask which environment to test if not specified.**

---

## 🚀 WORKFLOW: Smart Testing with Auth Handling

### Step 1: Try full_debug with bypass (if TEST_BYPASS_KEY is set)

```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "full_debug", "params": {
    "url": "URL_HERE",
    "test_bypass_key": "'"$TEST_BYPASS_KEY"'"
  }}'
```

### Step 2: Check if redirected to login

Look at the response:
- `navigation.finalUrl` - Does it contain `/login` or `/auth`?
- `page.forms` - Is there a login form?

**If redirected to login and no bypass key:**

Ask the user:
> "The page requires authentication. Would you like to:
> 1. **Set up test bypass** (recommended - add code to your app)
> 2. **Login manually** (I'll fill in credentials and maintain session)"

### Step 3a: If user chooses "Set up test bypass"

Provide this code to add to their Flask/Express app:

**For Flask:**
```python
# Add to your app.py or auth middleware
import os
from functools import wraps

def check_test_bypass(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow test bypass in development
        if os.environ.get('FLASK_ENV') == 'development':
            bypass_key = request.headers.get('X-Test-Bypass')
            expected_key = os.environ.get('TEST_BYPASS_KEY')
            if bypass_key and expected_key and bypass_key == expected_key:
                # Set a test user context
                g.user = {'email': 'test@example.com', 'role': 'admin'}
                g.test_mode = True
                return f(*args, **kwargs)
        # Continue with normal auth...
        return f(*args, **kwargs)
    return decorated
```

**For Express:**
```javascript
// Add to your auth middleware
const checkTestBypass = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const bypassKey = req.headers['x-test-bypass'];
    const expectedKey = process.env.TEST_BYPASS_KEY;
    if (bypassKey && expectedKey && bypassKey === expectedKey) {
      req.user = { email: 'test@example.com', role: 'admin' };
      req.testMode = true;
      return next();
    }
  }
  // Continue with normal auth...
  next();
};
```

Then tell user to add `TEST_BYPASS_KEY` to their Replit Secrets with a secure random value.

### Step 3b: If user chooses "Login manually"

First, set headers to persist the session, then login:

```bash
# Get the login form structure
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "navigate", "params": {"url": "LOGIN_PAGE_URL"}}'

curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "inspect", "params": {"focus": "inputs"}}'
```

Then login with multi_step_test:

```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "multi_step_test", "params": {
    "url": "LOGIN_PAGE_URL",
    "steps": [
      {"action": "type", "selector": "EMAIL_SELECTOR", "text": "USER_EMAIL"},
      {"action": "type", "selector": "PASSWORD_SELECTOR", "text": "USER_PASSWORD"},
      {"action": "click", "selector": "SUBMIT_SELECTOR"},
      {"action": "wait", "duration": 3000}
    ]
  }}'
```

**The session persists!** After login, all subsequent commands will be authenticated.

### Step 4: Continue with testing

After auth is handled, use full_debug or individual commands to test:

```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "full_debug", "params": {"url": "AUTHENTICATED_PAGE_URL"}}'
```

---

## 🔥 Quick Commands Reference

### Full Debug (everything in one call)
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "full_debug", "params": {"url": "URL", "test_bypass_key": "KEY"}}'
```

### Set Headers (persist for session)
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "set_headers", "params": {"headers": {"X-Test-Bypass": "KEY"}}}'
```

### Navigate with Headers
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "navigate", "params": {"url": "URL", "headers": {"X-Test-Bypass": "KEY"}}}'
```

### AI Vision Analysis
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "analyze_screenshot", "params": {"url": "URL", "prompt": "YOUR_QUESTION"}}'
```

### Interact (click, type, etc.)
```bash
curl -s -X POST https://mcp-debugger-online-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"method": "interact", "params": {"action": "click", "selector": "SELECTOR"}}'
```

---

## Available Methods

| Method | Purpose |
|--------|---------|
| `full_debug` | **ONE COMMAND** - navigation + errors + network + page + AI vision |
| `set_headers` | Set headers that persist for all requests (for auth bypass) |
| `navigate` | Go to URL (supports headers param) |
| `interact` | Click, type, select, hover, clear elements |
| `inspect` | Get page structure (forms, buttons, links, inputs) |
| `verify` | Check element visibility, text, URL, console errors |
| `screenshot` | Take PNG screenshot |
| `get_console_messages` | Get JavaScript console output |
| `get_network_requests` | Get all HTTP requests |
| `multi_step_test` | Run multiple actions in sequence (login flows) |
| `analyze_screenshot` | AI analysis with Gemini |

---

## Pro Tips

1. **Use full_debug first** - It tells you everything in one call
2. **Set up test bypass** - Much faster than logging in every time
3. **Session persists** - After login, you stay logged in for all commands
4. **Check finalUrl** - See if you got redirected (auth issue)
5. **AI vision** - Ask "what's wrong?" when something looks broken
6. **Dev vs Prod** - Always confirm which environment to test

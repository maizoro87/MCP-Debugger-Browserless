# MCP-Debugger Quick Start Guide

**For AI Assistants (Claude Code, etc.) - Read this to debug web applications**

---

## 🔌 Connection

**URL:** `https://mcp-debugger-production.up.railway.app`
**API Key:** `352368f9afffa3387a76561a062458d09834a26f9140f8a5e9bc88a08b571cf1`

---

## 🛠️ 4 Essential Tools (Start Here!)

### 1. **debug_navigate** - Go to a page
```json
{
  "name": "debug_navigate",
  "arguments": {
    "url": "https://yourapp.com/login"
  }
}
```
Returns: Page title, element counts, console errors (NOT full HTML - saves tokens!)

### 2. **debug_screenshot** - SEE what the browser looks like! 🎯
```json
{
  "name": "debug_screenshot",
  "arguments": {
    "description": "Check if login form is visible"
  }
}
```
**NEW!** Returns screenshot as base64 that Claude can SEE and analyze directly. Use this to verify your actions!

### 3. **debug_test_flow** - Complete workflows (MOST IMPORTANT!)
```json
{
  "name": "debug_test_flow",
  "arguments": {
    "startUrl": "https://yourapp.com/login",
    "steps": [
      {"action": "type", "selector": "input[type='email']", "value": "test@example.com"},
      {"action": "type", "selector": "input[type='password']", "value": "password"},
      {"action": "click", "selector": "button[type='submit']"},
      {"action": "wait", "duration": 2000},
      {"action": "verify_url", "value": "/dashboard"}
    ]
  }
}
```
**Why it's critical:** Session persists across all steps - login once, test everything!

### 4. **debug_verify** - Check if something worked
```json
{
  "name": "debug_verify",
  "arguments": {
    "checks": [
      {"type": "element_visible", "selector": "#dashboard"},
      {"type": "no_console_errors"}
    ]
  }
}
```

---

## 📋 All 9 Tools

| Tool | Use When | Token Cost |
|------|----------|------------|
| `debug_navigate` | Starting debugging | Low |
| `debug_screenshot` | **Verify visual state (USE THIS!)** | Low |
| `debug_interact` | Clicking/typing single elements | Low |
| `debug_inspect` | Understanding page structure | Low |
| `debug_test_flow` | **Testing complete flows** | Low (1 call vs 10!) |
| `debug_verify` | Checking conditions | Very Low |
| `debug_console_errors` | Checking for errors | Very Low |
| `debug_network_analyze` | Debugging API issues | Low |
| `debug_analyze_visual` | Complex visual analysis | High (try screenshot first!) |

---

## ⚡ The Golden Rule

**For authenticated flows, ALWAYS use `debug_test_flow` with ALL steps in ONE call!**

❌ **WRONG** (Session lost):
```
1. Call debug_test_flow (login)
2. Call debug_navigate (go to admin) ← NOT LOGGED IN ANYMORE!
3. Call debug_interact (click button) ← FAILS!
```

✅ **CORRECT** (Session maintained):
```
1. Call debug_test_flow with ALL steps:
   - login
   - navigate to admin (still logged in!)
   - click button (still logged in!)
   - verify result
```

---

## 🎯 Common Workflows

### Check if page loads
```
debug_navigate → debug_console_errors
```

### Test a button
```
debug_navigate → debug_inspect → debug_interact → debug_verify
```

### Test login → feature
```
debug_test_flow (with all steps: login, navigate, test, verify)
```

---

## 💡 Token Optimization Tips

1. ✅ Use `debug_inspect` instead of getting full HTML
2. ✅ Use `debug_verify` instead of screenshots
3. ✅ Use `debug_test_flow` for multi-step operations (1 call, not 10)
4. ✅ Only use `debug_analyze_visual` when truly needed
5. ✅ Clear errors with `debug_console_errors` action: "clear"

**Expected savings:** 80-90% fewer tokens vs screenshot-based debugging!

---

## 🐛 Troubleshooting

**"Element not found"**
→ Use `debug_inspect` to see what exists

**"Not authenticated"**
→ Use `debug_test_flow` with ALL steps including login

**"Page timeout"**
→ Add `waitForSelector` or increase timeout

**"Console errors"**
→ Use `debug_console_errors` to see details

---

## 📖 Full Documentation

- Complete guide: `CLAUDE_CODE_INSTRUCTIONS.md`
- Implementation plan: `IMPLEMENTATION_PLAN.md`
- Health check: https://mcp-debugger-production.up.railway.app/health

---

**Built for Claude Code - Efficient, powerful debugging without token waste!**

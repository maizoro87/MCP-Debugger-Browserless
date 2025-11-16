# MCP-Debugger Setup for Replit Apps

This guide shows how to configure any Replit app to use MCP-Debugger with Claude Code for automated browser testing.

---

## 🚀 Quick Setup (2 Minutes)

### Step 1: Run Setup Script in Your Replit App

In your Replit app's shell terminal, run:

```bash
curl -sL https://raw.githubusercontent.com/maizoro87/MCP-Debugger-Browserless/claude/verify-browserless-deployment-01Hbc3rwgrGDpUs6ujFxtWJR/setup-mcp-in-replit.sh | bash
```

This will:
- ✅ Create `.claude/mcp.json` with MCP server configuration
- ✅ Download universal testing guide to `.claude/TESTING_GUIDE.md`
- ✅ Verify files were created successfully

### Step 2: Add Your API Key

Edit `.claude/mcp.json` and replace `YOUR_MCP_API_KEY_HERE` with your actual API key:

```bash
zkXEYbgh4kmgRXJzzhrTNFhyfup8eaXqpZ44WqXemWNMpzEwvUJJuFkHhMpfpfosoCF79KuwUy3RttfNno2vP2
```

### Step 3: Restart Claude Code

**CRITICAL:** You must fully restart Claude Code for it to load the new MCP configuration:

1. Exit Claude Code completely
2. Start a new Claude Code session in your Replit shell

### Step 4: Verify Connection

In the new Claude Code session, ask:

```
List available MCP tools
```

You should see 9 tools starting with `mcp-debugger__`:
- `mcp-debugger__debug_navigate`
- `mcp-debugger__debug_screenshot`
- `mcp-debugger__debug_click`
- `mcp-debugger__debug_type`
- `mcp-debugger__debug_console`
- `mcp-debugger__debug_dom_state`
- `mcp-debugger__debug_network`
- `mcp-debugger__debug_cookies`
- `mcp-debugger__debug_analyze_visual`

---

## 🧪 Quick Test

Once connected, test it works by asking Claude Code:

```
Navigate to https://[your-app].replit.app using mcp-debugger__debug_navigate
and report the page title and load time
```

Replace `[your-app]` with your actual Replit app subdomain.

---

## 📖 Configure Automatic Testing (Optional)

To make Claude Code automatically test after making code changes:

### Step 1: Create Claude.md File

In your Replit app root, create a `Claude.md` file with:

```bash
curl -o Claude.md https://raw.githubusercontent.com/maizoro87/MCP-Debugger-Browserless/claude/verify-browserless-deployment-01Hbc3rwgrGDpUs6ujFxtWJR/CLAUDE_MD_TEMPLATE.md
```

### Step 2: Customize Claude.md

Edit `Claude.md` to add your app-specific details:

```markdown
## Project Overview

**Name:** Your App Name
**URL:** https://your-app.replit.app
**Tech Stack:** Node.js, Express, React, etc.
**Purpose:** What your app does
```

### Step 3: Restart Claude Code Again

Claude Code will now automatically:
- ✅ Test changes after implementing features
- ✅ Capture screenshots for verification
- ✅ Check for console errors and network failures
- ✅ Measure performance metrics
- ✅ Report detailed results with evidence

---

## 📚 Documentation Files

After setup, you'll have these files in your Replit app:

| File | Purpose |
|------|---------|
| `.claude/mcp.json` | MCP server configuration for Claude Code |
| `.claude/TESTING_GUIDE.md` | Complete testing guide (1,027 lines) |
| `Claude.md` | (Optional) Project instructions for Claude Code |

---

## 🎯 What Can MCP-Debugger Do?

### Browser Automation
- Navigate to any URL and measure load time
- Click buttons, links, and elements
- Fill forms and type text
- Take screenshots (uploaded to Firebase, returns public URLs)

### Error Detection
- Check for console errors and warnings
- Monitor network requests for failures
- Verify page content and DOM state

### Performance Testing
- Measure page load times
- Measure interaction delays
- Identify slow API calls

### Visual Analysis
- AI-powered screenshot analysis (Gemini Vision)
- Verify layout and visual elements
- Detect UI bugs and regressions

### Session Replays
- Every test creates a 7-day video replay on Browserless.io
- Full timeline of actions
- Console logs and network requests captured
- Access at: https://www.browserless.io/account/sessions

---

## 🔧 Troubleshooting

### Tools Don't Appear After Setup

**Problem:** Claude Code doesn't show MCP tools

**Solution:**
1. Verify `.claude/mcp.json` exists and has correct format
2. Check API key is correct (no quotes, exact string)
3. **Fully restart Claude Code** (this is critical!)
4. Check Claude Code startup logs for errors

### "Access Denied" Errors

**Problem:** MCP server returns 403 errors

**Solution:**
- Verify API key in `.claude/mcp.json` matches:
  ```
  zkXEYbgh4kmgRXJzzhrTNFhyfup8eaXqpZ44WqXemWNMpzEwvUJJuFkHhMpfpfosoCF79KuwUy3RttfNno2vP2
  ```

### Screenshots Return "null"

**Problem:** Screenshots fail to upload

**Solution:**
- This usually means Firebase isn't configured on the server side
- Screenshots will fall back to base64 (may crash Claude with large images)
- Contact server admin if this persists

---

## 💡 Example Testing Patterns

### Pattern 1: Homepage Load Test
```
Test my homepage:
1. Navigate to https://my-app.replit.app
2. Verify loads in < 3 seconds
3. Check for console errors
4. Capture screenshot
5. Report results
```

### Pattern 2: Login Flow Test
```
Test login functionality:
1. Navigate to /login
2. Fill email: test@example.com
3. Fill password: testpass123
4. Click submit button
5. Verify redirects to dashboard
6. Check for errors
7. Capture screenshots at each step
```

### Pattern 3: Form Validation Test
```
Test contact form validation:
1. Navigate to /contact
2. Try submitting empty form
3. Verify validation errors appear
4. Fill valid data
5. Submit form
6. Verify success message
7. Check network requests succeeded
```

### Pattern 4: Performance Audit
```
Run performance audit on my app:
1. Test all major pages
2. Measure load times
3. Identify slow API calls
4. Check for console errors
5. Report any issues found
```

---

## 🎓 Learn More

**Full Testing Guide:** `.claude/TESTING_GUIDE.md`
- Complete tool documentation with all parameters
- 5 comprehensive testing patterns
- Best practices and common mistakes
- Helper functions and utilities

**Ask Claude Code to read it:**
```
Read .claude/TESTING_GUIDE.md and explain the testing patterns
```

---

## 📊 Cost and Limits

**MCP Server (Browserless Edition):**
- Hosted on Railway
- Uses Browserless.io ($35/month)
- 20,000 units/month
- 3 concurrent browsers
- 7-day session replays
- Shared across all Replit apps

**Firebase Storage:**
- Screenshots auto-delete after 1 hour
- Minimal storage costs
- Public URLs for easy viewing

---

## ⚠️ Important Notes

1. **Always restart Claude Code** after creating/editing `.claude/mcp.json`
2. **Screenshots return URLs**, not base64 (safer, no crashes)
3. **Sessions are recorded** on Browserless.io for debugging
4. **API key is shared** across all your Replit apps
5. **Test responsibly** - you have 20k units/month shared capacity

---

## 🆘 Support

If you encounter issues:

1. Check `.claude/mcp.json` format is correct
2. Verify API key matches exactly
3. Confirm Claude Code was fully restarted
4. Read `.claude/TESTING_GUIDE.md` for examples
5. Check MCP server status: https://mcp-debugger-online-production.up.railway.app/health

---

## 🎉 You're Ready!

MCP-Debugger is now available in your Replit app. Ask Claude Code to test your app and it will use the MCP tools automatically.

**Example first test:**
```
Test my homepage at https://[your-app].replit.app:
1. Navigate and measure load time
2. Capture screenshot
3. Check for any errors
4. Report findings with screenshot URL
```

Happy testing! 🚀

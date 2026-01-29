# Browser Testing Skill for Replit

This skill enables Claude Code in Replit to test your web app's UI using a remote headless browser.

## Quick Install

Run this in your Replit project's shell:

```bash
curl -s https://raw.githubusercontent.com/maizoro87/MCP-Debugger-Browserless/main/replit-skill/install.sh | bash
```

Then add `MCP_API_KEY` to your Replit Secrets.

## Manual Install

1. Create `.claude/commands/` directory in your Replit project
2. Copy `test-ui.md` into that directory
3. Add `MCP_API_KEY` to Replit Secrets

## Usage

After installing, you can:

1. **Type `/test-ui`** to invoke the skill directly
2. **Ask Claude naturally:** "test the login page" or "check if the form works"

Claude will automatically use the remote browser debugger to:
- Navigate to your app
- Check for JavaScript errors
- Find buttons, forms, and inputs
- Click and type into elements
- Verify expected results

## What It Does

```
Your Replit Project
    │
    │ Claude Code uses curl
    ▼
MCP-Debugger (Railway)
    │
    │ WebSocket
    ▼
Browserless.io (headless Chrome)
    │
    │ Tests your app
    ▼
Results back to Claude
```

## Requirements

- `MCP_API_KEY` in Replit Secrets
- Internet access from Replit (standard)

## Example

```
You: Test the login page at https://myapp.repl.co/login

Claude: I'll test the login page using the browser debugger.
[navigates, finds form, types credentials, clicks submit, verifies result]
The login works! User is redirected to /dashboard with no console errors.
```

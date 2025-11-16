# Railway Deployment Troubleshooting Guide

## 🚨 Issue: "Access denied" on Health Endpoint

**Symptom:**
```bash
curl https://mcp-debugger-online-production.up.railway.app/health
# Returns: Access denied (HTTP 403)
```

**Root Cause:**
The 403 response is coming from Railway's infrastructure (Envoy proxy), **not from your application code**. This means Railway has network-level protection enabled.

**Evidence:**
```
HTTP/2 403
server: envoy          ← Railway's proxy, not your app
content-type: text/plain
Access denied
```

---

## ✅ Solutions (Try in Order)

### Solution 1: Check Private Networking Settings

Railway's "Private Networking" feature restricts public access to services.

**Steps:**
1. Go to https://railway.app/dashboard
2. Select your **mcp-debugger-online** project
3. Click on the service
4. Go to **Settings** tab
5. Scroll to **"Networking"** section
6. **Disable "Private Networking"** if enabled
7. Save and wait 30 seconds
8. Test again:
   ```bash
   curl https://mcp-debugger-online-production.up.railway.app/health
   ```

### Solution 2: Check Service Domain Configuration

**Steps:**
1. Railway Dashboard → Your Service → **Settings**
2. Scroll to **"Domains"** section
3. Verify domain is set to: `mcp-debugger-online-production.up.railway.app`
4. If missing, click **"Generate Domain"**
5. Wait for DNS propagation (1-2 minutes)
6. Test again

### Solution 3: Check if Service is Running

**Steps:**
1. Railway Dashboard → **Deployments** tab
2. Check latest deployment status
3. Should show: ✅ **Active**
4. Click on deployment to view logs
5. Look for startup message:
   ```
   ╔════════════════════════════════════════════════════════════╗
   ║  MCP-Debugger v3.0 - Running on port 3000              ║
   ╠════════════════════════════════════════════════════════════╣
   ║  🔌 MCP SSE Endpoint:    GET  /sse                         ║
   ║  📨 MCP Message:         POST /mcp/message                 ║
   ║  🏥 Health Check:        GET  /health                      ║
   ╚════════════════════════════════════════════════════════════╝
   ```

**If you don't see this:**
- Build failed → Check build logs
- Container crashed → Check runtime logs for errors
- Port mismatch → Railway should auto-set `PORT` env var

### Solution 4: Redeploy the Service

Sometimes Railway needs a fresh deployment:

**Option A: Trigger from Dashboard**
1. Railway Dashboard → Deployments
2. Click **"Redeploy"** on latest deployment

**Option B: Trigger from Git**
```bash
# In your local repo
git commit --allow-empty -m "Trigger Railway redeploy"
git push origin claude/verify-browserless-deployment-01Hbc3rwgrGDpUs6ujFxtWJR
```

### Solution 5: Check Railway Project Authentication

Railway has a project-level authentication feature (different from your app's API key).

**Steps:**
1. Railway Dashboard → Project Settings
2. Look for **"Environment Access"** or **"Authentication"**
3. Ensure it's set to **"Public"** or **"Allow external access"**
4. If restricted, update to allow public access

---

## 🔍 Diagnostic Commands

### Check HTTP Response Details
```bash
# See full HTTP headers
curl -i https://mcp-debugger-online-production.up.railway.app/health

# Verbose output with SSL/TLS info
curl -v https://mcp-debugger-online-production.up.railway.app/health
```

### Check DNS Resolution
```bash
# Verify domain resolves correctly
nslookup mcp-debugger-online-production.up.railway.app

# Should return Railway's IP addresses
```

### Check Service Status (via Railway CLI)
```bash
# Install Railway CLI if not installed
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Check status
railway status

# View logs
railway logs
```

---

## 📋 Environment Variables Checklist

While troubleshooting, verify these are set in Railway:

### Required Variables
```bash
MCP_API_KEY=<your-api-key>               # For MCP endpoint auth
BROWSERLESS_TOKEN=<your-token>           # Browserless.io API token
FIREBASE_SERVICE_ACCOUNT=<json-string>   # Firebase credentials (single line!)
FIREBASE_STORAGE_BUCKET=<bucket-name>    # Your Firebase bucket
```

### How to Check
1. Railway Dashboard → Your Service → **Variables** tab
2. Verify all required variables are present
3. Check for typos, especially in JSON values
4. `FIREBASE_SERVICE_ACCOUNT` must be **valid JSON on a single line**

### Common Mistakes
❌ **Wrong:**
```
FIREBASE_SERVICE_ACCOUNT={
  "type": "service_account",
  "project_id": "..."
}
```

✅ **Correct:**
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

---

## 🔧 If Still Not Working

### Option 1: Create New Railway Service

Sometimes it's easier to start fresh:

1. **Keep old service running** (for comparison)
2. Create new Railway service:
   ```bash
   railway init
   railway up
   ```
3. Configure environment variables
4. Generate new domain
5. Test new service
6. Compare logs with old service

### Option 2: Test with ngrok Locally

To verify your code works independently of Railway:

```bash
# Install dependencies
npm install

# Build
npm run build

# Set env vars locally
export MCP_API_KEY="test-key"
export BROWSERLESS_TOKEN="your-token"
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Start server
npm start

# In another terminal, expose with ngrok
ngrok http 3000

# Test the ngrok URL
curl https://your-ngrok-url.ngrok.io/health
```

If this works but Railway doesn't → Railway configuration issue
If this also fails → Application code issue

---

## 📊 Expected Behavior When Working

### Health Endpoint (No Auth)
```bash
$ curl https://mcp-debugger-online-production.up.railway.app/health

{
  "status": "ok",
  "version": "3.0.0",
  "service": "MCP-Debugger",
  "protocol": {
    "mcp": {
      "enabled": true,
      "version": "2024-11-05",
      "connections": 0,
      "tools": 9
    },
    "rest": {
      "enabled": true,
      "status": "legacy",
      "endpoint": "/mcp"
    }
  },
  "sessions": {
    "activeSessions": 0,
    "totalSessions": 0
  },
  "authenticated": true,
  "timestamp": "2025-11-16T04:00:00.000Z"
}
```

### MCP Info Endpoint (No Auth)
```bash
$ curl https://mcp-debugger-online-production.up.railway.app/mcp/info

{
  "name": "MCP-Debugger",
  "version": "3.0.0",
  "protocol": "MCP 2024-11-05",
  "transport": "Server-Sent Events (SSE)",
  "connection": {
    "endpoint": "/sse",
    "messageEndpoint": "/mcp/message",
    "authentication": "X-API-Key header or Authorization: Bearer token"
  },
  "tools": 9,
  "capabilities": {
    "browser_automation": true,
    "session_persistence": true,
    "ai_vision_analysis": true,
    "network_monitoring": true,
    "console_monitoring": true
  }
}
```

### MCP Message Endpoint (Requires Auth)
```bash
$ curl -X POST https://mcp-debugger-online-production.up.railway.app/mcp/message \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Should return list of 9 debug tools
```

---

## 🆘 Getting Help

### Railway Support
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Support email: team@railway.app

### This Project
- GitHub Issues: https://github.com/maizoro87/MCP-Debugger-Browserless/issues
- Include:
  - Railway deployment logs
  - `curl -v` output
  - Environment variable names (not values!)
  - Error messages from Railway

---

## ✅ Once Access is Restored

Run the comprehensive test suite:
```bash
./test-deployment.sh YOUR_API_KEY
```

This will verify:
- ✅ Health endpoint accessible
- ✅ Browserless connection working
- ✅ Firebase screenshot uploads functioning
- ✅ All 9 debug tools operational
- ✅ Session management working
- ✅ MCP protocol responding correctly

---

## 🔗 Related Documentation

- [README-BROWSERLESS.md](./README-BROWSERLESS.md) - Full deployment guide
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Railway-specific instructions
- [.env.example](./.env.example) - Environment variable reference
- [test-deployment.sh](./test-deployment.sh) - Automated testing script

---

**Last Updated:** 2025-11-16
**Status:** This guide addresses the HTTP 403 "Access denied" issue on Railway deployments

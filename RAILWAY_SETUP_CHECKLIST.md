# Railway Setup Checklist for MCP-Debugger-Browserless

Use this checklist to verify your Railway deployment is configured correctly.

---

## 📋 Pre-Deployment Checklist

### 1. Railway Project Setup
- [ ] Railway account created
- [ ] Project created: `mcp-debugger-online`
- [ ] Service created and linked to GitHub repo
- [ ] Branch connected: `claude/verify-browserless-deployment-01Hbc3rwgrGDpUs6ujFxtWJR` or `main`

### 2. Build Configuration
- [ ] Build method set to: **Dockerfile** (auto-detected from `railway.toml`)
- [ ] Dockerfile path: `Dockerfile` ✅ (default)
- [ ] Build command: None needed (Dockerfile handles it)

### 3. Environment Variables ⚠️ CRITICAL

Navigate to: **Railway Dashboard → Your Service → Variables**

#### Required Variables

**Authentication:**
```bash
MCP_API_KEY=<your-secure-api-key>
```
- [ ] Set `MCP_API_KEY`
- Generate with: `openssl rand -hex 32`

**Browserless Configuration:**
```bash
BROWSERLESS_TOKEN=<your-browserless-io-token>
BROWSERLESS_URL=wss://chrome.browserless.io
```
- [ ] Set `BROWSERLESS_TOKEN` (from https://www.browserless.io/account)
- [ ] Set `BROWSERLESS_URL` (defaults to `wss://chrome.browserless.io`)

**Firebase Configuration:**
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"mcp-debugger-c70ed","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

FIREBASE_STORAGE_BUCKET=mcp-debugger-c70ed.appspot.com
```
- [ ] Set `FIREBASE_SERVICE_ACCOUNT` (entire JSON as **single line**)
- [ ] Set `FIREBASE_STORAGE_BUCKET`

**How to get Firebase credentials:**
1. Go to Firebase Console → Project Settings
2. Service Accounts tab
3. Click "Generate New Private Key"
4. Download JSON file
5. Copy entire JSON and paste as single line (remove all newlines except those in the private_key value)

#### Optional Variables (Visual Debugging)
```bash
ENABLE_TRACE_RECORDING=false
ENABLE_VIDEO_RECORDING=false
AUTO_SCREENSHOT_AFTER_ACTION=false
SESSION_TIMEOUT_MS=1800000
MAX_SESSIONS=50
GEMINI_API_KEY=<your-gemini-key>
```
- [ ] Set optional variables if needed

#### Auto-Set by Railway (Don't Set These)
- `PORT` - Railway sets this automatically (usually 3000)
- `RAILWAY_ENVIRONMENT` - Set by Railway
- `RAILWAY_PROJECT_ID` - Set by Railway
- `RAILWAY_SERVICE_ID` - Set by Railway

### 4. Networking Configuration ⚠️ THIS FIXES "ACCESS DENIED"

Navigate to: **Railway Dashboard → Your Service → Settings → Networking**

- [ ] **Private Networking**: Should be **OFF** (or unchecked)
- [ ] **Public Networking**: Should be **ENABLED**
- [ ] Service Domain generated and active

**Current Domain:**
```
mcp-debugger-online-production.up.railway.app
```

If domain is missing:
1. Click "Generate Domain" button
2. Wait 1-2 minutes for DNS propagation
3. Test: `curl https://your-domain.up.railway.app/health`

### 5. Deployment Settings

Navigate to: **Railway Dashboard → Your Service → Settings**

**Health Check:**
- [ ] Health check path: `/health`
- [ ] Health check timeout: `300` seconds
- [ ] Health check interval: `30` seconds (default)

**Restart Policy:**
- [ ] Restart policy: `ON_FAILURE`
- [ ] Max retries: `10`

**Other:**
- [ ] Region: Choose closest to you (e.g., `us-west1`)
- [ ] Sleep mode: **DISABLED** (service must stay running for MCP)

---

## 🚀 Deployment Verification

### Step 1: Check Build Logs

Navigate to: **Railway Dashboard → Deployments → Click Latest Deployment**

**Expected build output:**
```
Building with Dockerfile...
=> [internal] load build definition from Dockerfile
=> [1/7] FROM mcr.microsoft.com/playwright:v1.55.0-jammy
=> [2/7] WORKDIR /app
=> [3/7] COPY package*.json ./
=> [4/7] RUN npm install
=> [5/7] COPY tsconfig.json ./
=> [6/7] COPY *.ts ./src
=> [7/7] RUN npm run build
=> exporting to image
Build successful ✅
```

- [ ] Build completed without errors
- [ ] Build time: ~2-4 minutes
- [ ] No timeout errors

### Step 2: Check Runtime Logs

Navigate to: **Railway Dashboard → Deployments → View Logs**

**Expected startup logs:**
```
╔════════════════════════════════════════════════════════════╗
║  MCP-Debugger v3.0 - Running on port 3000              ║
╠════════════════════════════════════════════════════════════╣
║  🔌 MCP SSE Endpoint:    GET  /sse                         ║
║  📨 MCP Message:         POST /mcp/message                 ║
║  ℹ️  MCP Info:            GET  /mcp/info                    ║
║  🏥 Health Check:        GET  /health                      ║
║  📊 Stats:               GET  /stats                       ║
║                                                            ║
║  🔧 Legacy REST API:     POST /mcp                         ║
║     (Maintained for backward compatibility)                ║
╠════════════════════════════════════════════════════════════╣
║  🔑 Authentication: Enabled ✅                             ║
║  🛠️  Tools Registered: 9                                    ║
║  🎭 Protocol: MCP 2024-11-05 over SSE                      ║
╚════════════════════════════════════════════════════════════╝

🔥 Firebase initialized with service account
✅ Ready to accept connections from Claude Code!
```

**What to look for:**
- [ ] Server started successfully
- [ ] `🔥 Firebase initialized with service account` appears
- [ ] `🔑 Authentication: Enabled ✅` shows (if MCP_API_KEY is set)
- [ ] `🛠️ Tools Registered: 9` shows all tools loaded
- [ ] No error messages about missing env vars

**Common issues in logs:**
- `⚠️ BROWSERLESS_TOKEN not set` → Add environment variable
- `⚠️ Firebase not configured` → Fix FIREBASE_SERVICE_ACCOUNT
- `❌ Firebase initialization failed` → Check JSON formatting

### Step 3: Test Health Endpoint

**From your terminal:**
```bash
curl https://mcp-debugger-online-production.up.railway.app/health
```

**Expected response (HTTP 200):**
```json
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

- [ ] Health endpoint returns HTTP 200 (not 403!)
- [ ] JSON response contains all fields above
- [ ] `authenticated: true` (means MCP_API_KEY is set)
- [ ] `tools: 9` (all debug tools loaded)

**If you get "Access denied":**
→ Go back to Step 4 (Networking Configuration) above

### Step 4: Test MCP Info Endpoint

```bash
curl https://mcp-debugger-online-production.up.railway.app/mcp/info
```

**Expected response:**
```json
{
  "name": "MCP-Debugger",
  "version": "3.0.0",
  "protocol": "MCP 2024-11-05",
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

- [ ] Info endpoint accessible
- [ ] Shows 9 tools
- [ ] All capabilities listed

### Step 5: Test Browserless Connection

**Run the automated test suite:**
```bash
cd /home/user/MCP-Debugger-Browserless
./test-deployment.sh YOUR_API_KEY
```

This will test:
- [ ] Health endpoint (public access)
- [ ] MCP info endpoint
- [ ] Browserless connection (creates session)
- [ ] Firebase screenshot upload
- [ ] All 9 debug tools

**Expected output:**
```
==========================================
MCP-Debugger-Browserless Deployment Test
==========================================

Test 1: Health Check (should be public)
✓ Health check passed

Test 2: MCP Info Endpoint
✓ MCP info retrieved

Test 3: Create Session & Test Browserless Connection
✓ Navigation successful
✓ Browserless connection confirmed

Test 4: Screenshot → Firebase Storage Upload
✓ Screenshot taken
✓ Screenshot uploaded to Firebase!
  URL: https://storage.googleapis.com/mcp-debugger-c70ed.appspot.com/...
✓ Screenshot URL is publicly accessible

Test 5: Check Session Statistics
✓ Stats retrieved

==========================================
Testing Complete!
==========================================
```

### Step 6: Verify Browserless Session Replays

1. Go to: https://www.browserless.io/account/sessions
2. Look for sessions with your trackingId (from test above)
3. Click on a session to view:
   - [ ] Timeline of actions
   - [ ] Video replay
   - [ ] Console logs
   - [ ] Network requests
   - [ ] Screenshots

This confirms Browserless integration is working!

### Step 7: Verify Firebase Storage

1. Go to: https://console.firebase.google.com
2. Select project: `mcp-debugger-c70ed`
3. Navigate to **Storage**
4. Check for folder: `screenshots/`
5. After running tests, verify:
   - [ ] Screenshot files appear in `screenshots/<session-id>/`
   - [ ] Files are publicly accessible (check URL)
   - [ ] Files auto-delete after 1 hour

---

## 🔧 Configuration Files Reference

### railway.toml
Located at root of repo. Controls build and deployment.

**Current config:**
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
numReplicas = 1
sleepApplication = false
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/health"
healthcheckTimeout = 300
```

**Do NOT modify unless you know what you're doing!**

### Dockerfile
Build configuration - already optimized.

**Key points:**
- Uses `mcr.microsoft.com/playwright:v1.55.0-jammy` base image
- Pre-installs Chromium (fast builds)
- Compiles TypeScript → JavaScript
- Starts with: `node dist/http-server-v3.js`

### .env.example
Template for local development. **NOT used by Railway!**

Railway uses environment variables set in the dashboard.

---

## 🐛 Troubleshooting

### Issue: "Access denied" on health endpoint

**Symptom:**
```bash
curl https://mcp-debugger-online-production.up.railway.app/health
# Returns: Access denied (HTTP 403)
```

**Solution:**
See [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md) for detailed steps.

**Quick fix:**
1. Railway Dashboard → Settings → Networking
2. **Disable Private Networking**
3. Verify domain is configured
4. Redeploy if needed

### Issue: Firebase not initializing

**Symptom in logs:**
```
⚠️  Firebase not configured - screenshots will use base64
```

**Solution:**
1. Check `FIREBASE_SERVICE_ACCOUNT` is set
2. Verify it's valid JSON on a **single line**
3. Common mistake: newlines in the middle of JSON (only keep them in `private_key` value)

**How to fix:**
```bash
# Take your firebase JSON file
cat firebase-service-account.json | jq -c '.'
# This outputs compact JSON (single line)
# Copy and paste into Railway variable
```

### Issue: Browserless connection fails

**Symptom in logs:**
```
⚠️  BROWSERLESS_TOKEN not set - using local browser
```

**Solution:**
1. Go to https://www.browserless.io/account
2. Copy your API Token
3. Set `BROWSERLESS_TOKEN` in Railway variables
4. Redeploy

### Issue: Build timeout

**Symptom:**
```
Build timed out after 10 minutes
```

**Solution:**
This shouldn't happen with Playwright base image. If it does:
1. Check Railway status page: https://status.railway.app
2. Try redeploying
3. Check Dockerfile hasn't been modified

---

## ✅ Success Criteria

Your deployment is working correctly when:

- [ ] Health endpoint returns HTTP 200 (not 403)
- [ ] Logs show "Firebase initialized"
- [ ] Logs show "Ready to accept connections"
- [ ] Test script passes all 5 tests
- [ ] Browserless sessions appear in dashboard
- [ ] Firebase screenshots upload successfully
- [ ] Claude Code can connect via MCP

---

## 📞 Getting Help

**Railway Issues:**
- Docs: https://docs.railway.com
- Discord: https://discord.gg/railway
- Support: team@railway.app

**Browserless Issues:**
- Docs: https://docs.browserless.io
- Support: support@browserless.io

**Firebase Issues:**
- Docs: https://firebase.google.com/docs
- Support: Firebase Console → Support

**This Project:**
- GitHub Issues: https://github.com/maizoro87/MCP-Debugger-Browserless/issues
- Documentation: [README-BROWSERLESS.md](./README-BROWSERLESS.md)

---

**Last Updated:** 2025-11-16
**Version:** 3.0.0
**Status:** Production Ready ✅

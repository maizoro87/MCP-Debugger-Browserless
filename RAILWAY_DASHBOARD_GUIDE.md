# Railway Dashboard Configuration Guide

**Step-by-step guide with exact locations in Railway dashboard**

---

## 🎯 Quick Links

After logging into Railway (https://railway.app):

1. **Your Project:** `mcp-debugger-online`
2. **Your Service:** Click the service card
3. **Current Domain:** `mcp-debugger-online-production.up.railway.app`

---

## 📍 Where to Find Each Setting

### 1. Check Deployment Status

**Path:** Dashboard → Deployments Tab

**What to look for:**
```
Latest Deployment
Status: ✅ Active
Build: Success
Runtime: Running
```

**If not active:**
- Click on the deployment
- Read build logs for errors
- Check "View Logs" for runtime errors

---

### 2. Fix "Access Denied" - Networking Settings ⚠️ MOST IMPORTANT

**Path:** Dashboard → Settings Tab → Scroll to "Networking" Section

**Settings to check:**

#### Public Domain
```
☑ Generate Domain
Domain: mcp-debugger-online-production.up.railway.app
```
- [ ] Domain is generated and active
- [ ] Shows green checkmark ✅

#### Private Networking
```
☐ Enable Private Networking
```
- [ ] This should be **UNCHECKED** (disabled)
- [ ] If checked, **uncheck it** to allow public access

**After changing:**
1. Click "Save" or "Update"
2. Wait 30 seconds
3. Test: `curl https://your-domain.up.railway.app/health`

---

### 3. Environment Variables ⚠️ CRITICAL

**Path:** Dashboard → Variables Tab

**You should see these variables:**

| Variable Name | Sample Value | Status |
|--------------|--------------|--------|
| `MCP_API_KEY` | `a1b2c3d4...` | ✅ Required |
| `BROWSERLESS_TOKEN` | `sk-...` | ✅ Required |
| `BROWSERLESS_URL` | `wss://chrome.browserless.io` | ✅ Required |
| `FIREBASE_SERVICE_ACCOUNT` | `{"type":"service_account"...}` | ✅ Required |
| `FIREBASE_STORAGE_BUCKET` | `mcp-debugger-c70ed.appspot.com` | ✅ Required |
| `PORT` | `3000` | 🔵 Auto-set by Railway |

**How to add a variable:**
1. Click "+ New Variable" button
2. Enter variable name (exactly as shown above)
3. Enter variable value
4. Click "Add"

**IMPORTANT for FIREBASE_SERVICE_ACCOUNT:**
```json
❌ WRONG (multi-line):
{
  "type": "service_account",
  "project_id": "mcp-debugger-c70ed"
}

✅ CORRECT (single line):
{"type":"service_account","project_id":"mcp-debugger-c70ed","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE..."}
```

**How to convert to single line:**
```bash
# On your computer:
cat firebase-credentials.json | jq -c '.'
# Copy the output and paste into Railway
```

---

### 4. Build Settings

**Path:** Dashboard → Settings Tab → "Build" Section

**Verify:**
```
Builder: Dockerfile ✅
Root Directory: /
Dockerfile Path: Dockerfile
Watch Paths: (empty - monitors all files)
```

**Should auto-detect from railway.toml - no changes needed!**

---

### 5. Deploy Settings

**Path:** Dashboard → Settings Tab → "Deploy" Section

**Verify:**
```
Health Check Path: /health ✅
Health Check Timeout: 300s
Restart Policy: On Failure
Max Retries: 10
Replicas: 1
```

**Should match railway.toml - no changes needed!**

---

### 6. Service Settings

**Path:** Dashboard → Settings Tab → "Service" Section

**Check:**
```
Service Name: (your service name)
Region: us-west1 (or your preferred region)
```

**Sleep Settings:**
```
☐ Enable Sleep Mode
```
- [ ] Should be **UNCHECKED**
- [ ] MCP server must stay running 24/7

---

## 🔍 How to View Logs

### Build Logs

**Path:** Dashboard → Deployments Tab → Click Latest Deployment → "Build" Tab

**Expected output:**
```
Cloning repository...
Building with Dockerfile...
Step 1/10 : FROM mcr.microsoft.com/playwright:v1.55.0-jammy
Step 2/10 : WORKDIR /app
...
Step 10/10 : CMD ["node", "dist/http-server-v3.js"]
Successfully built abc123def456
Build completed in 2m 34s
```

### Runtime Logs

**Path:** Dashboard → Deployments Tab → Click Latest Deployment → "View Logs" Button

**Expected startup logs:**
```
╔════════════════════════════════════════════════════════════╗
║  MCP-Debugger v3.0 - Running on port 3000              ║
╠════════════════════════════════════════════════════════════╣
║  🔌 MCP SSE Endpoint:    GET  /sse                         ║
║  📨 MCP Message:         POST /mcp/message                 ║
║  🏥 Health Check:        GET  /health                      ║
╚════════════════════════════════════════════════════════════╝

🔥 Firebase initialized with service account
🔑 Authentication: Enabled ✅
🛠️  Tools Registered: 9
✅ Ready to accept connections from Claude Code!
```

**Red flags in logs:**
```
❌ "⚠️  MCP_API_KEY not set"
→ Add MCP_API_KEY variable

❌ "⚠️  BROWSERLESS_TOKEN not set - using local browser"
→ Add BROWSERLESS_TOKEN variable

❌ "❌ Firebase initialization failed: Unexpected token"
→ Fix FIREBASE_SERVICE_ACCOUNT formatting (must be single line JSON)

❌ "⚠️  Firebase not configured - screenshots will use base64"
→ Add FIREBASE_SERVICE_ACCOUNT and FIREBASE_STORAGE_BUCKET
```

---

## 🔄 How to Redeploy

### Method 1: Manual Redeploy (Quick)

**Path:** Dashboard → Deployments Tab → Latest Deployment → "Redeploy" Button

Click "Redeploy" and Railway will rebuild from scratch.

### Method 2: Push to GitHub (Automatic)

```bash
# Make any small change (or empty commit)
git commit --allow-empty -m "Trigger Railway redeploy"
git push origin your-branch-name
```

Railway detects the push and automatically deploys.

### Method 3: Restart Service (No Rebuild)

**Path:** Dashboard → Three Dots Menu (⋮) → "Restart"

This restarts the container without rebuilding. Use when:
- You changed environment variables
- No code changes needed
- Just want fresh container

---

## 📊 Resource Monitoring

**Path:** Dashboard → Metrics Tab

**Check:**
- **CPU Usage:** Should be low (~5-10%) when idle
- **Memory:** Should be ~100-200MB (no browser locally!)
- **Network:** Spikes during test runs

**If memory is high (>500MB):**
- Browserless integration might not be working
- Service might be using local browser instead
- Check logs for "using local browser" warning

---

## 🧪 Testing Your Configuration

Once everything is set up:

### Test 1: Health Endpoint (Terminal)
```bash
curl https://mcp-debugger-online-production.up.railway.app/health
```

**Expected:** HTTP 200 with JSON response
**If 403:** Check "Networking" settings (disable Private Networking)

### Test 2: Run Automated Tests
```bash
cd /home/user/MCP-Debugger-Browserless
./test-deployment.sh YOUR_API_KEY
```

**Expected:** All 5 tests pass ✅

### Test 3: Check Browserless Dashboard
1. Go to https://www.browserless.io/account/sessions
2. Run a test (above)
3. Verify session appears with your trackingId

### Test 4: Check Firebase Console
1. Go to https://console.firebase.google.com
2. Select: `mcp-debugger-c70ed`
3. Navigate to Storage
4. After screenshot test, verify files in `screenshots/` folder

---

## 🎨 Railway Dashboard UI Reference

### Main Dashboard View
```
┌─────────────────────────────────────────────────────────┐
│  mcp-debugger-online                                    │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Your Service Card]                              │  │
│  │  Status: Active ✅                                │  │
│  │  Domain: mcp-debugger-online-production.up.rai... │  │
│  │  Latest Deploy: 2m ago                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [+ New Service]                                        │
└─────────────────────────────────────────────────────────┘
```

### Service View Tabs
```
┌─────────────────────────────────────────────────────────┐
│  [Deployments] [Variables] [Settings] [Metrics]         │
├─────────────────────────────────────────────────────────┤
│  Content of selected tab appears here                   │
└─────────────────────────────────────────────────────────┘
```

### Variables Tab Layout
```
┌─────────────────────────────────────────────────────────┐
│  Variables                                    [+ New]   │
├──────────────────────────────┬──────────────────────────┤
│  MCP_API_KEY                 │  ••••••••••••            │
│  BROWSERLESS_TOKEN           │  ••••••••••••            │
│  FIREBASE_SERVICE_ACCOUNT    │  ••••••••••••            │
│  FIREBASE_STORAGE_BUCKET     │  mcp-debugger-c70ed...   │
│  PORT                        │  3000 (Railway set)      │
└──────────────────────────────┴──────────────────────────┘
```

---

## ✅ Verification Checklist

Use this after making changes:

**Dashboard Checks:**
- [ ] Deployment status: Active ✅
- [ ] Domain generated and visible
- [ ] Private Networking: **DISABLED**
- [ ] Sleep Mode: **DISABLED**
- [ ] All 5 environment variables set
- [ ] Build logs show success
- [ ] Runtime logs show "Ready to accept connections"

**External Checks:**
- [ ] Health endpoint returns HTTP 200
- [ ] MCP info endpoint accessible
- [ ] Test script passes all tests
- [ ] Browserless session appears in dashboard
- [ ] Firebase screenshots upload successfully

---

## 🆘 Common Issues & Quick Fixes

| Issue | Location | Quick Fix |
|-------|----------|-----------|
| "Access denied" | Settings → Networking | Disable Private Networking |
| Build timeout | Deployments → Build Logs | Check Dockerfile, redeploy |
| Service not starting | Deployments → View Logs | Check for error messages |
| Firebase errors | Variables tab | Fix JSON formatting (single line) |
| Browserless not connecting | Variables tab | Add BROWSERLESS_TOKEN |
| Health check failing | Settings → Deploy | Verify path is `/health` |

---

## 📞 Support Resources

**Railway:**
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.com
- Discord: https://discord.gg/railway

**Project Docs:**
- [RAILWAY_SETUP_CHECKLIST.md](./RAILWAY_SETUP_CHECKLIST.md) - Detailed checklist
- [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md) - Troubleshooting guide
- [README-BROWSERLESS.md](./README-BROWSERLESS.md) - Full documentation

---

**Last Updated:** 2025-11-16
**Railway CLI Version:** 4.x
**Dashboard UI Version:** Current (changes frequently, but locations remain similar)

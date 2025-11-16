# Fix "Access Denied" - Step-by-Step Visual Guide

**Problem:** `curl https://mcp-debugger-online-production.up.railway.app/health` returns "Access denied" (HTTP 403)

**Solution:** Disable Private Networking in Railway Dashboard (5 minutes)

**Verified:** This issue is confirmed as of 2025-11-16 04:12 GMT

---

## 🎯 Quick Fix (Follow These Exact Steps)

### Step 1: Open Railway Dashboard

1. Open your web browser
2. Go to: **https://railway.app/dashboard**
3. You should see your projects listed

**What you'll see:**
```
┌─────────────────────────────────────┐
│  Railway Dashboard                  │
├─────────────────────────────────────┤
│  Projects:                          │
│  ┌─────────────────────────────┐   │
│  │  mcp-debugger-online         │   │  ← Click this
│  │  Active                      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Step 2: Open Your Service

1. Click on the **mcp-debugger-online** project card
2. You'll see your service(s) listed
3. Click on your service card (the one running your MCP-Debugger)

**What you'll see:**
```
┌─────────────────────────────────────────┐
│  mcp-debugger-online                    │
├─────────────────────────────────────────┤
│  Services:                              │
│  ┌───────────────────────────────────┐ │
│  │  [Your Service Name]               │ │  ← Click this
│  │  Status: Active ✅                │ │
│  │  Domain: mcp-debugger-online...    │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Step 3: Navigate to Settings Tab

1. At the top of the service view, you'll see tabs:
   - Deployments
   - Variables
   - **Settings** ← Click this
   - Metrics

2. Click on **Settings** tab

**What you'll see:**
```
┌──────────────────────────────────────────────┐
│ [Deployments] [Variables] [Settings] [Metrics]│
├──────────────────────────────────────────────┤
│                                              │
│  Settings for [Service Name]                 │
│                                              │
└──────────────────────────────────────────────┘
```

### Step 4: Find Networking Section

1. On the Settings page, **scroll down**
2. You'll see several sections:
   - Service Name
   - Region
   - Build
   - Deploy
   - **Networking** ← Find this section
   - Danger Zone

3. Scroll until you find the **"Networking"** section

**What you'll see:**
```
┌──────────────────────────────────────┐
│  Networking                          │
├──────────────────────────────────────┤
│  Domain                              │
│  ☑ Generate Domain                   │
│  mcp-debugger-online-production...   │
│                                      │
│  Private Networking                  │
│  ☑ Enable Private Networking    ← THIS IS THE PROBLEM!
│                                      │
└──────────────────────────────────────┘
```

### Step 5: Disable Private Networking ⚠️ CRITICAL

1. Look for the checkbox next to **"Enable Private Networking"**
2. If it's **checked** (☑), that's causing the "Access denied" error
3. **Click the checkbox to UNCHECK it** (☐)
4. The checkbox should now be **empty** (unchecked)

**Before (causing the problem):**
```
☑ Enable Private Networking    ← Checked (bad!)
```

**After (fixed):**
```
☐ Enable Private Networking    ← Unchecked (good!)
```

### Step 6: Save Changes

1. After unchecking, look for a **"Save"** or **"Update"** button
2. Click the button to save your changes
3. You might see a confirmation message like "Settings updated"

**What you'll see:**
```
┌──────────────────────────────────────┐
│  Private Networking                  │
│  ☐ Enable Private Networking         │
│                                      │
│  [Save Changes] ← Click this         │
└──────────────────────────────────────┘
```

### Step 7: Wait for Changes to Propagate

1. Wait **30-60 seconds** for Railway to apply the changes
2. The networking configuration needs to propagate through Railway's infrastructure
3. You can stay on the Settings page or navigate away

**What's happening:**
- Railway is updating your service's network configuration
- The Envoy proxy is reconfiguring to allow public access
- Your service doesn't need to restart (it's already running)

### Step 8: Verify the Fix

**Test the health endpoint:**
```bash
curl https://mcp-debugger-online-production.up.railway.app/health
```

**Expected (FIXED):**
```json
{
  "status": "ok",
  "version": "3.0.0",
  "service": "MCP-Debugger",
  "authenticated": true,
  "timestamp": "2025-11-16T04:15:00.000Z"
}
```

**If still "Access denied":**
- Wait another 30 seconds and try again
- Verify the checkbox is actually unchecked
- Try clicking "Save" again
- Check the Deployments tab to ensure service is Active

---

## ✅ Success Indicators

### You'll know it's fixed when:

1. **Health endpoint returns HTTP 200:**
   ```bash
   curl -I https://mcp-debugger-online-production.up.railway.app/health
   # HTTP/2 200 OK  ← Not 403!
   ```

2. **JSON response instead of "Access denied":**
   ```bash
   curl https://mcp-debugger-online-production.up.railway.app/health
   # Returns JSON with "status": "ok"
   ```

3. **Test suite passes:**
   ```bash
   cd /home/user/MCP-Debugger-Browserless
   ./test-deployment.sh YOUR_API_KEY
   # All 5 tests pass ✅
   ```

---

## 🔍 Troubleshooting

### Issue: Can't find "Networking" section

**Solution:**
- Make sure you're on the **Settings** tab (not Deployments or Variables)
- Scroll down - it might be below other sections
- It should be between "Deploy" and "Danger Zone" sections

### Issue: Checkbox is already unchecked

**Possible causes:**
1. **Wrong service** - Make sure you're in the correct service
2. **Different issue** - The 403 might be from a different cause
3. **Propagation delay** - Wait a few minutes and test again

**To verify you're in the right service:**
- Check the domain shown matches: `mcp-debugger-online-production.up.railway.app`
- Check deployment logs show "MCP-Debugger v3.0"

### Issue: Changes won't save

**Solutions:**
1. Refresh the page and try again
2. Check if you have permission to edit this service
3. Try using a different browser
4. Contact Railway support: https://discord.gg/railway

### Issue: Still getting 403 after disabling

**Wait longer:**
- Changes can take up to 2 minutes to propagate
- Try waiting 5 minutes and test again

**Verify deployment is active:**
1. Go to **Deployments** tab
2. Latest deployment should show **Active** ✅
3. If not, click **Redeploy**

**Check service domain:**
1. In Settings → Networking
2. Verify domain is: `mcp-debugger-online-production.up.railway.app`
3. If different or missing, click "Generate Domain"

---

## 🎓 What "Private Networking" Does

### When Enabled (☑):
- ❌ Blocks all public internet access to your service
- ❌ Only accessible from other Railway services in same project
- ❌ Health endpoints return 403 "Access denied"
- ❌ Cannot connect from external services (like Claude Code)
- ✅ Good for internal microservices
- ✅ Good for databases

### When Disabled (☐):
- ✅ Allows public internet access
- ✅ Health endpoints accessible
- ✅ Can connect from anywhere (with API key)
- ✅ Perfect for MCP servers
- ⚠️ Make sure you have authentication enabled (MCP_API_KEY)

**For MCP-Debugger, you WANT it disabled** because:
- Claude Code needs to connect from external network
- The `/health` endpoint should be publicly accessible
- You have API key authentication (`MCP_API_KEY`) for security
- The service is meant to be accessed over the internet

---

## 📋 After You Fix It

### Next Steps (In Order):

**1. Verify Basic Access (30 seconds)**
```bash
# Health check
curl https://mcp-debugger-online-production.up.railway.app/health

# Should return JSON, not "Access denied"
```

**2. Check Environment Variables (2 minutes)**
- Go to **Variables** tab in Railway
- Verify these 5 variables are set:
  ```
  MCP_API_KEY
  BROWSERLESS_TOKEN
  BROWSERLESS_URL
  FIREBASE_SERVICE_ACCOUNT
  FIREBASE_STORAGE_BUCKET
  ```
- See [RAILWAY_SETUP_CHECKLIST.md](./RAILWAY_SETUP_CHECKLIST.md) for details

**3. Run Comprehensive Tests (2 minutes)**
```bash
cd /home/user/MCP-Debugger-Browserless
./test-deployment.sh YOUR_API_KEY
```

**Expected output:**
```
✅ Health check passed
✅ MCP info retrieved
✅ Browserless connection confirmed
✅ Screenshot uploaded to Firebase!
✅ Stats retrieved
```

**4. Verify Integrations (5 minutes)**

**Check Browserless:**
1. Go to: https://www.browserless.io/account/sessions
2. Run a test (using the test script)
3. Verify session appears with your trackingId
4. Click session to view replay

**Check Firebase:**
1. Go to: https://console.firebase.google.com
2. Select project: `mcp-debugger-c70ed`
3. Navigate to **Storage**
4. Look for `screenshots/` folder
5. Verify files appear after screenshot tests

**5. Check Railway Logs (Optional)**

1. Go to **Deployments** tab
2. Click latest deployment
3. Click **View Logs**

**Expected logs:**
```
🔥 Firebase initialized with service account
🔑 Authentication: Enabled ✅
🛠️  Tools Registered: 9
✅ Ready to accept connections from Claude Code!

🌐 Connecting to Browserless for session test-123
✅ Connected to Browserless

📸 Screenshot uploaded: https://storage.googleapis.com/...
```

---

## 📸 Visual Reference

### Railway Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  Railway Dashboard                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Projects:                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  mcp-debugger-online                             │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │  [Your Service]                            │  │   │
│  │  │  [Deployments][Variables][Settings][Metrics]│ │   │
│  │  │  ┌─────────────────────────────────────┐  │  │   │
│  │  │  │  Settings                            │  │  │   │
│  │  │  │  ┌───────────────────────────────┐  │  │  │   │
│  │  │  │  │  Networking                    │  │  │  │   │
│  │  │  │  │  ☐ Enable Private Networking  │  │  │  │   │
│  │  │  │  │         ↑                      │  │  │  │   │
│  │  │  │  │    Uncheck this!              │  │  │  │   │
│  │  │  │  └───────────────────────────────┘  │  │  │   │
│  │  │  └─────────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist

Use this to verify each step:

- [ ] Opened Railway Dashboard (https://railway.app/dashboard)
- [ ] Clicked on `mcp-debugger-online` project
- [ ] Clicked on your service
- [ ] Clicked on **Settings** tab
- [ ] Scrolled to find **Networking** section
- [ ] Found the "Enable Private Networking" checkbox
- [ ] **Unchecked** the checkbox (☑ → ☐)
- [ ] Clicked **Save** button
- [ ] Waited 30-60 seconds
- [ ] Tested health endpoint (returns HTTP 200)
- [ ] Verified environment variables are set
- [ ] Ran test suite (all tests pass)
- [ ] Checked Browserless sessions
- [ ] Checked Firebase Storage

**If all checked:** ✅ Your deployment is fully configured and working!

---

## 🆘 Still Having Issues?

### Get Help:

1. **Check other guides:**
   - [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md) - Comprehensive troubleshooting
   - [RAILWAY_DASHBOARD_GUIDE.md](./RAILWAY_DASHBOARD_GUIDE.md) - Detailed dashboard guide
   - [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) - Current status report

2. **Railway Support:**
   - Discord: https://discord.gg/railway
   - Email: team@railway.app
   - Docs: https://docs.railway.com

3. **Include this information:**
   - "Health endpoint returns 403 Access denied"
   - "Private Networking is disabled but still getting 403"
   - Your service domain: `mcp-debugger-online-production.up.railway.app`
   - Screenshots of your Networking settings

---

**Last Updated:** 2025-11-16
**Issue:** HTTP 403 on health endpoint
**Cause:** Private Networking enabled
**Solution:** Disable Private Networking in Railway Dashboard
**Time to Fix:** 5 minutes

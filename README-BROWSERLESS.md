# MCP-Debugger (Browserless Edition) 🚀

**Production-grade browser automation with Browserless.io + Firebase Storage**

This is an enhanced version of MCP-Debugger optimized for cloud deployment with:
- ✅ **Browserless.io integration** - Cloud browsers with session replays
- ✅ **Firebase Storage** - Screenshot URLs instead of base64 (prevents Claude crashes)
- ✅ **9 Debug Tools** - Full MCP protocol support for Claude Code
- ✅ **Railway-ready** - Optimized for zero-downtime deployment

---

## 🎯 Why This Version?

### Problem with Original MCP-Debugger
The original version uses **local Chrome on Railway** which has limitations:

| Issue | Impact |
|-------|--------|
| Large base64 screenshots | Crashes Claude due to message size limits |
| No session replays | Can't review what went wrong |
| Single concurrent session | Slow when testing multiple pages |
| Railway resource usage | ~200-500MB RAM per instance |

### Browserless Edition Solutions

| Feature | Benefit |
|---------|---------|
| **Browserless.io** | 3 concurrent browsers, 7-day session replays |
| **Firebase Storage** | Screenshot URLs (not base64) - Claude never crashes |
| **Cloud-based** | No browser on Railway = faster, cheaper |
| **Session Tracking** | Every session tagged with trackingId for replays |

---

## 💰 Cost Comparison

### Original MCP-Debugger
- Railway: $10-20/month (512MB-1GB instance for Chrome)
- **Total: $10-20/month**

### Browserless Edition
- Railway: $5-10/month (tiny instance, no browser needed)
- Browserless.io: $35/month (20k units, 3 concurrent)
- Firebase: Free tier (Storage < 5GB, Bandwidth < 1GB/day)
- **Total: $40-45/month**

**Worth it?** ✅ Yes for production use:
- Session replays save hours of debugging
- No Claude crashes = better AI responses
- 3x concurrent browsers = faster testing
- Professional-grade infrastructure

---

## 🚀 Quick Start

### 1. Prerequisites

You'll need:
- **Railway account** - https://railway.app
- **Browserless.io subscription** - https://www.browserless.io ($35/mo recommended)
- **Firebase project** - https://console.firebase.google.com (free tier OK)

### 2. Get Your API Keys

**Browserless Token:**
1. Go to https://www.browserless.io/account
2. Copy your **API Token**

**Firebase Credentials:**
1. Go to Firebase Console → Project Settings
2. Service Accounts tab
3. Click "Generate New Private Key"
4. Save the JSON file

**Firebase Storage Bucket:**
1. Firebase Console → Storage
2. Create storage bucket (or use default: `your-project.appspot.com`)

### 3. Deploy to Railway

**Option A: From GitHub (Recommended)**
```bash
# Fork this repo first, then:
git clone https://github.com/YOUR_USERNAME/MCP-Debugger-Browserless
cd MCP-Debugger-Browserless

# Deploy to Railway
railway login
railway init
railway up
```

**Option B: One-Click Deploy**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### 4. Configure Environment Variables

In Railway dashboard → Your Service → Variables:

```bash
# REQUIRED: API Authentication
MCP_API_KEY=your-secure-api-key-here

# REQUIRED: Browserless Configuration
BROWSERLESS_TOKEN=your-browserless-token-here
BROWSERLESS_URL=wss://chrome.browserless.io

# REQUIRED: Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"mcp-debugger-c70ed",...}
FIREBASE_STORAGE_BUCKET=mcp-debugger-c70ed.appspot.com

# OPTIONAL: Visual Debugging
ENABLE_TRACE_RECORDING=false
AUTO_SCREENSHOT_AFTER_ACTION=false
SESSION_TIMEOUT_MS=1800000
MAX_SESSIONS=50
```

**Note:** For `FIREBASE_SERVICE_ACCOUNT`, paste the entire JSON as a **single line**.

### 5. Test Deployment

Once deployed, get your Railway URL and test:

```bash
# Health check (public, no auth needed)
curl https://your-app.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "version": "3.0.0",
  "service": "MCP-Debugger",
  "protocol": {
    "mcp": {
      "enabled": true,
      "connections": 0,
      "tools": 9
    }
  },
  "authenticated": true
}
```

Run the comprehensive test suite:
```bash
./test-deployment.sh YOUR_API_KEY
```

---

## 🔧 Available Debug Tools (9 Total)

All tools work via MCP protocol for Claude Code integration:

### 1. Navigation & Content
- `debug_navigate` - Navigate to URL
- `debug_screenshot` - Take screenshot → Upload to Firebase → Return URL
- `debug_click` - Click element by selector
- `debug_type` - Type into input fields
- `debug_console` - Get browser console messages

### 2. State & Analysis
- `debug_dom_state` - Get page title, URL, HTML
- `debug_network` - Get network requests/responses
- `debug_cookies` - Manage browser cookies
- `debug_analyze_visual` - AI analysis of screenshots (Gemini)

---

## 📸 How Firebase Screenshot Upload Works

### Old Way (Base64)
```json
{
  "screenshot": "iVBORw0KGgoAAAANSUhEUg....(5MB of base64)....CYII="
}
```
**Problem:** Large responses crash Claude Code

### New Way (Firebase URL)
```json
{
  "screenshot_url": "https://storage.googleapis.com/mcp-debugger-c70ed.appspot.com/screenshots/session-123/action.png"
}
```
**Benefits:**
- ✅ Small JSON responses
- ✅ Claude can view images via URL
- ✅ Auto-delete after 1 hour (saves storage costs)
- ✅ Public URLs (no auth needed)

### Implementation
See `src/utils/firebase-storage.ts`:
```typescript
export async function uploadScreenshot(
  screenshotBuffer: Buffer,
  sessionId: string,
  action: string
): Promise<string | null>
```

---

## 🌐 How Browserless Integration Works

### Session Creation
When you call a debug tool, the session manager (`src/session/manager.ts`) connects to Browserless:

```typescript
const browserlessToken = process.env.BROWSERLESS_TOKEN;
const wsEndpoint = `wss://chrome.browserless.io?token=${browserlessToken}&trackingId=${sessionId}`;
const browser = await chromium.connect(wsEndpoint);
```

**Key Benefits:**
1. **trackingId** - Each session tagged for replay viewing
2. **Cloud browsers** - No local Chrome needed
3. **Concurrent** - 3 browsers at same time (vs 1 with local)
4. **Session replays** - View in Browserless dashboard

### Session Replays
After running tests, view session replays:
1. Go to https://www.browserless.io/account/sessions
2. Search by your `trackingId` (same as MCP session ID)
3. Watch full replay with timeline, console, network
4. Download HAR files, screenshots, logs

---

## 🔐 Security & Authentication

### API Key Protection
All MCP endpoints require authentication:
```bash
curl -X POST https://your-app.railway.app/mcp/message \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"
```

Generate secure API key:
```bash
openssl rand -hex 32
```

### Public Endpoints
- `/health` - Health check (no auth)
- `/mcp/info` - Service info (no auth)

### Protected Endpoints
- `/sse` - MCP connection (requires auth)
- `/mcp/message` - Tool calls (requires auth)
- `/stats` - Service statistics (requires auth)

---

## 🧪 Testing Guide

### 1. Manual Testing

**Test Browserless Connection:**
```bash
# Set your API key
API_KEY="your-api-key"
RAILWAY_URL="https://your-app.up.railway.app"

# Navigate to a page (creates Browserless session)
curl -X POST $RAILWAY_URL/mcp/message \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-123" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "debug_navigate",
      "arguments": {"url": "https://example.com"}
    }
  }'
```

**Test Firebase Screenshot:**
```bash
# Take screenshot (should return Firebase URL)
curl -X POST $RAILWAY_URL/mcp/message \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-123" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "debug_screenshot",
      "arguments": {}
    }
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{
      "type": "text",
      "text": "Screenshot captured\nURL: https://storage.googleapis.com/..."
    }]
  }
}
```

### 2. Automated Testing

Run the test suite:
```bash
./test-deployment.sh YOUR_API_KEY
```

This will test:
- ✅ Health endpoint
- ✅ Browserless connection
- ✅ Firebase screenshot upload
- ✅ Session management
- ✅ All 9 debug tools

---

## 📊 Monitoring & Debugging

### Check Railway Logs
In Railway dashboard → Deployments → Click latest → View Logs

**Look for:**
```
✅ Ready to accept connections from Claude Code!
🔥 Firebase initialized with service account
🌐 Connecting to Browserless for session test-123
✅ Connected to Browserless
📸 Screenshot uploaded: https://storage.googleapis.com/...
```

### Check Browserless Sessions
1. Go to https://www.browserless.io/account/sessions
2. See all your sessions with replays
3. Click session to view timeline, console, network

### Check Firebase Storage
1. Go to Firebase Console → Storage
2. Navigate to `screenshots/` folder
3. See all uploaded screenshots (auto-deleted after 1hr)

---

## 🐛 Troubleshooting

### "Access denied" on health endpoint

**Problem:** Railway has network restrictions enabled

**Solution:**
1. Railway Dashboard → Your Service → Settings
2. Check **"Private Networking"** is **OFF**
3. Check **"Service Domain"** is configured
4. Redeploy if needed

### Browserless connection fails

**Check:**
1. `BROWSERLESS_TOKEN` is set correctly
2. Browserless subscription is active
3. Check Railway logs for connection errors

**Test manually:**
```bash
# Test Browserless token directly
curl "https://chrome.browserless.io/json/version?token=YOUR_TOKEN"
```

### Firebase uploads not working

**Check:**
1. `FIREBASE_SERVICE_ACCOUNT` is valid JSON (single line!)
2. `FIREBASE_STORAGE_BUCKET` is correct
3. Firebase Storage rules allow public read:
```json
{
  "rules": {
    "screenshots": {
      "$sessionId": {
        "$file": {
          ".read": true,
          ".write": "auth != null"
        }
      }
    }
  }
}
```

### Screenshots still using base64

**This happens when:**
- Firebase not initialized (check logs for errors)
- `FIREBASE_SERVICE_ACCOUNT` missing or invalid
- Firebase Storage bucket doesn't exist

**Fix:** Check Railway logs for:
```
⚠️  Firebase not configured - screenshots will use base64
```

---

## 📈 Performance & Scalability

### Resource Usage

**Railway Instance:**
- Memory: ~100-200MB (no browser!)
- CPU: Minimal
- Disk: ~500MB

**Browserless Limits (Startup Plan $35/mo):**
- 20,000 units/month
- 3 concurrent browsers
- 7-day session replay retention
- Unlimited screenshots

### Session Management

- Default timeout: 30 minutes
- Max sessions: 50 concurrent
- Auto-cleanup: Stale sessions removed every 60 seconds

Configure via env vars:
```bash
SESSION_TIMEOUT_MS=1800000  # 30 min
MAX_SESSIONS=50
```

---

## 🔄 Comparison: Original vs Browserless

| Feature | Original | Browserless Edition |
|---------|----------|---------------------|
| Browser | Local Chrome on Railway | Browserless.io cloud |
| Screenshots | Base64 (5MB+ JSON) | Firebase URLs (tiny JSON) |
| Claude Crashes | ❌ Frequent | ✅ Never |
| Session Replays | ❌ None | ✅ 7 days with video |
| Concurrent | 1 browser | 3 browsers |
| Railway Memory | 512MB-1GB | 100-200MB |
| Monthly Cost | $10-20 | $40-45 |
| Production Ready | ⚠️ Limited | ✅ Yes |
| Debugging | Logs only | Full replays + timeline |

---

## 🔗 Related Repositories

- **Original MCP-Debugger:** https://github.com/maizoro87/MCP-Debugger
  - Local Chrome, base64 screenshots, $10-20/mo
  - Good for development, testing

- **This Repo (Browserless):** https://github.com/maizoro87/MCP-Debugger-Browserless
  - Cloud browsers, Firebase screenshots, $40-45/mo
  - Production-grade, scalable

---

## 📝 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Claude Code                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ MCP Protocol (SSE)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Railway (MCP-Debugger Server)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  http-server-v3.ts                                    │  │
│  │  - MCP SSE endpoint (/sse)                           │  │
│  │  - Tool execution router                             │  │
│  │  - Session management                                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               │ WebSocket                │ HTTPS Upload
               ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Browserless.io         │  │   Firebase Storage       │
│  - Cloud Chrome browsers │  │  - Screenshot uploads    │
│  - 3 concurrent sessions │  │  - Public URLs           │
│  - Session replays       │  │  - Auto-delete (1hr)     │
│  - trackingId per session│  │  - Free tier             │
└──────────────────────────┘  └──────────────────────────┘
```

---

## 🛠️ Development

### Local Testing

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variables
export MCP_API_KEY="test-key"
export BROWSERLESS_TOKEN="your-token"
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Start server
npm start
```

### Adding New Tools

1. Define tool in `src/tools/debug-tools.ts`
2. Implement handler function
3. Tool auto-registers on server start

Example:
```typescript
export const allDebugTools = [
  {
    name: 'debug_my_new_tool',
    description: 'Description of what it does',
    inputSchema: {
      type: 'object',
      properties: {
        myParam: { type: 'string', description: 'Parameter description' }
      },
      required: ['myParam']
    }
  }
];
```

---

## 📄 License

MIT License (same as original MCP-Debugger)

---

## 🙏 Credits

- **Original MCP-Debugger:** https://github.com/maizoro87/MCP-Debugger
- **PlayMCP (inspiration):** https://github.com/jomon003/PlayMCP
- **Browserless.io:** https://www.browserless.io
- **Firebase:** https://firebase.google.com

---

## ✅ Deployment Checklist

Use this when deploying:

- [ ] Browserless.io subscription active ($35/mo)
- [ ] Firebase project created (free tier OK)
- [ ] Firebase Storage bucket created
- [ ] Firebase service account JSON downloaded
- [ ] Railway project created
- [ ] Environment variables set in Railway:
  - [ ] `MCP_API_KEY`
  - [ ] `BROWSERLESS_TOKEN`
  - [ ] `FIREBASE_SERVICE_ACCOUNT`
  - [ ] `FIREBASE_STORAGE_BUCKET`
- [ ] Code pushed to GitHub
- [ ] Railway deployment successful
- [ ] Health endpoint returns 200 OK
- [ ] Test script passes all tests
- [ ] Browserless session appears in dashboard
- [ ] Firebase screenshot uploads working
- [ ] Claude Code can connect via MCP

---

**Built for production browser automation** 🚀

*Browserless + Firebase + Railway = Zero crashes, full debugging*

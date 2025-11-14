# 🎥 Visual Debugging Guide for MCP-Debugger

## Overview

MCP-Debugger now supports **3 powerful visual debugging features** to help you verify what the browser is actually doing during automation:

1. **📹 Video Recording** - Record entire browser sessions as MP4 video
2. **🎬 Playwright Traces** - Interactive timeline with screenshots, network, console, and DOM snapshots
3. **📸 Auto-Screenshots** - Capture screenshots after each tool execution

## Why Visual Debugging?

When AI agents use MCP-Debugger, you can't see what the browser is doing. Visual debugging lets you:
- ✅ Verify the agent is actually navigating correctly
- ✅ Catch visual bugs that don't show up in logs
- ✅ Replay sessions to understand failures
- ✅ Confirm the AI isn't hallucinating results

---

## 🚀 Quick Start

### Enable Visual Debugging on Railway

Add these environment variables to your Railway deployment:

```bash
# Option 1: Full debugging (best for troubleshooting)
ENABLE_VIDEO_RECORDING=true
ENABLE_TRACE_RECORDING=true
AUTO_SCREENSHOT_AFTER_ACTION=true

# Option 2: Lightweight (just screenshots)
AUTO_SCREENSHOT_AFTER_ACTION=true

# Option 3: Trace only (recommended - most powerful)
ENABLE_TRACE_RECORDING=true
```

### How to Set in Railway:
1. Go to Railway dashboard
2. Select your MCP-Debugger project
3. Go to **Variables** tab
4. Add the environment variables above
5. Redeploy

---

## 📹 Feature 1: Video Recording

Records the entire browser session as a WebM video file.

### Configuration
```bash
ENABLE_VIDEO_RECORDING=true
VIDEO_DIR=/tmp/mcp-videos  # Optional, defaults to /tmp/mcp-videos
```

### How It Works
- Video starts when session is created
- Records all browser activity (navigation, clicks, typing)
- Saves automatically when session ends
- Format: 1280x720 WebM

### Retrieve Video
```bash
# Get session info
curl -H "X-API-Key: YOUR_API_KEY" \
  https://mcp-debugger-production.up.railway.app/session/SESSION_ID/recordings

# Download video
curl -H "X-API-Key: YOUR_API_KEY" \
  https://mcp-debugger-production.up.railway.app/session/SESSION_ID/video/download \
  -o session-video.webm
```

### Pros & Cons
✅ Easy to watch and share
✅ Shows real-time browser behavior
❌ Large file sizes
❌ No interaction or timeline scrubbing

---

## 🎬 Feature 2: Playwright Traces (RECOMMENDED)

Creates an interactive trace file that you can open in Playwright Trace Viewer.

### Configuration
```bash
ENABLE_TRACE_RECORDING=true
TRACE_DIR=/tmp/mcp-traces  # Optional, defaults to /tmp/mcp-traces
```

### How It Works
- Captures **everything**: screenshots, DOM snapshots, network requests, console logs
- Creates a ZIP file with interactive timeline
- Can be viewed in browser using Playwright Trace Viewer

### Retrieve Trace
```bash
# Download trace file
curl -H "X-API-Key: YOUR_API_KEY" \
  https://mcp-debugger-production.up.railway.app/session/SESSION_ID/trace/download \
  -o session-trace.zip
```

### View Trace Locally
```bash
# Install Playwright locally (one time)
npm install -D @playwright/test

# Open trace viewer
npx playwright show-trace session-trace.zip
```

This opens an **interactive browser UI** showing:
- 📸 Screenshots at every step
- 🌐 Full DOM snapshots (inspect HTML)
- 🌍 Network requests and responses
- 📝 Console logs
- ⏱️ Timeline of all actions

### Pros & Cons
✅ **Most powerful** - inspect everything
✅ Interactive timeline
✅ Shows network, console, DOM
✅ Smaller file size than video
✅ Professional debugging tool
❌ Requires Playwright to view

---

## 📸 Feature 3: Auto-Screenshots

Automatically captures a screenshot after every tool execution.

### Configuration
```bash
AUTO_SCREENSHOT_AFTER_ACTION=true
```

### How It Works
- After each `debug_navigate`, `debug_interact`, etc.
- Captures current viewport (1280x720)
- Stores last 20 screenshots per session
- Returns as base64 PNG

### Retrieve Screenshots
```bash
# Get all screenshots for session
curl -H "X-API-Key: YOUR_API_KEY" \
  https://mcp-debugger-production.up.railway.app/session/SESSION_ID/screenshots
```

### Response Format
```json
{
  "success": true,
  "sessionId": "abc123",
  "count": 5,
  "screenshots": [
    {
      "timestamp": "2025-11-14T10:30:00Z",
      "action": "after_debug_navigate",
      "image": "data:image/png;base64,iVBORw0KG..."
    }
  ]
}
```

### Display Screenshots in HTML
```html
<img src="data:image/png;base64,iVBORw0KG..." />
```

### Pros & Cons
✅ Lightweight and fast
✅ Easy to retrieve via API
✅ No external tools needed
❌ Limited history (20 screenshots)
❌ No timeline or interaction

---

## 🎯 Recommended Configurations

### For Development
```bash
ENABLE_TRACE_RECORDING=true
AUTO_SCREENSHOT_AFTER_ACTION=true
```
Best balance of debugging power and storage.

### For Production Monitoring
```bash
AUTO_SCREENSHOT_AFTER_ACTION=true
```
Lightweight, just enough to verify actions.

### For Deep Troubleshooting
```bash
ENABLE_VIDEO_RECORDING=true
ENABLE_TRACE_RECORDING=true
AUTO_SCREENSHOT_AFTER_ACTION=true
```
Maximum visibility, higher storage costs.

### For No Visual Debugging (Default)
Don't set any of these variables. Sessions run faster with less overhead.

---

## 📊 Check Visual Debugging Status

### Health Endpoint
```bash
curl https://mcp-debugger-production.up.railway.app/health
```

Response includes:
```json
{
  "status": "ok",
  "sessions": {
    "visualDebugging": {
      "videoRecording": true,
      "traceRecording": true
    }
  }
}
```

### Session Recordings Info
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://mcp-debugger-production.up.railway.app/session/SESSION_ID/recordings
```

Response:
```json
{
  "success": true,
  "sessionId": "abc123",
  "videoEnabled": true,
  "traceEnabled": true,
  "videoPath": "/tmp/mcp-videos/abc123-1234567890.webm",
  "tracePath": "/tmp/mcp-traces/abc123-1234567890.zip",
  "screenshotCount": 5
}
```

---

## 🔍 Example Workflow

### Scenario: Debugging a failed login test

1. **Enable trace recording** on Railway:
   ```bash
   ENABLE_TRACE_RECORDING=true
   ```

2. **Run your test** (AI agent uses MCP-Debugger)

3. **Get session ID** from logs or API

4. **Download trace**:
   ```bash
   curl -H "X-API-Key: YOUR_API_KEY" \
     https://mcp-debugger-production.up.railway.app/session/SESSION_ID/trace/download \
     -o login-test-trace.zip
   ```

5. **View trace locally**:
   ```bash
   npx playwright show-trace login-test-trace.zip
   ```

6. **Inspect failure**:
   - See exact screenshot when login failed
   - Check network tab for API errors
   - Review console for JavaScript errors
   - Inspect DOM to see what elements were present

---

## 🎬 Playwright Trace Viewer Tutorial

When you open a trace with `npx playwright show-trace`, you get:

### Timeline (Left Side)
- Every action taken (click, type, navigate)
- Timestamps for each action
- Click any action to see details

### Screenshot (Center)
- Visual state at that moment
- Hover to see element highlights

### Details (Right Tabs)
- **Network**: HTTP requests/responses
- **Console**: Console logs
- **Source**: Page source/HTML
- **Snapshot**: Full DOM at that moment

### Pro Tips
- Use the timeline slider to scrub through the session
- Click "Before" and "After" to see state changes
- Network tab shows which API calls succeeded/failed
- Console tab reveals JavaScript errors

---

## 💾 Storage Considerations

### Railway Ephemeral Storage
- Railway containers use ephemeral disk (resets on deploy)
- Videos/traces are lost when container restarts
- **Solution**: Download recordings after each session

### File Sizes
- **Screenshots**: ~100KB each (in-memory, auto-cleaned)
- **Video**: ~5-10MB per minute
- **Trace**: ~2-5MB per session (highly compressed)

### Auto-Cleanup
- Screenshots: Last 20 kept per session
- Sessions: Auto-destroyed after 30 minutes idle
- Files: Deleted with session cleanup

---

## 🚨 Troubleshooting

### "Trace file not found"
- Make sure `ENABLE_TRACE_RECORDING=true` is set
- Trace is only saved when session ends
- Check session is still active with `/session/:id/recordings`

### "Video file not found"
- Make sure `ENABLE_VIDEO_RECORDING=true` is set
- Video finishes encoding when session closes
- May take a few seconds after session end

### "No screenshots"
- Make sure `AUTO_SCREENSHOT_AFTER_ACTION=true` is set
- Screenshots are captured AFTER tool execution
- Check session ID is correct

### Performance Issues
Visual debugging adds overhead:
- Video: ~5-10% CPU overhead
- Trace: ~10-15% overhead
- Screenshots: Minimal overhead

---

## 📚 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/session/:id/recordings` | GET | Get recording status and paths |
| `/session/:id/screenshots` | GET | Get all screenshots for session |
| `/session/:id/trace/download` | GET | Download Playwright trace ZIP |
| `/session/:id/video/download` | GET | Download video WebM |
| `/health` | GET | Check if visual debugging is enabled |

All endpoints require `X-API-Key` header except `/health`.

---

## 🎓 Next Steps

1. **Try trace recording first** - It's the most powerful
2. **Download a trace** after a test run
3. **Open it** with `npx playwright show-trace`
4. **Explore** the timeline, network, and console tabs
5. **Share traces** with your team for debugging

Happy debugging! 🐛🔍

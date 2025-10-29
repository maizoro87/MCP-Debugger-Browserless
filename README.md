# MCP Debugger - Professional Playwright Browser Automation Server

**Railway-ready HTTP API for comprehensive browser automation and testing**

> Enhanced version of PlayMCP with production-grade features for the SMCHS Innovation Hub

---

## 🚀 What's New

This is a **professional-grade enhancement** of PlayMCP, rebuilt specifically for:
- ✅ **HTTP API** instead of stdio MCP protocol
- ✅ **Railway deployment** with optimized Dockerfile
- ✅ **Real-time monitoring** - Console logs & network requests
- ✅ **Network mocking** - Intercept and mock API responses
- ✅ **Cookie & storage management** - Full browser state control
- ✅ **Production stability** - TypeScript, error handling, health checks

---

## 📊 Enhanced Features

### Phase 1: Console & Network Monitoring ✅
**Problem Solved:** Original PlayMCP couldn't monitor console logs or network requests during automation.

- **Real-time console capture** - All browser console messages (log, warn, error, info)
- **Network request tracking** - Full HTTP request/response details
- **Request/Response inspection** - Headers, status codes, body content
- **Clear history endpoints** - Reset between tests

### Phase 2: Network Interception & Mocking ✅
**Problem Solved:** Couldn't test error states or mock APIs for frontend testing.

- **Request interception** - Abort, continue, or mock any network request
- **API response mocking** - Replace API responses with test data
- **Resource blocking** - Block images/CSS/fonts for faster tests
- **Pattern-based routing** - Regex or string matching

### Phase 3: Cookie & Storage Management ✅
**Problem Solved:** No way to manage browser state for auth testing.

- **Cookie CRUD** - Get, set, clear browser cookies
- **localStorage management** - Read/write browser storage
- **Session persistence** - Maintain state across navigations

### Phase 4: HTTP Server Support ✅
**Problem Solved:** Screenshot methods only saved to file, couldn't return data directly.

- **Screenshot as Buffer** - Base64 responses for HTTP
- **Element visibility** - Check if elements are visible
- **Form filling** - Type into inputs
- **Flexible waiting** - Time or selector-based
- **Direct page access** - Advanced operations via Playwright API

---

## 📡 HTTP API Reference

### Base Configuration
```
Base URL: https://your-app.up.railway.app
Health Check: GET /health
Main Endpoint: POST /mcp
Content-Type: application/json
```

### Quick Examples

**Health Check:**
```bash
curl https://your-app.up.railway.app/health
```

**Navigate & Screenshot:**
```bash
curl -X POST https://your-app.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "screenshot",
    "params": {
      "url": "https://example.com",
      "fullPage": true
    }
  }'
```

**Multi-Step Test:**
```bash
curl -X POST https://your-app.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "multi_step_test",
    "params": {
      "url": "https://myapp.com/login",
      "steps": [
        {"action": "type", "selector": "#email", "text": "user@example.com"},
        {"action": "type", "selector": "#password", "text": "pass123"},
        {"action": "click", "selector": "#login-btn"},
        {"action": "wait", "duration": 2000},
        {"action": "is_visible", "selector": "#dashboard"}
      ]
    }
  }'
```

### Complete API Methods

<details>
<summary><b>Navigation & Content (6 methods)</b></summary>

```javascript
// Navigate
{"method": "navigate", "params": {"url": "https://example.com"}}

// Get page content
{"method": "get_content", "params": {
  "url": "https://example.com",
  "includeHtml": true,
  "includeText": true
}}

// Screenshot
{"method": "screenshot", "params": {
  "url": "https://example.com",
  "fullPage": true,
  "type": "png"
}}

// Evaluate JavaScript
{"method": "evaluate", "params": {
  "url": "https://example.com",
  "script": "document.title"
}}

// Wait for selector
{"method": "wait_for_selector", "params": {
  "url": "https://example.com",
  "selector": "#my-element",
  "timeout": 30000
}}

// Multi-step test
{"method": "multi_step_test", "params": {
  "url": "https://example.com",
  "steps": [
    {"action": "wait", "duration": 1000},
    {"action": "click", "selector": "#button"},
    {"action": "type", "selector": "#input", "text": "Hello"},
    {"action": "is_visible", "selector": "#result"},
    {"action": "dom_state"},
    {"action": "evaluate", "script": "document.title"}
  ]
}}
```
</details>

<details>
<summary><b>Console & Network Monitoring (4 methods)</b></summary>

```javascript
// Get console messages
{"method": "get_console_messages", "params": {}}

// Get network requests
{"method": "get_network_requests", "params": {}}

// Clear console messages
{"method": "clear_console_messages", "params": {}}

// Clear network requests
{"method": "clear_network_requests", "params": {}}
```
</details>

<details>
<summary><b>Network Interception (3 methods)</b></summary>

```javascript
// Intercept requests
{"method": "intercept_request", "params": {
  "urlPattern": "**/api/users",
  "action": "mock",
  "mockResponse": {
    "status": 200,
    "contentType": "application/json",
    "body": {"users": []}
  }
}}

// Mock API response
{"method": "mock_api_response", "params": {
  "url": "https://api.example.com/data",
  "mockData": {"result": "success"},
  "status": 200
}}

// Block resources
{"method": "block_resources", "params": {
  "resourceTypes": ["image", "stylesheet", "font"]
}}
```
</details>

<details>
<summary><b>Cookie Management (3 methods)</b></summary>

```javascript
// Get cookies
{"method": "get_cookies", "params": {"name": "session_id"}}

// Set cookie
{"method": "set_cookie", "params": {
  "cookie": {
    "name": "session_id",
    "value": "abc123",
    "domain": "example.com",
    "path": "/",
    "expires": 1234567890
  }
}}

// Clear cookies
{"method": "clear_cookies", "params": {}}
```
</details>

<details>
<summary><b>Storage Management (3 methods)</b></summary>

```javascript
// Get localStorage
{"method": "get_local_storage", "params": {"key": "user_data"}}

// Set localStorage
{"method": "set_local_storage", "params": {
  "key": "user_data",
  "value": "{\"name\": \"John\"}"
}}

// Clear localStorage
{"method": "clear_local_storage", "params": {}}
```
</details>

**Total: 19 HTTP endpoints** (vs 38 stdio tools in original PlayMCP)

---

## 🏗️ Architecture

### Core Components

```
playmcp/
├── src/
│   ├── controllers/
│   │   └── playwright.ts         # Enhanced PlaywrightController
│   │       ├── Phase 1: Console & Network Monitoring
│   │       ├── Phase 2: Network Interception
│   │       ├── Phase 3: Cookie & Storage
│   │       └── Phase 4: HTTP Support Methods
│   └── types/
│       └── index.ts              # TypeScript definitions
├── http-server.ts                # Express HTTP server
├── Dockerfile                    # Railway-optimized
├── railway.toml                  # Deployment config
├── package.json
└── tsconfig.json
```

### Design Patterns
- **Singleton Controller** - One browser instance per container
- **Lazy Initialization** - Browser starts on first request
- **Event-Driven Monitoring** - Real-time console/network capture
- **Type-Safe API** - Full TypeScript implementation

---

## 🔧 Local Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
git clone https://github.com/maizoro87/MCP-Debugger.git
cd MCP-Debugger
npm install
npm run build
npm start
```

Server runs on `PORT` (default: 3000)

### Testing
```bash
# Health check
curl http://localhost:3000/health

# Screenshot test
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"screenshot","params":{"url":"https://example.com"}}'
```

---

## 🚂 Railway Deployment

### Quick Deploy

1. **Fork this repo** to your GitHub account

2. **Create Railway project:**
   ```bash
   railway login
   railway init
   railway link
   ```

3. **Deploy:**
   ```bash
   git push railway main
   ```

4. **Get URL:**
   Railway will assign: `https://[your-app].up.railway.app`

### Configuration

**railway.toml** (already included):
```toml
[build]
builder = "DOCKERFILE"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Dockerfile** (already optimized):
- Base: `mcr.microsoft.com/playwright:v1.55.0-jammy`
- Chromium pre-installed
- Build time: 2-3 minutes
- Memory: ~200-500MB

### Environment Variables
```bash
NODE_ENV=production
PORT=3000  # Railway sets automatically
```

---

## 🎯 Use Cases

### 1. E2E Testing
```javascript
// Test login flow with console monitoring
POST /mcp
{
  "method": "multi_step_test",
  "params": {
    "url": "https://myapp.com/login",
    "steps": [
      {"action": "type", "selector": "#email", "text": "test@example.com"},
      {"action": "type", "selector": "#password", "text": "password123"},
      {"action": "click", "selector": "#login-button"},
      {"action": "wait", "duration": 2000},
      {"action": "is_visible", "selector": "#dashboard"}
    ]
  }
}

// Response includes:
// - consoleLogs: ["info: Login successful", ...]
// - networkRequests: [{url: "/api/login", status: 200}, ...]
// - steps: [{step: 1, success: true}, ...]
```

### 2. API Mocking for Frontend Tests
```javascript
// Mock API before testing
POST /mcp
{"method": "mock_api_response", "params": {
  "url": "https://api.myapp.com/users",
  "mockData": {"users": [{"id": 1, "name": "Test"}]}
}}

// Navigate and test
POST /mcp
{"method": "navigate", "params": {"url": "https://myapp.com/users"}}

// Verify mock was used
POST /mcp
{"method": "get_network_requests", "params": {}}
```

### 3. Visual Regression Testing
```javascript
// Take baseline screenshot
POST /mcp
{"method": "screenshot", "params": {
  "url": "https://myapp.com/dashboard",
  "fullPage": true
}}

// Returns: {"screenshot": "base64-encoded-image"}
```

### 4. Console Error Monitoring
```javascript
// Navigate and collect errors
POST /mcp
{"method": "navigate", "params": {"url": "https://myapp.com"}}

POST /mcp
{"method": "get_console_messages", "params": {}}

// Returns: {
//   "messages": [
//     {"type": "error", "text": "Uncaught TypeError: ...", "timestamp": "..."}
//   ]
// }
```

---

## 🔐 Security

⚠️ **Current Implementation:**
- No authentication
- No rate limiting
- No input sanitization
- No CORS configuration

🛡️ **Production Recommendations:**
1. Add API key middleware
2. Implement rate limiting (express-rate-limit)
3. Validate and sanitize all inputs
4. Configure CORS appropriately
5. Use HTTPS only
6. Deploy behind a secure gateway

---

## 📈 Performance

### Resource Usage
- **Idle:** ~200MB RAM
- **Active:** ~500MB RAM
- **CPU:** Minimal when idle, spikes during page loads

### Build Times
- **Railway:** 2-3 minutes (Playwright base image)
- **Local:** < 10 seconds (TypeScript only)

### Optimization Tips
- Use `block_resources` to skip images/fonts
- Clear console/network logs between tests
- Reuse browser instance (automatic)

---

## 🛠️ Development Guide

### Adding New Methods

**1. Add to PlaywrightController:**
```typescript
// src/controllers/playwright.ts
async myNewMethod(param: string): Promise<void> {
  if (!this.isInitialized() || !this.state.page) {
    throw new Error('Browser not initialized');
  }
  this.log('My new method', { param });
  // Implementation
}
```

**2. Expose in HTTP Server:**
```typescript
// http-server.ts
case 'my_new_method': {
  const controller = await initBrowser();
  await controller.myNewMethod(params.param);
  res.json({
    success: true,
    message: 'Method executed'
  });
  break;
}
```

**3. Document in README:**
Update API reference section.

### Testing Changes
```bash
npm run build
npm start

# In another terminal
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"my_new_method","params":{"param":"test"}}'
```

---

## 🚧 Roadmap

### ✅ Completed (Phases 1-4)
- Console & network monitoring
- Network interception & mocking
- Cookie & storage management
- HTTP server support methods
- Railway deployment config
- TypeScript compilation
- Production build

### ⏳ Coming Next (Phase 5+)
- **AI Vision Analysis** - GPT-4 Vision screenshot analysis
- **Device Emulation** - Mobile, tablet, desktop testing
- **Performance Metrics** - Load times, resource analysis
- **Video Recording** - Capture test execution
- **Multi-Page Support** - Popups, new windows
- **Authentication Scenarios** - OAuth, SSO testing

---

## 🤝 Contributing

This is the enhanced MCP Debugger built for the SMCHS Innovation Hub project.

**Original Project:** PlayMCP by @jomon003
**Enhanced By:** Innovation Hub Team

**Goals:**
- ✅ Production-grade browser automation
- ✅ Railway-ready deployment
- ✅ Real-time monitoring & debugging
- ⏳ AI-powered testing (coming soon)

---

## 📝 License

MIT License (inherited from PlayMCP)

---

## 🔗 Links

- **GitHub:** https://github.com/maizoro87/MCP-Debugger
- **Original PlayMCP:** https://github.com/jomon003/PlayMCP
- **Railway:** Deploy with one click
- **Playwright Docs:** https://playwright.dev/
- **Innovation Hub:** https://sm-innovation-hub.replit.app

---

## 🎓 Comparison: Original vs Enhanced

| Feature | Original PlayMCP | MCP Debugger |
|---------|-----------------|--------------|
| **Protocol** | stdio/JSON-RPC | HTTP REST API |
| **Deployment** | Local only | Railway-ready |
| **Console Monitoring** | ❌ | ✅ Real-time |
| **Network Monitoring** | ❌ | ✅ Full details |
| **API Mocking** | ❌ | ✅ Intercept & mock |
| **Cookie Management** | ❌ | ✅ Get, set, clear |
| **Screenshot** | File only | ✅ Base64 response |
| **Build Time** | Slow | 2-3 min (optimized) |
| **Production Ready** | No | ✅ Yes |
| **Health Checks** | ❌ | ✅ /health endpoint |
| **TypeScript** | ✅ | ✅ Enhanced |

---

**Built with ❤️ for comprehensive browser testing**

*Ready to deploy to Railway and start testing!*

# MCP-Debugger Testing Guide for Claude Code

**Universal guide for testing any Replit web application**

---

## 🎯 Quick Start

### MCP Server Configuration

Claude Code should already have `.claude/mcp.json` configured with:

```json
{
  "mcpServers": {
    "mcp-debugger": {
      "url": "https://mcp-debugger-online-production.up.railway.app/sse",
      "transport": "sse",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

---

## 🛠️ Available Tools (9 Total)

All tools are prefixed with `mcp-debugger__` when used in Claude Code.

### 1. `debug_navigate`

**Navigate to a URL and wait for page load**

**Parameters:**
```typescript
{
  url: string;              // Required: URL to navigate to
  waitUntil?: string;       // Optional: "load" | "domcontentloaded" | "networkidle" (default: "load")
  timeout?: number;         // Optional: timeout in ms (default: 30000)
}
```

**Returns:**
```typescript
{
  url: string;              // Final URL (after redirects)
  title: string;            // Page title
  loadTime: number;         // Load time in ms
  timestamp: string;
}
```

**Example:**
```typescript
// Navigate and wait for network to be idle
await use_mcp_tool("mcp-debugger", "debug_navigate", {
  url: "https://your-app.replit.app",
  waitUntil: "networkidle",
  timeout: 10000
});
```

---

### 2. `debug_screenshot`

**Capture screenshot of current page (uploads to Firebase, returns URL)**

**Parameters:**
```typescript
{
  fullPage?: boolean;       // Optional: capture full scrollable page (default: false)
  selector?: string;        // Optional: CSS selector for specific element
}
```

**Returns:**
```typescript
{
  screenshot_url: string;   // Firebase Storage URL (public, auto-deletes after 1 hour)
  dimensions: {
    width: number;
    height: number;
  };
  timestamp: string;
}
```

**Example:**
```typescript
// Capture full page screenshot
await use_mcp_tool("mcp-debugger", "debug_screenshot", {
  fullPage: true
});

// Screenshot specific element
await use_mcp_tool("mcp-debugger", "debug_screenshot", {
  selector: ".main-content"
});
```

**Note:** Screenshots are uploaded to Firebase Storage and return a public URL instead of base64. This prevents Claude from crashing on large images.

---

### 3. `debug_click`

**Click an element by CSS selector**

**Parameters:**
```typescript
{
  selector: string;         // Required: CSS selector
  waitForElement?: boolean; // Optional: wait for element to be visible (default: true)
  timeout?: number;         // Optional: timeout in ms (default: 30000)
}
```

**Returns:**
```typescript
{
  success: boolean;
  elementFound: boolean;
  clicked: boolean;
  timestamp: string;
}
```

**Example:**
```typescript
// Click a button
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: "button[type='submit']",
  waitForElement: true,
  timeout: 5000
});
```

---

### 4. `debug_type`

**Type text into an input field**

**Parameters:**
```typescript
{
  selector: string;         // Required: CSS selector for input
  text: string;             // Required: text to type
  clear?: boolean;          // Optional: clear existing content first (default: true)
  delay?: number;           // Optional: typing delay in ms (default: 0)
}
```

**Returns:**
```typescript
{
  success: boolean;
  finalValue: string;       // Value after typing
  timestamp: string;
}
```

**Example:**
```typescript
// Type into an input field
await use_mcp_tool("mcp-debugger", "debug_type", {
  selector: "#email",
  text: "user@example.com",
  clear: true
});
```

---

### 5. `debug_console`

**Get browser console messages (errors, warnings, logs)**

**Parameters:**
```typescript
{
  filter?: string;          // Optional: "error" | "warning" | "info" | "log"
  clear?: boolean;          // Optional: clear messages after retrieval (default: false)
}
```

**Returns:**
```typescript
{
  messages: Array<{
    type: string;           // "error" | "warning" | "info" | "log"
    text: string;           // Message text
    timestamp: string;
  }>;
  count: number;
  hasErrors: boolean;       // True if any errors present
}
```

**Example:**
```typescript
// Check for console errors
const result = await use_mcp_tool("mcp-debugger", "debug_console", {
  filter: "error"
});

if (result.hasErrors) {
  console.error("Console errors detected:", result.messages);
}
```

---

### 6. `debug_dom_state`

**Get current page state (title, URL, HTML content)**

**Parameters:**
```typescript
{
  includeHtml?: boolean;    // Optional: include full HTML (default: false)
  selector?: string;        // Optional: get HTML of specific element
}
```

**Returns:**
```typescript
{
  url: string;
  title: string;
  html?: string;            // If includeHtml=true
  timestamp: string;
}
```

**Example:**
```typescript
// Get page state after action
const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
  includeHtml: false
});

// Verify URL changed
assert(state.url.includes("/dashboard"));
```

---

### 7. `debug_network`

**Get network requests made by the page**

**Parameters:**
```typescript
{
  filter?: string;          // Optional: URL pattern to filter
  clear?: boolean;          // Optional: clear after retrieval (default: false)
}
```

**Returns:**
```typescript
{
  requests: Array<{
    url: string;
    method: string;         // "GET" | "POST" | "PUT" | "DELETE" etc.
    status: number;         // HTTP status code
    timing: {
      duration: number;     // Request duration in ms
    };
    timestamp: string;
  }>;
  count: number;
  failedRequests: number;   // Count of 4xx/5xx responses
}
```

**Example:**
```typescript
// Check API requests
const network = await use_mcp_tool("mcp-debugger", "debug_network", {
  filter: "/api/"
});

// Verify no failed API calls
assert(network.failedRequests === 0, "API requests failed");
```

---

### 8. `debug_cookies`

**Manage browser cookies (get, set, clear)**

**Parameters:**
```typescript
{
  action: string;           // Required: "get" | "set" | "clear"
  name?: string;            // Optional: cookie name (for get/set)
  value?: string;           // Optional: cookie value (for set)
  domain?: string;          // Optional: cookie domain
}
```

**Returns:**
```typescript
{
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
  }>;
  count: number;
}
```

**Example:**
```typescript
// Set authentication cookie
await use_mcp_tool("mcp-debugger", "debug_cookies", {
  action: "set",
  name: "session_id",
  value: "abc123xyz",
  domain: "your-app.replit.app"
});

// Get all cookies
const cookies = await use_mcp_tool("mcp-debugger", "debug_cookies", {
  action: "get"
});
```

---

### 9. `debug_analyze_visual`

**AI-powered screenshot analysis using Gemini (optional, requires GEMINI_API_KEY)**

**Parameters:**
```typescript
{
  prompt?: string;          // Optional: specific question about screenshot
  fullPage?: boolean;       // Optional: analyze full page (default: false)
}
```

**Returns:**
```typescript
{
  analysis: string;         // AI analysis of the screenshot
  screenshot_url: string;   // Firebase URL of analyzed screenshot
  timestamp: string;
}
```

**Example:**
```typescript
// Analyze page layout
const analysis = await use_mcp_tool("mcp-debugger", "debug_analyze_visual", {
  prompt: "List all visible UI elements and verify the page is fully loaded",
  fullPage: true
});
```

---

## 🎯 Testing Patterns

### Pattern 1: Complete User Flow (Login → Action → Verify)

**Use Case:** Test authenticated user flows

```typescript
async function testUserFlow() {
  // Step 1: Navigate to login
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://your-app.replit.app/login",
    waitUntil: "networkidle"
  });

  // Step 2: Fill login form
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#email",
    text: "user@example.com"
  });

  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#password",
    text: "password123"
  });

  // Step 3: Submit login
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  // Step 4: Wait for redirect
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 5: Verify login success
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
  assert(state.url.includes("/dashboard"), "Should redirect to dashboard");

  // Step 6: Take screenshot
  const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
    fullPage: true
  });
  console.log("Dashboard screenshot:", screenshot.screenshot_url);

  // Step 7: Check for errors
  const consoleMessages = await use_mcp_tool("mcp-debugger", "debug_console", {});
  assert(!consoleMessages.hasErrors, "No console errors should occur");

  return {
    success: true,
    screenshot: screenshot.screenshot_url
  };
}
```

---

### Pattern 2: Performance Testing

**Use Case:** Measure page load times, interaction delays

```typescript
async function testPagePerformance() {
  const startTime = Date.now();

  // Navigate and measure load time
  const navResult = await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://your-app.replit.app",
    waitUntil: "networkidle"
  });

  const loadTime = navResult.loadTime;
  console.log(`Page load time: ${loadTime}ms`);

  // Verify performance threshold
  assert(loadTime < 3000, `Page should load in <3s (actual: ${loadTime}ms)`);

  // Measure interaction performance
  const clickStart = Date.now();
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "a[href='/page']"
  });
  const clickDuration = Date.now() - clickStart;

  console.log(`Navigation click response: ${clickDuration}ms`);
  assert(clickDuration < 1000, "Click should respond in <1s");

  // Check network performance
  const network = await use_mcp_tool("mcp-debugger", "debug_network", {});

  const slowRequests = network.requests.filter(r => r.timing.duration > 2000);
  console.log(`Slow requests (>2s): ${slowRequests.length}`);

  if (slowRequests.length > 0) {
    console.warn("Slow requests detected:", slowRequests);
  }

  return {
    loadTime,
    clickDuration,
    slowRequests: slowRequests.length,
    totalRequests: network.count
  };
}
```

---

### Pattern 3: Content Verification

**Use Case:** Verify correct content is displayed, no missing elements

```typescript
async function testPageContent() {
  // Navigate to page
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://your-app.replit.app/page",
    waitUntil: "networkidle"
  });

  // Get page state
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
    includeHtml: true
  });

  // Verify page title
  assert(state.title.length > 0, "Page should have a title");

  // Take screenshot for manual verification
  const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
    fullPage: true
  });

  console.log("Content verification screenshot:", screenshot.screenshot_url);

  // Check for console errors
  const console = await use_mcp_tool("mcp-debugger", "debug_console", {
    filter: "error"
  });

  assert(!console.hasErrors, "Page should load without console errors");

  return {
    success: true,
    screenshot: screenshot.screenshot_url,
    title: state.title
  };
}
```

---

### Pattern 4: Form Validation Testing

**Use Case:** Test form validation, error states, edge cases

```typescript
async function testFormValidation() {
  // Navigate to form
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://your-app.replit.app/form"
  });

  // Test 1: Submit empty form (should show validation errors)
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  const screenshot1 = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
  console.log("Empty form validation:", screenshot1.screenshot_url);

  // Verify validation messages appeared
  const state1 = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
    includeHtml: true
  });

  assert(state1.html?.includes("required") || state1.html?.includes("validation"),
    "Validation errors should be shown");

  // Test 2: Fill with valid data
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#field1",
    text: "Valid input data"
  });

  // Submit and verify success
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  const screenshot2 = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
  console.log("Form submission result:", screenshot2.screenshot_url);

  return {
    success: true,
    screenshots: [screenshot1.screenshot_url, screenshot2.screenshot_url]
  };
}
```

---

### Pattern 5: Error State Testing

**Use Case:** Test error handling, network failures, edge cases

```typescript
async function testErrorHandling() {
  const results = [];

  // Test 1: Navigate to non-existent page (404)
  try {
    await use_mcp_tool("mcp-debugger", "debug_navigate", {
      url: "https://your-app.replit.app/nonexistent-page"
    });

    const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
    const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});

    results.push({
      test: "404 page",
      screenshot: screenshot.screenshot_url,
      shows404: state.html?.includes("404") || state.html?.includes("not found")
    });
  } catch (error) {
    results.push({
      test: "404 page",
      error: error.message
    });
  }

  // Test 2: Check console errors after problematic interaction
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://your-app.replit.app"
  });

  const console = await use_mcp_tool("mcp-debugger", "debug_console", {
    filter: "error"
  });

  results.push({
    test: "Console errors check",
    hasErrors: console.hasErrors,
    errors: console.messages
  });

  return results;
}
```

---

## ✅ Testing Best Practices

### 1. Always Use Specific Selectors

```typescript
// ❌ BAD - Too generic
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: "button"
});

// ✅ GOOD - Specific and reliable
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: "button[data-testid='submit-btn']"
});

// ✅ GOOD - Use semantic selectors
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: "button[aria-label='Save']"
});
```

### 2. Wait for State Changes

```typescript
// ❌ BAD - Race condition
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: ".submit-btn"
});
await use_mcp_tool("mcp-debugger", "debug_screenshot", {}); // Might capture loading state

// ✅ GOOD - Wait for completion
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: ".submit-btn"
});

// Wait for success indicator
await new Promise(resolve => setTimeout(resolve, 2000));

await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
```

### 3. Verify Outcomes, Don't Just Execute

```typescript
// ❌ BAD - No verification
await use_mcp_tool("mcp-debugger", "debug_type", {
  selector: "#input",
  text: "test"
});

// ✅ GOOD - Verify the action worked
await use_mcp_tool("mcp-debugger", "debug_type", {
  selector: "#input",
  text: "test"
});

const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
  includeHtml: true
});

assert(state.html?.includes("test"), "Input should be filled");
```

### 4. Capture Comprehensive Diagnostics

```typescript
// After each major action, capture state
async function captureState(label: string) {
  const [screenshot, console, network, state] = await Promise.all([
    use_mcp_tool("mcp-debugger", "debug_screenshot", { fullPage: true }),
    use_mcp_tool("mcp-debugger", "debug_console", {}),
    use_mcp_tool("mcp-debugger", "debug_network", {}),
    use_mcp_tool("mcp-debugger", "debug_dom_state", {})
  ]);

  console.log(`${label}:`, {
    screenshot: screenshot.screenshot_url,
    url: state.url,
    consoleErrors: console.messages.filter(m => m.type === "error"),
    failedRequests: network.failedRequests
  });

  return { screenshot, console, network, state };
}

// Use throughout test
await captureState("After login");
await captureState("After form submission");
await captureState("Final state");
```

### 5. Test Realistic User Journeys

```typescript
// ✅ GOOD - Complete user flow
async function testCompleteUserJourney() {
  // 1. User arrives at homepage
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://your-app.replit.app",
    waitUntil: "networkidle"
  });

  // 2. User clicks on navigation link
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "a[href='/page']"
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. User fills out form
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "input[name='search']",
    text: "search query"
  });

  // 4. User submits
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 5. Verify results
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
  assert(state.url.includes("/results"), "Should navigate to results");

  // 6. Capture final state
  const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
    fullPage: true
  });

  // 7. Check for errors
  const console = await use_mcp_tool("mcp-debugger", "debug_console", {
    filter: "error"
  });

  assert(!console.hasErrors, "User experience should be error-free");

  return {
    success: true,
    screenshot: screenshot.screenshot_url
  };
}
```

### 6. Measure Performance

```typescript
async function measureUserExperience() {
  const metrics = {
    pageLoads: [],
    interactions: [],
    networkRequests: []
  };

  // Measure page load
  const navResult = await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://your-app.replit.app",
    waitUntil: "networkidle"
  });
  metrics.pageLoads.push({
    page: "homepage",
    duration: navResult.loadTime
  });

  // Measure click interaction
  const clickStart = Date.now();
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: ".nav-link"
  });
  const clickEnd = Date.now();
  metrics.interactions.push({
    action: "navigation click",
    duration: clickEnd - clickStart
  });

  // Get network performance
  const network = await use_mcp_tool("mcp-debugger", "debug_network", {});
  metrics.networkRequests = network.requests.map(r => ({
    url: r.url,
    method: r.method,
    status: r.status,
    duration: r.timing.duration
  }));

  // Analyze performance
  const slowPages = metrics.pageLoads.filter(p => p.duration > 3000);
  const slowInteractions = metrics.interactions.filter(i => i.duration > 1000);
  const slowRequests = metrics.networkRequests.filter(r => r.duration > 2000);

  console.log("Performance Report:", {
    slowPages,
    slowInteractions,
    slowRequests
  });

  return metrics;
}
```

---

## 📊 Common Assertions

```typescript
// URL verification
async function assertUrl(expectedPattern: string) {
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
  assert(state.url.includes(expectedPattern),
    `URL should contain "${expectedPattern}", got: ${state.url}`);
}

// No console errors
async function assertNoConsoleErrors() {
  const console = await use_mcp_tool("mcp-debugger", "debug_console", {
    filter: "error"
  });
  assert(!console.hasErrors,
    `Should have no console errors, found: ${JSON.stringify(console.messages)}`);
}

// Performance threshold
async function assertPerformance(url: string, maxLoadTime: number) {
  const result = await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url,
    waitUntil: "networkidle"
  });
  assert(result.loadTime < maxLoadTime,
    `Load time should be < ${maxLoadTime}ms, got: ${result.loadTime}ms`);
}

// No failed network requests
async function assertNoNetworkFailures() {
  const network = await use_mcp_tool("mcp-debugger", "debug_network", {});
  assert(network.failedRequests === 0,
    `Should have 0 failed requests, found: ${network.failedRequests}`);
}
```

---

## 🚨 Common Mistakes to Avoid

### 1. ❌ Not Waiting for Async Operations

```typescript
// ❌ BAD
await use_mcp_tool("mcp-debugger", "debug_click", { selector: ".submit" });
const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});

// ✅ GOOD
await use_mcp_tool("mcp-debugger", "debug_click", { selector: ".submit" });
await new Promise(resolve => setTimeout(resolve, 2000));
const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
```

### 2. ❌ Ignoring Console Errors

```typescript
// ❌ BAD - Errors might indicate problems
await use_mcp_tool("mcp-debugger", "debug_navigate", { url: "..." });

// ✅ GOOD - Always check
await use_mcp_tool("mcp-debugger", "debug_navigate", { url: "..." });
const console = await use_mcp_tool("mcp-debugger", "debug_console", {
  filter: "error"
});
if (console.hasErrors) {
  console.error("Console errors detected:", console.messages);
}
```

### 3. ❌ Using Hard-Coded Delays

```typescript
// ❌ BAD - Unreliable and slow
await use_mcp_tool("mcp-debugger", "debug_click", { selector: ".btn" });
await new Promise(resolve => setTimeout(resolve, 5000)); // Too long, arbitrary

// ✅ GOOD - Wait for specific condition
await use_mcp_tool("mcp-debugger", "debug_click", { selector: ".btn" });
let loaded = false;
for (let i = 0; i < 10 && !loaded; i++) {
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
  if (state.url.includes("/success")) {
    loaded = true;
  } else {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
```

### 4. ❌ Not Capturing Diagnostics on Failure

```typescript
// ❌ BAD
try {
  await runTest();
} catch (error) {
  console.error("Test failed:", error);
}

// ✅ GOOD - Capture state on failure
try {
  await runTest();
} catch (error) {
  const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
  const console = await use_mcp_tool("mcp-debugger", "debug_console", {});
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});

  console.error("Test failed:", {
    error: error.message,
    screenshot: screenshot.screenshot_url,
    url: state.url,
    consoleErrors: console.messages
  });
}
```

---

## 🎓 Advanced Tips

### Helper Functions

```typescript
// Screenshot helper
async function captureAndLog(label: string) {
  const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
    fullPage: true
  });
  console.log(`[${label}] Screenshot: ${screenshot.screenshot_url}`);
  return screenshot.screenshot_url;
}

// Verification helper
async function verifyNoErrors() {
  const [console, network] = await Promise.all([
    use_mcp_tool("mcp-debugger", "debug_console", { filter: "error" }),
    use_mcp_tool("mcp-debugger", "debug_network", {})
  ]);

  assert(!console.hasErrors, "No console errors");
  assert(network.failedRequests === 0, "No failed requests");
}
```

### Use Browserless Session Replays

Every test creates a session on Browserless.io with 7-day video replay!

After running tests:
1. Go to https://www.browserless.io/account/sessions
2. Search for your session ID (visible in Railway logs)
3. Watch full replay with timeline, console, network

### Parallel Testing

Since each session is isolated, you can run multiple tests in parallel:

```typescript
const results = await Promise.all([
  testHomepageLoad(),
  testPageBrowsing(),
  testSearchFunctionality()
]);
```

---

## 📚 Performance Thresholds (Recommended)

**General guidelines:**
- Homepage load: < 3 seconds
- Secondary pages: < 4 seconds
- Click interactions: < 1 second
- Form submissions: < 2 seconds
- API calls: < 2 seconds each

**Adjust based on your application's complexity.**

---

## ✅ Quick Reference

| Tool | Primary Use | Key Parameters |
|------|-------------|----------------|
| `debug_navigate` | Load pages | `url`, `waitUntil` |
| `debug_screenshot` | Visual verification | `fullPage`, `selector` |
| `debug_click` | Click elements | `selector`, `waitForElement` |
| `debug_type` | Fill inputs | `selector`, `text`, `clear` |
| `debug_console` | Check errors | `filter`, `clear` |
| `debug_dom_state` | Get page state | `includeHtml` |
| `debug_network` | API monitoring | `filter`, `clear` |
| `debug_cookies` | Session management | `action`, `name`, `value` |
| `debug_analyze_visual` | AI analysis | `prompt`, `fullPage` |

---

**Happy Testing! 🚀**

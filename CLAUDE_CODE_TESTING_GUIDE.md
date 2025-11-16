# MCP-Debugger Testing Guide for Claude Code in Replit

**Complete guide for using MCP-Debugger to test Replit web applications**

---

## 🎯 Quick Start

### Step 1: Configure MCP Server

Create or update `.claude/mcp.json` in your Replit project root:

```json
{
  "mcpServers": {
    "mcp-debugger": {
      "url": "https://mcp-debugger-online-production.up.railway.app",
      "transport": "sse",
      "headers": {
        "X-API-Key": "YOUR_MCP_API_KEY_HERE"
      },
      "timeout": 60000,
      "description": "Browser automation testing with Browserless + Firebase"
    }
  }
}
```

**Replace `YOUR_MCP_API_KEY_HERE` with your actual API key.**

### Step 2: Restart Claude Code

After adding the config, restart Claude Code to load the MCP server.

### Step 3: Verify Connection

Ask Claude Code: "List available MCP tools"

You should see 9 debug tools available.

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
  url: "https://sm-innovation-hub.replit.app",
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
  selector: ".dashboard-content"
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
// Click create button
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: "button[data-testid='create-tool-btn']",
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
// Type into email field
await use_mcp_tool("mcp-debugger", "debug_type", {
  selector: "#email",
  text: "teacher@smchs.org",
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
  domain: "sm-innovation-hub.replit.app"
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
// Analyze dashboard layout
const analysis = await use_mcp_tool("mcp-debugger", "debug_analyze_visual", {
  prompt: "List all visible UI elements and verify the dashboard is fully loaded",
  fullPage: true
});
```

**Note:** This tool uses Gemini 2.5 Flash for AI vision analysis. Requires `GEMINI_API_KEY` set on Railway.

---

## 🎯 Testing Patterns for Replit Apps

### Pattern 1: Complete User Flow (Login → Action → Verify)

**Use Case:** Test authenticated user flows (teacher creating a tool, student accessing content, etc.)

```typescript
// Example: Teacher creates a new tool
async function testCreateTool() {
  // Step 1: Navigate to login
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://sm-innovation-hub.replit.app/login",
    waitUntil: "networkidle"
  });

  // Step 2: Fill login form
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#email",
    text: "teacher@smchs.org"
  });

  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#password",
    text: "testpassword123"
  });

  // Step 3: Submit login
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  // Step 4: Wait for dashboard
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 5: Verify dashboard loaded
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
  assert(state.url.includes("/dashboard"), "Should be on dashboard");

  // Step 6: Take screenshot to verify UI
  const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
    fullPage: true
  });
  console.log("Dashboard screenshot:", screenshot.screenshot_url);

  // Step 7: Click create tool button
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "[data-testid='create-tool-btn']"
  });

  // Step 8: Fill tool form
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#tool-name",
    text: "Test Browser Automation Tool"
  });

  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#tool-description",
    text: "Automated testing tool created via MCP"
  });

  // Step 9: Save tool
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  // Step 10: Wait for save completion
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 11: Verify success
  const consoleMessages = await use_mcp_tool("mcp-debugger", "debug_console", {});
  assert(!consoleMessages.hasErrors, "No console errors should occur");

  // Step 12: Check network requests
  const network = await use_mcp_tool("mcp-debugger", "debug_network", {
    filter: "/api/tools"
  });
  assert(network.failedRequests === 0, "All API requests should succeed");

  // Step 13: Final screenshot
  const finalScreenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
    fullPage: true
  });
  console.log("Success screenshot:", finalScreenshot.screenshot_url);

  return {
    success: true,
    screenshots: [screenshot.screenshot_url, finalScreenshot.screenshot_url]
  };
}
```

---

### Pattern 2: Performance Testing

**Use Case:** Measure page load times, interaction delays, verify performance

```typescript
async function testPagePerformance() {
  const startTime = Date.now();

  // Navigate and measure load time
  const navResult = await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://sm-innovation-hub.replit.app",
    waitUntil: "networkidle"
  });

  const loadTime = navResult.loadTime;
  console.log(`Page load time: ${loadTime}ms`);

  // Verify performance threshold
  assert(loadTime < 3000, `Page should load in <3s (actual: ${loadTime}ms)`);

  // Measure interaction performance
  const clickStart = Date.now();
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: ".tools-nav-link"
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
async function testToolsPageContent() {
  // Navigate to tools page
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://sm-innovation-hub.replit.app/tools",
    waitUntil: "networkidle"
  });

  // Get page state
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
    includeHtml: true
  });

  // Verify page title
  assert(state.title.includes("Tools"), "Page title should mention Tools");

  // Verify critical elements present
  const requiredElements = [
    ".tool-card",
    ".search-bar",
    ".category-filter",
    "button.create-tool"
  ];

  for (const selector of requiredElements) {
    const html = state.html || "";
    // Simple check - in production you'd parse the HTML properly
    assert(html.includes(selector.replace(".", "class=")),
      `Element ${selector} should be present`);
  }

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
    elementsVerified: requiredElements.length
  };
}
```

---

### Pattern 4: Form Validation Testing

**Use Case:** Test form validation, error states, edge cases

```typescript
async function testFormValidation() {
  // Navigate to create tool form
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://sm-innovation-hub.replit.app/admin/tools/create"
  });

  // Test 1: Submit empty form (should show validation errors)
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  const screenshot1 = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
  console.log("Empty form validation:", screenshot1.screenshot_url);

  // Verify validation messages appeared (check DOM or console)
  const state1 = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
    includeHtml: true
  });

  assert(state1.html?.includes("required") || state1.html?.includes("validation"),
    "Validation errors should be shown");

  // Test 2: Fill with invalid data
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#tool-name",
    text: "A" // Too short
  });

  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  const screenshot2 = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
  console.log("Invalid data validation:", screenshot2.screenshot_url);

  // Test 3: Fill with valid data
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#tool-name",
    text: "Valid Tool Name With Enough Characters"
  });

  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#tool-description",
    text: "A proper description that meets minimum length requirements"
  });

  // Submit and verify success
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check for success indicators
  const finalState = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});

  // Should redirect or show success message
  const success = finalState.url.includes("/tools") ||
                  finalState.html?.includes("success");

  const screenshot3 = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
  console.log("Form submission result:", screenshot3.screenshot_url);

  return {
    success,
    screenshots: [
      screenshot1.screenshot_url,
      screenshot2.screenshot_url,
      screenshot3.screenshot_url
    ]
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
      url: "https://sm-innovation-hub.replit.app/nonexistent-page-xyz"
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

  // Test 2: Click non-existent element
  try {
    await use_mcp_tool("mcp-debugger", "debug_navigate", {
      url: "https://sm-innovation-hub.replit.app"
    });

    await use_mcp_tool("mcp-debugger", "debug_click", {
      selector: ".this-element-does-not-exist-xyz",
      timeout: 3000
    });

    results.push({
      test: "Click non-existent element",
      unexpectedSuccess: true // Should have failed
    });
  } catch (error) {
    results.push({
      test: "Click non-existent element",
      properlyFailed: true,
      error: error.message
    });
  }

  // Test 3: Check console errors after problematic interaction
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://sm-innovation-hub.replit.app/tools"
  });

  // Do something that might cause errors
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: ".tool-card:first-child"
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

## ✅ Testing Best Practices for Replit Apps

### 1. Always Use Specific Selectors

```typescript
// ❌ BAD - Too generic, might click wrong element
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: "button"
});

// ✅ GOOD - Specific and reliable
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: "button[data-testid='create-tool-btn']"
});

// ✅ GOOD - Use semantic selectors
await use_mcp_tool("mcp-debugger", "debug_click", {
  selector: "button[aria-label='Save tool']"
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

// Or better: poll for expected state
let attempts = 0;
while (attempts < 10) {
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
  if (state.url.includes("/success") || state.html?.includes("saved")) {
    break;
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  attempts++;
}

await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
```

### 3. Verify Outcomes, Don't Just Execute

```typescript
// ❌ BAD - No verification
await use_mcp_tool("mcp-debugger", "debug_type", {
  selector: "#title",
  text: "My Tool"
});

// ✅ GOOD - Verify the action worked
await use_mcp_tool("mcp-debugger", "debug_type", {
  selector: "#title",
  text: "My Tool"
});

const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
  includeHtml: true
});

assert(state.html?.includes("My Tool"), "Title should be filled");
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
async function testStudentToolAccess() {
  // 1. Student arrives at homepage
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://sm-innovation-hub.replit.app",
    waitUntil: "networkidle"
  });

  // 2. Clicks on Tools section
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "a[href='/tools']"
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Searches for specific tool
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "input[type='search']",
    text: "Browser Automation"
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // 4. Clicks on tool card
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: ".tool-card:first-child"
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 5. Verifies tool details loaded
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
  assert(state.url.includes("/tools/"), "Should navigate to tool details");

  // 6. Takes screenshot for verification
  const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
    fullPage: true
  });

  // 7. Checks for errors
  const console = await use_mcp_tool("mcp-debugger", "debug_console", {
    filter: "error"
  });

  assert(!console.hasErrors, "Student experience should be error-free");

  return {
    success: true,
    screenshot: screenshot.screenshot_url,
    journey: "Homepage → Tools → Search → Tool Details"
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
  const navStart = Date.now();
  const navResult = await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://sm-innovation-hub.replit.app",
    waitUntil: "networkidle"
  });
  metrics.pageLoads.push({
    page: "homepage",
    duration: navResult.loadTime
  });

  // Measure click interaction
  const clickStart = Date.now();
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: ".tools-link"
  });
  const clickEnd = Date.now();
  metrics.interactions.push({
    action: "navigate to tools",
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

### 7. Clean Up After Tests

```typescript
async function runTest() {
  try {
    // Run your test
    await testFunction();

  } finally {
    // Clean up: clear cookies, storage, etc.
    await use_mcp_tool("mcp-debugger", "debug_cookies", {
      action: "clear"
    });

    // Clear console and network logs
    await use_mcp_tool("mcp-debugger", "debug_console", {
      clear: true
    });

    await use_mcp_tool("mcp-debugger", "debug_network", {
      clear: true
    });
  }
}
```

---

## 🚀 Complete Test Example: Teacher Workflow

```typescript
/**
 * Complete E2E test: Teacher creates and publishes a tool
 * Tests: Authentication, form filling, file upload, validation, publishing
 */
async function testTeacherCreateTool() {
  const testResults = {
    steps: [],
    screenshots: [],
    errors: [],
    performance: {}
  };

  try {
    // Step 1: Navigate to login
    console.log("Step 1: Navigating to login...");
    const navStart = Date.now();
    await use_mcp_tool("mcp-debugger", "debug_navigate", {
      url: "https://sm-innovation-hub.replit.app/login",
      waitUntil: "networkidle"
    });
    testResults.performance.loginPageLoad = Date.now() - navStart;
    testResults.steps.push({ step: 1, action: "navigate", success: true });

    // Capture login page
    const loginScreenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
    testResults.screenshots.push({ label: "Login page", url: loginScreenshot.screenshot_url });

    // Step 2: Fill login credentials
    console.log("Step 2: Filling login form...");
    await use_mcp_tool("mcp-debugger", "debug_type", {
      selector: "#email",
      text: "teacher@smchs.org",
      clear: true
    });

    await use_mcp_tool("mcp-debugger", "debug_type", {
      selector: "#password",
      text: "SecurePassword123!",
      clear: true
    });
    testResults.steps.push({ step: 2, action: "fill credentials", success: true });

    // Step 3: Submit login
    console.log("Step 3: Submitting login...");
    const loginStart = Date.now();
    await use_mcp_tool("mcp-debugger", "debug_click", {
      selector: "button[type='submit']"
    });

    // Wait for dashboard load
    await new Promise(resolve => setTimeout(resolve, 3000));
    testResults.performance.loginDuration = Date.now() - loginStart;

    // Verify login success
    const dashboardState = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});
    assert(dashboardState.url.includes("/dashboard") || dashboardState.url.includes("/admin"),
      "Should redirect to dashboard after login");
    testResults.steps.push({ step: 3, action: "login", success: true });

    // Capture dashboard
    const dashboardScreenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
      fullPage: true
    });
    testResults.screenshots.push({ label: "Dashboard", url: dashboardScreenshot.screenshot_url });

    // Step 4: Navigate to create tool
    console.log("Step 4: Opening create tool form...");
    await use_mcp_tool("mcp-debugger", "debug_click", {
      selector: "a[href*='/tools/create'], button[data-testid='create-tool-btn']"
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    testResults.steps.push({ step: 4, action: "open create form", success: true });

    // Step 5: Fill tool details
    console.log("Step 5: Filling tool details...");
    await use_mcp_tool("mcp-debugger", "debug_type", {
      selector: "#tool-name, input[name='name']",
      text: "Advanced Browser Testing Tool"
    });

    await use_mcp_tool("mcp-debugger", "debug_type", {
      selector: "#tool-description, textarea[name='description']",
      text: "A comprehensive browser automation testing tool that integrates with Claude Code for thorough E2E testing of Replit applications."
    });

    // Select category if available
    try {
      await use_mcp_tool("mcp-debugger", "debug_click", {
        selector: "select[name='category'], #category"
      });
      await use_mcp_tool("mcp-debugger", "debug_click", {
        selector: "option[value='testing'], option[value='development']"
      });
    } catch (error) {
      console.log("Category selection not available or different structure");
    }

    testResults.steps.push({ step: 5, action: "fill tool details", success: true });

    // Capture form state
    const formScreenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
    testResults.screenshots.push({ label: "Tool form filled", url: formScreenshot.screenshot_url });

    // Step 6: Submit tool creation
    console.log("Step 6: Submitting tool...");
    await use_mcp_tool("mcp-debugger", "debug_click", {
      selector: "button[type='submit'], button.save-btn"
    });

    // Wait for save completion
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for errors
    const consoleAfterSave = await use_mcp_tool("mcp-debugger", "debug_console", {
      filter: "error"
    });

    if (consoleAfterSave.hasErrors) {
      testResults.errors.push({
        step: 6,
        errors: consoleAfterSave.messages
      });
    }

    // Check network requests
    const networkAfterSave = await use_mcp_tool("mcp-debugger", "debug_network", {
      filter: "/api/"
    });

    if (networkAfterSave.failedRequests > 0) {
      testResults.errors.push({
        step: 6,
        failedRequests: networkAfterSave.requests.filter(r => r.status >= 400)
      });
    }

    testResults.steps.push({
      step: 6,
      action: "submit tool",
      success: !consoleAfterSave.hasErrors && networkAfterSave.failedRequests === 0
    });

    // Step 7: Verify tool created
    console.log("Step 7: Verifying tool creation...");
    const finalState = await use_mcp_tool("mcp-debugger", "debug_dom_state", {});

    const toolCreated = finalState.url.includes("/tools") ||
                        finalState.html?.includes("success") ||
                        finalState.html?.includes("created");

    testResults.steps.push({
      step: 7,
      action: "verify creation",
      success: toolCreated
    });

    // Final screenshot
    const finalScreenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
      fullPage: true
    });
    testResults.screenshots.push({ label: "After tool creation", url: finalScreenshot.screenshot_url });

    // Step 8: Navigate to tools list and verify tool appears
    console.log("Step 8: Verifying tool appears in list...");
    await use_mcp_tool("mcp-debugger", "debug_navigate", {
      url: "https://sm-innovation-hub.replit.app/tools"
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const toolsListState = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
      includeHtml: true
    });

    const toolAppears = toolsListState.html?.includes("Advanced Browser Testing Tool");
    testResults.steps.push({
      step: 8,
      action: "verify in list",
      success: toolAppears
    });

    const listScreenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {
      fullPage: true
    });
    testResults.screenshots.push({ label: "Tools list", url: listScreenshot.screenshot_url });

    // Summary
    const allStepsSucceeded = testResults.steps.every(s => s.success);
    const noErrors = testResults.errors.length === 0;

    testResults.summary = {
      totalSteps: testResults.steps.length,
      successfulSteps: testResults.steps.filter(s => s.success).length,
      failedSteps: testResults.steps.filter(s => !s.success).length,
      errors: testResults.errors.length,
      overallSuccess: allStepsSucceeded && noErrors,
      duration: {
        loginPageLoad: testResults.performance.loginPageLoad,
        loginDuration: testResults.performance.loginDuration
      }
    };

    console.log("\n=== Test Results ===");
    console.log("Overall Success:", testResults.summary.overallSuccess);
    console.log("Steps:", `${testResults.summary.successfulSteps}/${testResults.summary.totalSteps} passed`);
    console.log("Errors:", testResults.errors.length);
    console.log("\nScreenshots:");
    testResults.screenshots.forEach(s => {
      console.log(`  ${s.label}: ${s.url}`);
    });

    return testResults;

  } catch (error) {
    testResults.errors.push({
      fatal: true,
      error: error.message,
      stack: error.stack
    });

    // Try to capture error state
    try {
      const errorScreenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
      testResults.screenshots.push({ label: "Error state", url: errorScreenshot.screenshot_url });
    } catch (e) {
      console.error("Could not capture error screenshot:", e);
    }

    throw error;
  }
}
```

---

## 🎨 Test Scenarios Template

### Scenario 1: Anonymous User Browsing

```typescript
async function testAnonymousUserBrowsing() {
  // 1. Visit homepage
  // 2. Browse tools without login
  // 3. Click on tool details
  // 4. Verify can view but not edit
  // 5. Check performance metrics
}
```

### Scenario 2: Student Registration & Tool Usage

```typescript
async function testStudentWorkflow() {
  // 1. Navigate to registration
  // 2. Fill registration form
  // 3. Verify email validation
  // 4. Complete registration
  // 5. Login with new account
  // 6. Browse and use a tool
  // 7. Submit feedback
}
```

### Scenario 3: Teacher Admin Operations

```typescript
async function testTeacherAdminWorkflow() {
  // 1. Login as teacher
  // 2. Access admin dashboard
  // 3. Create new tool
  // 4. Edit existing tool
  // 5. Publish/unpublish tools
  // 6. Review student submissions
  // 7. Export data
}
```

### Scenario 4: Mobile Responsiveness

```typescript
async function testMobileResponsiveness() {
  // 1. Navigate with mobile viewport
  // 2. Test hamburger menu
  // 3. Verify touch interactions
  // 4. Check image scaling
  // 5. Test form inputs on mobile
}
```

---

## 📊 Common Assertions

```typescript
// URL verification
function assertUrl(expectedPattern: string) {
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
async function assertPerformance(maxLoadTime: number) {
  const result = await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "...",
    waitUntil: "networkidle"
  });
  assert(result.loadTime < maxLoadTime,
    `Load time should be < ${maxLoadTime}ms, got: ${result.loadTime}ms`);
}

// Element visibility
async function assertElementVisible(selector: string) {
  const state = await use_mcp_tool("mcp-debugger", "debug_dom_state", {
    includeHtml: true
  });
  assert(state.html?.includes(selector),
    `Element "${selector}" should be visible`);
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
// Screenshot might capture loading state

// ✅ GOOD
await use_mcp_tool("mcp-debugger", "debug_click", { selector: ".submit" });
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for completion
const screenshot = await use_mcp_tool("mcp-debugger", "debug_screenshot", {});
```

### 2. ❌ Testing Without Authentication When Required

```typescript
// ❌ BAD - Will fail if page requires auth
await use_mcp_tool("mcp-debugger", "debug_navigate", {
  url: "https://sm-innovation-hub.replit.app/admin/dashboard"
});

// ✅ GOOD - Login first
await loginAsTeacher();
await use_mcp_tool("mcp-debugger", "debug_navigate", {
  url: "https://sm-innovation-hub.replit.app/admin/dashboard"
});
```

### 3. ❌ Ignoring Console Errors

```typescript
// ❌ BAD - Errors might indicate problems
await use_mcp_tool("mcp-debugger", "debug_navigate", { url: "..." });
// No check for errors

// ✅ GOOD - Always check
await use_mcp_tool("mcp-debugger", "debug_navigate", { url: "..." });
const console = await use_mcp_tool("mcp-debugger", "debug_console", {
  filter: "error"
});
if (console.hasErrors) {
  console.error("Console errors detected:", console.messages);
}
```

### 4. ❌ Using Hard-Coded Delays

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

### 5. ❌ Not Capturing Diagnostics on Failure

```typescript
// ❌ BAD - Hard to debug failures
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

### Tip 1: Create Helper Functions

```typescript
// Login helper
async function loginAsTeacher() {
  await use_mcp_tool("mcp-debugger", "debug_navigate", {
    url: "https://sm-innovation-hub.replit.app/login"
  });
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#email",
    text: "teacher@smchs.org"
  });
  await use_mcp_tool("mcp-debugger", "debug_type", {
    selector: "#password",
    text: process.env.TEST_PASSWORD || "testpass"
  });
  await use_mcp_tool("mcp-debugger", "debug_click", {
    selector: "button[type='submit']"
  });
  await new Promise(resolve => setTimeout(resolve, 2000));
}

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

### Tip 2: Use Browserless Session Replays

Remember: Every test creates a session on Browserless.io with 7-day video replay!

After running tests:
1. Go to https://www.browserless.io/account/sessions
2. Search for your session ID (visible in Railway logs)
3. Watch full replay with timeline, console, network
4. Download HAR files for detailed analysis

### Tip 3: Parallel Testing

Since each session is isolated, you can run multiple tests in parallel:

```typescript
const results = await Promise.all([
  testHomepageLoad(),
  testToolsBrowsing(),
  testSearchFunctionality()
]);
```

---

## 📚 Resources

- **MCP-Debugger Repository:** https://github.com/maizoro87/MCP-Debugger-Browserless
- **Browserless Dashboard:** https://www.browserless.io/account/sessions
- **Firebase Console:** https://console.firebase.google.com
- **Railway Logs:** https://railway.app/dashboard → Your service → Deployments

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

For questions or issues, check the main documentation or Railway logs.

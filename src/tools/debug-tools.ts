/**
 * MCP Debugging Tools - Token-Optimized for Claude Code
 *
 * These 8 tools replace the 21 REST endpoints with efficient,
 * high-level debugging operations optimized for LLM usage.
 */

import { Tool } from '../mcp/types.js';
import { sessionManager } from '../session/manager.js';
import type { Page } from 'playwright';

/**
 * Tool 1: debug_navigate - Smart navigation with context
 *
 * Navigate to URL and return page summary (not full HTML)
 * Token-optimized: Returns structured summary instead of raw content
 */
export const debugNavigateTool: Tool = {
  name: 'debug_navigate',
  description: 'Navigate to a URL and get page summary. Returns title, URL, element count, and any console errors. Much more token-efficient than getting full HTML.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to navigate to (e.g., https://example.com or https://localhost:3000/login)'
      },
      waitForSelector: {
        type: 'string',
        description: 'Optional CSS selector to wait for before returning (e.g., "#dashboard" or ".content-loaded")'
      },
      timeout: {
        type: 'number',
        description: 'Navigation timeout in milliseconds (default: 30000)'
      }
    },
    required: ['url']
  }
};

export async function executeDebugNavigate(sessionId: string, args: any): Promise<string> {
  const { url, waitForSelector, timeout = 30000 } = args;

  const page = sessionManager.getSessionPage(sessionId);
  if (!page) {
    throw new Error('Session not initialized. This should not happen.');
  }

  // Navigate
  await page.goto(url, { timeout, waitUntil: 'domcontentloaded' });

  // Wait for selector if specified
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {
      // Non-fatal if selector not found
    });
  }

  // Wait a bit for page to settle
  await page.waitForTimeout(1000);

  // Collect page summary
  const title = await page.title();
  const currentUrl = page.url();

  // Get element counts (not full HTML!)
  const summary = await page.evaluate(() => {
    const getElementCount = (selector: string) => document.querySelectorAll(selector).length;

    return {
      elements: {
        total: document.querySelectorAll('*').length,
        buttons: getElementCount('button'),
        inputs: getElementCount('input'),
        links: getElementCount('a'),
        forms: getElementCount('form'),
        headings: getElementCount('h1, h2, h3, h4, h5, h6')
      },
      body: {
        hasContent: !!document.body?.textContent?.trim(),
        length: document.body?.textContent?.trim().length || 0
      },
      interactive: {
        clickable: getElementCount('[onclick], button, a[href]'),
        editable: getElementCount('input, textarea, select, [contenteditable="true"]')
      }
    };
  });

  // Get console errors (only errors, not all logs)
  const consoleLogs = sessionManager.getConsoleLogs(sessionId);
  const errors = consoleLogs
    .filter(log => log.type === 'error')
    .slice(-5) // Last 5 errors only
    .map(log => log.text);

  // Build token-efficient response
  const response = {
    success: true,
    navigation: {
      url: currentUrl,
      title: title || '(no title)',
      status: 'loaded'
    },
    page: {
      elements: summary.elements,
      interactive: summary.interactive,
      contentLength: summary.body.length
    },
    issues: {
      consoleErrors: errors,
      errorCount: errors.length
    }
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Tool 2: debug_interact - Interactive element manipulation
 *
 * Click, type, select elements efficiently
 * Token-optimized: Action + result in one call
 */
export const debugInteractTool: Tool = {
  name: 'debug_interact',
  description: 'Interact with page elements (click, type, select). Supports CSS selectors or natural descriptions. Returns action result and state changes.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['click', 'type', 'select', 'hover', 'clear'],
        description: 'The interaction type'
      },
      selector: {
        type: 'string',
        description: 'CSS selector (e.g., "#submit-btn", "input[type=email]", ".login-button")'
      },
      value: {
        type: 'string',
        description: 'Value for type/select actions (text to type or option to select)'
      },
      waitAfter: {
        type: 'number',
        description: 'Milliseconds to wait after action (default: 500)'
      }
    },
    required: ['action', 'selector']
  }
};

export async function executeDebugInteract(sessionId: string, args: any): Promise<string> {
  const { action, selector, value, waitAfter = 500 } = args;

  const page = sessionManager.getSessionPage(sessionId);
  if (!page) throw new Error('Session not initialized');

  const beforeUrl = page.url();

  // Perform action
  let result = '';
  switch (action) {
    case 'click':
      await page.click(selector);
      result = `Clicked element: ${selector}`;
      break;

    case 'type':
      if (!value) throw new Error('value required for type action');
      await page.fill(selector, value);
      result = `Typed "${value}" into ${selector}`;
      break;

    case 'select':
      if (!value) throw new Error('value required for select action');
      await page.selectOption(selector, value);
      result = `Selected "${value}" in ${selector}`;
      break;

    case 'hover':
      await page.hover(selector);
      result = `Hovered over ${selector}`;
      break;

    case 'clear':
      await page.fill(selector, '');
      result = `Cleared ${selector}`;
      break;

    default:
      throw new Error(`Unknown action: ${action}`);
  }

  // Wait for any effects
  await page.waitForTimeout(waitAfter);

  const afterUrl = page.url();
  const title = await page.title();

  // Check for new console errors
  const consoleLogs = sessionManager.getConsoleLogs(sessionId);
  const recentErrors = consoleLogs
    .filter(log => log.type === 'error')
    .slice(-2)
    .map(log => log.text);

  const response = {
    success: true,
    action: {
      performed: action,
      target: selector,
      value: value || null,
      result
    },
    stateChange: {
      urlChanged: beforeUrl !== afterUrl,
      previousUrl: beforeUrl,
      currentUrl: afterUrl,
      currentTitle: title
    },
    newErrors: recentErrors
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Tool 3: debug_inspect - Intelligent page inspection
 *
 * Get page structure without full HTML dump
 * Token-optimized: Structured summaries instead of raw HTML
 */
export const debugInspectTool: Tool = {
  name: 'debug_inspect',
  description: 'Inspect page structure and elements. Returns organized summaries of interactive elements, forms, links, etc. Much more efficient than getting full HTML.',
  inputSchema: {
    type: 'object',
    properties: {
      focus: {
        type: 'string',
        enum: ['all', 'forms', 'buttons', 'links', 'inputs', 'errors'],
        description: 'What to focus inspection on (default: all)'
      },
      selector: {
        type: 'string',
        description: 'Optional CSS selector to limit inspection scope (e.g., "#main-content")'
      }
    }
  }
};

export async function executeDebugInspect(sessionId: string, args: any): Promise<string> {
  const { focus = 'all', selector } = args;

  const page = sessionManager.getSessionPage(sessionId);
  if (!page) throw new Error('Session not initialized');

  const inspection = await page.evaluate((opts) => {
    const { focus, selector } = opts;
    const root = selector ? document.querySelector(selector) : document.body;
    if (!root) return { error: 'Selector not found' };

    const result: any = {};

    if (focus === 'all' || focus === 'forms') {
      result.forms = Array.from(root.querySelectorAll('form') as NodeListOf<HTMLFormElement>).map((form, i) => ({
        index: i,
        action: form.action || '(none)',
        method: form.method || 'get',
        fields: Array.from(form.querySelectorAll('input, select, textarea') as NodeListOf<Element>).map((field) => ({
          name: field.getAttribute('name') || '(unnamed)',
          type: field.getAttribute('type') || field.tagName.toLowerCase(),
          id: field.id || null,
          required: field.hasAttribute('required')
        }))
      }));
    }

    if (focus === 'all' || focus === 'buttons') {
      result.buttons = Array.from(root.querySelectorAll('button, input[type="submit"], input[type="button"]') as NodeListOf<HTMLElement>)
        .map((btn, i) => ({
          index: i,
          text: btn.textContent?.trim() || (btn as HTMLInputElement).value || '(no text)',
          type: btn.getAttribute('type') || 'button',
          id: btn.id || null,
          disabled: btn.hasAttribute('disabled')
        }));
    }

    if (focus === 'all' || focus === 'links') {
      result.links = Array.from(root.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>)
        .slice(0, 20) // Limit to 20 to avoid token explosion
        .map((link, i) => ({
          index: i,
          text: link.textContent?.trim() || '(no text)',
          href: link.href
        }));
    }

    if (focus === 'all' || focus === 'inputs') {
      result.inputs = Array.from(root.querySelectorAll('input, textarea, select') as NodeListOf<HTMLInputElement>)
        .map((input, i) => ({
          index: i,
          type: input.getAttribute('type') || input.tagName.toLowerCase(),
          name: input.getAttribute('name') || '(unnamed)',
          id: input.id || null,
          placeholder: input.getAttribute('placeholder') || null,
          value: input.value || null
        }));
    }

    return result;
  }, { focus, selector });

  // Add console errors if requested
  if (focus === 'all' || focus === 'errors') {
    const errors = sessionManager.getConsoleLogs(sessionId)
      .filter(log => log.type === 'error')
      .slice(-10)
      .map(log => log.text);

    (inspection as any).consoleErrors = errors;
  }

  const response = {
    success: true,
    inspection,
    url: page.url(),
    title: await page.title()
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Tool 4: debug_test_flow - Multi-step authenticated workflows
 *
 * Execute complete test flows in one call with session persistence
 * Token-optimized: One call instead of 10+ separate requests
 */
export const debugTestFlowTool: Tool = {
  name: 'debug_test_flow',
  description: 'Execute multi-step test flows with persistent session (login → navigate → interact → verify). All steps share the same browser context, so authentication persists. Returns detailed step results.',
  inputSchema: {
    type: 'object',
    properties: {
      startUrl: {
        type: 'string',
        description: 'Starting URL for the flow'
      },
      steps: {
        type: 'array',
        description: 'Array of steps to execute in sequence',
        items: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['navigate', 'click', 'type', 'wait', 'verify_visible', 'verify_text', 'verify_url'],
              description: 'Step action'
            },
            selector: {
              type: 'string',
              description: 'CSS selector (for click, type, verify actions)'
            },
            value: {
              type: 'string',
              description: 'Value (for type, verify_text, verify_url actions)'
            },
            duration: {
              type: 'number',
              description: 'Wait duration in ms (for wait action)'
            },
            url: {
              type: 'string',
              description: 'URL (for navigate action)'
            }
          },
          required: ['action']
        }
      }
    },
    required: ['startUrl', 'steps']
  }
};

export async function executeDebugTestFlow(sessionId: string, args: any): Promise<string> {
  const { startUrl, steps } = args;

  const page = sessionManager.getSessionPage(sessionId);
  if (!page) throw new Error('Session not initialized');

  const results: any[] = [];
  let failedSteps = 0;

  // Navigate to start URL
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  results.push({
    step: 0,
    action: 'navigate',
    url: startUrl,
    success: true,
    currentUrl: page.url()
  });

  // Execute each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const startTime = Date.now();

    try {
      switch (step.action) {
        case 'navigate':
          await page.goto(step.url, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(1000);
          results.push({
            step: i + 1,
            action: step.action,
            url: step.url,
            success: true,
            duration: Date.now() - startTime,
            currentUrl: page.url()
          });
          break;

        case 'click':
          await page.click(step.selector);
          await page.waitForTimeout(500);
          results.push({
            step: i + 1,
            action: step.action,
            selector: step.selector,
            success: true,
            duration: Date.now() - startTime
          });
          break;

        case 'type':
          await page.fill(step.selector, step.value);
          results.push({
            step: i + 1,
            action: step.action,
            selector: step.selector,
            value: step.value,
            success: true,
            duration: Date.now() - startTime
          });
          break;

        case 'wait':
          await page.waitForTimeout(step.duration || 1000);
          results.push({
            step: i + 1,
            action: step.action,
            duration: step.duration || 1000,
            success: true
          });
          break;

        case 'verify_visible':
          const isVisible = await page.isVisible(step.selector);
          results.push({
            step: i + 1,
            action: step.action,
            selector: step.selector,
            success: isVisible,
            result: isVisible ? 'Element is visible' : 'Element NOT visible',
            duration: Date.now() - startTime
          });
          if (!isVisible) failedSteps++;
          break;

        case 'verify_text':
          const text = await page.textContent(step.selector);
          const matches = text?.includes(step.value);
          results.push({
            step: i + 1,
            action: step.action,
            selector: step.selector,
            expected: step.value,
            actual: text?.substring(0, 100),
            success: matches,
            duration: Date.now() - startTime
          });
          if (!matches) failedSteps++;
          break;

        case 'verify_url':
          const currentUrl = page.url();
          const urlMatches = currentUrl.includes(step.value);
          results.push({
            step: i + 1,
            action: step.action,
            expected: step.value,
            actual: currentUrl,
            success: urlMatches,
            duration: Date.now() - startTime
          });
          if (!urlMatches) failedSteps++;
          break;

        default:
          throw new Error(`Unknown action: ${step.action}`);
      }
    } catch (error: any) {
      results.push({
        step: i + 1,
        action: step.action,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      failedSteps++;
    }
  }

  // Get final state
  const finalUrl = page.url();
  const finalTitle = await page.title();
  const errors = sessionManager.getConsoleLogs(sessionId)
    .filter(log => log.type === 'error')
    .slice(-5)
    .map(log => log.text);

  const response = {
    success: failedSteps === 0,
    summary: {
      totalSteps: steps.length + 1,
      passedSteps: steps.length + 1 - failedSteps,
      failedSteps
    },
    steps: results,
    finalState: {
      url: finalUrl,
      title: finalTitle,
      consoleErrors: errors
    }
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Tool 5: debug_verify - Smart verification
 *
 * Check element states without screenshots
 * Token-optimized: Boolean/text results only
 */
export const debugVerifyTool: Tool = {
  name: 'debug_verify',
  description: 'Verify page state (element visibility, text content, URL). Returns boolean/text results without screenshots.',
  inputSchema: {
    type: 'object',
    properties: {
      checks: {
        type: 'array',
        description: 'Array of verification checks to perform',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['element_visible', 'element_exists', 'text_contains', 'url_contains', 'no_console_errors'],
              description: 'Type of verification'
            },
            selector: {
              type: 'string',
              description: 'CSS selector (for element checks)'
            },
            value: {
              type: 'string',
              description: 'Expected value (for text/url checks)'
            }
          },
          required: ['type']
        }
      }
    },
    required: ['checks']
  }
};

export async function executeDebugVerify(sessionId: string, args: any): Promise<string> {
  const { checks } = args;

  const page = sessionManager.getSessionPage(sessionId);
  if (!page) throw new Error('Session not initialized');

  const results: any[] = [];
  let failedChecks = 0;

  for (const check of checks) {
    try {
      let passed = false;
      let details = '';

      switch (check.type) {
        case 'element_visible':
          passed = await page.isVisible(check.selector);
          details = passed ? 'Element is visible' : 'Element is NOT visible or does not exist';
          break;

        case 'element_exists':
          const element = await page.$(check.selector);
          passed = element !== null;
          details = passed ? 'Element exists' : 'Element does NOT exist';
          break;

        case 'text_contains':
          const text = await page.textContent(check.selector);
          passed = text?.includes(check.value) || false;
          details = passed
            ? `Text contains "${check.value}"`
            : `Text does NOT contain "${check.value}". Found: ${text?.substring(0, 100)}`;
          break;

        case 'url_contains':
          const url = page.url();
          passed = url.includes(check.value);
          details = passed
            ? `URL contains "${check.value}"`
            : `URL does NOT contain "${check.value}". Current: ${url}`;
          break;

        case 'no_console_errors':
          const errors = sessionManager.getConsoleLogs(sessionId)
            .filter(log => log.type === 'error');
          passed = errors.length === 0;
          details = passed
            ? 'No console errors'
            : `Found ${errors.length} console errors: ${errors.slice(0, 2).map(e => e.text).join(', ')}`;
          break;

        default:
          throw new Error(`Unknown check type: ${check.type}`);
      }

      results.push({
        check: check.type,
        selector: check.selector || null,
        expected: check.value || null,
        passed,
        details
      });

      if (!passed) failedChecks++;

    } catch (error: any) {
      results.push({
        check: check.type,
        selector: check.selector || null,
        passed: false,
        error: error.message
      });
      failedChecks++;
    }
  }

  const response = {
    success: failedChecks === 0,
    summary: {
      totalChecks: checks.length,
      passedChecks: checks.length - failedChecks,
      failedChecks
    },
    checks: results,
    url: page.url(),
    title: await page.title()
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Tool 6: debug_screenshot - Get current page screenshot
 *
 * Returns screenshot directly to Claude for visual inspection
 */
export const debugScreenshotTool: Tool = {
  name: 'debug_screenshot',
  description: 'Capture screenshot of current page or specific element. Returns base64 PNG that Claude can see directly. Use this to verify visual state, check if elements are visible, or inspect layout.',
  inputSchema: {
    type: 'object',
    properties: {
      fullPage: {
        type: 'boolean',
        description: 'Capture full page (default: false, viewport only)'
      },
      selector: {
        type: 'string',
        description: 'Optional: Capture only this element instead of full page'
      },
      description: {
        type: 'string',
        description: 'Optional: What you want to check in the screenshot (helps with analysis)'
      }
    }
  }
};

export async function executeDebugScreenshot(sessionId: string, args: any): Promise<string> {
  const { fullPage = false, selector, description } = args;

  const page = sessionManager.getSessionPage(sessionId);
  if (!page) throw new Error('Session not initialized');

  // Take screenshot
  let screenshot: Buffer;
  if (selector) {
    const element = await page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    screenshot = await element.screenshot({ type: 'png' });
  } else {
    screenshot = await page.screenshot({ fullPage, type: 'png' });
  }

  // Return as base64 so Claude can see it
  const response = {
    success: true,
    url: page.url(),
    title: await page.title(),
    screenshot: `data:image/png;base64,${screenshot.toString('base64')}`,
    description: description || 'Current page screenshot',
    note: 'Claude can see this screenshot directly and analyze what\'s happening visually'
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Tool 7: debug_analyze_visual - Gemini Vision (use sparingly!)
 *
 * Visual analysis only when needed
 * Token-optimized: Strategic use, not default behavior
 */
export const debugAnalyzeVisualTool: Tool = {
  name: 'debug_analyze_visual',
  description: 'Take screenshot and analyze with Gemini Vision AI. Use ONLY when visual inspection is truly needed (layout issues, visual bugs). Very token-intensive, use sparingly!',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Specific question about the visual appearance (e.g., "Is the login button visible?" or "Are there any layout issues?")'
      },
      fullPage: {
        type: 'boolean',
        description: 'Capture full page (default: false, viewport only)'
      },
      selector: {
        type: 'string',
        description: 'Optional: Capture only this element instead of full page'
      }
    }
  }
};

export async function executeDebugAnalyzeVisual(sessionId: string, args: any): Promise<string> {
  const { prompt, fullPage = false, selector } = args;

  const page = sessionManager.getSessionPage(sessionId);
  if (!page) throw new Error('Session not initialized');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }

  // Take screenshot
  let screenshot: Buffer;
  if (selector) {
    const element = await page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    screenshot = await element.screenshot({ type: 'png' });
  } else {
    screenshot = await page.screenshot({ fullPage, type: 'png' });
  }

  // Analyze with Gemini
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const analysisPrompt = prompt || 'Describe this screenshot in detail, focusing on UI elements, layout, and any visual issues.';

  const result = await model.generateContent([
    analysisPrompt,
    {
      inlineData: {
        data: screenshot.toString('base64'),
        mimeType: 'image/png'
      }
    }
  ]);

  const response = await result.response;
  const analysis = response.text();

  const output = {
    success: true,
    analysis,
    url: page.url(),
    title: await page.title(),
    screenshotIncluded: true,
    warning: 'Visual analysis is token-intensive. Use debug_inspect or debug_verify for most checks.'
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Tool 7: debug_console_errors - Error monitoring
 *
 * Get console errors efficiently
 * Token-optimized: Only errors, not all logs
 */
export const debugConsoleErrorsTool: Tool = {
  name: 'debug_console_errors',
  description: 'Get console errors from the page. Returns only errors (not warnings/logs) to save tokens. Can filter by time or clear buffer.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get', 'clear', 'get_and_clear'],
        description: 'Action to perform (default: get)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of errors to return (default: 10, max: 50)'
      }
    }
  }
};

export async function executeDebugConsoleErrors(sessionId: string, args: any): Promise<string> {
  const { action = 'get', limit = 10 } = args;

  const errors = sessionManager.getConsoleLogs(sessionId)
    .filter(log => log.type === 'error')
    .slice(-Math.min(limit, 50))
    .map(log => ({
      text: log.text,
      timestamp: log.timestamp.toISOString()
    }));

  if (action === 'clear' || action === 'get_and_clear') {
    sessionManager.clearConsoleLogs(sessionId);
  }

  const response = {
    success: true,
    action,
    errorCount: errors.length,
    errors,
    cleared: action !== 'get'
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Tool 8: debug_network_analyze - Network inspection
 *
 * Analyze network requests efficiently
 * Token-optimized: Only failed/slow requests
 */
export const debugNetworkAnalyzeTool: Tool = {
  name: 'debug_network_analyze',
  description: 'Analyze network requests (failed requests, slow requests, API errors). Returns only problematic requests to save tokens.',
  inputSchema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        enum: ['failed', 'slow', 'all', 'api_only'],
        description: 'Filter type (default: failed)'
      },
      slowThresholdMs: {
        type: 'number',
        description: 'Threshold for "slow" requests in ms (default: 3000)'
      },
      action: {
        type: 'string',
        enum: ['get', 'clear', 'get_and_clear'],
        description: 'Action (default: get)'
      }
    }
  }
};

export async function executeDebugNetworkAnalyze(sessionId: string, args: any): Promise<string> {
  const { filter = 'failed', slowThresholdMs = 3000, action = 'get' } = args;

  let requests = sessionManager.getNetworkRequests(sessionId);

  // Apply filter
  switch (filter) {
    case 'failed':
      requests = requests.filter(r => r.status && r.status >= 400);
      break;

    case 'slow':
      // Note: We don't have timing info in current implementation
      // This would require enhancing the session manager
      requests = requests.slice(-20); // Last 20 as proxy
      break;

    case 'api_only':
      requests = requests.filter(r =>
        r.url.includes('/api/') ||
        r.url.includes('/graphql') ||
        r.method !== 'GET'
      );
      break;

    case 'all':
      requests = requests.slice(-50); // Last 50 to avoid token explosion
      break;
  }

  if (action === 'clear' || action === 'get_and_clear') {
    sessionManager.clearNetworkRequests(sessionId);
  }

  const summary = {
    total: sessionManager.getNetworkRequests(sessionId).length,
    failed: sessionManager.getNetworkRequests(sessionId).filter(r => r.status && r.status >= 400).length
  };

  const response = {
    success: true,
    filter,
    action,
    summary,
    requests: requests.slice(-20).map(r => ({
      url: r.url,
      method: r.method,
      status: r.status,
      timestamp: r.timestamp.toISOString()
    })),
    cleared: action !== 'get'
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Export all tools
 */
export const allDebugTools: Tool[] = [
  debugNavigateTool,
  debugInteractTool,
  debugInspectTool,
  debugTestFlowTool,
  debugVerifyTool,
  debugScreenshotTool,
  debugAnalyzeVisualTool,
  debugConsoleErrorsTool,
  debugNetworkAnalyzeTool
];

/**
 * Tool execution router
 */
export async function executeDebugTool(
  toolName: string,
  sessionId: string,
  args: any
): Promise<string> {
  let result: string;

  // Execute the tool
  switch (toolName) {
    case 'debug_navigate':
      result = await executeDebugNavigate(sessionId, args);
      break;

    case 'debug_interact':
      result = await executeDebugInteract(sessionId, args);
      break;

    case 'debug_inspect':
      result = await executeDebugInspect(sessionId, args);
      break;

    case 'debug_test_flow':
      result = await executeDebugTestFlow(sessionId, args);
      break;

    case 'debug_verify':
      result = await executeDebugVerify(sessionId, args);
      break;

    case 'debug_screenshot':
      result = await executeDebugScreenshot(sessionId, args);
      break;

    case 'debug_analyze_visual':
      result = await executeDebugAnalyzeVisual(sessionId, args);
      break;

    case 'debug_console_errors':
      result = await executeDebugConsoleErrors(sessionId, args);
      break;

    case 'debug_network_analyze':
      result = await executeDebugNetworkAnalyze(sessionId, args);
      break;

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }

  // Auto-capture screenshot after tool execution if enabled
  const autoScreenshot = process.env.AUTO_SCREENSHOT_AFTER_ACTION === 'true';
  if (autoScreenshot) {
    try {
      await sessionManager.captureScreenshot(sessionId, `after_${toolName}`);
    } catch (error: any) {
      console.warn(`Failed to auto-capture screenshot for ${toolName}:`, error.message);
    }
  }

  return result;
}

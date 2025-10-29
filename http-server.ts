/**
 * HTTP Wrapper for PlayMCP Playwright Browser Automation
 *
 * This provides an HTTP API for browser automation testing.
 * Designed for Railway deployment with optimized build times.
 *
 * Now uses the enhanced PlaywrightController with:
 * - Fixed console/network monitoring
 * - Network interception & mocking
 * - Cookie & storage management
 * - AI vision capabilities (coming soon)
 */

import express from 'express';
import { playwrightController } from './src/controllers/playwright.js';

const app = express();
app.use(express.json());

// Initialize browser on startup
async function initBrowser() {
  // Use the enhanced controller
  if (!playwrightController.isInitialized()) {
    await playwrightController.openBrowser(true, false); // headless=true, debug=false
  }
  return playwrightController;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'playwright-mcp', timestamp: new Date().toISOString() });
});

// Navigate endpoint
app.post('/mcp', async (req, res) => {
  try {
    const { method, params } = req.body;
    await initBrowser();

    switch (method) {
      case 'navigate': {
        const controller = await initBrowser();
        await controller.navigate(params.url);
        res.json({
          success: true,
          message: 'Navigation complete',
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'get_content': {
        const controller = await initBrowser();

        if (params.url) {
          await controller.navigate(params.url);
        }

        const html = await controller.getPageSource();
        const text = await controller.getPageText();
        const title = await controller.getPageTitle();
        const url = await controller.getPageUrl();

        res.json({
          success: true,
          url,
          title,
          html: params.includeHtml !== false ? html : undefined,
          text: params.includeText !== false ? text : undefined,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'screenshot': {
        const controller = await initBrowser();

        if (params.url) {
          await controller.navigate(params.url);
        }

        const screenshot = await controller.screenshotBuffer({
          fullPage: params.fullPage !== false,
          type: params.type || 'png'
        });

        res.json({
          success: true,
          screenshot: screenshot.toString('base64'),
          url: await controller.getPageUrl(),
          title: await controller.getPageTitle(),
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'evaluate': {
        const controller = await initBrowser();

        if (params.url) {
          await controller.navigate(params.url);
        }

        const result = await controller.evaluateWithReturn(params.script);

        res.json({
          success: true,
          result,
          url: await controller.getPageUrl(),
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'wait_for_selector': {
        const controller = await initBrowser();

        if (params.url) {
          await controller.navigate(params.url);
        }

        await controller.waitForSelector(params.selector, params.timeout || 30000);

        res.json({
          success: true,
          selector: params.selector,
          found: true,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'multi_step_test': {
        const controller = await initBrowser();
        await controller.navigate(params.url);

        const results = [];
        let failedSteps = 0;

        for (let i = 0; i < params.steps.length; i++) {
          const step = params.steps[i];
          const startTime = Date.now();

          try {
            switch (step.action) {
              case 'wait':
                await controller.waitFor(step.duration || 1000);
                results.push({
                  step: i + 1,
                  action: step.action,
                  duration: Date.now() - startTime,
                  success: true
                });
                break;

              case 'click':
                await controller.click(step.selector);
                results.push({
                  step: i + 1,
                  action: step.action,
                  success: true
                });
                break;

              case 'type':
                await controller.fill(step.selector, step.text);
                results.push({
                  step: i + 1,
                  action: step.action,
                  success: true
                });
                break;

              case 'is_visible':
                const isVisible = await controller.isElementVisible(step.selector);
                results.push({
                  step: i + 1,
                  action: step.action,
                  duration: Date.now() - startTime,
                  success: isVisible
                });
                if (!isVisible) failedSteps++;
                break;

              case 'dom_state':
                const title = await controller.getPageTitle();
                results.push({
                  step: i + 1,
                  action: step.action,
                  duration: Date.now() - startTime,
                  success: true,
                  data: { title }
                });
                break;

              case 'evaluate':
                const result = await controller.evaluateWithReturn(step.script);
                results.push({
                  step: i + 1,
                  action: step.action,
                  result: String(result),
                  duration: Date.now() - startTime,
                  success: true
                });
                break;

              default:
                results.push({
                  step: i + 1,
                  action: step.action,
                  success: false,
                  error: `Unknown action: ${step.action}`
                });
                failedSteps++;
            }
          } catch (error: any) {
            results.push({
              step: i + 1,
              action: step.action,
              success: false,
              error: error.message
            });
            failedSteps++;
          }
        }

        // Get console messages and network requests if monitoring was enabled
        const consoleLogs = await controller.getConsoleMessages();
        const networkLogs = await controller.getNetworkRequests();

        res.json({
          success: failedSteps === 0,
          totalSteps: params.steps.length,
          completedSteps: params.steps.length - failedSteps,
          failedSteps,
          steps: results,
          finalUrl: await controller.getPageUrl(),
          finalTitle: await controller.getPageTitle(),
          consoleLogs: consoleLogs.map(m => `${m.type}: ${m.text}`),
          networkRequests: networkLogs.map(r => ({
            url: r.url,
            method: r.method,
            status: r.status
          })),
          timestamp: new Date().toISOString()
        });
        break;
      }

      // NEW: Console & Network Monitoring
      case 'get_console_messages': {
        const controller = await initBrowser();
        const messages = await controller.getConsoleMessages();
        res.json({
          success: true,
          messages,
          count: messages.length,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'get_network_requests': {
        const controller = await initBrowser();
        const requests = await controller.getNetworkRequests();
        res.json({
          success: true,
          requests,
          count: requests.length,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'clear_console_messages': {
        const controller = await initBrowser();
        await controller.clearConsoleMessages();
        res.json({
          success: true,
          message: 'Console messages cleared',
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'clear_network_requests': {
        const controller = await initBrowser();
        await controller.clearNetworkRequests();
        res.json({
          success: true,
          message: 'Network requests cleared',
          timestamp: new Date().toISOString()
        });
        break;
      }

      // NEW: Network Interception & Mocking
      case 'intercept_request': {
        const controller = await initBrowser();
        await controller.interceptRequest(
          params.urlPattern,
          params.action,
          params.mockResponse
        );
        res.json({
          success: true,
          message: 'Request interception set up',
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'mock_api_response': {
        const controller = await initBrowser();
        await controller.mockApiResponse(
          params.url,
          params.mockData,
          params.status || 200
        );
        res.json({
          success: true,
          message: 'API response mocked',
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'block_resources': {
        const controller = await initBrowser();
        await controller.blockResources(params.resourceTypes);
        res.json({
          success: true,
          message: 'Resource blocking set up',
          blockedTypes: params.resourceTypes,
          timestamp: new Date().toISOString()
        });
        break;
      }

      // NEW: Cookie Management
      case 'get_cookies': {
        const controller = await initBrowser();
        const cookies = await controller.getCookies(params.name);
        res.json({
          success: true,
          cookies,
          count: cookies.length,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'set_cookie': {
        const controller = await initBrowser();
        await controller.setCookie(params.cookie);
        res.json({
          success: true,
          message: 'Cookie set successfully',
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'clear_cookies': {
        const controller = await initBrowser();
        await controller.clearCookies();
        res.json({
          success: true,
          message: 'All cookies cleared',
          timestamp: new Date().toISOString()
        });
        break;
      }

      // NEW: Storage Management
      case 'get_local_storage': {
        const controller = await initBrowser();
        const data = await controller.getLocalStorage(params.key);
        res.json({
          success: true,
          data,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'set_local_storage': {
        const controller = await initBrowser();
        await controller.setLocalStorage(params.key, params.value);
        res.json({
          success: true,
          message: 'localStorage set successfully',
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'clear_local_storage': {
        const controller = await initBrowser();
        await controller.clearLocalStorage();
        res.json({
          success: true,
          message: 'localStorage cleared',
          timestamp: new Date().toISOString()
        });
        break;
      }

      default:
        res.status(400).json({
          success: false,
          error: `Unknown method: ${method}`
        });
    }
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Close browser on shutdown
process.on('SIGTERM', async () => {
  if (playwrightController.isInitialized()) {
    await playwrightController.closeBrowser();
  }
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Playwright MCP HTTP server running on port ${PORT}`);
});

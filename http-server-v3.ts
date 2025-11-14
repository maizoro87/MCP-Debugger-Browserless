/**
 * MCP-Debugger v3.0 - Unified HTTP + MCP SSE Server
 *
 * Provides BOTH:
 * 1. MCP SSE protocol (new) - For Claude Code integration
 * 2. REST API (legacy) - For backward compatibility
 *
 * Architecture:
 * - /sse - MCP protocol over Server-Sent Events
 * - /mcp/message - MCP message endpoint
 * - /mcp - Legacy REST API (maintained for compatibility)
 * - /health - Service health check
 */

import express from 'express';
import { mcpSSEServer } from './src/mcp/sse-server.js';
import { allDebugTools, executeDebugTool } from './src/tools/debug-tools.js';
import { sessionManager } from './src/session/manager.js';
import { playwrightController } from './src/controllers/playwright.js';
import { initializeFirebase } from './src/utils/firebase-storage.js';

// Initialize Firebase Storage (for screenshot uploads)
initializeFirebase();

const app = express();
app.use(express.json());

// API Key Authentication Middleware
const API_KEY = process.env.MCP_API_KEY;

function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_KEY) {
    console.warn('⚠️  MCP_API_KEY not set - API is open to public!');
    return next();
  }

  const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Provide via X-API-Key header or Authorization: Bearer <key>'
    });
  }

  if (providedKey !== API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
}

// ===========================================
// MCP SSE ENDPOINTS (New v3.0)
// ===========================================

/**
 * SSE endpoint for MCP protocol
 * This is where Claude Code connects
 */
app.get('/sse', requireApiKey, (req, res) => {
  console.log('🔌 New MCP SSE connection request');
  mcpSSEServer.handleConnection(req, res);
});

/**
 * Message endpoint for MCP protocol (client → server)
 */
app.post('/mcp/message', requireApiKey, async (req, res) => {
  await mcpSSEServer.handleMessage(req, res);
});

/**
 * MCP Info endpoint - Describes the MCP integration
 */
app.get('/mcp/info', (req, res) => {
  res.json({
    name: 'MCP-Debugger',
    version: '3.0.0',
    protocol: 'MCP 2024-11-05',
    transport: 'Server-Sent Events (SSE)',
    connection: {
      endpoint: '/sse',
      messageEndpoint: '/mcp/message',
      authentication: 'X-API-Key header or Authorization: Bearer token'
    },
    tools: allDebugTools.length,
    capabilities: {
      browser_automation: true,
      session_persistence: true,
      ai_vision_analysis: true,
      network_monitoring: true,
      console_monitoring: true
    },
    documentation: 'https://github.com/maizoro87/MCP-Debugger',
    legacy: {
      restApi: '/mcp (POST)',
      status: 'maintained for backward compatibility',
      deprecation: 'No deprecation timeline yet'
    }
  });
});

// ===========================================
// MCP TOOL EXECUTION HANDLER
// ===========================================

/**
 * Handle tool execution from MCP protocol
 */
mcpSSEServer.on('tool:call', async (event: any) => {
  const { connection, toolName, args, resolve, reject } = event;

  try {
    console.log(`🔧 Executing MCP tool: ${toolName} for session ${connection.sessionId}`);

    // Ensure session exists
    await sessionManager.getOrCreateSession(connection.sessionId, connection.id);

    // Execute tool
    const result = await executeDebugTool(toolName, connection.sessionId, args);

    console.log(`✅ Tool ${toolName} completed successfully`);
    resolve(result);

  } catch (error: any) {
    console.error(`❌ Tool ${toolName} failed:`, error.message);
    reject(error);
  }
});

// Register tools with MCP server
mcpSSEServer.registerTools(allDebugTools);

// Handle disconnections - cleanup sessions
mcpSSEServer.on('disconnect', async (event: any) => {
  const { connectionId, sessionId } = event;
  console.log(`🔌 Cleaning up after disconnect: connection=${connectionId}, session=${sessionId}`);

  // Check if any other connections are using this session
  const sessionConnections = mcpSSEServer.getSessionConnections(sessionId);
  if (sessionConnections.length === 0) {
    // No more connections, destroy session after a delay
    setTimeout(async () => {
      const stillActive = mcpSSEServer.getSessionConnections(sessionId);
      if (stillActive.length === 0) {
        console.log(`🗑️  No active connections for session ${sessionId}, destroying...`);
        await sessionManager.destroySession(sessionId);
      }
    }, 60000); // 1 minute grace period
  }
});

// ===========================================
// LEGACY REST API (Backward Compatibility)
// ===========================================

// Initialize browser helper (for legacy endpoints)
async function initBrowser() {
  if (!playwrightController.isInitialized()) {
    await playwrightController.openBrowser(true, false);
  }
  return playwrightController;
}

/**
 * Legacy REST API endpoint
 * Maintained for backward compatibility with existing integrations
 */
app.post('/mcp', requireApiKey, async (req, res) => {
  try {
    const { method, params } = req.body;
    await initBrowser();

    console.log(`📡 Legacy REST API call: ${method}`);

    // Route to legacy controller methods
    switch (method) {
      case 'navigate': {
        const controller = await initBrowser();
        await controller.navigate(params.url);
        res.json({
          success: true,
          message: 'Navigation complete',
          timestamp: new Date().toISOString(),
          note: 'You are using the legacy REST API. Consider migrating to MCP SSE for better performance.'
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
                results.push({ step: i + 1, action: step.action, success: true });
                break;
              case 'click':
                await controller.click(step.selector);
                results.push({ step: i + 1, action: step.action, success: true });
                break;
              case 'type':
                await controller.fill(step.selector, step.text);
                results.push({ step: i + 1, action: step.action, success: true });
                break;
              case 'is_visible':
                const isVisible = await controller.isElementVisible(step.selector);
                results.push({ step: i + 1, action: step.action, success: isVisible });
                if (!isVisible) failedSteps++;
                break;
              case 'evaluate':
                const result = await controller.evaluateWithReturn(step.script);
                results.push({ step: i + 1, action: step.action, result: String(result), success: true });
                break;
              default:
                results.push({ step: i + 1, action: step.action, success: false, error: `Unknown action: ${step.action}` });
                failedSteps++;
            }
          } catch (error: any) {
            results.push({ step: i + 1, action: step.action, success: false, error: error.message });
            failedSteps++;
          }
        }

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
          networkRequests: networkLogs.map(r => ({ url: r.url, method: r.method, status: r.status })),
          timestamp: new Date().toISOString()
        });
        break;
      }

      // Other legacy endpoints...
      case 'get_console_messages': {
        const controller = await initBrowser();
        const messages = await controller.getConsoleMessages();
        res.json({ success: true, messages, count: messages.length, timestamp: new Date().toISOString() });
        break;
      }

      case 'get_network_requests': {
        const controller = await initBrowser();
        const requests = await controller.getNetworkRequests();
        res.json({ success: true, requests, count: requests.length, timestamp: new Date().toISOString() });
        break;
      }

      case 'clear_console_messages': {
        const controller = await initBrowser();
        await controller.clearConsoleMessages();
        res.json({ success: true, message: 'Console messages cleared', timestamp: new Date().toISOString() });
        break;
      }

      case 'clear_network_requests': {
        const controller = await initBrowser();
        await controller.clearNetworkRequests();
        res.json({ success: true, message: 'Network requests cleared', timestamp: new Date().toISOString() });
        break;
      }

      case 'analyze_screenshot': {
        const controller = await initBrowser();
        const apiKey = params.apiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          res.status(400).json({ success: false, error: 'Gemini API key required' });
          break;
        }
        const result = await controller.analyzeScreenshot(
          params.url,
          params.prompt,
          apiKey,
          { fullPage: params.fullPage !== false, type: params.screenshotType || 'png' }
        );
        res.json({ success: true, ...result, timestamp: new Date().toISOString() });
        break;
      }

      default:
        res.status(400).json({
          success: false,
          error: `Unknown method: ${method}`,
          suggestion: 'Consider migrating to MCP SSE protocol for access to new debugging tools'
        });
    }
  } catch (error: any) {
    console.error('Legacy REST API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===========================================
// HEALTH & STATUS ENDPOINTS
// ===========================================

/**
 * Health check (public)
 */
app.get('/health', (req, res) => {
  const mcpStats = mcpSSEServer.getStats();
  const sessionStats = sessionManager.getStats();

  res.json({
    status: 'ok',
    version: '3.0.0',
    service: 'MCP-Debugger',
    protocol: {
      mcp: {
        enabled: true,
        version: '2024-11-05',
        connections: mcpStats.activeConnections,
        tools: mcpStats.registeredTools
      },
      rest: {
        enabled: true,
        status: 'legacy',
        endpoint: '/mcp'
      }
    },
    sessions: sessionStats,
    authenticated: !!API_KEY,
    timestamp: new Date().toISOString()
  });
});

/**
 * Stats endpoint (protected)
 */
app.get('/stats', requireApiKey, (req, res) => {
  const mcpStats = mcpSSEServer.getStats();
  const sessionStats = sessionManager.getStats();

  res.json({
    mcp: mcpStats,
    sessions: sessionStats,
    tools: allDebugTools.map(t => ({
      name: t.name,
      description: t.description
    })),
    timestamp: new Date().toISOString()
  });
});

// ===========================================
// VISUAL DEBUGGING ENDPOINTS
// ===========================================

/**
 * Get session recordings info (trace/video/screenshots)
 */
app.get('/session/:sessionId/recordings', requireApiKey, (req, res) => {
  const { sessionId } = req.params;
  const recordings = sessionManager.getSessionRecordings(sessionId);

  if (!recordings) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    ...recordings,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get session screenshots
 */
app.get('/session/:sessionId/screenshots', requireApiKey, (req, res) => {
  const { sessionId } = req.params;
  const screenshots = sessionManager.getSessionScreenshots(sessionId);

  res.json({
    success: true,
    sessionId,
    count: screenshots.length,
    screenshots: screenshots.map(s => ({
      timestamp: s.timestamp,
      action: s.action,
      image: `data:image/png;base64,${s.base64}`
    })),
    timestamp: new Date().toISOString()
  });
});

/**
 * Download trace file for session
 */
app.get('/session/:sessionId/trace/download', requireApiKey, (req, res) => {
  const { sessionId } = req.params;
  const recordings = sessionManager.getSessionRecordings(sessionId);

  if (!recordings || !recordings.tracePath) {
    return res.status(404).json({
      success: false,
      error: 'Trace file not found. Make sure ENABLE_TRACE_RECORDING=true is set.'
    });
  }

  res.download(recordings.tracePath, `${sessionId}-trace.zip`);
});

/**
 * Download video file for session
 */
app.get('/session/:sessionId/video/download', requireApiKey, (req, res) => {
  const { sessionId } = req.params;
  const recordings = sessionManager.getSessionRecordings(sessionId);

  if (!recordings || !recordings.videoPath) {
    return res.status(404).json({
      success: false,
      error: 'Video file not found. Make sure ENABLE_VIDEO_RECORDING=true is set.'
    });
  }

  res.download(recordings.videoPath, `${sessionId}-video.webm`);
});

// ===========================================
// CLEANUP & SHUTDOWN
// ===========================================

/**
 * Cleanup interval
 */
setInterval(() => {
  mcpSSEServer.cleanupStaleConnections();
}, 60000); // Every minute

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('📛 SIGTERM received, shutting down gracefully...');

  // Close all sessions
  await sessionManager.destroyAllSessions();

  // Close legacy browser
  if (playwrightController.isInitialized()) {
    await playwrightController.closeBrowser();
  }

  console.log('✅ Shutdown complete');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📛 SIGINT received, shutting down gracefully...');

  await sessionManager.destroyAllSessions();

  if (playwrightController.isInitialized()) {
    await playwrightController.closeBrowser();
  }

  console.log('✅ Shutdown complete');
  process.exit(0);
});

// ===========================================
// START SERVER
// ===========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  MCP-Debugger v3.0 - Running on port ${PORT}              ║
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
║  🔑 Authentication: ${API_KEY ? 'Enabled ✅' : 'Disabled ⚠️ '}                    ║
║  🛠️  Tools Registered: ${allDebugTools.length}                                    ║
║  🎭 Protocol: MCP 2024-11-05 over SSE                      ║
╚════════════════════════════════════════════════════════════╝
`);

  if (!API_KEY) {
    console.warn(`
⚠️  WARNING: MCP_API_KEY not set!
    Set environment variable MCP_API_KEY to enable authentication.
    Current state: API is OPEN to public.
`);
  }

  console.log('✅ Ready to accept connections from Claude Code!\n');
});

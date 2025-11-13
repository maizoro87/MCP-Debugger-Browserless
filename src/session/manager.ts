/**
 * Session Manager for MCP-Debugger
 *
 * Manages persistent browser sessions for each MCP connection.
 * Each session gets its own browser context, maintaining cookies,
 * localStorage, and authentication state across multiple tool calls.
 */

import { playwrightController } from '../controllers/playwright.js';
import type { BrowserContext, Page, Browser } from 'playwright';
import { chromium } from 'playwright';

export interface DebugSession {
  id: string;
  connectionId: string;
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
  createdAt: Date;
  lastActivity: Date;
  metadata: {
    authenticated?: boolean;
    currentUrl?: string;
    userAgent?: string;
  };
}

export class SessionManager {
  private sessions: Map<string, DebugSession> = new Map();
  private sessionTimeout: number;
  private maxSessions: number;

  constructor(sessionTimeoutMs: number = 1800000, maxSessions: number = 50) {
    this.sessionTimeout = sessionTimeoutMs; // Default 30 minutes
    this.maxSessions = maxSessions;

    // Start cleanup interval
    setInterval(() => this.cleanupStaleSessions(), 60000); // Every minute
  }

  /**
   * Get or create session for connection
   */
  async getOrCreateSession(sessionId: string, connectionId: string): Promise<DebugSession> {
    let session = this.sessions.get(sessionId);

    if (session) {
      // Update activity
      session.lastActivity = new Date();
      console.log(`♻️  Reusing session: ${sessionId}`);
      return session;
    }

    // Check if we're at max capacity
    if (this.sessions.size >= this.maxSessions) {
      // Clean up oldest session
      this.cleanupOldestSession();
    }

    // Create new session
    console.log(`🆕 Creating new session: ${sessionId}`);

    session = {
      id: sessionId,
      connectionId,
      browser: null,
      context: null,
      page: null,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: {}
    };

    // Initialize browser for this session
    try {
      session.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      session.context = await session.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'MCP-Debugger/3.0 (Playwright)'
      });

      session.page = await session.context.newPage();

      // Set up console and network monitoring
      this.setupMonitoring(session);

      console.log(`✅ Session ${sessionId} initialized with dedicated browser`);
    } catch (error: any) {
      console.error(`Failed to initialize session ${sessionId}:`, error);
      throw new Error(`Session initialization failed: ${error.message}`);
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Setup monitoring for session
   */
  private setupMonitoring(session: DebugSession): void {
    if (!session.page) return;

    // Store console messages in session metadata
    const consoleLogs: Array<{type: string, text: string, timestamp: Date}> = [];
    session.page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date()
      });

      // Keep only last 1000 messages
      if (consoleLogs.length > 1000) {
        consoleLogs.shift();
      }
    });

    (session as any).consoleLogs = consoleLogs;

    // Store network requests in session metadata
    const networkRequests: Array<{
      url: string,
      method: string,
      status?: number,
      timestamp: Date
    }> = [];

    session.page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date()
      });
    });

    session.page.on('response', response => {
      const req = networkRequests.find(r => r.url === response.url() && !r.status);
      if (req) {
        req.status = response.status();
      }
    });

    (session as any).networkRequests = networkRequests;
  }

  /**
   * Get existing session
   */
  getSession(sessionId: string): DebugSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  /**
   * Get session page (for tool execution)
   */
  getSessionPage(sessionId: string): Page | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.lastActivity = new Date();
    return session.page;
  }

  /**
   * Get console logs for session
   */
  getConsoleLogs(sessionId: string): Array<{type: string, text: string, timestamp: Date}> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return (session as any).consoleLogs || [];
  }

  /**
   * Clear console logs for session
   */
  clearConsoleLogs(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      (session as any).consoleLogs = [];
    }
  }

  /**
   * Get network requests for session
   */
  getNetworkRequests(sessionId: string): Array<{
    url: string,
    method: string,
    status?: number,
    timestamp: Date
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return (session as any).networkRequests || [];
  }

  /**
   * Clear network requests for session
   */
  clearNetworkRequests(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      (session as any).networkRequests = [];
    }
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`🗑️  Destroying session: ${sessionId}`);

    try {
      if (session.page) await session.page.close();
      if (session.context) await session.context.close();
      if (session.browser) await session.browser.close();
    } catch (error: any) {
      console.error(`Error closing session ${sessionId}:`, error.message);
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Cleanup stale sessions
   */
  private cleanupStaleSessions(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const idleTime = now - session.lastActivity.getTime();
      if (idleTime > this.sessionTimeout) {
        toDelete.push(sessionId);
      }
    }

    for (const sessionId of toDelete) {
      console.log(`🧹 Cleaning up idle session: ${sessionId}`);
      this.destroySession(sessionId);
    }

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} idle sessions`);
    }
  }

  /**
   * Cleanup oldest session (when at capacity)
   */
  private cleanupOldestSession(): void {
    let oldestSession: DebugSession | null = null;
    let oldestTime = Date.now();

    for (const session of this.sessions.values()) {
      const activityTime = session.lastActivity.getTime();
      if (activityTime < oldestTime) {
        oldestTime = activityTime;
        oldestSession = session;
      }
    }

    if (oldestSession) {
      console.log(`🧹 Removing oldest session to make room: ${oldestSession.id}`);
      this.destroySession(oldestSession.id);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const sessions = Array.from(this.sessions.values());
    return {
      totalSessions: sessions.length,
      maxSessions: this.maxSessions,
      sessionTimeout: this.sessionTimeout,
      oldestSession: sessions.length > 0
        ? Math.floor((Date.now() - Math.min(...sessions.map(s => s.createdAt.getTime()))) / 1000)
        : 0
    };
  }

  /**
   * Destroy all sessions (for shutdown)
   */
  async destroyAllSessions(): Promise<void> {
    console.log(`🛑 Destroying all ${this.sessions.size} sessions`);
    const sessionIds = Array.from(this.sessions.keys());
    await Promise.all(sessionIds.map(id => this.destroySession(id)));
  }
}

// Export singleton instance
export const sessionManager = new SessionManager(
  parseInt(process.env.SESSION_TIMEOUT_MS || '1800000'),
  parseInt(process.env.MAX_SESSIONS || '50')
);

/**
 * Session-related types for MCP-Debugger
 */

export interface SessionMetadata {
  authenticated?: boolean;
  currentUrl?: string;
  userAgent?: string;
  lastError?: string;
  pageTitle?: string;
}

export interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: Date;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  timestamp: Date;
  headers?: Record<string, string>;
  body?: string;
}

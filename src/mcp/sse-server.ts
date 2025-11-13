/**
 * MCP SSE (Server-Sent Events) Server Implementation
 *
 * Implements the Model Context Protocol over SSE for remote connections.
 * This allows Claude Code and other MCP clients to connect and use
 * the debugger tools.
 *
 * Protocol: MCP 2024-11-05
 * Transport: Server-Sent Events (SSE)
 */

import express from 'express';
import { EventEmitter } from 'events';
import { MCPMessage, MCPRequest, MCPResponse, MCPNotification, Tool } from './types.js';

export interface MCPConnection {
  id: string;
  sessionId: string;
  res: express.Response;
  emitter: EventEmitter;
  lastActivity: Date;
  authenticated: boolean;
}

export class MCPSSEServer extends EventEmitter {
  private connections: Map<string, MCPConnection> = new Map();
  private tools: Tool[] = [];
  private serverInfo = {
    name: 'MCP-Debugger',
    version: '3.0.0'
  };

  constructor() {
    super();
  }

  /**
   * Register available MCP tools
   */
  registerTools(tools: Tool[]): void {
    this.tools = tools;
    console.log(`📋 Registered ${tools.length} MCP tools`);
  }

  /**
   * Handle SSE connection endpoint
   */
  handleConnection(req: express.Request, res: express.Response): void {
    const connectionId = this.generateConnectionId();
    const sessionId = req.query.sessionId as string || this.generateSessionId();

    console.log(`🔌 New MCP connection: ${connectionId} (session: ${sessionId})`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Create connection object
    const connection: MCPConnection = {
      id: connectionId,
      sessionId,
      res,
      emitter: new EventEmitter(),
      lastActivity: new Date(),
      authenticated: false
    };

    this.connections.set(connectionId, connection);

    // Send connection established event
    this.sendEvent(connectionId, 'connected', {
      connectionId,
      sessionId,
      serverInfo: this.serverInfo
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(`🔌 Client disconnected: ${connectionId}`);
      this.connections.delete(connectionId);
      this.emit('disconnect', { connectionId, sessionId });
    });

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      if (!this.connections.has(connectionId)) {
        clearInterval(heartbeat);
        return;
      }
      this.sendEvent(connectionId, 'heartbeat', { timestamp: new Date().toISOString() });
    }, 30000); // Every 30 seconds

    req.on('close', () => clearInterval(heartbeat));
  }

  /**
   * Handle MCP message endpoint (for client → server messages)
   */
  async handleMessage(req: express.Request, res: express.Response): Promise<void> {
    try {
      const connectionId = req.headers['x-connection-id'] as string;
      const message: MCPMessage = req.body;

      if (!connectionId) {
        res.status(400).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32600,
            message: 'Missing X-Connection-ID header'
          }
        });
        return;
      }

      const connection = this.connections.get(connectionId);
      if (!connection) {
        res.status(404).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32001,
            message: 'Connection not found'
          }
        });
        return;
      }

      // Update last activity
      connection.lastActivity = new Date();

      console.log(`📨 Received message from ${connectionId}:`, message.method || message);

      // Handle the message and get response
      const response = await this.processMessage(connection, message);

      // Send response via SSE
      if (response) {
        this.sendEvent(connectionId, 'message', response);
      }

      // Also send HTTP response for acknowledgment
      res.json({ success: true });

    } catch (error: any) {
      console.error('Message handling error:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error.message
        }
      });
    }
  }

  /**
   * Process incoming MCP message
   */
  private async processMessage(
    connection: MCPConnection,
    message: MCPMessage
  ): Promise<MCPResponse | null> {
    // Check if it's a request (has id) or notification (no id)
    const isRequest = 'id' in message && message.id !== undefined;

    try {
      // Route based on method
      switch (message.method) {
        case 'initialize':
          return this.handleInitialize(connection, message as MCPRequest);

        case 'initialized':
          // Notification - no response needed
          console.log(`✅ Client ${connection.id} initialized`);
          return null;

        case 'tools/list':
          return this.handleToolsList(connection, message as MCPRequest);

        case 'tools/call':
          return await this.handleToolCall(connection, message as MCPRequest);

        case 'ping':
          return {
            jsonrpc: '2.0',
            id: (message as MCPRequest).id,
            result: { pong: true }
          };

        default:
          if (isRequest) {
            return {
              jsonrpc: '2.0',
              id: (message as MCPRequest).id,
              error: {
                code: -32601,
                message: `Method not found: ${message.method}`
              }
            };
          }
          return null;
      }
    } catch (error: any) {
      console.error(`Error processing ${message.method}:`, error);

      if (isRequest) {
        return {
          jsonrpc: '2.0',
          id: (message as MCPRequest).id,
          error: {
            code: -32603,
            message: error.message || 'Internal error'
          }
        };
      }
      return null;
    }
  }

  /**
   * Handle MCP initialize request
   */
  private handleInitialize(connection: MCPConnection, message: MCPRequest): MCPResponse {
    console.log(`🤝 Initializing connection ${connection.id}`);

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          logging: {}
        },
        serverInfo: this.serverInfo
      }
    };
  }

  /**
   * Handle tools/list request
   */
  private handleToolsList(connection: MCPConnection, message: MCPRequest): MCPResponse {
    console.log(`📋 Listing tools for ${connection.id}`);

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: this.tools
      }
    };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(connection: MCPConnection, message: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = message.params as { name: string; arguments?: any };

    console.log(`🔧 Calling tool: ${name} for connection ${connection.id}`);

    try {
      // Emit event for tool execution (handled by tool registry)
      const result = await this.executeToolCall(connection, name, args);

      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    } catch (error: any) {
      console.error(`Tool call error (${name}):`, error);

      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        }
      };
    }
  }

  /**
   * Execute tool call (to be implemented by tool handlers)
   */
  private async executeToolCall(
    connection: MCPConnection,
    toolName: string,
    args: any
  ): Promise<any> {
    // Emit event that will be handled by tool registry
    return new Promise((resolve, reject) => {
      this.emit('tool:call', {
        connection,
        toolName,
        args,
        resolve,
        reject
      });
    });
  }

  /**
   * Send SSE event to specific connection
   */
  private sendEvent(connectionId: string, event: string, data: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.warn(`⚠️  Cannot send event to ${connectionId}: connection not found`);
      return;
    }

    try {
      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      connection.res.write(eventData);
    } catch (error: any) {
      console.error(`Error sending event to ${connectionId}:`, error.message);
      this.connections.delete(connectionId);
    }
  }

  /**
   * Broadcast event to all connections
   */
  broadcastEvent(event: string, data: any): void {
    for (const [connectionId] of this.connections) {
      this.sendEvent(connectionId, event, data);
    }
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): MCPConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections for a session
   */
  getSessionConnections(sessionId: string): MCPConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.sessionId === sessionId);
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(maxIdleMs: number = 1800000): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [connectionId, connection] of this.connections) {
      const idleTime = now - connection.lastActivity.getTime();
      if (idleTime > maxIdleMs) {
        console.log(`🧹 Cleaning up stale connection: ${connectionId} (idle ${Math.round(idleTime / 1000)}s)`);
        connection.res.end();
        this.connections.delete(connectionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} stale connections`);
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      activeConnections: this.connections.size,
      registeredTools: this.tools.length,
      serverInfo: this.serverInfo
    };
  }
}

export const mcpSSEServer = new MCPSSEServer();

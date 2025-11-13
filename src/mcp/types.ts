export interface Tool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface ServerConfig {
    name: string;
    version: string;
}

export interface ServerCapabilities {
    capabilities: {
        tools: Record<string, Tool>;
    };
}

export interface CallToolRequest {
    params: {
        name: string;
        arguments?: Record<string, any>;
    };
}

export interface ToolResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}

export interface ListToolsResponse {
    tools: Tool[];
}

// MCP Protocol Message Types
export interface MCPMessage {
    jsonrpc: '2.0';
    method?: string;
    id?: string | number;
}

export interface MCPRequest extends MCPMessage {
    id: string | number;
    method: string;
    params?: any;
}

export interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number | null;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export interface MCPNotification extends MCPMessage {
    method: string;
    params?: any;
}
/**
 * Configuration type definitions for MCP servers
 */

export interface MCPServerConfig {
  /** Human-readable server name */
  name: string;
  /** Server executable command */
  command: string;
  /** Command-line arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Connection retry attempts */
  retries?: number;
  /** Cache tool discovery results */
  cacheToolsList?: boolean;
  /** Supported integration types */
  integrationTypes: string[];
}

export interface IntegrationServerMap {
  [integrationType: string]: {
    /** Reference to server config name */
    serverName: string;
    /** Required credential fields */
    requiredCredentials: string[];
    /** Optional configuration fields */
    optionalSettings: string[];
  };
}

export interface MCPClientConfig {
  /** Available server configurations */
  servers: MCPServerConfig[];
  /** Integration to server mapping */
  integrationMap: IntegrationServerMap;
  /** Global client settings */
  defaults: MCPClientDefaults;
}

export interface MCPClientDefaults {
  /** Default server timeout */
  timeout: number;
  /** Default retry attempts */
  retries: number;
  /** Default tool caching */
  cacheToolsList: boolean;
  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
}

export interface ServerCredentials {
  /** Integration type */
  type: string;
  /** Encrypted credentials */
  credentials: Record<string, unknown>;
  /** Additional settings */
  settings?: Record<string, unknown>;
}

export interface MCPServerInstance {
  /** Server configuration */
  config: MCPServerConfig;
  /** Server process reference */
  process?: unknown;
  /** Connection status */
  connected: boolean;
  /** Last health check */
  lastHealthCheck?: Date;
  /** Error information */
  error?: string;
}
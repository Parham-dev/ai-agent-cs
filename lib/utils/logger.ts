/**
 * Comprehensive logging system for the AI Customer Service Platform
 * Supports different log levels, structured logging, and environment-aware output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  [key: string]: unknown;
  userId?: string;
  agentId?: string;
  organizationId?: string;
  integrationId?: string;
  conversationId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  service: string;
  environment: string;
}

class Logger {
  private service: string;
  private environment: string;
  private minLevel: LogLevel;

  constructor(service: string = 'ai-customer-service') {
    this.service = service;
    this.environment = process.env.NODE_ENV || 'development';
    this.minLevel = this.getMinLogLevel();
  }

  private getMinLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return this.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      environment: this.environment,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.environment === 'production') {
      // In production, output structured JSON for log aggregation services
      console.log(JSON.stringify(entry));
    } else {
      // In development, output human-readable format
      const levelColors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.FATAL]: '\x1b[35m', // Magenta
      };
      const reset = '\x1b[0m';
      const levelName = LogLevel[entry.level];
      const color = levelColors[entry.level];
      
      let output = `${color}[${entry.timestamp}] ${levelName}${reset}: ${entry.message}`;
      
      if (entry.context) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
      }
      
      if (entry.error) {
        output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }
      
      console.log(output);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message, context, error);
    this.output(entry);
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log errors
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log fatal errors
   */
  fatal(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.service);
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, additionalContext?: LogContext, error?: Error) => {
      const mergedContext = { ...context, ...additionalContext };
      originalLog(level, message, mergedContext, error);
    };
    
    return childLogger;
  }

  /**
   * Time a function execution and log the duration
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T> | T,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    this.debug(`Starting ${operation}`, context);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed ${operation}`, { ...context, duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed ${operation}`, { ...context, duration: `${duration}ms` }, error as Error);
      throw error;
    }
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience functions for common logging patterns
export const createLogger = (service: string): Logger => new Logger(service);

// API-specific logger with common context
export const createApiLogger = (context: LogContext): Logger => {
  return logger.child({
    service: 'api',
    ...context,
  });
};

// Integration-specific logger
export const createIntegrationLogger = (integrationType: string, context: LogContext): Logger => {
  return logger.child({
    service: `integration-${integrationType}`,
    ...context,
  });
};

export default logger;
/**
 * Client-side logging utility for React components
 * Provides consistent logging for browser environments
 */

export enum ClientLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface ClientLogContext {
  [key: string]: unknown;
  component?: string;
  userId?: string;
  agentId?: string;
  organizationId?: string;
  page?: string;
  action?: string;
}

class ClientLogger {
  private component: string;
  private minLevel: ClientLogLevel;

  constructor(component: string = 'app') {
    this.component = component;
    this.minLevel = this.getMinLogLevel();
  }

  private getMinLogLevel(): ClientLogLevel {
    // In development, show all logs. In production, only show warnings and errors
    return process.env.NODE_ENV === 'production' ? ClientLogLevel.WARN : ClientLogLevel.DEBUG;
  }

  private shouldLog(level: ClientLogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: ClientLogLevel, message: string, context?: ClientLogContext): string {
    const timestamp = new Date().toISOString();
    const levelName = ClientLogLevel[level];
    const componentInfo = `[${this.component}]`;
    
    let formattedMessage = `${timestamp} ${levelName} ${componentInfo}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formattedMessage += ` | Context: ${JSON.stringify(context)}`;
    }
    
    return formattedMessage;
  }

  private output(level: ClientLogLevel, message: string, context?: ClientLogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case ClientLogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case ClientLogLevel.INFO:
        console.info(formattedMessage);
        break;
      case ClientLogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case ClientLogLevel.ERROR:
        console.error(formattedMessage);
        if (error) {
          console.error('Error details:', error);
        }
        break;
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: ClientLogContext): void {
    this.output(ClientLogLevel.DEBUG, message, context);
  }

  /**
   * Log general information
   */
  info(message: string, context?: ClientLogContext): void {
    this.output(ClientLogLevel.INFO, message, context);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: ClientLogContext): void {
    this.output(ClientLogLevel.WARN, message, context);
  }

  /**
   * Log errors
   */
  error(message: string, context?: ClientLogContext, error?: Error): void {
    this.output(ClientLogLevel.ERROR, message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: ClientLogContext): ClientLogger {
    const childLogger = new ClientLogger(this.component);
    const originalOutput = childLogger.output.bind(childLogger);
    
    childLogger.output = (level: ClientLogLevel, message: string, additionalContext?: ClientLogContext, error?: Error) => {
      const mergedContext = { ...context, ...additionalContext };
      originalOutput(level, message, mergedContext, error);
    };
    
    return childLogger;
  }

  /**
   * Time a function execution and log the duration
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T> | T,
    context?: ClientLogContext
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

// Global client logger
export const clientLogger = new ClientLogger();

// Component-specific logger factory
export const createClientLogger = (component: string): ClientLogger => new ClientLogger(component);

export default clientLogger;
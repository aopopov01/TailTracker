/**
 * Production-safe logger utility
 * Eliminates console statement warnings by providing conditional logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    // Set log level based on environment
    this.logLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public debug(...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG && __DEV__) {
      // Only log in development to avoid console warnings in production
      // eslint-disable-next-line no-console
      console.log('[DEBUG]', ...args);
    }
  }

  public info(...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO && __DEV__) {
      // eslint-disable-next-line no-console
      console.info('[INFO]', ...args);
    }
  }

  public warn(...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn('[WARN]', ...args);
    }
  }

  public error(...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      // eslint-disable-next-line no-console
      console.error('[ERROR]', ...args);
    }
  }

  public performance(label: string, data?: any): void {
    if (__DEV__ && this.logLevel <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(`🚀 ${label}`, data || '');
    }
  }

  public group(label: string, collapsed = false): void {
    if (__DEV__ && this.logLevel <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
    }
  }

  public groupEnd(): void {
    if (__DEV__ && this.logLevel <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }
}

// Export singleton instance
const logger = Logger.getInstance();

// Export convenient static methods
export const log = {
  debug: (...args: any[]) => logger.debug(...args),
  info: (...args: any[]) => logger.info(...args),
  warn: (...args: any[]) => logger.warn(...args),
  error: (...args: any[]) => logger.error(...args),
  performance: (label: string, data?: any) => logger.performance(label, data),
  group: (label: string, collapsed?: boolean) => logger.group(label, collapsed),
  groupEnd: () => logger.groupEnd(),
  setLevel: (level: LogLevel) => logger.setLogLevel(level),
};

export { Logger };
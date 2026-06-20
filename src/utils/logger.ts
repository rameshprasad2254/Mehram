/**
 * Logger Utility
 * Provides structured logging across the application
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  stack?: string;
}

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number;
  private minLevel: LogLevel;

  constructor(maxLogs: number = 1000, minLevel: LogLevel = LogLevel.DEBUG) {
    this.maxLogs = maxLogs;
    this.minLevel = minLevel;
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, context?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context
    };

    this.logs.push(entry);

    // Keep logs within max size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    this.consoleLog(entry);
  }

  /**
   * Debug level log
   */
  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level log
   */
  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level log
   */
  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level log
   */
  error(message: string, context?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      context,
      stack: error?.stack
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.consoleLog(entry);
  }

  /**
   * Console output
   */
  private consoleLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.context || '');
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }

  /**
   * Check if should log
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.minLevel);
    const logIndex = levels.indexOf(level);
    return logIndex >= currentIndex;
  }

  /**
   * Get all logs
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export default Logger;
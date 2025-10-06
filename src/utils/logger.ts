import {Platform} from 'react-native';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string | undefined;
}

class Logger {
  // private isDevelopment = __DEV__;
  private isDevelopment = true;

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      // stack: data instanceof Error ? data.stack ?? '' : '',
      stack: data instanceof Error ? data.stack : undefined,
    };
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.isDevelopment) {
      return;
    }

    const logEntry = this.formatMessage(level, message, data);
    
    if (Platform.OS === 'web') {
      console.log(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(`[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}`);
      if (logEntry.data) {
        console.log('Data:', logEntry.data);
      }
      if (logEntry.stack) {
        console.log('Stack:', logEntry.stack);
      }
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }
}

export const logger = new Logger();

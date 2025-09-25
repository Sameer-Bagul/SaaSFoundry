import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger implementation
class Logger {
  private logToFile(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    const logFile = level === 'error' ? 'error.log' : 'combined.log';
    const logPath = path.join(logsDir, logFile);

    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta));
    this.logToFile('info', message, meta);
  }

  error(message: string, meta?: any) {
    console.error(this.formatMessage('error', message, meta));
    this.logToFile('error', message, meta);
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
    this.logToFile('warn', message, meta);
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, meta));
    }
    this.logToFile('debug', message, meta);
  }
}

const logger = new Logger();
export default logger;
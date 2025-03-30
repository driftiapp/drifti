type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  data: Record<string, any> | undefined;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: Record<string, any>): LogMessage {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    const logMessage = this.formatMessage(level, message, data);

    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' :
                          level === 'warn' ? 'warn' :
                          level === 'info' ? 'info' : 'debug';

      console[consoleMethod](
        `[${logMessage.timestamp}] ${level.toUpperCase()}: ${message}`,
        data ? data : ''
      );
    }

    // In production, you might want to send logs to a logging service
    if (!this.isDevelopment) {
      // Example: Send to logging service
      this.sendToLoggingService(logMessage).catch(error => {
        console.error('Failed to send log to logging service:', error);
      });
    }
  }

  private async sendToLoggingService(logMessage: LogMessage): Promise<void> {
    // Implement your logging service integration here
    // For example, sending to a logging endpoint
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logMessage),
      });
    } catch (error) {
      // Fallback to console in case of failure
      console.error('Failed to send log to logging service:', error);
    }
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }
}

export const logger = new Logger(); 
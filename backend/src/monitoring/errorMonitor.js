const Sentry = require('@sentry/node');
const { performance } = require('perf_hooks');

class ErrorMonitor {
  constructor() {
    this.errors = new Map();
    this.errorThreshold = 5; // Number of errors before alerting
    this.timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  init() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: require('../app') }),
      ],
    });
  }

  async trackError(error, context = {}) {
    const errorKey = `${error.name}:${error.message}`;
    const now = Date.now();
    
    // Clean up old errors
    this.cleanupOldErrors(now);

    // Track new error
    const errorCount = this.errors.get(errorKey) || 0;
    this.errors.set(errorKey, {
      count: errorCount + 1,
      lastOccurrence: now,
      context: {
        ...context,
        stack: error.stack,
      },
    });

    // Report to Sentry
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });

    // Check if we've exceeded the error threshold
    if (errorCount + 1 >= this.errorThreshold) {
      await this.handleErrorThresholdExceeded(errorKey);
    }
  }

  cleanupOldErrors(now) {
    for (const [key, value] of this.errors.entries()) {
      if (now - value.lastOccurrence > this.timeWindow) {
        this.errors.delete(key);
      }
    }
  }

  async handleErrorThresholdExceeded(errorKey) {
    const errorData = this.errors.get(errorKey);
    // Implement alerting logic here (e.g., send email, Slack notification)
    console.error(`Error threshold exceeded for ${errorKey}:`, errorData);
  }

  getErrorStats() {
    return {
      totalErrors: this.errors.size,
      errors: Array.from(this.errors.entries()),
    };
  }
}

module.exports = new ErrorMonitor(); 
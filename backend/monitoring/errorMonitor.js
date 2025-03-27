const Sentry = require('@sentry/node');
const config = require('../config');

// Initialize Sentry
Sentry.init({
  dsn: config.sentry.dsn,
  environment: config.env,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});

const trackError = (error, context = {}) => {
  // Log error to console in development
  if (config.env === 'development') {
    console.error('Error:', error);
    console.error('Context:', context);
  }

  // Track error in Sentry
  Sentry.withScope((scope) => {
    // Add context to error
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Set error level
    if (error.statusCode >= 500) {
      scope.setLevel('error');
    } else if (error.statusCode >= 400) {
      scope.setLevel('warning');
    }

    // Capture error
    Sentry.captureException(error);
  });
};

module.exports = {
  trackError,
  Sentry
}; 
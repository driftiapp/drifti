const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

const initSentry = () => {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        integrations: [
            new ProfilingIntegration(),
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app: require('../app') }),
            new Sentry.Integrations.Mongo({ useMongoose: true }),
            new Sentry.Integrations.Stripe()
        ],
        // Performance monitoring
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        // Set sampling rate for performance monitoring
        tracesSampler: (samplingContext) => {
            // Sample 100% of transactions in development
            if (process.env.NODE_ENV === 'development') return 1.0;
            
            // Sample 10% of transactions in production
            return 0.1;
        },
        // Configure error sampling
        sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        // Configure beforeSend to filter out certain errors
        beforeSend(event) {
            // Don't send errors in development
            if (process.env.NODE_ENV === 'development') return null;
            
            // Filter out certain types of errors
            if (event.exception?.values?.[0]?.type === 'ValidationError') {
                return null;
            }
            
            return event;
        }
    });

    // Create a request handler
    const requestHandler = Sentry.Handlers.requestHandler();

    // Create a tracing handler
    const tracingHandler = Sentry.Handlers.tracingHandler();

    // Create an error handler
    const errorHandler = Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            // Capture all errors in production
            if (process.env.NODE_ENV === 'production') return true;
            
            // Only capture critical errors in development
            return error.status >= 500;
        }
    });

    return {
        requestHandler,
        tracingHandler,
        errorHandler
    };
};

module.exports = initSentry; 
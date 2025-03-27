'use strict';

exports.config = {
    app_name: ['Drifti Backend'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,
    logging: {
        level: 'info'
    },
    allow_all_headers: true,
    attributes: {
        exclude: [
            'request.headers.cookie',
            'request.headers.authorization',
            'request.headers.proxyAuthorization',
            'request.headers.setCookie*',
            'request.headers.x*',
            'response.headers.cookie',
            'response.headers.authorization',
            'response.headers.proxyAuthorization',
            'response.headers.setCookie*',
            'response.headers.x*'
        ]
    },
    transaction_tracer: {
        transaction_threshold: 'apdex_f',
        record_sql: 'obfuscated',
        explain_threshold: 200,
        enabled: true
    },
    slow_sql: {
        enabled: true,
        max_samples: 10,
        transaction_threshold: 'apdex_f',
        record_sql: 'obfuscated',
        explain_threshold: 200
    },
    error_collector: {
        enabled: true,
        capture_events: true,
        ignore_status_codes: [404, 401, 403]
    },
    custom_insights_events: {
        enabled: true,
        max_samples_stored: 30000
    },
    transaction_events: {
        attributes: {
            exclude: [
                'request.headers.cookie',
                'request.headers.authorization',
                'request.headers.proxyAuthorization',
                'request.headers.setCookie*',
                'request.headers.x*',
                'response.headers.cookie',
                'response.headers.authorization',
                'response.headers.proxyAuthorization',
                'response.headers.setCookie*',
                'response.headers.x*'
            ]
        }
    }
}; 
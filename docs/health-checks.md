# Health Check System Documentation

## Overview
The health check system provides comprehensive monitoring of various system components and external services. It includes both basic health checks and detailed system metrics.

## Endpoints

### Basic Health Check
```
GET /api/health
```
Returns a simple health status of the system.

**Response:**
```json
{
    "status": "healthy|unhealthy",
    "timestamp": "2024-03-26T12:00:00Z"
}
```

### Comprehensive Health Check
```
GET /api/health/comprehensive
```
Returns detailed health status of all system components.

**Response:**
```json
{
    "status": "healthy|unhealthy",
    "components": {
        "mongodb": true|false,
        "firebase": true|false,
        "stripe": true|false,
        "redis": true|false,
        "api": true|false,
        "email": true|false,
        "cdn": true|false,
        "thirdParty": true|false,
        "backups": true|false
    },
    "metrics": {
        "uptime": 3600,
        "memoryUsage": {
            "heapUsed": 123456789,
            "heapTotal": 987654321,
            "rss": 123456789
        },
        "cpuUsage": {
            "user": 123456789,
            "system": 987654321
        },
        "lastCheck": "2024-03-26T12:00:00Z",
        "environment": "production",
        "version": "1.0.0"
    },
    "migrations": {
        "status": "ok|warning|error",
        "pendingCount": 0,
        "migrations": []
    },
    "loadBalancing": {
        "status": "ok|warning|error",
        "details": {}
    }
}
```

### System Metrics
```
GET /api/health/metrics
```
Returns detailed system metrics (requires admin authentication).

**Response:**
```json
{
    "uptime": 3600,
    "memoryUsage": {
        "heapUsed": 123456789,
        "heapTotal": 987654321,
        "rss": 123456789
    },
    "cpuUsage": {
        "user": 123456789,
        "system": 987654321
    },
    "healthStatus": {
        "mongodb": true,
        "firebase": true,
        "stripe": true,
        "redis": true,
        "api": true,
        "email": true,
        "cdn": true,
        "thirdParty": true,
        "backups": true
    },
    "lastCheck": "2024-03-26T12:00:00Z",
    "environment": "production",
    "version": "1.0.0"
}
```

### Database Migration Status
```
GET /api/health/migrations
```
Returns the status of database migrations (requires admin authentication).

**Response:**
```json
{
    "status": "ok|warning|error",
    "pendingCount": 0,
    "migrations": []
}
```

### Load Balancing Status
```
GET /api/health/load-balancing
```
Returns the status of load balancing (requires admin authentication).

**Response:**
```json
{
    "status": "ok|warning|error",
    "details": {}
}
```

## Component Health Checks

### MongoDB
- Checks primary connection status
- Verifies replica set health (if configured)
- Tests write operations
- Monitors connection pool

### Firebase
- Verifies Admin SDK initialization
- Tests authentication
- Checks Firestore connectivity (if enabled)

### Stripe
- Validates API key
- Checks webhook endpoints
- Monitors API response times

### Redis
- Tests connection
- Verifies read/write operations
- Monitors memory usage
- Checks connection pool

### Email Service
- Tests SMTP connection
- Verifies email sending capability
- Monitors email queue

### CDN
- Checks availability
- Monitors response times
- Verifies cache status

### Third-Party Services
- Maps API
- Weather API
- Analytics API
- Other configured services

### Database Backups
- Verifies backup service connectivity
- Checks backup frequency
- Monitors storage usage

## Rate Limiting
Health check endpoints are rate-limited to prevent abuse:
- 100 requests per 15 minutes per IP address
- Admin endpoints require authentication

## Error Handling
- All health checks return appropriate HTTP status codes
- Detailed error messages are logged
- Failed checks are reported in the response

## Monitoring
The system automatically:
- Runs health checks every minute
- Logs failures and warnings
- Updates system metrics
- Monitors component status

## Security
- Admin endpoints require authentication
- Rate limiting is applied
- Sensitive information is not exposed
- Health check headers are validated

## Integration
The health check system can be integrated with:
- Load balancers
- Monitoring services
- CI/CD pipelines
- Alert systems 
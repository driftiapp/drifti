# Create .env.example
$envExample = @"
### Server Configuration ###
PORT=3000
NODE_ENV=development

### WebSocket Configuration ###
WS_PORT=8080
WS_PATH=/ws
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=10000

### JWT Configuration ###
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

### Admin Dashboard ###
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strongpassword

### Redis Configuration ###
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

### Metrics Configuration ###
METRICS_ENABLED=true
METRICS_PORT=9100
METRICS_PATH=/metrics

### Frontend Configuration ###
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:8080/ws
REACT_APP_ENV=development

### Presence System Configuration ###
PRESENCE_ACTIVITY_TIMEOUT=300000
PRESENCE_CLEANUP_INTERVAL=30000
PRESENCE_MAX_ROOMS_PER_USER=5
PRESENCE_MAX_USERS_PER_ROOM=100

### Logging Configuration ###
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=logs/app.log

### Security Configuration ###
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

### Database Configuration ###
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
"@

# Create .env with secure defaults
$env = @"
### Server Configuration ###
PORT=3000
NODE_ENV=development

### WebSocket Configuration ###
WS_PORT=8080
WS_PATH=/ws
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=10000

### JWT Configuration ###
JWT_SECRET=$([Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)))
JWT_EXPIRES_IN=1h

### Admin Dashboard ###
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$([Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(12)))

### Redis Configuration ###
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

### Metrics Configuration ###
METRICS_ENABLED=true
METRICS_PORT=9100
METRICS_PATH=/metrics

### Frontend Configuration ###
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:8080/ws
REACT_APP_ENV=development

### Presence System Configuration ###
PRESENCE_ACTIVITY_TIMEOUT=300000
PRESENCE_CLEANUP_INTERVAL=30000
PRESENCE_MAX_ROOMS_PER_USER=5
PRESENCE_MAX_USERS_PER_ROOM=100

### Logging Configuration ###
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=logs/app.log

### Security Configuration ###
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

### Database Configuration ###
DB_HOST=localhost
DB_PORT=5432
DB_NAME=driftix
DB_USER=postgres
DB_PASSWORD=$([Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(12)))
"@

# Write the files
$envExample | Out-File -FilePath ".env.example" -Encoding UTF8
$env | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Environment files created successfully!"
Write-Host "📝 .env.example has been created with template values"
Write-Host "🔐 .env has been created with secure random values for sensitive fields"
Write-Host "⚠️  Please review and adjust the values in .env according to your needs" 
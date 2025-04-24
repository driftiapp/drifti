#!/bin/bash

# Create .env.example
cat > .env.example << 'EOL'
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

### Backup Configuration ###
BACKUP_ENCRYPTION_KEY=your_backup_encryption_key
MASTER_BACKUP_KEY=your_master_backup_key
EOL

# Generate secure encryption keys
BACKUP_KEY=$(openssl rand -hex 32)
MASTER_KEY=$(openssl rand -hex 32)

# Create .env with secure defaults
cat > .env << EOL
### Server Configuration ###
PORT=3000
NODE_ENV=development

### WebSocket Configuration ###
WS_PORT=8080
WS_PATH=/ws
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=10000

### JWT Configuration ###
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=1h

### Admin Dashboard ###
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -base64 12)

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
DB_PASSWORD=$(openssl rand -base64 12)

### Backup Configuration ###
BACKUP_ENCRYPTION_KEY=${BACKUP_KEY}
MASTER_BACKUP_KEY=${MASTER_KEY}
EOL

echo "✅ Environment files created successfully!"
echo "📝 .env.example has been created with template values"
echo "🔐 .env has been created with secure random values for sensitive fields"
echo "🔑 Backup encryption key has been generated and set"
echo "🔐 Master backup key has been generated and set"
echo "⚠️  Please review and adjust the values in .env according to your needs"

# Export the keys for the current session
export BACKUP_ENCRYPTION_KEY=${BACKUP_KEY}
export MASTER_BACKUP_KEY=${MASTER_KEY}

# Make backup management script executable
chmod +x scripts/manage-backups.js

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run backup management commands with error handling
run_backup_command() {
    local command=$1
    echo "🔄 Running backup command: $command"
    
    if ! command_exists node; then
        echo "❌ Node.js is not installed. Please install Node.js to use backup management."
        exit 1
    fi
    
    if [ ! -f "scripts/manage-backups.js" ]; then
        echo "❌ Backup management script not found at scripts/manage-backups.js"
        exit 1
    fi
    
    if ! node scripts/manage-backups.js $command; then
        echo "❌ Backup command failed: $command"
        exit 1
    fi
}

# Run backup management commands
echo "\n🔐 Setting up backup management..."
run_backup_command "verify"

echo "\n🔄 Rotating backup encryption key..."
run_backup_command "rotate-key"

echo "\n🔄 Rotating master backup key..."
run_backup_command "rotate-master-key"

echo "\n✅ Backup management setup completed!"

# Copy the example environment file
cp .env.example .env

# Test your environment setup
npm run test:env

# Run the secret rotation tool
node scripts/rotate-secrets.js

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 
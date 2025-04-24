# Driftix

A modern web solution built with Next.js, React, and Tailwind CSS.

## Features

- Modern and responsive design
- Built with Next.js 14 and React 18
- Styled with Tailwind CSS
- TypeScript support
- ESLint configuration
- Optimized for performance

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/driftix.git
cd driftix
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
driftix/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── styles/
├── public/
│   └── images/
├── package.json
├── tsconfig.json
└── README.md
```

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm start` - Runs the built app in production mode
- `npm run lint` - Runs ESLint to catch errors

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - [@yourusername](https://twitter.com/yourusername)

Project Link: [https://github.com/yourusername/driftix](https://github.com/yourusername/driftix)

## Environment Setup

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- Redis 7 or higher
- npm or yarn

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

#### Server Configuration

- `PORT`: The port number for the main server (default: 3000)
- `NODE_ENV`: The environment mode (development, production, or test)

#### WebSocket Configuration

- `WS_PORT`: The port number for the WebSocket server (default: 8080)
- `WS_PATH`: The WebSocket endpoint path (default: /ws)
- `WS_PING_INTERVAL`: Keep-alive ping interval in milliseconds (default: 30000)
- `WS_PING_TIMEOUT`: Ping timeout duration in milliseconds (default: 10000)

#### JWT Configuration

- `JWT_SECRET`: Secret key for JWT tokens (must be at least 32 characters)
- `JWT_EXPIRES_IN`: Token expiration time (format: <number>[h|m|s], e.g., "1h")

#### Admin Dashboard

- `ADMIN_USERNAME`: Admin panel username
- `ADMIN_PASSWORD`: Admin panel password (must be at least 12 characters)

#### Redis Configuration

- `REDIS_HOST`: Redis server host (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis password (if any)
- `REDIS_DB`: Redis database number (default: 0)

#### Metrics Configuration

- `METRICS_ENABLED`: Enable/disable metrics (default: true)
- `METRICS_PORT`: Metrics server port (default: 9100)
- `METRICS_PATH`: Metrics endpoint path (default: /metrics)

#### Frontend Configuration

- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_WS_URL`: WebSocket server URL
- `REACT_APP_ENV`: Frontend environment (development, production, or test)

#### Presence System Configuration

- `PRESENCE_ACTIVITY_TIMEOUT`: User activity timeout in milliseconds (default: 300000)
- `PRESENCE_CLEANUP_INTERVAL`: Cleanup interval in milliseconds (default: 30000)
- `PRESENCE_MAX_ROOMS_PER_USER`: Maximum rooms per user (default: 5)
- `PRESENCE_MAX_USERS_PER_ROOM`: Maximum users per room (default: 100)

#### Logging Configuration

- `LOG_LEVEL`: Logging level (info, debug, warn, error)
- `LOG_FORMAT`: Log format (json, dev)
- `LOG_FILE`: Log file path (default: logs/app.log)

#### Security Configuration

- `CORS_ORIGIN`: Allowed CORS origins
- `RATE_LIMIT_WINDOW`: Rate limiting window in minutes (default: 15)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 100)

#### Database Configuration

- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password (must be at least 12 characters)

### Setting Up Environment Variables

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Generate secure values for sensitive fields:

   ```bash
   # For JWT_SECRET
   openssl rand -base64 32
   
   # For ADMIN_PASSWORD and DB_PASSWORD
   openssl rand -base64 12
   ```

3. Update the `.env` file with your specific values.

4. Run the environment validation script to ensure all variables are properly set:

   ```bash
   npm run test:env
   ```

### Environment-Specific Configuration

- **Development**: Use the default values in `.env.example`
- **Testing**: Use the test configuration in the CI/CD pipeline
- **Production**: Use secure values and production-specific settings

### Security Best Practices

1. Never commit the `.env` file to version control
2. Regularly rotate sensitive values (JWT_SECRET, DB_PASSWORD, etc.)
3. Use different values for development and production
4. Consider using a secrets management service for production

### CI/CD Integration

The project includes GitHub Actions workflows that:

1. Validate environment variables
2. Run tests with a test database
3. Ensure all required services are available

To set up the CI/CD pipeline:

1. Add the following secrets to your GitHub repository:
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
   - `DB_PASSWORD`
   - `REDIS_PASSWORD`

2. The workflow will automatically run on:
   - Push to main or develop branches
   - Pull requests to main or develop branches

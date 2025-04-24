# Secret Rotation Scripts

This directory contains scripts for managing and rotating application secrets securely.

## Secret Rotation

The `rotate-secrets.js` script provides a comprehensive solution for rotating application secrets with the following features:

- Secure secret generation
- Backup creation before rotation
- Rollback capability
- Integration with deployment platforms
- Notification system (Slack and Email)
- Application restart after rotation

### Configuration

The script is configured through `rotate-secrets.config.js`. Key configuration options include:

#### Secret Definitions

```javascript
secrets: {
  JWT_SECRET: { length: 32 },
  ADMIN_PASSWORD: { length: 16 },
  DB_PASSWORD: { length: 16 },
  REDIS_PASSWORD: { length: 16 }
}
```

#### Rollback Settings

```javascript
rollback: {
  enabled: true,
  backupPath: './backups/secrets'
}
```

#### Notification Settings

```javascript
notifications: {
  enabled: true,
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: '#secrets-rotation'
  },
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    fromEmail: 'secrets@yourdomain.com',
    toEmail: 'admin@yourdomain.com'
  }
}
```

#### Deployment Platform

```javascript
deployment: {
  platform: 'none', // Options: 'none', 'firebase', 'render', 'railway'
}
```

#### Application Restart

```javascript
restart: {
  enabled: true,
  delay: 5000,
  command: 'npm run start'
}
```

### Usage

1. Configure the script by editing `rotate-secrets.config.js`
2. Set up required environment variables:
   - `SLACK_WEBHOOK_URL` (if using Slack notifications)
   - `SMTP_*` variables (if using email notifications)
   - Deployment platform credentials (if using deployment integration)
3. Run the script:

   ```bash
   node rotate-secrets.js
   ```

### Security Considerations

- The script creates backups before rotation
- Secrets are generated using cryptographically secure random values
- Notifications are sent for audit purposes
- Rollback capability is available if needed
- Application restart ensures new secrets are loaded

### Best Practices

1. Run the script during low-traffic periods
2. Test the rollback procedure regularly
3. Keep backup files secure and encrypted
4. Monitor notification channels for rotation events
5. Review and update secret lengths periodically
6. Document any manual steps required for your specific deployment platform

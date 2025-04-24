# Features Documentation

## Data Export

The dashboard now supports exporting data in multiple formats:

### Supported Formats

- CSV: Comma-separated values format
- JSON: JavaScript Object Notation format

### How to Use

1. Navigate to the dashboard
2. Select a date range using the date picker
3. Click the export button
4. Choose your preferred format
5. The file will be downloaded automatically

## Two-Factor Authentication (2FA)

Enhanced security with two-factor authentication:

### Setup Process

1. Go to your profile settings
2. Click "Enable 2FA"
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the verification code
5. 2FA will be enabled for your account

### Security Features

- Time-based one-time passwords (TOTP)
- QR code generation for easy setup
- Backup codes for account recovery
- Automatic session management

### Best Practices

- Keep your authenticator app secure
- Don't share your 2FA codes
- Use a strong password in addition to 2FA
- Keep backup codes in a safe place

## API Endpoints

### Export API

```typescript
POST /api/export
Body: {
  format: 'csv' | 'json',
  dateRange?: {
    from: Date,
    to: Date
  }
}
```

### 2FA API

```typescript
POST /api/2fa/setup
Response: {
  secret: string,
  qrCode: string
}

POST /api/2fa/verify
Body: {
  code: string
}
Response: {
  success: boolean
}
```

## Security Considerations

- All API endpoints require authentication
- 2FA secrets are stored securely in the database
- Export data is filtered based on user permissions
- Rate limiting is implemented for security

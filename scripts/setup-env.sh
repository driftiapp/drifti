#!/bin/bash

# Create necessary directories
mkdir -p backend/src/main/resources

# Backend setup
if [ ! -f backend/.env ]; then
    echo "Setting up backend environment..."
    cp backend/.env.example backend/.env
    echo "Please edit backend/.env with your actual values"
fi

# Frontend setup
if [ ! -f frontend/.env ]; then
    echo "Setting up frontend environment..."
    cp frontend/.env.example frontend/.env
    echo "Please edit frontend/.env with your actual values"
fi

# Firebase credentials setup
if [ -f serviceAccountKey.json ]; then
    echo "Converting serviceAccountKey.json to base64..."
    FIREBASE_CREDENTIALS_BASE64=$(base64 -w 0 serviceAccountKey.json)
    echo "Add this to your backend/.env file:"
    echo "FIREBASE_CREDENTIALS_BASE64=$FIREBASE_CREDENTIALS_BASE64"
    echo ""
    echo "Moving serviceAccountKey.json to a secure location..."
    mv serviceAccountKey.json backend/src/main/resources/
    echo "⚠️ Make sure to add serviceAccountKey.json to .gitignore!"
else
    echo "⚠️ serviceAccountKey.json not found. Please obtain it from Firebase Console"
fi

# Generate JWT secret
if [ ! -f jwt_secret.txt ]; then
    echo "Generating new JWT secret..."
    openssl rand -base64 32 > jwt_secret.txt
    JWT_SECRET=$(cat jwt_secret.txt)
    echo "Add this to your backend/.env file:"
    echo "JWT_SECRET=$JWT_SECRET"
    echo ""
    echo "⚠️ Make sure to add jwt_secret.txt to .gitignore!"
fi

echo "Setup complete! Please:"
echo "1. Edit backend/.env with your database and Firebase settings"
echo "2. Edit frontend/.env with your Firebase client settings"
echo "3. Ensure all sensitive files are in .gitignore"
echo "4. Delete any sensitive files from Git history if they were committed"

# Default run
pwsh scripts/secure-project.ps1

# Skip confirmations
pwsh scripts/secure-project.ps1 -Force

# Skip Git history cleaning
pwsh scripts/secure-project.ps1 -SkipGitClean

# Skip backup creation
pwsh scripts/secure-project.ps1 -SkipBackup

# Skip encryption
pwsh scripts/secure-project.ps1 -SkipEncryption

# Provide custom backup password
pwsh scripts/secure-project.ps1 -BackupPassword "your-secure-password"

# Check for sensitive files
git status --ignored

# Verify .gitignore is working
git check-ignore serviceAccountKey.json
git check-ignore backend/.env
git check-ignore frontend/.env

# Restore from latest backup
pwsh scripts/restore-project.ps1

# Restore from specific backup
pwsh scripts/restore-project.ps1 -BackupDir "secure-backup-20240220-123456"

# Restore specific files
pwsh scripts/restore-project.ps1 -SpecificFiles @("backend/.env", "serviceAccountKey.json")

# Skip decryption for unencrypted backups
pwsh scripts/restore-project.ps1 -SkipDecryption

# Force restore without confirmation
pwsh scripts/restore-project.ps1 -Force

# Validate files after restore
pwsh scripts/restore-project.ps1 -ValidateAfterRestore

# Run full security audit
pwsh scripts/security-audit.ps1 -GenerateReport

# Run audit and fix vulnerabilities
pwsh scripts/security-audit.ps1 -FixVulnerabilities -GenerateReport

# Skip specific checks
pwsh scripts/security-audit.ps1 -SkipOwasp -GenerateReport

# Custom report path
pwsh scripts/security-audit.ps1 -ReportPath "reports/security-audit-$(Get-Date -Format 'yyyyMMdd').md"

# Run standalone scan
pwsh scripts/security-monitor.ps1 -AlertMethod all -SlackWebhook "https://hooks.slack.com/..."

# Run in CI mode
pwsh scripts/security-monitor.ps1 -Mode ci

# Run scheduled with auto-remediation
pwsh scripts/security-monitor.ps1 -Mode scheduled -ScanIntervalHours 12 -AutoRemediate

# Show the dashboard
./scripts/security-monitor.ps1 -ShowDashboard

# Run security scan with dashboard
./scripts/security-monitor.ps1 -Mode standalone -ShowDashboard -AutoRemediate

# GitHub Actions example
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Security Scan
      run: pwsh scripts/security-monitor.ps1 -Mode ci
  permissions:
    contents: write
    deployments: write
    issues: write
    pull-requests: write
    statuses: write

# With custom alert handling
$dashboard.SetAlertCallback({
    param($event)
    # Send to Slack, email, etc.
    Write-Host "ALERT: $($event.Message)" -ForegroundColor Red
})

# Configure Slack alerts
$dashboard.ConfigureSlackAlerts(
    "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "#security-alerts",
    "Security Monitor",
    ":shield:"
)

# Configure email alerts
$dashboard.ConfigureEmailAlerts(
    "smtp.company.com",
    587,
    $true,
    "security@company.com",
    @("admin@company.com", "security-team@company.com"),
    $credentials
)

# Customize alert rules
$dashboard.ConfigureAlertRule("CriticalThreats", $true, @{
    MinScore = 85
    Channels = @("Slack", "Email")
    Template = "🚨 High-Risk Threat: {IP} (Score: {Score}%)"
})

# Add new secrets to GitHub
echo "RENDER_API_KEY: rnd_qmlbV08y7FZX1IEmS8V2YvkybC3K"
echo "RENDER_BACKEND_SERVICE_ID: srv-cvh80kogph6c73fj7bpg"
echo "RENDER_FRONTEND_SERVICE_ID: srv-cvh6rpin91rc73au56d0"
echo "FIREBASE_TOKEN: 1//052YFeeo2pL2KCgYIARAAGAUSNwF-L9Ir1Hjn1NHBwzJ0Yo2floG3xSeHLu2cA29zQp0K632-vdjyJKn-ApUG9jEhO6qLTQmq pE8"
echo "NEXT_PUBLIC_FIREBASE_API_KEY: AIzaSyA_YX244PTxsjLsDnKJHH_TbfmtQ6bFAgw"

# Deploy with verification
npm run deploy:safe

# Check performance
npm run performance:monitor

# Security audit
npm run security:audit

# Bundle analysis
npm run analyze

# Verify deployment
npm run verify:deploy 
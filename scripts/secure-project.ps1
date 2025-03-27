# Unified Security Project Setup Script
[CmdletBinding()]
param (
    [switch]$Force,
    [switch]$SkipGitClean,
    [switch]$SkipBackup,
    [switch]$SkipEncryption,
    [string]$BackupPassword
)

function Initialize-SecureProject {
    Write-Host "🔒 Starting Secure Project Setup..." -ForegroundColor Green

    try {
        # 1. Verify Git repository
        if (-not (Test-Path ".git")) {
            throw "Not a Git repository. Please run this script from the root of your Git project."
        }

        # 2. Create timestamp and directories
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupDir = "secure-backup-${timestamp}"
        $directories = @(
            $backupDir,
            "backend/src/main/resources/security",
            "frontend/src/config",
            "scripts/security"
        )

        foreach ($dir in $directories) {
            if (-not (Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
                Write-Host "  ✓ Created directory: $dir" -ForegroundColor Green
            }
        }

        # 3. Define sensitive files
        $sensitiveFiles = @(
            "serviceAccountKey.json",
            "jwt_secret.txt",
            ".env",
            ".env.local",
            "backend/.env",
            "frontend/.env",
            "frontend/.env.local",
            "*.key",
            "*.pem",
            "credentials.json"
        )

        # 4. Backup and encrypt sensitive files
        if (-not $SkipBackup) {
            Write-Host "`n🔐 Backing up sensitive files..." -ForegroundColor Yellow
            
            foreach ($pattern in $sensitiveFiles) {
                Get-ChildItem -Path . -Recurse -File -Filter $pattern | ForEach-Object {
                    $relativePath = $_.FullName.Replace($PWD.Path + '\', '')
                    $backupPath = Join-Path $backupDir $relativePath
                    $backupDir = Split-Path $backupPath -Parent

                    if (-not (Test-Path $backupDir)) {
                        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
                    }

                    if (-not $SkipEncryption) {
                        # Generate encryption password if not provided
                        if (-not $BackupPassword) {
                            $BackupPassword = [Convert]::ToBase64String((New-Object byte[] 32))
                            Set-Content -Path (Join-Path $backupDir "backup-key.txt") -Value $BackupPassword
                        }

                        # Encrypt file content
                        $content = Get-Content $_.FullName -Raw
                        $secureString = ConvertTo-SecureString $content -AsPlainText -Force
                        $encrypted = ConvertFrom-SecureString $secureString -Key ([System.Convert]::FromBase64String($BackupPassword))
                        Set-Content -Path "${backupPath}.enc" -Value $encrypted
                        Write-Host "  ✓ Encrypted and backed up: $relativePath" -ForegroundColor Green
                    } else {
                        Copy-Item $_.FullName -Destination $backupPath -Force
                        Write-Host "  ✓ Backed up: $relativePath" -ForegroundColor Green
                    }
                }
            }
        }

        # 5. Handle Firebase credentials
        if (Test-Path "serviceAccountKey.json") {
            Write-Host "`n🔑 Processing Firebase credentials..." -ForegroundColor Yellow
            
            # Convert to base64
            $content = Get-Content "serviceAccountKey.json" -Raw
            $base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
            
            # Update backend .env
            $envPath = "backend/.env"
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
                if ($envContent -match "FIREBASE_CREDENTIALS_BASE64=") {
                    $envContent = $envContent -replace "FIREBASE_CREDENTIALS_BASE64=.*", "FIREBASE_CREDENTIALS_BASE64=$base64"
                } else {
                    $envContent += "`nFIREBASE_CREDENTIALS_BASE64=$base64"
                }
                Set-Content -Path $envPath -Value $envContent
                Write-Host "  ✓ Updated Firebase credentials in backend/.env" -ForegroundColor Green
            }
            
            # Move original file to secure location
            Move-Item "serviceAccountKey.json" "backend/src/main/resources/security/" -Force
            Write-Host "  ✓ Moved serviceAccountKey.json to secure location" -ForegroundColor Green
        }

        # 6. Generate JWT secret
        if (-not (Test-Path "jwt_secret.txt")) {
            Write-Host "`n🔑 Generating JWT secret..." -ForegroundColor Yellow
            $jwtSecret = [Convert]::ToBase64String((New-Object byte[] 32))
            Set-Content -Path "jwt_secret.txt" -Value $jwtSecret
            
            # Update backend .env
            $envPath = "backend/.env"
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
                if ($envContent -match "JWT_SECRET=") {
                    $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret"
                } else {
                    $envContent += "`nJWT_SECRET=$jwtSecret"
                }
                Set-Content -Path $envPath -Value $envContent
                Write-Host "  ✓ Updated JWT secret in backend/.env" -ForegroundColor Green
            }
        }

        # 7. Update .gitignore
        Write-Host "`n📝 Updating .gitignore..." -ForegroundColor Yellow
        $gitignoreEntries = @(
            "# Environment Variables",
            ".env",
            ".env.local",
            ".env.*.local",
            "*.env",
            "# Sensitive Files",
            "serviceAccountKey.json",
            "jwt_secret.txt",
            "secure-backup*/",
            "*.key",
            "*.pem",
            "*.cert",
            "credentials.json",
            "backup-key.txt",
            "# Firebase",
            "firebase-debug.log",
            ".firebase/",
            "# Build & Dependencies",
            "node_modules/",
            "dist/",
            "build/",
            ".next/",
            "target/",
            "# IDE & OS",
            ".idea/",
            ".vscode/",
            ".DS_Store",
            "Thumbs.db",
            "# Logs",
            "*.log",
            "npm-debug.log*",
            "yarn-debug.log*",
            "yarn-error.log*"
        )

        Set-Content -Path ".gitignore" -Value ($gitignoreEntries -join "`n")
        Write-Host "  ✓ Updated .gitignore" -ForegroundColor Green

        # 8. Clean Git history if needed
        if (-not $SkipGitClean) {
            $cleanGit = $Force -or ((Read-Host "`nDo you want to clean Git history? This is irreversible! (y/N)").ToLower() -eq 'y')
            if ($cleanGit) {
                Write-Host "`n🧹 Cleaning Git history..." -ForegroundColor Yellow
                
                # Create temporary branch
                $tempBranch = "temp-clean-${timestamp}"
                git checkout --orphan $tempBranch
                
                # Add all files except sensitive ones
                git add .
                foreach ($pattern in $sensitiveFiles) {
                    git reset HEAD $pattern 2>$null
                }
                
                # Commit and replace main branch
                git commit -m "🔒 Clean repository state (removed sensitive files)"
                git branch -D main 2>$null
                git branch -m main
                
                Write-Host "`n⚠️  Git history has been cleaned. Next steps:" -ForegroundColor Yellow
                Write-Host "1. Review changes to ensure no sensitive data remains"
                Write-Host "2. Force push: git push origin main --force"
                Write-Host "3. Team members should run: git fetch origin && git reset --hard origin/main"
            }
        }

        # 9. Create example environment files
        Write-Host "`n📄 Creating environment examples..." -ForegroundColor Yellow
        
        # Backend .env.example
        $backendEnvExample = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=86400000

# Firebase Configuration
FIREBASE_CREDENTIALS_BASE64=your_base64_encoded_credentials
FIREBASE_PROJECT_ID=your_project_id

# Server Configuration
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Security Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_HTTPS_ONLY=true
"@

        # Frontend .env.example
        $frontendEnvExample = @"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
"@

        Set-Content -Path "backend/.env.example" -Value $backendEnvExample
        Set-Content -Path "frontend/.env.example" -Value $frontendEnvExample
        Write-Host "  ✓ Created environment example files" -ForegroundColor Green

        # 10. Verify setup
        Write-Host "`n🔍 Verifying setup..." -ForegroundColor Yellow
        
        # Check .gitignore effectiveness
        foreach ($file in $sensitiveFiles) {
            if (git check-ignore $file 2>$null) {
                Write-Host "  ✓ $file will be ignored by Git" -ForegroundColor Green
            }
        }

        Write-Host "`n✅ Security setup completed!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Review the backup in '${backupDir}'"
        if (-not $SkipEncryption) {
            Write-Host "2. Save the encryption key from '${backupDir}/backup-key.txt' securely"
        }
        Write-Host "3. Update your .env files with actual values"
        Write-Host "4. Run 'git status' to verify no sensitive files are tracked"
        Write-Host "5. If you cleaned Git history, coordinate with your team before force pushing"

    } catch {
        Write-Host "`n❌ Error during security setup: $_" -ForegroundColor Red
        exit 1
    }
}

# Run the setup
Initialize-SecureProject @PSBoundParameters 
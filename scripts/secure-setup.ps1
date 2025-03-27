# Unified Security Setup Script
Write-Host "🔒 Starting Unified Security Setup..." -ForegroundColor Green

# Import existing security functions
. "./scripts/setup-secure-environment.ps1"

function Initialize-SecureEnvironment {
    param (
        [switch]$Force,
        [switch]$SkipGitClean,
        [switch]$SkipBackup
    )

    try {
        # 1. Create timestamp for this run
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupDir = "secure-backup-${timestamp}"

        # 2. Verify Git repository
        if (-not (Test-Path ".git")) {
            throw "Not a Git repository. Please run this script from the root of your Git project."
        }

        # 3. Create necessary directories
        $directories = @(
            "backend/src/main/resources/security",
            "frontend/src/config",
            $backupDir
        )
        foreach ($dir in $directories) {
            if (-not (Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
                Write-Host "  ✓ Created directory: $dir" -ForegroundColor Green
            }
        }

        # 4. Backup and encrypt sensitive files
        if (-not $SkipBackup) {
            Write-Host "`n🔐 Backing up sensitive files..." -ForegroundColor Yellow
            $sensitiveFiles = @(
                "serviceAccountKey.json",
                "jwt_secret.txt",
                ".env",
                "backend/.env",
                "frontend/.env",
                "frontend/.env.local",
                "*.key",
                "*.pem"
            )

            foreach ($pattern in $sensitiveFiles) {
                Get-ChildItem -Path . -Recurse -File -Filter $pattern | ForEach-Object {
                    $relativePath = $_.FullName.Replace($PWD.Path + '\', '')
                    $encryptedPath = Join-Path $backupDir "${relativePath}.enc"
                    $encryptedDir = Split-Path $encryptedPath -Parent

                    if (-not (Test-Path $encryptedDir)) {
                        New-Item -ItemType Directory -Path $encryptedDir -Force | Out-Null
                    }

                    # Encrypt file content
                    $content = Get-Content $_.FullName -Raw
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                    $encrypted = Protect-CmsMessage -Content $bytes
                    Set-Content -Path $encryptedPath -Value $encrypted -Encoding Byte

                    Write-Host "  ✓ Encrypted and backed up: $relativePath" -ForegroundColor Green
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

        # 6. Generate JWT secret if needed
        if (-not (Test-Path "jwt_secret.txt")) {
            Write-Host "`n🔑 Generating JWT secret..." -ForegroundColor Yellow
            $jwtSecret = New-SecureSecret
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
            "Thumbs.db"
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
        Create-EnvExamples

        # 10. Validate environment setup
        Write-Host "`n🔍 Validating environment setup..." -ForegroundColor Yellow
        $backendValid = Test-RequiredVariables -EnvFile "backend/.env" -RequiredVars @(
            "DB_HOST",
            "JWT_SECRET",
            "FIREBASE_CREDENTIALS_BASE64"
        )
        
        $frontendValid = Test-RequiredVariables -EnvFile "frontend/.env" -RequiredVars @(
            "NEXT_PUBLIC_FIREBASE_API_KEY",
            "NEXT_PUBLIC_API_URL"
        )

        Write-Host "`n✅ Security setup completed!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Review the encrypted backup in '${backupDir}'"
        Write-Host "2. Update environment files with actual values"
        Write-Host "3. Run security headers setup: ./scripts/setup-secure-environment.ps1"
        Write-Host "4. Test the health endpoint: http://localhost:8080/api/health"
        Write-Host "5. Run 'git status' to verify no sensitive files are tracked"
        
        if (-not ($backendValid -and $frontendValid)) {
            Write-Host "`n⚠️  Some environment variables are missing. Please update your .env files." -ForegroundColor Yellow
        }

    } catch {
        Write-Host "`n❌ Error during security setup: $_" -ForegroundColor Red
        exit 1
    }
}

# Run the setup
Initialize-SecureEnvironment 
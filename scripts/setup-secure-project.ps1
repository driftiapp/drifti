# Project Security Setup Script
Write-Host "🚀 Starting project security setup..."

# 1. Create necessary directories
Write-Host "`n📁 Creating necessary directories..."
New-Item -ItemType Directory -Force -Path backend/src/main/resources | Out-Null
New-Item -ItemType Directory -Force -Path frontend/src | Out-Null

# 2. Setup environment files
Write-Host "`n📝 Setting up environment files..."

# Backend .env
if (!(Test-Path backend/.env)) {
    if (Test-Path backend/.env.example) {
        Copy-Item backend/.env.example backend/.env
        Write-Host "✅ Created backend/.env from example"
    } else {
        Write-Host "⚠️ backend/.env.example not found. Please create it manually."
    }
}

# Frontend .env
if (!(Test-Path frontend/.env)) {
    if (Test-Path frontend/.env.example) {
        Copy-Item frontend/.env.example frontend/.env
        Write-Host "✅ Created frontend/.env from example"
    } else {
        Write-Host "⚠️ frontend/.env.example not found. Please create it manually."
    }
}

# 3. Handle Firebase credentials
Write-Host "`n🔥 Processing Firebase credentials..."
if (Test-Path "serviceAccountKey.json") {
    Write-Host "Found serviceAccountKey.json"
    try {
        # Convert to base64
        $base64Creds = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("serviceAccountKey.json"))
        
        # Update backend/.env
        $envContent = Get-Content backend/.env -ErrorAction SilentlyContinue
        $envContent = $envContent | Where-Object { !$_.StartsWith("FIREBASE_CREDENTIALS_BASE64=") }
        $envContent += "FIREBASE_CREDENTIALS_BASE64=$base64Creds"
        $envContent | Set-Content backend/.env
        
        # Move file to secure location
        Move-Item -Force serviceAccountKey.json backend/src/main/resources/
        Write-Host "✅ Firebase credentials secured and moved to backend/src/main/resources/"
    } catch {
        Write-Host "❌ Error processing Firebase credentials: $_"
    }
} else {
    Write-Host "⚠️ serviceAccountKey.json not found. Get it from Firebase Console."
}

# 4. Handle JWT Secret
Write-Host "`n🔑 Setting up JWT secret..."
if (Test-Path "jwt_secret.txt") {
    try {
        $jwtSecret = Get-Content jwt_secret.txt
        
        # Update backend/.env
        $envContent = Get-Content backend/.env -ErrorAction SilentlyContinue
        $envContent = $envContent | Where-Object { !$_.StartsWith("JWT_SECRET=") }
        $envContent += "JWT_SECRET=$jwtSecret"
        $envContent | Set-Content backend/.env
        
        Remove-Item jwt_secret.txt
        Write-Host "✅ JWT secret secured and file removed"
    } catch {
        Write-Host "❌ Error processing JWT secret: $_"
    }
} else {
    # Generate new JWT secret
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $envContent = Get-Content backend/.env -ErrorAction SilentlyContinue
    $envContent = $envContent | Where-Object { !$_.StartsWith("JWT_SECRET=") }
    $envContent += "JWT_SECRET=$jwtSecret"
    $envContent | Set-Content backend/.env
    Write-Host "✅ New JWT secret generated and secured"
}

# 5. Clean up sensitive files
Write-Host "`n🧹 Cleaning up sensitive files..."
$sensitiveFiles = @(
    "serviceAccountKey.json",
    "jwt_secret.txt",
    ".env.local",
    ".env.development",
    ".env.production"
)

Get-ChildItem -Path . -Recurse -Include $sensitiveFiles | 
    Where-Object { $_.FullName -notlike "*backend\src\main\resources*" } | 
    ForEach-Object {
        Write-Host "Removing: $($_.FullName)"
        Remove-Item $_.FullName -Force
    }

# 6. Git security check
Write-Host "`n🔍 Checking Git security..."
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
$requiredIgnores = @(
    "*.env",
    "!.env.example",
    "serviceAccountKey.json",
    "jwt_secret.txt",
    "*.key",
    "*.pem",
    "*.p12",
    "*.jks"
)

foreach ($ignore in $requiredIgnores) {
    if ($gitignoreContent -notcontains $ignore) {
        Add-Content .gitignore "`n$ignore"
        Write-Host "Added $ignore to .gitignore"
    }
}

Write-Host "`n✨ Security setup complete!"
Write-Host "`n📋 Next steps:"
Write-Host "1. Update backend/.env with your database settings"
Write-Host "2. Update frontend/.env with your Firebase client settings"
Write-Host "3. Run 'git clean -fdx' to remove any ignored files"
Write-Host "4. If sensitive files were committed, run scripts/clean-git-history.ps1" 
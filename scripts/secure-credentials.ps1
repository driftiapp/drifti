# Secure credentials script
Write-Host "🔒 Securing credentials..."

# Create necessary directories
New-Item -ItemType Directory -Force -Path backend/src/main/resources | Out-Null

# Handle Firebase credentials
if (Test-Path "serviceAccountKey.json") {
    Write-Host "📝 Converting serviceAccountKey.json to base64..."
    $base64Creds = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("serviceAccountKey.json"))
    
    # Update backend/.env
    $envContent = Get-Content backend/.env -ErrorAction SilentlyContinue
    $envContent = $envContent | Where-Object { !$_.StartsWith("FIREBASE_CREDENTIALS_BASE64=") }
    $envContent += "FIREBASE_CREDENTIALS_BASE64=$base64Creds"
    $envContent | Set-Content backend/.env

    # Move serviceAccountKey.json to secure location
    Write-Host "📦 Moving serviceAccountKey.json to secure location..."
    Move-Item -Force serviceAccountKey.json backend/src/main/resources/
    
    Write-Host "✅ Firebase credentials secured!"
} else {
    Write-Host "⚠️ serviceAccountKey.json not found. Please obtain it from Firebase Console"
}

# Handle JWT secret
if (Test-Path "jwt_secret.txt") {
    Write-Host "🔑 Securing JWT secret..."
    $jwtSecret = Get-Content jwt_secret.txt
    
    # Update backend/.env
    $envContent = Get-Content backend/.env -ErrorAction SilentlyContinue
    $envContent = $envContent | Where-Object { !$_.StartsWith("JWT_SECRET=") }
    $envContent += "JWT_SECRET=$jwtSecret"
    $envContent | Set-Content backend/.env
    
    # Remove jwt_secret.txt
    Remove-Item jwt_secret.txt
    
    Write-Host "✅ JWT secret secured!"
} else {
    Write-Host "🔑 Generating new JWT secret..."
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    # Update backend/.env
    $envContent = Get-Content backend/.env -ErrorAction SilentlyContinue
    $envContent = $envContent | Where-Object { !$_.StartsWith("JWT_SECRET=") }
    $envContent += "JWT_SECRET=$jwtSecret"
    $envContent | Set-Content backend/.env
    
    Write-Host "✅ New JWT secret generated and secured!"
}

# Clean up any duplicate serviceAccountKey.json files
Get-ChildItem -Path . -Recurse -Include serviceAccountKey.json | 
    Where-Object { $_.FullName -notlike "*backend\src\main\resources*" } | 
    ForEach-Object { 
        Write-Host "🗑️ Removing duplicate Firebase credentials at: $($_.FullName)"
        Remove-Item $_.FullName 
    }

Write-Host "✨ Credentials secured successfully!"
Write-Host "⚠️ Remember to:"
Write-Host "1. Never commit .env files"
Write-Host "2. Keep your serviceAccountKey.json secure"
Write-Host "3. Backup your credentials in a secure location" 
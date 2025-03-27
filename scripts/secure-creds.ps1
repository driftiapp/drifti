# Create secure directory
New-Item -ItemType Directory -Force -Path backend/src/main/resources | Out-Null

# Handle Firebase credentials
if (Test-Path "serviceAccountKey.json") {
    $base64Creds = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("serviceAccountKey.json"))
    Add-Content -Path backend/.env -Value "FIREBASE_CREDENTIALS_BASE64=$base64Creds"
    Move-Item -Force serviceAccountKey.json backend/src/main/resources/
}

# Handle JWT secret
if (Test-Path "jwt_secret.txt") {
    $jwtSecret = Get-Content jwt_secret.txt
    Add-Content -Path backend/.env -Value "JWT_SECRET=$jwtSecret"
    Remove-Item jwt_secret.txt
} else {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Add-Content -Path backend/.env -Value "JWT_SECRET=$jwtSecret"
}

# Clean up duplicate files
Get-ChildItem -Path . -Recurse -Include serviceAccountKey.json | 
    Where-Object { $_.FullName -notlike "*backend\src\main\resources*" } | 
    Remove-Item 
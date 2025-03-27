# Restore Project from Secure Backup
[CmdletBinding()]
param (
    [string]$BackupDir,
    [string]$BackupPassword,
    [string[]]$SpecificFiles,
    [switch]$Force,
    [switch]$SkipDecryption,
    [switch]$ValidateAfterRestore
)

function Find-LatestBackup {
    Write-Host "🔍 Looking for latest backup..." -ForegroundColor Yellow
    
    $backups = Get-ChildItem -Directory -Filter "secure-backup-*" | 
        Where-Object { $_.Name -match "secure-backup-\d{8}-\d{6}" } |
        Sort-Object Name -Descending
    
    if (-not $backups) {
        throw "No backup directories found matching pattern 'secure-backup-*'"
    }
    
    $latest = $backups[0]
    Write-Host "  ✓ Found latest backup: $($latest.Name)" -ForegroundColor Green
    return $latest.FullName
}

function Get-BackupPassword {
    param (
        [string]$BackupDir
    )
    
    $keyFile = Join-Path $BackupDir "backup-key.txt"
    if (Test-Path $keyFile) {
        return Get-Content $keyFile
    }
    return $null
}

function Test-RestorePrerequisites {
    param (
        [string]$BackupDir,
        [string]$BackupPassword
    )
    
    Write-Host "🔍 Checking restore prerequisites..." -ForegroundColor Yellow
    
    if (-not (Test-Path $BackupDir)) {
        throw "Backup directory not found: $BackupDir"
    }
    
    if (-not $SkipDecryption -and -not $BackupPassword) {
        $keyFile = Join-Path $BackupDir "backup-key.txt"
        if (-not (Test-Path $keyFile)) {
            throw "No backup key found and no password provided. Cannot decrypt files."
        }
    }
    
    Write-Host "  ✓ Prerequisites check passed" -ForegroundColor Green
}

function Restore-EnvironmentFile {
    param (
        [string]$Source,
        [string]$Destination,
        [string]$BackupPassword
    )
    
    try {
        if ($Source.EndsWith(".enc")) {
            # Decrypt and restore
            $encrypted = Get-Content $Source
            $secureString = ConvertTo-SecureString $encrypted -Key ([System.Convert]::FromBase64String($BackupPassword))
            $decrypted = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
            )
            Set-Content -Path $Destination -Value $decrypted
        } else {
            # Simple copy
            Copy-Item -Path $Source -Destination $Destination -Force
        }
        Write-Host "  ✓ Restored: $Destination" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ❌ Failed to restore $Destination : $_" -ForegroundColor Red
        return $false
    }
}

function Restore-SecureFiles {
    param (
        [string]$BackupDir,
        [string]$BackupPassword,
        [string[]]$SpecificFiles
    )
    
    Write-Host "`n🔄 Restoring secure files..." -ForegroundColor Yellow
    
    # Define critical files that should always be restored unless specific files are requested
    $criticalFiles = @(
        "serviceAccountKey.json",
        "jwt_secret.txt",
        ".env",
        "backend/.env",
        "frontend/.env"
    )
    
    $filesToRestore = $SpecificFiles.Count -gt 0 ? $SpecificFiles : $criticalFiles
    $restoredFiles = @()
    $failedFiles = @()
    
    foreach ($file in $filesToRestore) {
        $backupFile = Join-Path $BackupDir $file
        $encryptedFile = "${backupFile}.enc"
        
        # Check for encrypted version first
        if (Test-Path $encryptedFile) {
            if (Restore-EnvironmentFile -Source $encryptedFile -Destination $file -BackupPassword $BackupPassword) {
                $restoredFiles += $file
            } else {
                $failedFiles += $file
            }
        }
        # Then check for unencrypted version
        elseif (Test-Path $backupFile) {
            if (Restore-EnvironmentFile -Source $backupFile -Destination $file -BackupPassword $null) {
                $restoredFiles += $file
            } else {
                $failedFiles += $file
            }
        }
        else {
            Write-Host "  ⚠️ No backup found for: $file" -ForegroundColor Yellow
            $failedFiles += $file
        }
    }
    
    return @{
        Restored = $restoredFiles
        Failed = $failedFiles
    }
}

function Test-RestoredEnvironment {
    param (
        [string[]]$RestoredFiles
    )
    
    Write-Host "`n🔍 Validating restored environment..." -ForegroundColor Yellow
    $errors = @()
    
    foreach ($file in $RestoredFiles) {
        if (-not (Test-Path $file)) {
            $errors += "File not found after restore: $file"
            continue
        }
        
        try {
            $content = Get-Content $file -Raw
            
            # Validate .env files
            if ($file -like "*.env") {
                if (-not ($content -match "=")) {
                    $errors += "Invalid .env file format: $file"
                }
                
                # Check for empty values
                $lines = $content -split "`n" | Where-Object { $_ -match "=" }
                foreach ($line in $lines) {
                    if ($line -match "^([^=]+)=\s*$") {
                        $errors += "Empty value for $($matches[1]) in $file"
                    }
                }
            }
            
            # Validate JSON files
            if ($file -like "*.json") {
                $null = ConvertFrom-Json $content
            }
        }
        catch {
            $errors += "Error validating $file : $_"
        }
    }
    
    if ($errors.Count -gt 0) {
        Write-Host "  ⚠️ Validation found issues:" -ForegroundColor Yellow
        foreach ($error in $errors) {
            Write-Host "    - $error" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✓ All restored files validated successfully" -ForegroundColor Green
    }
    
    return $errors
}

# Main execution
try {
    # 1. Determine backup directory
    if (-not $BackupDir) {
        $BackupDir = Find-LatestBackup
    }
    
    # 2. Get backup password if not provided
    if (-not $BackupPassword -and -not $SkipDecryption) {
        $BackupPassword = Get-BackupPassword -BackupDir $BackupDir
    }
    
    # 3. Check prerequisites
    Test-RestorePrerequisites -BackupDir $BackupDir -BackupPassword $BackupPassword
    
    # 4. Confirm restore
    if (-not $Force) {
        $message = "Are you sure you want to restore from backup? This will overwrite existing files."
        if ($SpecificFiles) {
            $message += "`nFiles to restore: $($SpecificFiles -join ', ')"
        }
        $confirm = Read-Host "$message (y/N)"
        if ($confirm -ne "y") {
            Write-Host "❌ Restore cancelled by user" -ForegroundColor Red
            exit 0
        }
    }
    
    # 5. Perform restore
    $result = Restore-SecureFiles -BackupDir $BackupDir -BackupPassword $BackupPassword -SpecificFiles $SpecificFiles
    
    # 6. Validate if requested
    if ($ValidateAfterRestore) {
        $errors = Test-RestoredEnvironment -RestoredFiles $result.Restored
        if ($errors.Count -gt 0) {
            Write-Host "`n⚠️ Restore completed with validation errors" -ForegroundColor Yellow
        }
    }
    
    # 7. Summary
    Write-Host "`n📋 Restore Summary:" -ForegroundColor Cyan
    Write-Host "Successfully restored: $($result.Restored.Count) files"
    if ($result.Failed.Count -gt 0) {
        Write-Host "Failed to restore: $($result.Failed.Count) files"
        Write-Host "Failed files:"
        $result.Failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    
    Write-Host "`n✅ Restore process completed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Review restored files to ensure they contain the expected values"
    Write-Host "2. Update any environment-specific values if needed"
    Write-Host "3. Restart your applications to apply the changes"
    
} catch {
    Write-Host "`n❌ Error during restore: $_" -ForegroundColor Red
    exit 1
} 
# Unified Security Setup Script
Write-Host "🔒 Starting unified security setup..." -ForegroundColor Green

# Import existing security functions
. "./scripts/secure-project.ps1"

function Test-CommandExists {
    param (
        [string]$Command
    )
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

function Initialize-ProjectStructure {
    Write-Host "📂 Initializing project structure..." -ForegroundColor Yellow
    
    $directories = @(
        "backend/src/main/resources",
        "backend/src/main/java/com/drifti/config",
        "backend/src/main/java/com/drifti/security",
        "frontend/src/components",
        "frontend/src/config",
        "scripts/security"
    )

    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  ✓ Created directory: $dir" -ForegroundColor Green
        }
    }
}

function Move-SensitiveFiles {
    Write-Host "📦 Moving sensitive files to secure locations..." -ForegroundColor Yellow
    
    # Move Firebase credentials
    if (Test-Path "serviceAccountKey.json") {
        $secureDir = "backend/src/main/resources/security"
        if (-not (Test-Path $secureDir)) {
            New-Item -ItemType Directory -Path $secureDir -Force | Out-Null
        }
        Move-Item "serviceAccountKey.json" "$secureDir/serviceAccountKey.json" -Force
        Write-Host "  ✓ Moved serviceAccountKey.json to secure location" -ForegroundColor Green
    }
}

function Update-SecurityHeaders {
    Write-Host "🛡️ Adding security configuration..." -ForegroundColor Yellow
    
    # Create SecurityConfig.java if it doesn't exist
    $securityConfigPath = "backend/src/main/java/com/drifti/config/SecurityConfig.java"
    if (-not (Test-Path $securityConfigPath)) {
        $securityConfig = @"
package com.drifti.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()  // CSRF is handled by Firebase Auth tokens
            .cors()
            .and()
            .headers()
                .xssProtection()
                .and()
                .contentSecurityPolicy("default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';")
                .and()
                .referrerPolicy(ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN)
                .and()
                .frameOptions().deny()
                .and()
            .authorizeRequests()
                .antMatchers("/api/health/**").permitAll()
                .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated()
            .and()
            .oauth2ResourceServer()
                .jwt();

        return http.build();
    }
}
"@
        Set-Content -Path $securityConfigPath -Value $securityConfig
        Write-Host "  ✓ Created SecurityConfig.java with secure defaults" -ForegroundColor Green
    }
}

function Add-RateLimiting {
    Write-Host "🚦 Adding rate limiting configuration..." -ForegroundColor Yellow
    
    # Create RateLimitConfig.java
    $rateLimitConfigPath = "backend/src/main/java/com/drifti/config/RateLimitConfig.java"
    if (-not (Test-Path $rateLimitConfigPath)) {
        $rateLimitConfig = @"
package com.drifti.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import java.time.Duration;

@Configuration
public class RateLimitConfig {
    
    private final Environment env;
    
    public RateLimitConfig(Environment env) {
        this.env = env;
    }
    
    @Bean
    public Bucket bucket() {
        long capacity = env.getProperty("RATE_LIMIT_MAX_REQUESTS", Long.class, 100L);
        long duration = env.getProperty("RATE_LIMIT_WINDOW_MS", Long.class, 900000L);
        
        Bandwidth limit = Bandwidth.classic(capacity, Refill.intervally(capacity, Duration.ofMillis(duration)));
        return Bucket4j.builder().addLimit(limit).build();
    }
}
"@
        Set-Content -Path $rateLimitConfigPath -Value $rateLimitConfig
        Write-Host "  ✓ Created RateLimitConfig.java" -ForegroundColor Green
    }
}

function Update-HealthChecks {
    Write-Host "🏥 Updating health check endpoints..." -ForegroundColor Yellow
    
    # Update HealthController.java
    $healthControllerPath = "backend/src/main/java/com/drifti/controller/HealthController.java"
    if (-not (Test-Path $healthControllerPath)) {
        $healthController = @"
package com.drifti.controller;

import com.google.firebase.FirebaseApp;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Map<String, Object> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        Map<String, Object> services = new HashMap<>();
        Map<String, Object> system = new HashMap<>();

        // Check Database
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            services.put("database", Map.of(
                "status", "healthy",
                "message", "Database connection successful",
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            services.put("database", Map.of(
                "status", "unhealthy",
                "message", "Database connection failed: " + e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }

        // Check Firebase
        try {
            FirebaseApp.getInstance();
            services.put("firebase", Map.of(
                "status", "healthy",
                "message", "Firebase connection successful",
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            services.put("firebase", Map.of(
                "status", "unhealthy",
                "message", "Firebase connection failed: " + e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }

        // System Information
        Runtime runtime = Runtime.getRuntime();
        system.put("memory", Map.of(
            "total", runtime.totalMemory(),
            "free", runtime.freeMemory(),
            "max", runtime.maxMemory()
        ));
        system.put("cpu", Map.of(
            "processors", runtime.availableProcessors()
        ));
        system.put("java", Map.of(
            "version", System.getProperty("java.version"),
            "vendor", System.getProperty("java.vendor")
        ));
        system.put("os", Map.of(
            "name", System.getProperty("os.name"),
            "version", System.getProperty("os.version"),
            "arch", System.getProperty("os.arch")
        ));

        status.put("status", services.values().stream()
                .allMatch(s -> ((Map)s).get("status").equals("healthy")) ? "UP" : "DOWN");
        status.put("services", services);
        status.put("system", system);
        status.put("timestamp", System.currentTimeMillis());

        return status;
    }
}
"@
        Set-Content -Path $healthControllerPath -Value $healthController
        Write-Host "  ✓ Created HealthController.java" -ForegroundColor Green
    }
}

# Function to encrypt sensitive files
function Protect-SensitiveFiles {
    param (
        [string]$BackupDir = "secure-backup",
        [string]$KeyFile = "backup-key.txt"
    )
    
    Write-Host "🔐 Encrypting sensitive files..." -ForegroundColor Yellow
    
    # Generate a secure key if it doesn't exist
    if (-not (Test-Path $KeyFile)) {
        $key = New-Object byte[] 32
        [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($key)
        $key | Set-Content $KeyFile -Encoding Byte
        Write-Host "  ✓ Generated new encryption key" -ForegroundColor Green
    }
    
    # Get all files in backup directory
    Get-ChildItem $BackupDir -File | ForEach-Object {
        $file = $_
        $encryptedFile = Join-Path $BackupDir "$($file.Name).enc"
        
        try {
            # Read the key
            $key = Get-Content $KeyFile -Encoding Byte
            # Read the file content
            $content = Get-Content $file.FullName -Raw
            # Convert to bytes
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
            # Encrypt
            $encryptedBytes = Protect-CmsMessage -Content $bytes -To $key
            # Save encrypted file
            $encryptedBytes | Set-Content $encryptedFile -Encoding Byte
            # Remove original file
            Remove-Item $file.FullName
            
            Write-Host "  ✓ Encrypted: $($file.Name)" -ForegroundColor Green
        }
        catch {
            Write-Host "  ❌ Failed to encrypt: $($file.Name)" -ForegroundColor Red
        }
    }
    
    # Move key to secure location
    if (Test-Path $KeyFile) {
        Move-Item $KeyFile $BackupDir -Force
        Write-Host "  ✓ Moved encryption key to secure location" -ForegroundColor Green
    }
}

# Function to validate environment variables
function Test-RequiredVariables {
    param (
        [string]$EnvFile,
        [string[]]$RequiredVars
    )
    
    if (-not (Test-Path $EnvFile)) {
        return $false
    }
    
    $content = Get-Content $EnvFile -Raw
    $missingVars = @()
    
    foreach ($var in $RequiredVars) {
        if ($content -notmatch $var) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        $fileName = Split-Path $EnvFile -Leaf
        Write-Host "  ❌ Missing variables in ${fileName}:" -ForegroundColor Red
        $missingVars | ForEach-Object {
            Write-Host "    - $_" -ForegroundColor Red
        }
        return $false
    }
    
    return $true
}

# Function to generate secure secrets
function New-SecureSecret {
    param (
        [int]$Length = 32
    )
    
    $bytes = New-Object byte[] $Length
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Enhanced backup function
function Backup-SensitiveFiles {
    param (
        [string]$BackupDir = "secure-backup"
    )
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }

    Write-Host "📦 Backing up sensitive files..." -ForegroundColor Yellow
    
    $filesToBackup = @(
        "serviceAccountKey.json",
        "jwt_secret.txt",
        ".env",
        "backend/.env",
        "frontend/.env",
        "frontend/.env.local",
        "*.key",
        "*.pem",
        "credentials.json",
        "firebase-adminsdk.json"
    )

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = Join-Path -Path $BackupDir -ChildPath $timestamp
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    
    $backupCount = 0
    $rootPath = $PWD.Path
    foreach ($file in $filesToBackup) {
        Get-ChildItem -Path . -Recurse -File -Filter $file | ForEach-Object {
            $fullPath = $_.FullName
            $relativePath = $fullPath.Substring($rootPath.Length).TrimStart('\', '/')
            $destPath = Join-Path -Path $backupDir -ChildPath $relativePath
            $destDir = Split-Path -Path $destPath -Parent
            
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            
            Copy-Item -Path $fullPath -Destination $destPath -Force
            Write-Host "  ✓ Backed up: $relativePath" -ForegroundColor Green
            $backupCount++
        }
    }

    if ($backupCount -eq 0) {
        Write-Host "  ℹ️ No sensitive files found to backup" -ForegroundColor Blue
    } else {
        Write-Host "  ✓ Created backup with timestamp: $timestamp" -ForegroundColor Green
    }
    
    return $backupDir
}

# Enhanced environment example creation
function Create-EnvExamples {
    Write-Host "📄 Creating .env.example files..." -ForegroundColor Yellow
    
    # Backend .env.example with more comprehensive settings
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
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_BASE64=your_base64_encoded_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Server Configuration
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Security Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_HTTPS_ONLY=true
SESSION_TIMEOUT_MINUTES=30

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
ENABLE_AUDIT_LOGGING=true

# Monitoring
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_INTERVAL_MS=30000
"@
    
    # Frontend .env.example with comprehensive settings
    $frontendEnvExample = @"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_TIMEOUT_MS=5000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=false
NEXT_PUBLIC_MAINTENANCE_MODE=false

# Security Settings
NEXT_PUBLIC_ENABLE_CSP=true
NEXT_PUBLIC_ENABLE_HSTS=true

# Monitoring
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_HEALTH_CHECK_INTERVAL_MS=30000
"@

    Set-Content -Path "backend/.env.example" -Value $backendEnvExample
    Set-Content -Path "frontend/.env.example" -Value $frontendEnvExample
    
    Write-Host "  ✓ Created backend/.env.example" -ForegroundColor Green
    Write-Host "  ✓ Created frontend/.env.example" -ForegroundColor Green
}

# Main execution
try {
    # 1. Initialize project structure
    Initialize-ProjectStructure

    # 2. Backup sensitive files
    $backupDir = Backup-SensitiveFiles
    
    # 3. Encrypt backups
    Protect-SensitiveFiles -BackupDir $backupDir

    # 4. Convert Firebase service account if exists
    $base64ServiceAccount = Convert-ServiceAccountToEnv
    if ($base64ServiceAccount) {
        Write-Host "  ✓ Converted serviceAccountKey.json to base64" -ForegroundColor Green
        if (Test-Path "backend/.env") {
            $envContent = Get-Content "backend/.env" -Raw
            $envContent = $envContent -replace "FIREBASE_PRIVATE_KEY_BASE64=.*", "FIREBASE_PRIVATE_KEY_BASE64=$base64ServiceAccount"
            Set-Content -Path "backend/.env" -Value $envContent
            Write-Host "  ✓ Updated FIREBASE_PRIVATE_KEY_BASE64 in backend/.env" -ForegroundColor Green
        }
    }

    # 5. Generate new JWT secret if needed
    if (-not (Test-Path "jwt_secret.txt")) {
        $jwtSecret = New-SecureSecret
        Write-Host "`nGenerated new JWT secret. Add this to your backend/.env:" -ForegroundColor Yellow
        Write-Host "JWT_SECRET=$jwtSecret"
    }

    # 6. Update .gitignore and security configurations
    Update-GitIgnore
    Update-SecurityHeaders
    Add-RateLimiting
    Update-HealthChecks

    # 7. Create and validate environment files
    Create-EnvExamples
    
    # 8. Validate environment files
    $backendVars = @(
        "DB_HOST",
        "DB_PORT",
        "JWT_SECRET",
        "FIREBASE_PROJECT_ID"
    )
    
    $frontendVars = @(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_API_URL"
    )
    
    $backendValid = Test-RequiredVariables -EnvFile "backend/.env" -RequiredVars $backendVars
    $frontendValid = Test-RequiredVariables -EnvFile "frontend/.env" -RequiredVars $frontendVars
    
    if (-not ($backendValid -and $frontendValid)) {
        Write-Host "`n⚠️  Warning: Some environment variables are missing. Please update your .env files." -ForegroundColor Yellow
    }

    # 9. Clean Git history (optional)
    $confirmation = Read-Host "`nDo you want to clean Git history? This action is irreversible! (y/N)"
    if ($confirmation -eq 'y') {
        Clean-GitHistory
    }

    Write-Host "`n✅ Security setup completed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Review the encrypted backup in '$backupDir'"
    Write-Host "2. Update your .env files with actual values from the examples"
    Write-Host "3. Add required dependencies to backend pom.xml:"
    Write-Host "   - spring-boot-starter-security"
    Write-Host "   - bucket4j-core"
    Write-Host "4. If you cleaned Git history, coordinate with your team before force pushing"
    Write-Host "5. Test the health endpoint at: http://localhost:8080/api/health"
    Write-Host "6. Run 'git status' to verify no sensitive files are tracked"
    Write-Host "7. Store the backup encryption key securely"

} catch {
    Write-Host "`n❌ Error during security setup: $_" -ForegroundColor Red
    exit 1
} 
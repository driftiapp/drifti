# Security Audit Script
[CmdletBinding()]
param (
    [switch]$FixVulnerabilities,
    [switch]$GenerateReport,
    [string]$ReportPath = "security-audit-report.md",
    [switch]$SkipNpm,
    [switch]$SkipPip,
    [switch]$SkipOwasp
)

# Initialize report content
$reportContent = @"
# Security Audit Report
Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Summary
"@

function Write-ReportSection {
    param (
        [string]$Title,
        [string]$Content
    )
    
    $script:reportContent += "`n`n## $Title`n$Content"
}

function Test-CommandExists {
    param (
        [string]$Command
    )
    
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Initialize-AuditPrerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    $missing = @()
    
    if (-not $SkipNpm -and -not (Test-CommandExists "npm")) {
        $missing += "npm"
    }
    
    if (-not $SkipPip -and -not (Test-CommandExists "pip")) {
        $missing += "pip"
    }
    
    if (-not $SkipOwasp -and -not (Test-CommandExists "java")) {
        $missing += "java"
    }
    
    if ($missing.Count -gt 0) {
        throw "Missing required tools: $($missing -join ', ')"
    }
    
    Write-Host "  ✓ All required tools are available" -ForegroundColor Green
}

function Invoke-NpmAudit {
    Write-Host "`n🔍 Running npm security audit..." -ForegroundColor Yellow
    
    $auditResults = @()
    
    # Check frontend
    if (Test-Path "frontend/package.json") {
        Push-Location frontend
        try {
            $result = npm audit --json | ConvertFrom-Json
            $auditResults += @{
                Directory = "frontend"
                Vulnerabilities = $result.vulnerabilities
                Total = $result.metadata.vulnerabilities.total
                Critical = $result.metadata.vulnerabilities.critical
                High = $result.metadata.vulnerabilities.high
            }
            
            if ($FixVulnerabilities) {
                Write-Host "  🔧 Attempting to fix frontend vulnerabilities..." -ForegroundColor Yellow
                npm audit fix --force
            }
        } catch {
            Write-Host "  ❌ Error auditing frontend: $_" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    }
    
    # Check backend (if it uses Node.js)
    if (Test-Path "backend/package.json") {
        Push-Location backend
        try {
            $result = npm audit --json | ConvertFrom-Json
            $auditResults += @{
                Directory = "backend"
                Vulnerabilities = $result.vulnerabilities
                Total = $result.metadata.vulnerabilities.total
                Critical = $result.metadata.vulnerabilities.critical
                High = $result.metadata.vulnerabilities.high
            }
            
            if ($FixVulnerabilities) {
                Write-Host "  🔧 Attempting to fix backend vulnerabilities..." -ForegroundColor Yellow
                npm audit fix --force
            }
        } catch {
            Write-Host "  ❌ Error auditing backend: $_" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    }
    
    # Generate report section
    $reportSection = ""
    foreach ($result in $auditResults) {
        $reportSection += "`n### $($result.Directory)`n"
        $reportSection += "- Total vulnerabilities: $($result.Total)`n"
        $reportSection += "- Critical: $($result.Critical)`n"
        $reportSection += "- High: $($result.High)`n"
        
        if ($result.Vulnerabilities) {
            $reportSection += "`nDetailed vulnerabilities:`n"
            foreach ($vuln in $result.Vulnerabilities.PSObject.Properties) {
                $v = $vuln.Value
                $reportSection += "- $($v.name) ($($v.severity)): $($v.title)`n"
            }
        }
    }
    
    Write-ReportSection -Title "npm Audit Results" -Content $reportSection
}

function Invoke-PipAudit {
    Write-Host "`n🔍 Running Python package security audit..." -ForegroundColor Yellow
    
    # Install pip-audit if not present
    if (-not (Test-CommandExists "pip-audit")) {
        Write-Host "  📦 Installing pip-audit..." -ForegroundColor Yellow
        pip install pip-audit
    }
    
    $auditResults = @()
    
    # Check backend Python dependencies
    if (Test-Path "backend/requirements.txt") {
        Push-Location backend
        try {
            $result = pip-audit -r requirements.txt --format json | ConvertFrom-Json
            $auditResults += @{
                Directory = "backend"
                Vulnerabilities = $result.vulnerabilities
                Total = $result.vulnerabilities.Count
            }
            
            if ($FixVulnerabilities) {
                Write-Host "  🔧 Attempting to fix Python vulnerabilities..." -ForegroundColor Yellow
                pip-audit -r requirements.txt --fix
            }
        } catch {
            Write-Host "  ❌ Error auditing Python packages: $_" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    }
    
    # Generate report section
    $reportSection = ""
    foreach ($result in $auditResults) {
        $reportSection += "`n### $($result.Directory)`n"
        $reportSection += "- Total vulnerabilities: $($result.Total)`n"
        
        if ($result.Vulnerabilities) {
            $reportSection += "`nDetailed vulnerabilities:`n"
            foreach ($vuln in $result.Vulnerabilities) {
                $reportSection += "- $($vuln.package_name) ($($vuln.vulnerability_id)): $($vuln.description)`n"
            }
        }
    }
    
    Write-ReportSection -Title "Python Package Audit Results" -Content $reportSection
}

function Invoke-OwaspZapScan {
    Write-Host "`n🔍 Running OWASP ZAP security scan..." -ForegroundColor Yellow
    
    # Download ZAP if not present
    $zapPath = "tools/zap"
    $zapJar = "$zapPath/zap.jar"
    
    if (-not (Test-Path $zapJar)) {
        Write-Host "  📦 Downloading OWASP ZAP..." -ForegroundColor Yellow
        
        New-Item -ItemType Directory -Force -Path $zapPath | Out-Null
        $zapUrl = "https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2.14.0_Core.jar"
        
        try {
            Invoke-WebRequest -Uri $zapUrl -OutFile $zapJar
        } catch {
            Write-Host "  ❌ Failed to download OWASP ZAP: $_" -ForegroundColor Red
            return
        }
    }
    
    # Start ZAP in daemon mode
    $process = Start-Process java -ArgumentList "-jar", $zapJar, "-daemon", "-port", "8090" -PassThru
    Start-Sleep -Seconds 10 # Wait for ZAP to start
    
    try {
        # Run spider and active scan
        $target = "http://localhost:3000" # Adjust based on your application
        $result = Invoke-RestMethod -Uri "http://localhost:8090/JSON/spider/action/scan/?url=$target" -Method Get
        
        # Wait for spider to complete
        do {
            Start-Sleep -Seconds 5
            $status = Invoke-RestMethod -Uri "http://localhost:8090/JSON/spider/view/status/" -Method Get
        } while ($status.status -ne "100")
        
        # Run active scan
        $result = Invoke-RestMethod -Uri "http://localhost:8090/JSON/ascan/action/scan/?url=$target" -Method Get
        
        # Wait for scan to complete
        do {
            Start-Sleep -Seconds 5
            $status = Invoke-RestMethod -Uri "http://localhost:8090/JSON/ascan/view/status/" -Method Get
        } while ($status.status -ne "100")
        
        # Get alerts
        $alerts = Invoke-RestMethod -Uri "http://localhost:8090/JSON/core/view/alerts/" -Method Get
        
        # Generate report section
        $reportSection = "`nScan target: $target`n`n"
        
        if ($alerts.alerts) {
            $reportSection += "Found vulnerabilities:`n"
            foreach ($alert in $alerts.alerts) {
                $reportSection += "- [$($alert.risk)] $($alert.name)`n"
                $reportSection += "  - URL: $($alert.url)`n"
                $reportSection += "  - Description: $($alert.description)`n"
                $reportSection += "  - Solution: $($alert.solution)`n`n"
            }
        } else {
            $reportSection += "No vulnerabilities found."
        }
        
        Write-ReportSection -Title "OWASP ZAP Scan Results" -Content $reportSection
        
    } catch {
        Write-Host "  ❌ Error during OWASP ZAP scan: $_" -ForegroundColor Red
    } finally {
        # Stop ZAP
        Stop-Process $process
    }
}

function Save-AuditReport {
    if ($GenerateReport) {
        Write-Host "`n📝 Generating security audit report..." -ForegroundColor Yellow
        Set-Content -Path $ReportPath -Value $reportContent
        Write-Host "  ✓ Report saved to: $ReportPath" -ForegroundColor Green
    }
}

# Main execution
try {
    Initialize-AuditPrerequisites
    
    if (-not $SkipNpm) {
        Invoke-NpmAudit
    }
    
    if (-not $SkipPip) {
        Invoke-PipAudit
    }
    
    if (-not $SkipOwasp) {
        Invoke-OwaspZapScan
    }
    
    Save-AuditReport
    
    Write-Host "`n✅ Security audit completed!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error during security audit: $_" -ForegroundColor Red
    exit 1
} 
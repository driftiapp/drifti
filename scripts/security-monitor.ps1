# Security Monitoring Script
[CmdletBinding()]
param (
    [ValidateSet('standalone', 'ci', 'scheduled')]
    [string]$Mode = 'standalone',
    
    [ValidateSet('slack', 'email', 'webhook', 'all')]
    [string]$AlertMethod = 'all',
    
    [string]$SlackWebhook,
    [string]$EmailTo,
    [string]$CustomWebhook,
    
    [int]$ScanIntervalHours = 24,
    [switch]$AutoRemediate,
    [string]$LogPath = "logs/security",
    [string]$ConfigPath = "config/security-monitor.json",
    [string]$AbuseIPDBKey = $env:ABUSEIPDB_API_KEY,
    [string]$VirusTotalKey = $env:VIRUSTOTAL_API_KEY,
    [switch]$EnableThreatIntel,
    [switch]$ShowDashboard
)

# Default configuration
$defaultConfig = @{
    AlertThresholds = @{
        Critical = 1
        High = 3
        Medium = 5
        Low = 10
    }
    AutoRemediationRules = @{
        UpdateDependencies = $true
        FixVulnerablePackages = $true
        UpdateSecurityHeaders = $true
        BlockSuspiciousIPs = $true
    }
    Monitoring = @{
        CheckEndpoints = $true
        WatchLogs = $true
        MonitorDependencies = $true
        TrackRateLimits = $true
    }
    Notifications = @{
        Slack = @{
            Enabled = $false
            Webhook = ""
            Channel = "#security-alerts"
        }
        Email = @{
            Enabled = $false
            SmtpServer = ""
            Port = 587
            UseSsl = $true
            From = ""
            To = @()
        }
        Webhook = @{
            Enabled = $false
            Url = ""
            Headers = @{}
        }
    }
    ThreatIntelligence = @{
        Enabled = $true
        CacheExpiryHours = 24
        BlockThreshold = 80  # AbuseIPDB confidence score
        AutoReportThreshold = 90
    }
    AdvancedMonitoring = @{
        TrackAPIAbuse = $true
        MonitorTrafficPatterns = $true
        DetectRateLimitEvasion = $true
        SSLCertExpiryThreshold = 30  # Days
    }
    SSLMonitoring = @{
        Endpoints = @(
            "https://api.yourdomain.com",
            "https://yourdomain.com"
        )
        AutoRenew = @{
            Enabled = $true
            Provider = "lets-encrypt"  # or 'certbot'
            EmailContact = ""
            RenewBeforeDays = 30
        }
        NotifyBeforeDays = 30
    }
    AutoRemediation = @{
        BlockMaliciousIPs = @{
            Enabled = $true
            BlockThreshold = 80  # AbuseIPDB confidence score
            BlockMethod = "windows-firewall"  # or 'iptables' for Linux
            WhitelistedIPs = @()
        }
        SecurityHeaders = @{
            Enabled = $true
            EnforceCORS = $true
            AllowedOrigins = @("https://yourdomain.com")
            StrongCSP = $true
            CSPDirectives = @{
                DefaultSrc = "'self'"
                ScriptSrc = "'self' 'unsafe-inline' 'unsafe-eval'"
                StyleSrc = "'self' 'unsafe-inline'"
                ImgSrc = "'self' data: https:"
                ConnectSrc = "'self' https://api.yourdomain.com"
            }
        }
        RateLimiting = @{
            Enabled = $true
            RequestsPerMinute = 60
            BurstSize = 10
            BlockDuration = 300  # seconds
        }
    }
}

# Initialize script
function Initialize-SecurityMonitor {
    # Create necessary directories
    $directories = @($LogPath, (Split-Path $ConfigPath -Parent))
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    # Load or create configuration
    if (Test-Path $ConfigPath) {
        $config = Get-Content $ConfigPath | ConvertFrom-Json -AsHashtable
        # Merge with defaults for any missing properties
        $config = Merge-Hashtables $defaultConfig $config
    } else {
        $config = $defaultConfig.Clone()
        # Update config with parameters
        if ($SlackWebhook) {
            $config.Notifications.Slack.Enabled = $true
            $config.Notifications.Slack.Webhook = $SlackWebhook
        }
        if ($EmailTo) {
            $config.Notifications.Email.Enabled = $true
            $config.Notifications.Email.To = @($EmailTo)
        }
        if ($CustomWebhook) {
            $config.Notifications.Webhook.Enabled = $true
            $config.Notifications.Webhook.Url = $CustomWebhook
        }
        
        $config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath
    }
    
    return $config
}

function Merge-Hashtables {
    param (
        [hashtable]$Default,
        [hashtable]$Custom
    )
    
    $result = $Default.Clone()
    
    foreach ($key in $Custom.Keys) {
        if ($result.ContainsKey($key)) {
            if ($result[$key] -is [hashtable] -and $Custom[$key] -is [hashtable]) {
                $result[$key] = Merge-Hashtables $result[$key] $Custom[$key]
            } else {
                $result[$key] = $Custom[$key]
            }
        } else {
            $result[$key] = $Custom[$key]
        }
    }
    
    return $result
}

function Initialize-ThreatIntelligence {
    if (-not $EnableThreatIntel) {
        return $null
    }
    
    if (-not $AbuseIPDBKey -or -not $VirusTotalKey) {
        Write-Warning "Threat intelligence disabled: Missing API keys"
        return $null
    }
    
    Import-Module "$PSScriptRoot/security/SecurityTypes.psm1"
    $threatIntel = [ThreatIntelligence]::new($AbuseIPDBKey, $VirusTotalKey)
    Write-Host "✓ Initialized threat intelligence module" -ForegroundColor Green
    return $threatIntel
}

function Get-AdvancedMetrics {
    param (
        [hashtable]$Config,
        [ThreatIntelligence]$ThreatIntel
    )
    
    $metrics = [SecurityMetrics]::new()
    
    # Analyze rate limit logs
    if ($Config.AdvancedMonitoring.DetectRateLimitEvasion) {
        $rateLimitLogs = Get-RateLimitMetrics
        if ($rateLimitLogs) {
            foreach ($ip in $rateLimitLogs.TopIPs) {
                if ($ip.Count -gt $Config.AlertThresholds.High) {
                    if ($ThreatIntel) {
                        $threatInfo = $ThreatIntel.CheckIP($ip.Name)
                        if ($threatInfo.IsKnownBad) {
                            $metrics.SuspiciousIPs.Add($threatInfo)
                            if ($threatInfo.AbuseConfidenceScore -gt $Config.ThreatIntelligence.AutoReportThreshold) {
                                $ThreatIntel.ReportIP($ip.Name, "Rate limit evasion attempt")
                            }
                        }
                    }
                    $metrics.RateLimitViolations[$ip.Name] = $ip.Count
                }
            }
        }
    }
    
    # Enhanced SSL certificate monitoring
    foreach ($endpoint in $Config.SSLMonitoring.Endpoints) {
        try {
            $uri = [Uri]$endpoint
            $client = [System.Net.Sockets.TcpClient]::new($uri.Host, 443)
            $sslStream = [System.Net.Security.SslStream]::new($client.GetStream())
            $sslStream.AuthenticateAsClient($uri.Host)
            
            $cert = $sslStream.RemoteCertificate -as [System.Security.Cryptography.X509Certificates.X509Certificate2]
            $daysUntilExpiry = ($cert.NotAfter - (Get-Date)).Days
            
            $metrics.SSLCertificates[$endpoint] = @{
                ExpiresIn = $daysUntilExpiry
                Issuer = $cert.Issuer
                ValidFrom = $cert.NotBefore
                ValidTo = $cert.NotAfter
                Subject = $cert.Subject
                SerialNumber = $cert.SerialNumber
                Thumbprint = $cert.Thumbprint
                SignatureAlgorithm = $cert.SignatureAlgorithm.FriendlyName
            }
            
            # Check for weak cipher suites
            $cipherSuite = $sslStream.CipherAlgorithm.ToString()
            if ($cipherSuite -in @('RC4', 'DES', '3DES')) {
                $alert = [SecurityAlert]::new(
                    "WeakSSLCipher",
                    ("Weak cipher suite detected for {0} - {1}" -f $endpoint, $cipherSuite),
                    4
                )
                $alert.RecommendedAction = "Update SSL configuration to use strong cipher suites"
                $metrics.Alerts.Add($alert)
            }
            
            if ($daysUntilExpiry -le $Config.SSLMonitoring.NotifyBeforeDays) {
                $alert = [SecurityAlert]::new(
                    "SSLCertExpiring",
                    "SSL Certificate expiring soon for $endpoint",
                    3
                )
                $alert.Details["DaysRemaining"] = $daysUntilExpiry
                $alert.Details["Issuer"] = $cert.Issuer
                $alert.RecommendedAction = "Renew SSL certificate"
                $metrics.Alerts.Add($alert)
            }
            
            $sslStream.Dispose()
            $client.Dispose()
        }
        catch {
            Write-Warning "Failed to check SSL certificate for $endpoint : $_"
            $metrics.SSLCertificates[$endpoint] = @{
                Error = $_.Exception.Message
            }
        }
    }
    
    return $metrics
}

function Start-SecurityScan {
    param (
        [hashtable]$Config,
        [ThreatIntelligence]$ThreatIntel
    )
    
    $scanResults = @{
        Timestamp = Get-Date
        Vulnerabilities = @()
        Metrics = @{}
        Alerts = @()
    }
    
    # Run security audit
    $auditResults = & "$PSScriptRoot/security-audit.ps1" -GenerateReport -ReportPath "logs/security/audit-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
    $scanResults.Vulnerabilities += $auditResults
    
    # Check security headers
    $headers = Test-SecurityHeaders
    $scanResults.Metrics['SecurityHeaders'] = $headers
    
    # Get advanced metrics
    if ($Config.AdvancedMonitoring.TrackAPIAbuse -or $Config.AdvancedMonitoring.MonitorTrafficPatterns) {
        $advancedMetrics = Get-AdvancedMetrics -Config $Config -ThreatIntel $ThreatIntel
        $scanResults.Metrics['Advanced'] = $advancedMetrics
        
        # Add alerts from advanced metrics
        if ($advancedMetrics.SuspiciousIPs.Count -gt 0) {
            $alert = [SecurityAlert]::new(
                "SuspiciousActivity",
                "Detected suspicious IPs with known malicious activity",
                4
            )
            $alert.Details["SuspiciousIPs"] = $advancedMetrics.SuspiciousIPs
            $alert.RecommendedAction = "Review and block suspicious IPs"
            $scanResults.Alerts += $alert
        }
    }
    
    # Monitor rate limits
    if ($Config.Monitoring.TrackRateLimits) {
        $rateLimits = Get-RateLimitMetrics
        $scanResults.Metrics['RateLimits'] = $rateLimits
    }
    
    # Check dependencies
    if ($Config.Monitoring.MonitorDependencies) {
        $dependencies = Test-Dependencies
        $scanResults.Metrics['Dependencies'] = $dependencies
    }
    
    # Save metrics for dashboard
    $metricsFile = Join-Path $LogPath "latest_metrics.json"
    $scanResults.Metrics | ConvertTo-Json -Depth 10 | Set-Content $metricsFile
    
    return $scanResults
}

function Test-SecurityHeaders {
    $endpoints = @(
        "http://localhost:8080/api/health",
        "http://localhost:3000"
    )
    
    $results = @{}
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint -Method Head
            $headers = $response.Headers
            
            $results[$endpoint] = @{
                HasXssProtection = $null -ne $headers['X-XSS-Protection']
                HasContentSecurityPolicy = $null -ne $headers['Content-Security-Policy']
                HasFrameOptions = $null -ne $headers['X-Frame-Options']
                HasHsts = $null -ne $headers['Strict-Transport-Security']
            }
        } catch {
            Write-Warning "Failed to check headers for $endpoint : $_"
            $results[$endpoint] = @{
                Error = $_.Exception.Message
            }
        }
    }
    
    return $results
}

function Get-RateLimitMetrics {
    $logFile = "logs/security/rate-limits.log"
    
    if (Test-Path $logFile) {
        $logs = Get-Content $logFile | ConvertFrom-Json
        
        return @{
            TotalBlocked = ($logs | Where-Object { $_.blocked -eq $true }).Count
            TopIPs = $logs | Group-Object ip | Sort-Object Count -Descending | Select-Object -First 5
            RecentIncidents = $logs | Where-Object {
                $_.timestamp -gt (Get-Date).AddHours(-1)
            }
        }
    }
    
    return $null
}

function Test-Dependencies {
    $results = @{
        Frontend = @()
        Backend = @()
    }
    
    # Check frontend dependencies
    if (Test-Path "frontend/package.json") {
        Push-Location frontend
        try {
            $outdated = npm outdated --json | ConvertFrom-Json
            foreach ($package in $outdated.PSObject.Properties) {
                $results.Frontend += @{
                    Name = $package.Name
                    Current = $package.Value.current
                    Wanted = $package.Value.wanted
                    Latest = $package.Value.latest
                }
            }
        } catch {
            Write-Warning "Failed to check frontend dependencies: $_"
        } finally {
            Pop-Location
        }
    }
    
    # Check backend dependencies
    if (Test-Path "backend/pom.xml") {
        Push-Location backend
        try {
            $outdated = mvn versions:display-dependency-updates
            # Parse Maven output and add to results
            $results.Backend += $outdated | Select-String -Pattern "(?<group>[^\s]+):(?<artifact>[^\s]+) (?<current>[^\s]+) -> (?<latest>[^\s]+)"
        } catch {
            Write-Warning "Failed to check backend dependencies: $_"
        } finally {
            Pop-Location
        }
    }
    
    return $results
}

function Send-SecurityAlert {
    param (
        [hashtable]$Config,
        [hashtable]$ScanResults,
        [string]$AlertType
    )
    
    $message = @"
🚨 Security Alert: $AlertType
Time: $($ScanResults.Timestamp)

Findings:
$($ScanResults.Alerts | ForEach-Object { "- $_" } | Out-String)

Metrics:
$($ScanResults.Metrics | ConvertTo-Json)
"@
    
    # Send Slack alert
    if ($Config.Notifications.Slack.Enabled) {
        $slackPayload = @{
            channel = $Config.Notifications.Slack.Channel
            text = $message
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri $Config.Notifications.Slack.Webhook -Method Post -Body $slackPayload -ContentType 'application/json'
        } catch {
            Write-Warning "Failed to send Slack alert: $_"
        }
    }
    
    # Send email alert
    if ($Config.Notifications.Email.Enabled) {
        $emailParams = @{
            SmtpServer = $Config.Notifications.Email.SmtpServer
            Port = $Config.Notifications.Email.Port
            UseSsl = $Config.Notifications.Email.UseSsl
            From = $Config.Notifications.Email.From
            To = $Config.Notifications.Email.To
            Subject = "Security Alert: $AlertType"
            Body = $message
        }
        
        try {
            Send-MailMessage @emailParams
        } catch {
            Write-Warning "Failed to send email alert: $_"
        }
    }
    
    # Send webhook alert
    if ($Config.Notifications.Webhook.Enabled) {
        $webhookPayload = @{
            type = $AlertType
            timestamp = $ScanResults.Timestamp
            findings = $ScanResults.Alerts
            metrics = $ScanResults.Metrics
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri $Config.Notifications.Webhook.Url -Method Post -Body $webhookPayload -Headers $Config.Notifications.Webhook.Headers -ContentType 'application/json'
        } catch {
            Write-Warning "Failed to send webhook alert: $_"
        }
    }
}

function Start-AutoRemediation {
    param (
        [hashtable]$Config,
        [hashtable]$ScanResults,
        [ThreatIntelligence]$ThreatIntel
    )
    
    $remediationActions = @()
    
    # Block malicious IPs
    if ($Config.AutoRemediation.BlockMaliciousIPs.Enabled -and $ThreatIntel) {
        $suspiciousIPs = $ScanResults.Metrics.Advanced.SuspiciousIPs
        foreach ($ip in $suspiciousIPs) {
            if ($ip.AbuseConfidenceScore -ge $Config.AutoRemediation.BlockMaliciousIPs.BlockThreshold -and 
                $ip.IP -notin $Config.AutoRemediation.BlockMaliciousIPs.WhitelistedIPs) {
                
                switch ($Config.AutoRemediation.BlockMaliciousIPs.BlockMethod) {
                    'windows-firewall' {
                        $ruleName = "Block-Malicious-IP-$($ip.IP)"
                        if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
                            New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Block -RemoteAddress $ip.IP
                            $remediationActions += "Blocked malicious IP $($ip.IP) using Windows Firewall"
                        }
                    }
                    'iptables' {
                        $ipAddress = $ip.IP
                        $existingRule = bash -c 'iptables -L INPUT -n | grep '$ipAddress
                        if (-not $existingRule) {
                            bash -c 'iptables -A INPUT -s '$ipAddress' -j DROP'
                            $remediationActions += "Blocked malicious IP $($ip.IP) using iptables"
                        }
                    }
                }
            }
        }
    }
    
    # Auto-renew SSL certificates
    if ($Config.SSLMonitoring.AutoRenew.Enabled) {
        foreach ($endpoint in $Config.SSLMonitoring.Endpoints) {
            $certInfo = $ScanResults.Metrics.Advanced.SSLCertificates[$endpoint]
            if ($certInfo -and $certInfo.ExpiresIn -le $Config.SSLMonitoring.AutoRenew.RenewBeforeDays) {
                try {
                    switch ($Config.SSLMonitoring.AutoRenew.Provider) {
                        'lets-encrypt' {
                            $domain = ([Uri]$endpoint).Host
                            $email = $Config.SSLMonitoring.AutoRenew.EmailContact
                            certbot renew --cert-name $domain --force-renewal --non-interactive
                            $remediationActions += "Auto-renewed SSL certificate for $domain using Let's Encrypt"
                        }
                    }
                }
                catch {
                    Write-Warning "Failed to auto-renew SSL certificate for $endpoint : $_"
                }
            }
        }
    }
    
    # Update security headers
    if ($Config.AutoRemediation.SecurityHeaders.Enabled) {
        $headers = $ScanResults.Metrics.SecurityHeaders
        foreach ($endpoint in $headers.Keys) {
            $headerConfig = $headers[$endpoint]
            if (-not $headerConfig.HasContentSecurityPolicy -or -not $headerConfig.HasFrameOptions) {
                try {
                    # Update Nginx/Apache config based on your web server
                    $webServerConfig = Get-WebServerConfig
                    $updated = Update-SecurityHeaders -Config $webServerConfig -CSPDirectives $Config.AutoRemediation.SecurityHeaders.CSPDirectives
                    if ($updated) {
                        Restart-WebServer
                        $remediationActions += "Updated security headers for $endpoint"
                    }
                }
                catch {
                    Write-Warning "Failed to update security headers for $endpoint : $_"
                }
            }
        }
    }
    
    # Update dependencies and fix vulnerabilities
    if ($Config.AutoRemediationRules.UpdateDependencies) {
        # Update non-breaking dependencies
        if (Test-Path "frontend/package.json") {
            Push-Location frontend
            try {
                npm update --save
                $remediationActions += "Updated frontend dependencies"
            } catch {
                Write-Warning "Failed to update frontend dependencies: $_"
            } finally {
                Pop-Location
            }
        }
    }
    
    if ($Config.AutoRemediationRules.FixVulnerablePackages) {
        # Run npm audit fix
        if (Test-Path "frontend/package.json") {
            Push-Location frontend
            try {
                npm audit fix
                $remediationActions += "Fixed vulnerable packages in frontend"
            } catch {
                Write-Warning "Failed to fix frontend vulnerabilities: $_"
            } finally {
                Pop-Location
            }
        }
    }
    
    # Log remediation actions
    $remediationLog = Join-Path $LogPath "remediation.log"
    $logEntry = @{
        Timestamp = (Get-Date).ToString("o")
        Type = "AutoRemediation"
        Action = $remediationActions -join "; "
    }
    
    if (Test-Path $remediationLog) {
        $logs = Get-Content $remediationLog | ConvertFrom-Json
        $logs += $logEntry
    } else {
        $logs = @($logEntry)
    }
    
    $logs | ConvertTo-Json | Set-Content $remediationLog
    
    return $remediationActions
}

# Main execution
try {
    $config = Initialize-SecurityMonitor
    $threatIntel = Initialize-ThreatIntelligence
    
    if ($ShowDashboard) {
        Import-Module "$PSScriptRoot/security/SecurityDashboard.psm1"
        Show-SecurityDashboard -Config $config -ThreatIntel $threatIntel
        return
    }
    
    switch ($Mode) {
        'standalone' {
            $results = Start-SecurityScan -Config $config -ThreatIntel $threatIntel
            if ($AutoRemediate) {
                $remediationActions = Start-AutoRemediation -Config $config -ScanResults $results -ThreatIntel $threatIntel
                $results.Alerts += $remediationActions
            }
            Send-SecurityAlert -Config $config -ScanResults $results -AlertType "Standalone Scan"
        }
        'ci' {
            $results = Start-SecurityScan -Config $config -ThreatIntel $threatIntel
            if ($results.Vulnerabilities.Count -gt 0) {
                throw "Security scan failed: Found $($results.Vulnerabilities.Count) vulnerabilities"
            }
        }
        'scheduled' {
            while ($true) {
                $results = Start-SecurityScan -Config $config -ThreatIntel $threatIntel
                if ($AutoRemediate) {
                    $remediationActions = Start-AutoRemediation -Config $config -ScanResults $results -ThreatIntel $threatIntel
                    $results.Alerts += $remediationActions
                }
                Send-SecurityAlert -Config $config -ScanResults $results -AlertType "Scheduled Scan"
                Start-Sleep -Hours $ScanIntervalHours
            }
        }
    }
    
    Write-Host "`n✅ Security monitoring completed!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error during security monitoring: $_" -ForegroundColor Red
    exit 1
} 
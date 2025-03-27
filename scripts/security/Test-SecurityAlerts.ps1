# Import required modules
Import-Module "$PSScriptRoot\SecurityReporter.psd1" -Force
Import-Module "$PSScriptRoot\SecurityConfig.psm1" -Force

Write-Host "`n🔒 Testing Enhanced Security Alerts"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

Write-Host "📝 Initializing Security Configuration..."

# Initialize test configuration
$config = @{
    Notifications = @{
        Email = @{
            Enabled = $true
            SmtpServer = "smtp.test.com"
            Port = 587
            UseSsl = $true
            From = "security@test.com"
            To = @("admin@test.com")
            Username = "test-user"
            Password = "test-password"
        }
        Slack = @{
            Enabled = $true
            WebhookUrl = "https://hooks.slack.com/test"
            Channel = "#security-test"
        }
        Teams = @{
            Enabled = $true
            WebhookUrl = "https://teams.microsoft.com/test"
        }
    }
}

try {
    # Create output directory if it doesn't exist
    $outputPath = Join-Path $PSScriptRoot "..\..\security_reports"
    if (-not (Test-Path $outputPath)) {
        New-Item -ItemType Directory -Path $outputPath | Out-Null
    }

    # Initialize reporter
    Write-Host "`n📊 Initializing Security Reporter..."
    $reporter = New-SecurityReporter -OutputPath $outputPath
    $reporter.ConfigureNotifications($config.Notifications)

    # Create test alerts with different risk levels
    $testAlerts = @(
        @{
            Id = "ALERT-001"
            Type = "Brute Force Attack"
            Timestamp = Get-Date
            RiskLevel = "Critical"
            RiskScore = 0.95
            Source = "192.168.1.100"
            Description = "Multiple failed login attempts detected from suspicious IP address"
            Insights = @(
                "Pattern matches known brute force attack signatures",
                "IP address has been flagged in threat intelligence feeds",
                "Unusual time of day for authentication attempts",
                "10x increase in failed attempts compared to baseline"
            )
            Recommendations = @(
                "Block IP address 192.168.1.100 immediately",
                "Enable additional authentication factors for affected accounts",
                "Review successful logins from this IP in the past 24 hours",
                "Update brute force protection rules"
            )
        }
        @{
            Id = "ALERT-002"
            Type = "Suspicious API Access"
            Timestamp = Get-Date
            RiskLevel = "High"
            RiskScore = 0.75
            Source = "api.example.com"
            Description = "Unusual API access pattern detected with high data exfiltration risk"
            Insights = @(
                "Abnormal data transfer volume (500MB vs 50MB avg)",
                "Access from previously unseen location",
                "Multiple sensitive endpoints accessed in rapid succession",
                "Deviation from user's normal API usage pattern"
            )
            Recommendations = @(
                "Review API access logs for the past hour",
                "Implement rate limiting for affected endpoints",
                "Verify API key authorization settings",
                "Consider revoking and rotating affected API credentials"
            )
        }
        @{
            Id = "ALERT-003"
            Type = "Configuration Change"
            Timestamp = Get-Date
            RiskLevel = "Medium"
            RiskScore = 0.45
            Source = "firewall-01.prod"
            Description = "Security configuration changes detected outside maintenance window"
            Insights = @(
                "Change made during non-business hours",
                "No corresponding change ticket found",
                "Multiple rule modifications in quick succession",
                "Similar pattern to previous security incidents"
            )
            Recommendations = @(
                "Review recent firewall configuration changes",
                "Verify changes against approved change requests",
                "Implement configuration change approval workflow",
                "Update security policy for off-hours changes"
            )
        }
    )

    # Send test alerts through each channel
    foreach ($alert in $testAlerts) {
        Write-Host "`n📬 Sending $($alert.RiskLevel) alert: $($alert.Type)..."
        
        # Send Email alert
        Write-Host "  📧 Sending Email alert..."
        $reporter.SendEmailAlert($alert)
        
        # Send Slack alert
        Write-Host "  💬 Sending Slack alert..."
        $reporter.SendSlackAlert($alert)
        
        # Send Teams alert
        Write-Host "  👥 Sending Teams alert..."
        $reporter.SendTeamsAlert($alert)
        
        Start-Sleep -Seconds 1 # Add small delay between alerts
    }
}
catch {
    Write-Error "❌ Error during alert testing: $_"
    exit 1
}

Write-Host "`n✨ Testing complete!" 
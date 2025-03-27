# Import required modules
Import-Module "$PSScriptRoot\SecurityReporter.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAnalytics.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAutomation.psm1" -Force

# Create output directory if it doesn't exist
$outputPath = Join-Path $PSScriptRoot "..\..\security_reports"
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

Write-Host "`n🤖 Testing Security Automation System"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Initialize Security Reporter and Automation
Write-Host "📝 Initializing Security Configuration..."
$reporter = New-SecurityReporter -OutputPath $outputPath
$reporter.InitializeAutomation()

# Test different types of alerts
$alertTypes = @(
    @{
        Id = "SEC-$(Get-Random)"
        Type = "Brute Force Attack"
        RiskLevel = "Critical"
        Description = "Multiple failed login attempts detected from IP 192.168.1.100 targeting the Authentication System"
        Source = "192.168.1.100"
        RiskScore = 0.95
        Timestamp = Get-Date
    }
    @{
        Id = "SEC-$(Get-Random)"
        Type = "Suspicious API Access"
        RiskLevel = "High"
        Description = "Unusual API access pattern detected from IP 10.0.0.50 affecting the API Gateway"
        Source = "10.0.0.50"
        RiskScore = 0.75
        Timestamp = Get-Date
    }
    @{
        Id = "SEC-$(Get-Random)"
        Type = "Configuration Change"
        RiskLevel = "Medium"
        Description = "Unauthorized configuration change detected in the User Database"
        Source = "172.16.0.25"
        RiskScore = 0.45
        Timestamp = Get-Date
    }
)

foreach ($alert in $alertTypes) {
    Write-Host "`n🚨 Processing $($alert.RiskLevel) alert: $($alert.Type)..."
    
    # Send alert through notification channels
    Write-Host "  📧 Sending Email alert..."
    try {
        $reporter.SendEmailAlert($alert)
    } catch {
        Write-Host "    ⚠️ Email notification failed (expected with test credentials)"
    }
    
    Write-Host "  💬 Sending Slack alert..."
    try {
        $reporter.SendSlackAlert($alert)
    } catch {
        Write-Host "    ⚠️ Slack notification failed (expected with test credentials)"
    }
    
    Write-Host "  👥 Sending Teams alert..."
    try {
        $reporter.SendTeamsAlert($alert)
    } catch {
        Write-Host "    ⚠️ Teams notification failed (expected with test credentials)"
    }
    
    # Display automation results
    if ($alert.AutomationResponse) {
        Write-Host "`n  🤖 Automation Response:"
        Write-Host "    • Status: $($alert.AutomationResponse.Status)"
        
        if ($alert.AutomationResponse.ExecutedActions.Count -gt 0) {
            Write-Host "    • Executed Actions:"
            foreach ($action in $alert.AutomationResponse.ExecutedActions) {
                Write-Host "      - $($action.Name) ($($action.Status))"
                if ($action.Result) {
                    $resultJson = $action.Result | ConvertTo-Json -Compress
                    Write-Host "        Details: $resultJson"
                }
            }
        }
        
        if ($alert.AutomationResponse.PendingActions.Count -gt 0) {
            Write-Host "    • Pending Actions:"
            foreach ($action in $alert.AutomationResponse.PendingActions) {
                Write-Host "      - $($action.Name) (Requires Approval)"
            }
        }
        
        if ($alert.AutomationResponse.Errors.Count -gt 0) {
            Write-Host "    • Errors:"
            foreach ($error in $alert.AutomationResponse.Errors) {
                Write-Host "      - $($error.Rule): $($error.Error)"
            }
        }
    }
    
    # Add a small delay between alerts
    Start-Sleep -Seconds 2
}

Write-Host "`n✨ Testing complete!" 
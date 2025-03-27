# Import required modules
Import-Module "$PSScriptRoot\SecurityReporter.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAnalytics.psm1" -Force

# Create output directory if it doesn't exist
$outputPath = Join-Path $PSScriptRoot "..\..\security_reports"
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

Write-Host "`n🔒 Testing Enhanced Security Analytics"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Initialize Security Reporter and Analytics
Write-Host "📝 Initializing Security Configuration..."
$reporter = New-SecurityReporter -OutputPath $outputPath

Write-Host "📊 Initializing Security Analytics..."
$analytics = New-SecurityAnalytics -DataPath $outputPath

# Test different types of alerts
$alertTypes = @(
    @{
        Type = "Brute Force Attack"
        RiskLevel = "Critical"
        Description = "Multiple failed login attempts detected from IP 192.168.1.100 targeting the Authentication System"
        Source = "192.168.1.100"
        RiskScore = 0.95
    }
    @{
        Type = "Suspicious API Access"
        RiskLevel = "High"
        Description = "Unusual API access pattern detected from IP 10.0.0.50 affecting the API Gateway"
        Source = "10.0.0.50"
        RiskScore = 0.75
    }
    @{
        Type = "Configuration Change"
        RiskLevel = "Medium"
        Description = "Unauthorized configuration change detected in the User Database"
        Source = "172.16.0.25"
        RiskScore = 0.45
    }
)

foreach ($alert in $alertTypes) {
    Write-Host "`n📬 Analyzing $($alert.RiskLevel) alert: $($alert.Type)..."
    
    # Get recent events
    $recentEvents = $reporter.GetRecentEvents($alert.Type)
    
    # Generate insights
    Write-Host "  🔍 Generating insights..."
    $insights = $analytics.GenerateInsights($recentEvents, $alert)
    
    # Display analytics results
    Write-Host "  📊 Analytics Results:"
    Write-Host "    • Impact Score: $([Math]::Round($insights.Impact.Score * 100))%"
    Write-Host "    • Affected Users: $($insights.Impact.Affected.Users)"
    Write-Host "    • Resolution Time: $($insights.Impact.Mitigation.EstimatedTime) minutes"
    Write-Host "    • Trend: $($insights.Trends.Statistics.Trend)"
    
    # Send enhanced notifications
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
}

Write-Host "`n✨ Testing complete!" 
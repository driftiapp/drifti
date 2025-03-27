# Import required modules
Import-Module "$PSScriptRoot\SecurityReporter.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAnalytics.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAutomation.psm1" -Force
Import-Module "$PSScriptRoot\SecurityApproval.psm1" -Force
Import-Module "$PSScriptRoot\SecurityMetrics.psm1" -Force
Import-Module "$PSScriptRoot\SecurityMonitor.psm1" -Force

# Create output directory for reports
$outputDir = Join-Path $PSScriptRoot "..\..\security_reports"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Write-Host "`n🔍 Testing Security Monitoring System"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Initialize components
Write-Host "📝 Initializing Security Components..."
$reporter = New-SecurityReporter -OutputPath $outputDir
$reporter.InitializeAutomation()
$reporter.Automation.InitializeApproval()
$monitor = New-SecurityMonitor -DataPath $outputDir -Reporter $reporter

# Configure test notification settings
$reporter.ConfigureNotifications(@{
    Email = @{
        Enabled = $true
        SmtpServer = "smtp.test.com"
        Port = 587
        UseSsl = $true
        From = "security@test.com"
        To = @("admin@test.com")
        Username = "security@test.com"
        Password = "test123"
    }
    Slack = @{
        Enabled = $true
        WebhookUrl = "https://hooks.slack.com/test"
        Channel = "#security-alerts"
    }
    Teams = @{
        Enabled = $true
        WebhookUrl = "https://teams.microsoft.com/webhook/test"
    }
})

# Initialize collections
$reporter.Automation.Approval.PendingApprovals = [System.Collections.Concurrent.ConcurrentBag[object]]::new()
$reporter.Automation.Approval.ApprovalHistory = [System.Collections.Concurrent.ConcurrentBag[object]]::new()

# Start monitoring
Write-Host "`n🚀 Starting Monitoring..."
$monitor.StartMonitoring()

# Test Response Time Alerts
Write-Host "`n📊 Testing Response Time Monitoring..."
1..3 | ForEach-Object {
    $alert = @{
        Id = "SEC-CRIT-$_"
        Type = "Brute Force Attack"
        RiskLevel = "Critical"
        Description = "Multiple failed login attempts detected"
        Source = "192.168.1.$_"
        RiskScore = 0.9
        Timestamp = (Get-Date).AddMinutes(-30)  # Simulate delayed response
    }
    
    Write-Host "  • Creating critical alert with delayed response: $($alert.Id)"
    $response = $reporter.Automation.ProcessAlert($alert)
    
    # Create approval request
    $approvalRequest = @{
        Id = [System.Guid]::NewGuid().ToString()
        AlertId = $alert.Id
        RiskLevel = $alert.RiskLevel
        RequesterRole = "SecurityAnalyst"
        Reason = "Approval needed for critical alert"
        Status = "Pending"
        Created = Get-Date
        LastModified = Get-Date
        Approvers = @()
        Comments = @()
        History = @()
    }
    $reporter.Automation.Approval.PendingApprovals.Add($approvalRequest)
}

# Test Approval Rate Alerts
Write-Host "`n📊 Testing Approval Rate Monitoring..."
1..5 | ForEach-Object {
    $alert = @{
        Id = "SEC-HIGH-$_"
        Type = "Suspicious API Access"
        RiskLevel = "High"
        Description = "Unusual API pattern detected"
        Source = "10.0.0.$_"
        RiskScore = 0.75
        Timestamp = (Get-Date).AddMinutes(-5)
    }
    
    Write-Host "  • Processing high risk alert: $($alert.Id)"
    $response = $reporter.Automation.ProcessAlert($alert)
    
    # Create approval request
    $approvalRequest = @{
        Id = [System.Guid]::NewGuid().ToString()
        AlertId = $alert.Id
        RiskLevel = $alert.RiskLevel
        RequesterRole = "SecurityAnalyst"
        Reason = "Approval needed for high risk alert"
        Status = "Pending"
        Created = Get-Date
        LastModified = Get-Date
        Approvers = @()
        Comments = @()
        History = @()
    }
    $reporter.Automation.Approval.PendingApprovals.Add($approvalRequest)
    
    # Randomly reject some to trigger approval rate alert
    if ($_ % 2 -eq 0) {
        $approvalRequest.Status = "Rejected"
        $approvalRequest.LastModified = Get-Date
        $approvalRequest.Approvers += @{
            Id = "ANALYST-001"
            Role = "SecurityAnalyst"
            Action = "Reject"
            Timestamp = Get-Date
            Comment = "Rejecting for testing"
        }
        $reporter.Automation.Approval.ApprovalHistory.Add($approvalRequest.Clone())
        
        # Remove from pending approvals
        $tempBag = [System.Collections.Concurrent.ConcurrentBag[object]]::new()
        foreach ($item in $reporter.Automation.Approval.PendingApprovals) {
            if ($item.Id -ne $approvalRequest.Id) {
                $tempBag.Add($item)
            }
        }
        $reporter.Automation.Approval.PendingApprovals = $tempBag
    }
}

# Test Escalation Rate Alerts
Write-Host "`n📊 Testing Escalation Rate Monitoring..."
1..3 | ForEach-Object {
    $alert = @{
        Id = "SEC-MED-$_"
        Type = "Configuration Change"
        RiskLevel = "Medium"
        Description = "Unauthorized config change"
        Source = "172.16.0.$_"
        RiskScore = 0.5
        Timestamp = (Get-Date).AddMinutes(-10)
    }
    
    Write-Host "  • Creating alert requiring escalation: $($alert.Id)"
    $response = $reporter.Automation.ProcessAlert($alert)
    
    # Create approval request
    $approvalRequest = @{
        Id = [System.Guid]::NewGuid().ToString()
        AlertId = $alert.Id
        RiskLevel = $alert.RiskLevel
        RequesterRole = "SecurityAnalyst"
        Reason = "Approval needed for medium risk alert"
        Status = "Pending"
        Created = Get-Date
        LastModified = Get-Date
        Approvers = @()
        Comments = @()
        History = @()
        IsEscalated = $true
        EscalationReason = "Escalating for testing"
        EscalationTimestamp = Get-Date
    }
    $reporter.Automation.Approval.PendingApprovals.Add($approvalRequest)
}

# Wait for alerts to be processed
Write-Host "`n⏳ Waiting for alerts to be processed (30 seconds)..."
Start-Sleep -Seconds 30

# Generate monitoring report
Write-Host "`n📋 Generating Monitoring Report..."
$reportPath = Join-Path $outputDir "monitoring_report.json"
$report = $monitor.GenerateReport($reportPath, 1)

# Display active alerts
Write-Host "`n🚨 Active Alerts:"
$monitor.GetActiveAlerts() | ForEach-Object {
    Write-Host "  • [$($_.Severity)] $($_.Type): $($_.Message)"
}

# Display statistics
Write-Host "`n📈 Alert Statistics (Last Hour):"
Write-Host "  • Total Alerts: $($report.Statistics.TotalAlerts)"
Write-Host "  • Critical Alerts: $($report.Statistics.BySeverity.Critical)"
Write-Host "  • Warning Alerts: $($report.Statistics.BySeverity.Warning)"
Write-Host "  • Response Time Alerts: $($report.Statistics.ByType.ResponseTime)"
Write-Host "  • Approval Rate Alerts: $($report.Statistics.ByType.ApprovalRate)"
Write-Host "  • Escalation Rate Alerts: $($report.Statistics.ByType.EscalationRate)"
Write-Host "  • Pending Request Alerts: $($report.Statistics.ByType.PendingRequests)"

# Stop monitoring
Write-Host "`n🛑 Stopping Monitoring..."
$monitor.StopMonitoring()

Write-Host "`n✨ Testing complete!" 
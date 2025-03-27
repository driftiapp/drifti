# Import required modules
Import-Module "$PSScriptRoot\SecurityReporter.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAnalytics.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAutomation.psm1" -Force
Import-Module "$PSScriptRoot\SecurityApproval.psm1" -Force
Import-Module "$PSScriptRoot\SecurityMetrics.psm1" -Force

# Create output directory if it doesn't exist
$outputPath = Join-Path $PSScriptRoot "..\..\security_reports"
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

Write-Host "`n📊 Testing Security Metrics System"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Initialize Security Reporter with all components
Write-Host "📝 Initializing Security Configuration..."
$reporter = New-SecurityReporter -OutputPath $outputPath
$reporter.InitializeAutomation()
$reporter.Automation.InitializeApproval()

# Initialize Metrics System
Write-Host "📈 Initializing Metrics System..."
$metrics = New-SecurityMetrics -DataPath $outputPath

# Generate some test data
Write-Host "🔄 Generating Test Data..."

$testScenarios = @(
    # Critical Risk Scenarios
    1..5 | ForEach-Object {
        @{
            Alert = @{
                Id = "SEC-CRIT-$_"
                Type = "Brute Force Attack"
                RiskLevel = "Critical"
                Description = "Multiple failed login attempts detected"
                Source = "192.168.1.$_"
                RiskScore = 0.9
                Timestamp = (Get-Date).AddHours(-$_)
            }
            Approvers = @(
                @{ Id = "LEAD-001"; Role = "SecurityLead"; Action = "Approve"; Comment = "Verified threat" }
                @{ Id = "CISO-001"; Role = "CISO"; Action = "Approve"; Comment = "Confirmed pattern" }
            )
        }
    }
    
    # High Risk Scenarios
    1..8 | ForEach-Object {
        @{
            Alert = @{
                Id = "SEC-HIGH-$_"
                Type = "Suspicious API Access"
                RiskLevel = "High"
                Description = "Unusual API pattern detected"
                Source = "10.0.0.$_"
                RiskScore = 0.75
                Timestamp = (Get-Date).AddHours(-$_)
            }
            Approvers = @(
                @{ Id = "ENG-001"; Role = "SecurityEngineer"; Action = "Approve"; Comment = "Validated pattern" }
            )
        }
    }
    
    # Medium Risk Scenarios
    1..12 | ForEach-Object {
        @{
            Alert = @{
                Id = "SEC-MED-$_"
                Type = "Configuration Change"
                RiskLevel = "Medium"
                Description = "Unauthorized config change"
                Source = "172.16.0.$_"
                RiskScore = 0.5
                Timestamp = (Get-Date).AddHours(-$_)
            }
            Approvers = @(
                @{ Id = "ANALYST-001"; Role = "SecurityAnalyst"; Action = if ($_ % 3 -eq 0) { "Reject" } else { "Approve" }; Comment = "Standard review" }
            )
        }
    }
)

# Process test scenarios
foreach ($scenario in $testScenarios) {
    Write-Host "  • Processing $($scenario.Alert.RiskLevel) alert: $($scenario.Alert.Id)..."
    
    # Process through automation
    $response = $reporter.Automation.ProcessAlert($scenario.Alert, @{
        Impact = @{
            Score = $scenario.Alert.RiskScore
            Affected = @{ Users = 100 }
            Mitigation = @{ EstimatedTime = 60; Effort = "Medium" }
        }
    })
    
    # Process approvals
    foreach ($approval in $response.PendingApprovals) {
        foreach ($approver in $scenario.Approvers) {
            $result = $reporter.Automation.Approval.ProcessApproval(
                $approval.Id,
                $approver.Id,
                $approver.Role,
                $approver.Comment,
                $approver.Action -eq "Approve"
            )
            
            if ($result.Status -eq "Approved") {
                $reporter.Automation.ProcessApprovedAction($approval.Id)
            }
        }
    }
    
    # Add some random delay to simulate real-world timing
    Start-Sleep -Milliseconds (Get-Random -Minimum 100 -Maximum 500)
}

# Calculate metrics
Write-Host "`n📊 Calculating Metrics..."
$calculatedMetrics = $metrics.CalculateMetrics($reporter.Automation.Approval)

# Generate reports
Write-Host "📋 Generating Reports..."
$reportFormats = @("HTML", "JSON")
foreach ($format in $reportFormats) {
    $reportPath = Join-Path $outputPath "metrics_report.$($format.ToLower())"
    $report = $metrics.GenerateReport($calculatedMetrics, $format)
    
    # Save report
    if ($format -eq "HTML") {
        [System.IO.File]::WriteAllText($reportPath, $report)
    } else {
        $report | Out-File -FilePath $reportPath
    }
    Write-Host "  ✅ $format report saved to: $reportPath"
}

# Display key metrics
Write-Host "`n📈 Key Metrics Summary:"
Write-Host "  • Total Requests: $($calculatedMetrics.Summary.TotalRequests)"
Write-Host "  • Approval Rate: $([Math]::Round($calculatedMetrics.Summary.ApprovalRate * 100, 1))%"
Write-Host "  • Average Response Time: $([Math]::Round($calculatedMetrics.ResponseTimes.Average, 1)) minutes"
Write-Host "  • Escalation Rate: $([Math]::Round($calculatedMetrics.Summary.EscalationRate * 100, 1))%"

# Display recommendations
if ($calculatedMetrics.Recommendations.Count -gt 0) {
    Write-Host "`n💡 Recommendations:"
    foreach ($rec in $calculatedMetrics.Recommendations) {
        Write-Host "  • $rec"
    }
}

Write-Host "`n✨ Testing complete!" 
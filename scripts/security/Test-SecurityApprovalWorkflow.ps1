# Import required modules
Import-Module "$PSScriptRoot\SecurityReporter.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAnalytics.psm1" -Force
Import-Module "$PSScriptRoot\SecurityAutomation.psm1" -Force
Import-Module "$PSScriptRoot\SecurityApproval.psm1" -Force

# Create output directory if it doesn't exist
$outputPath = Join-Path $PSScriptRoot "..\..\security_reports"
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

Write-Host "`n🔐 Testing Security Approval Workflow System"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Initialize Security Reporter and Automation with Approval System
Write-Host "📝 Initializing Security Configuration..."
$reporter = New-SecurityReporter -OutputPath $outputPath
$reporter.InitializeAutomation()
$reporter.Automation.InitializeApproval()

# Test different scenarios
$testScenarios = @(
    @{
        Alert = @{
            Id = "SEC-$(Get-Random)"
            Type = "Brute Force Attack"
            RiskLevel = "Critical"
            Description = "Multiple failed login attempts detected from IP 192.168.1.100"
            Source = "192.168.1.100"
            RiskScore = 0.95
            Timestamp = Get-Date
        }
        Approvers = @(
            @{ Id = "LEAD-001"; Role = "SecurityLead"; Action = "Approve"; Comment = "Verified malicious activity" }
            @{ Id = "CISO-001"; Role = "CISO"; Action = "Approve"; Comment = "Confirmed threat actor pattern" }
        )
    }
    @{
        Alert = @{
            Id = "SEC-$(Get-Random)"
            Type = "Suspicious API Access"
            RiskLevel = "High"
            Description = "Unusual API access pattern detected from IP 10.0.0.50"
            Source = "10.0.0.50"
            RiskScore = 0.75
            Timestamp = Get-Date
        }
        Approvers = @(
            @{ Id = "ENG-001"; Role = "SecurityEngineer"; Action = "Approve"; Comment = "Validated suspicious pattern" }
        )
    }
    @{
        Alert = @{
            Id = "SEC-$(Get-Random)"
            Type = "Configuration Change"
            RiskLevel = "Medium"
            Description = "Unauthorized configuration change detected"
            Source = "172.16.0.25"
            RiskScore = 0.45
            Timestamp = Get-Date
        }
        Approvers = @(
            @{ Id = "ANALYST-001"; Role = "SecurityAnalyst"; Action = "Approve"; Comment = "Confirmed unauthorized change" }
        )
    }
)

foreach ($scenario in $testScenarios) {
    Write-Host "`n🚨 Processing $($scenario.Alert.RiskLevel) alert: $($scenario.Alert.Type)..."
    
    # Process alert through automation
    $response = $reporter.Automation.ProcessAlert($scenario.Alert, @{
        Impact = @{
            Score = $scenario.Alert.RiskScore
            Affected = @{ Users = 100 }
            Mitigation = @{ EstimatedTime = 60; Effort = "Medium" }
        }
    })
    
    # Display initial automation response
    Write-Host "  📋 Initial Response:"
    Write-Host "    • Status: $($response.Status)"
    Write-Host "    • Actions: $($response.Actions.Count)"
    Write-Host "    • Pending Approvals: $($response.PendingApprovals.Count)"
    
    # Process approvals
    if ($response.PendingApprovals.Count -gt 0) {
        Write-Host "`n  ✍️ Processing Approvals..."
        
        foreach ($approval in $response.PendingApprovals) {
            Write-Host "    • Approval Request: $($approval.Action.Name)"
            Write-Host "      Required Approvals: $($approval.RequiredApprovals)"
            Write-Host "      Minimum Level: $($approval.MinimumLevel)"
            
            foreach ($approver in $scenario.Approvers) {
                Write-Host "      - $($approver.Role) ($($approver.Id)): $($approver.Action)"
                
                try {
                    $result = $reporter.Automation.Approval.ProcessApproval(
                        $approval.Id,
                        $approver.Id,
                        $approver.Role,
                        $approver.Comment,
                        $approver.Action -eq "Approve"
                    )
                    
                    if ($result.Status -eq "Approved") {
                        Write-Host "        ✅ Request Approved!"
                        
                        # Execute the approved action
                        $actionResult = $reporter.Automation.ProcessApprovedAction($approval.Id)
                        Write-Host "        🔄 Action Executed: $($actionResult.Status)"
                        
                        if ($actionResult.Result) {
                            $resultJson = $actionResult.Result | ConvertTo-Json -Compress
                            Write-Host "        📝 Details: $resultJson"
                        }
                    }
                    elseif ($result.Status -eq "Rejected") {
                        Write-Host "        ❌ Request Rejected"
                    }
                    else {
                        Write-Host "        ⏳ Awaiting more approvals..."
                    }
                }
                catch {
                    Write-Host "        ❌ Error: $_"
                }
            }
        }
    }
    
    # Test JIT access
    Write-Host "`n  🔑 Testing JIT Access..."
    try {
        $jitSession = $reporter.Automation.Approval.RequestJITAccess(
            "EMERGENCY-001",
            "SecurityLead",
            "Emergency response to $($scenario.Alert.Type)",
            "10.0.0.100"
        )
        
        Write-Host "    ✅ JIT Access Granted"
        Write-Host "    • Session ID: $($jitSession.Id)"
        Write-Host "    • Expires: $($jitSession.Expires)"
        
        # Validate JIT access
        $actionValid = $reporter.Automation.Approval.ValidateJITAccess(
            $jitSession.Id,
            "BlockIP"
        )
        Write-Host "    • Action Validation: $(if ($actionValid) { "✅ Allowed" } else { "❌ Denied" })"
    }
    catch {
        Write-Host "    ❌ JIT Access Error: $_"
    }
    
    # Process any escalations
    Write-Host "`n  🔄 Processing Escalations..."
    $escalated = $reporter.Automation.Approval.ProcessEscalations()
    if ($escalated.Count -gt 0) {
        foreach ($req in $escalated) {
            Write-Host "    • Request $($req.Id) escalated to level $($req.EscalationLevel)"
        }
    }
    else {
        Write-Host "    • No pending escalations"
    }
    
    # Add a small delay between scenarios
    Start-Sleep -Seconds 2
}

Write-Host "`n✨ Testing complete!" 
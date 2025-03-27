using namespace System.Collections.Generic
using module "./SecurityTypes.psm1"
using module "./SecurityDashboard.psm1"

class SecurityTestHarness {
    hidden [SecurityDashboard]$Dashboard
    hidden [List[hashtable]]$TestResults
    hidden [string]$LogPath
    hidden [hashtable]$TestScenarios
    hidden [int]$TotalTests = 0
    hidden [int]$PassedTests = 0
    
    SecurityTestHarness([SecurityDashboard]$dashboard) {
        $this.Dashboard = $dashboard
        $this.TestResults = [List[hashtable]]::new()
        $this.LogPath = Join-Path $PSScriptRoot "../../logs/security/test_results"
        $this.InitializeTestScenarios()
        
        # Create test results directory if it doesn't exist
        if (-not (Test-Path $this.LogPath)) {
            New-Item -ItemType Directory -Path $this.LogPath -Force | Out-Null
        }
    }
    
    hidden [void] InitializeTestScenarios() {
        $this.TestScenarios = @{
            BruteForceAttack = @{
                Name = "Brute Force Attack Detection"
                Events = @(
                    @{
                        Type = "Login"
                        IP = "192.168.1.100"
                        Username = "admin"
                        FailedAttempts = 10
                        TimeWindow = 300  # 5 minutes
                        ExpectedSeverity = "High"
                    }
                )
            }
            
            RateLimitViolation = @{
                Name = "Rate Limit Violation Detection"
                Events = @(
                    @{
                        Type = "RateLimit"
                        IP = "192.168.1.101"
                        Count = 150
                        TimeWindow = 60  # 1 minute
                        ExpectedSeverity = "High"
                    }
                )
            }
            
            SSLExpiration = @{
                Name = "SSL Certificate Expiration"
                Events = @(
                    @{
                        Type = "SSL"
                        Endpoint = "https://example.com"
                        DaysRemaining = 5
                        ExpectedSeverity = "Critical"
                    }
                )
            }
            
            APIAbuse = @{
                Name = "API Abuse Detection"
                Events = @(
                    @{
                        Type = "API"
                        IP = "192.168.1.102"
                        Endpoint = "/api/login"
                        ErrorCount = 75
                        TimeWindow = 300  # 5 minutes
                        ExpectedSeverity = "High"
                    }
                )
            }
            
            LowRiskEvent = @{
                Name = "Low Risk Event Classification"
                Events = @(
                    @{
                        Type = "API"
                        IP = "192.168.1.103"
                        Endpoint = "/api/status"
                        ErrorCount = 5
                        TimeWindow = 300
                        ExpectedSeverity = "Low"
                    }
                )
            }
            
            MultiVectorAttack = @{
                Name = "Multi-Vector Attack Detection"
                Events = @(
                    @{
                        Type = "Login"
                        IP = "192.168.1.104"
                        Username = "admin"
                        FailedAttempts = 5
                        TimeWindow = 300
                        ExpectedSeverity = "Medium"
                    },
                    @{
                        Type = "API"
                        IP = "192.168.1.104"
                        Endpoint = "/api/admin"
                        ErrorCount = 30
                        TimeWindow = 300
                        ExpectedSeverity = "High"
                    }
                )
            }
        }
    }
    
    [void] RunAllTests() {
        Write-Host "`nStarting Security Alert System Tests..." -ForegroundColor Cyan
        Write-Host "----------------------------------------`n"
        
        foreach ($scenario in $this.TestScenarios.Keys) {
            $this.RunTestScenario($scenario)
        }
        
        $this.GenerateTestReport()
    }
    
    [void] RunTestScenario([string]$scenarioName) {
        $scenario = $this.TestScenarios[$scenarioName]
        Write-Host "Testing: $($scenario.Name)" -ForegroundColor Yellow
        
        $results = @{
            Scenario = $scenario.Name
            Events = [List[hashtable]]::new()
            StartTime = Get-Date
            FalsePositives = 0
            FalseNegatives = 0
        }
        
        foreach ($event in $scenario.Events) {
            $this.TotalTests++
            
            # Process the event through the adaptive alert system
            $alert = $this.SimulateSecurityEvent($event)
            
            # Validate the results
            $isCorrect = $alert.Severity -eq $event.ExpectedSeverity
            if ($isCorrect) {
                $this.PassedTests++
            }
            
            # Track false positives/negatives
            if ($alert.Severity -in @('High', 'Critical') -and $event.ExpectedSeverity -in @('Low', 'Medium')) {
                $results.FalsePositives++
            }
            elseif ($alert.Severity -in @('Low', 'Medium') -and $event.ExpectedSeverity -in @('High', 'Critical')) {
                $results.FalseNegatives++
            }
            
            $results.Events.Add(@{
                Type = $event.Type
                ExpectedSeverity = $event.ExpectedSeverity
                ActualSeverity = $alert.Severity
                Score = $alert.Score
                Correct = $isCorrect
                Anomalies = $alert.Anomalies
            })
            
            # Train the model with the correct severity
            $this.Dashboard.AdaptiveAlerts.TrainModel($event, $event.ExpectedSeverity)
        }
        
        $results.EndTime = Get-Date
        $results.Duration = $results.EndTime - $results.StartTime
        $this.TestResults.Add($results)
        
        # Display immediate results
        $this.DisplayScenarioResults($results)
    }
    
    hidden [hashtable] SimulateSecurityEvent([hashtable]$event) {
        $metrics = @{
            ThreatScore = 0
            LoginFailures = 0
            APIErrors = 0
            RateLimit = 0
        }
        
        # Set appropriate metrics based on event type
        switch ($event.Type) {
            "Login" { $metrics.LoginFailures = $event.FailedAttempts }
            "API" { $metrics.APIErrors = $event.ErrorCount }
            "RateLimit" { $metrics.RateLimit = $event.Count }
            "SSL" { $metrics.ThreatScore = 90 }  # High score for critical SSL issues
        }
        
        $simulatedEvent = @{
            Type = $event.Type
            Timestamp = Get-Date
            Metrics = $metrics
            AttackFrequency = $this.CalculateSimulatedFrequency($event)
            ImpactScope = $this.CalculateSimulatedImpact($event)
        }
        
        return $this.Dashboard.AdaptiveAlerts.ProcessSecurityEvent($simulatedEvent)
    }
    
    hidden [int] CalculateSimulatedFrequency([hashtable]$event) {
        # Simulate attack frequency based on event type and window
        switch ($event.Type) {
            "Login" { return [Math]::Ceiling($event.FailedAttempts / ($event.TimeWindow / 60)) }
            "API" { return [Math]::Ceiling($event.ErrorCount / ($event.TimeWindow / 60)) }
            "RateLimit" { return [Math]::Ceiling($event.Count / ($event.TimeWindow / 60)) }
            default { return 1 }  # Default frequency for unknown event types
        }
        return 1  # Ensure all paths return a value
    }
    
    hidden [int] CalculateSimulatedImpact([hashtable]$event) {
        # Calculate impact score based on event type and severity
        switch ($event.Type) {
            "Login" { return [Math]::Min(100, ($event.FailedAttempts * 10)) }
            "API" { return [Math]::Min(100, ($event.ErrorCount * 1.5)) }
            "RateLimit" { return [Math]::Min(100, ($event.Count / 2)) }
            "SSL" { return [Math]::Min(100, (30 - $event.DaysRemaining) * 10) }
            default { return 50 }  # Default medium impact for unknown event types
        }
        return 50  # Ensure all paths return a value
    }
    
    hidden [void] DisplayScenarioResults([hashtable]$results) {
        $totalEvents = $results.Events.Count
        $correctEvents = ($results.Events | Where-Object { $_.Correct }).Count
        $accuracy = $correctEvents / $totalEvents
        
        $color = switch ($accuracy) {
            { $_ -ge 0.9 } { "Green" }
            { $_ -ge 0.7 } { "Yellow" }
            default { "Red" }
        }
        
        Write-Host "`nResults for: $($results.Scenario)" -ForegroundColor Cyan
        Write-Host "Accuracy: " -NoNewline
        Write-Host ("{0:P2}" -f $accuracy) -ForegroundColor $color
        Write-Host "False Positives: $($results.FalsePositives)"
        Write-Host "False Negatives: $($results.FalseNegatives)"
        Write-Host "Duration: $($results.Duration.TotalSeconds) seconds`n"
        
        # Display detailed event results
        foreach ($event in $results.Events) {
            $eventColor = if ($event.Correct) { "Green" } else { "Red" }
            Write-Host ("Event Type: {0}" -f $event.Type)
            Write-Host ("Expected: {0}, Actual: {1}" -f $event.ExpectedSeverity, $event.ActualSeverity) -ForegroundColor $eventColor
            Write-Host ("Score: {0:N2}" -f $event.Score)
            if ($event.Anomalies.Count -gt 0) {
                Write-Host ("Anomalies: {0}" -f ($event.Anomalies -join ", "))
            }
            Write-Host ""
        }
    }
    
    [void] GenerateTestReport() {
        $reportTime = Get-Date -Format "yyyyMMdd_HHmmss"
        $reportPath = Join-Path $this.LogPath "test_report_$reportTime.md"
        
        $sb = [System.Text.StringBuilder]::new()
        
        # Add report header
        [void]$sb.AppendLine("# Security Alert System Test Report")
        [void]$sb.AppendLine("Generated: $(Get-Date)")
        [void]$sb.AppendLine("")
        
        # Add summary
        [void]$sb.AppendLine("## Summary")
        [void]$sb.AppendLine("- Total Tests: $($this.TotalTests)")
        [void]$sb.AppendLine("- Passed Tests: $($this.PassedTests)")
        [void]$sb.AppendLine("- Overall Accuracy: $([Math]::Round($this.PassedTests / $this.TotalTests * 100, 2))%")
        [void]$sb.AppendLine("")
        
        # Add detailed results
        [void]$sb.AppendLine("## Detailed Results")
        foreach ($result in $this.TestResults) {
            [void]$sb.AppendLine("`n### $($result.Scenario)")
            [void]$sb.AppendLine("- Duration: $($result.Duration.TotalSeconds) seconds")
            [void]$sb.AppendLine("- False Positives: $($result.FalsePositives)")
            [void]$sb.AppendLine("- False Negatives: $($result.FalseNegatives)")
            
            [void]$sb.AppendLine("`nEvent Results:")
            [void]$sb.AppendLine("| Type | Expected | Actual | Score | Correct | Anomalies |")
            [void]$sb.AppendLine("|------|----------|--------|--------|---------|-----------|")
            
            foreach ($event in $result.Events) {
                [void]$sb.AppendLine("| $($event.Type) | $($event.ExpectedSeverity) | $($event.ActualSeverity) | $($event.Score) | $($event.Correct) | $($event.Anomalies -join ', ') |")
            }
        }
        
        # Add recommendations
        [void]$sb.AppendLine("`n## Recommendations")
        $this.AddRecommendations($sb)
        
        # Save report
        $sb.ToString() | Set-Content $reportPath
        Write-Host "`nTest report generated: $reportPath" -ForegroundColor Green
    }
    
    hidden [void] AddRecommendations([System.Text.StringBuilder]$sb) {
        $falsePositiveRate = ($this.TestResults | Measure-Object -Property FalsePositives -Sum).Sum / $this.TotalTests
        $falseNegativeRate = ($this.TestResults | Measure-Object -Property FalseNegatives -Sum).Sum / $this.TotalTests
        
        [void]$sb.AppendLine("Based on the test results, here are the recommendations:")
        
        if ($falsePositiveRate -gt 0.1) {
            [void]$sb.AppendLine("- **High False Positive Rate**: Consider increasing the threshold multipliers for severity classification")
            [void]$sb.AppendLine("- Review and adjust the anomaly detection sensitivity")
        }
        
        if ($falseNegativeRate -gt 0.1) {
            [void]$sb.AppendLine("- **High False Negative Rate**: Consider lowering the threshold multipliers for severity classification")
            [void]$sb.AppendLine("- Increase the weight of historical behavior in the scoring model")
        }
        
        $accuracyByType = $this.TestResults.Events | Group-Object Type | ForEach-Object {
            @{
                Type = $_.Name
                Accuracy = ($_.Group | Where-Object { $_.Correct }).Count / $_.Group.Count
            }
        }
        
        foreach ($type in $accuracyByType) {
            if ($type.Accuracy -lt 0.8) {
                [void]$sb.AppendLine("- **Improve $($type.Type) Detection**: Review and adjust the scoring weights for this event type")
            }
        }
    }
}

# Export functions
function Test-SecurityAlerts {
    param (
        [Parameter(Mandatory=$true)]
        [SecurityDashboard]$Dashboard
    )
    
    $testHarness = [SecurityTestHarness]::new($Dashboard)
    $testHarness.RunAllTests()
}

Export-ModuleMember -Function Test-SecurityAlerts 
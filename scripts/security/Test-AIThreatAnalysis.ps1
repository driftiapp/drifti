# Import required modules
using module "./SecurityDashboard.psm1"
using module "./SecurityTypes.psm1"
using module "./AIThreatAnalysis.psm1"

# Create test events
$testEvents = @(
    # Normal login activity
    @{
        Type = "Login"
        FailedAttempts = 2
        TimeWindow = 300  # 5 minutes
        Severity = 20
        Context = @()
        IsActualThreat = $false
    }
    
    # Suspicious login activity
    @{
        Type = "Login"
        FailedAttempts = 15
        TimeWindow = 180  # 3 minutes
        Severity = 60
        Context = @()
        IsActualThreat = $true
    }
    
    # Normal API usage
    @{
        Type = "API"
        ErrorCount = 5
        TimeWindow = 600  # 10 minutes
        Severity = 10
        Context = @()
        IsActualThreat = $false
    }
    
    # API abuse pattern
    @{
        Type = "API"
        ErrorCount = 120
        TimeWindow = 300  # 5 minutes
        Severity = 70
        Context = @()
        IsActualThreat = $true
    }
    
    # Critical SSL issue
    @{
        Type = "SSL"
        DaysRemaining = 2
        Severity = 90
        Context = @()
        IsActualThreat = $true
    }
)

# Initialize dashboard
$dashboard = [SecurityDashboard]::new()

# Process test events
Write-Host "`nProcessing test events...`n" -ForegroundColor Cyan

foreach ($event in $testEvents) {
    Write-Host "Testing $($event.Type) event:" -ForegroundColor Yellow
    Write-Host "Original severity: $($event.Severity)"
    
    try {
        $dashboard.AddSecurityEvent($event)
        
        Write-Host "Final severity: $($event.Severity)"
        if ($event.Context.Count -gt 0) {
            Write-Host "AI Insights:" -ForegroundColor Green
            foreach ($insight in $event.Context) {
                Write-Host "  - $insight"
            }
        }
        
        # Validate detection accuracy
        $correctDetection = ($event.Severity -ge 80) -eq $event.IsActualThreat
        $result = if ($correctDetection) { "PASS" } else { "FAIL" }
        Write-Host "Detection Result: $result" -ForegroundColor $(if ($correctDetection) { "Green" } else { "Red" })
    }
    catch {
        Write-Host "Error processing event: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Get alert statistics
$stats = $dashboard.AdaptiveAlerts.GetAlertStats()
Write-Host "Alert Statistics:" -ForegroundColor Cyan
Write-Host "Total Alerts: $($stats.TotalAlerts)"
Write-Host "False Positives: $($stats.FalsePositives)"
Write-Host "Total Events Processed: $($stats.EventCount)"

if ($stats.TotalAlerts -gt 0) {
    $accuracy = 100 * (1 - ($stats.FalsePositives / $stats.TotalAlerts))
    Write-Host "Detection Accuracy: $([Math]::Round($accuracy, 2))%" -ForegroundColor $(if ($accuracy -ge 80) { "Green" } else { "Yellow" }) 
} 
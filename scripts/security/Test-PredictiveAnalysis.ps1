# Import required modules
using module "./SecurityTypes.psm1"
using module "./SecurityDashboard.psm1"
using module "./PredictiveAnalysis.psm1"

# Initialize test events
$testEvents = @(
    @{
        Type = "Login"
        Timestamp = (Get-Date).AddDays(-2)
        FailedAttempts = 5
        TimeWindow = 300
        Severity = 20
        IsActualThreat = $false
        Context = [System.Collections.Generic.List[string]]::new()
    },
    @{
        Type = "Login"
        Timestamp = (Get-Date).AddDays(-1)
        FailedAttempts = 15
        TimeWindow = 60
        Severity = 60
        IsActualThreat = $true
        Context = [System.Collections.Generic.List[string]]::new()
    },
    @{
        Type = "API"
        Timestamp = (Get-Date).AddHours(-1)
        ErrorCount = 50
        TimeWindow = 300
        Severity = 70
        IsActualThreat = $true
        Context = [System.Collections.Generic.List[string]]::new()
    },
    @{
        Type = "SSL"
        Timestamp = (Get-Date).AddHours(-9)
        DaysRemaining = 5
        Severity = 80
        IsActualThreat = $true
        Context = [System.Collections.Generic.List[string]]::new()
    }
)

Write-Host "`nProcessing test events for predictive analysis..."

# Initialize components
$timeSeriesAnalyzer = [TimeSeriesAnalyzer]::new()
$predictiveModel = [PredictiveModel]::new($timeSeriesAnalyzer)
$riskForecaster = [RiskForecaster]::new($predictiveModel)

# Process test events
foreach ($event in $testEvents) {
    Write-Host "`nProcessing $($event.Type) event from $($event.Timestamp)"
    try {
        $timeSeriesAnalyzer.AddEvent($event)
        $predictiveModel.AddEvent($event.Type, $event.Timestamp)
    }
    catch {
        Write-Host "Error processing event: $_" -ForegroundColor Red
    }
}

Write-Host "`nAnalyzing predictive insights..."

# Test predictions for each event type
$eventTypes = @("Login", "API", "SSL")
foreach ($type in $eventTypes) {
    Write-Host "`nPredictions for $type events:"
    $predictions = $predictiveModel.PredictNextEvents($type, 24)
    
    Write-Host "Expected events in next 24h: $($predictions.ExpectedCount)"
    Write-Host "Probability: $([Math]::Round($predictions.Probability * 100, 2))%"
    Write-Host "Predicted severity: $($predictions.Severity)"
    Write-Host "Confidence: $([Math]::Round($predictions.Confidence * 100))%"
    
    Write-Host "`nHigh-risk periods:"
    foreach ($period in $predictions.TimeRanges) {
        Write-Host "Hour $($period.Start) to $($period.End) (Risk: $([Math]::Round($period.Risk, 2)))"
    }
    
    if ($predictions.TemporalPatterns.HourlyTrend.Count -gt 0) {
        Write-Host "`nTop risk hours:"
        $topHours = $predictions.TemporalPatterns.HourlyTrend.GetEnumerator() | 
            Sort-Object Value -Descending | 
            Select-Object -First 3
        foreach ($hour in $topHours) {
            Write-Host "$($hour.Key):00 - Risk: $([Math]::Round($hour.Value * 100, 1))%"
        }
    }
}

# Test risk forecasting
foreach ($type in $eventTypes) {
    Write-Host "`nRisk forecast for $type events:"
    $forecast = $riskForecaster.ForecastRisk($type, 24)
    
    Write-Host "Immediate risk: $([Math]::Round($forecast.ImmediateRisk * 100, 2))%"
    Write-Host "Chain risk: $([Math]::Round($forecast.ChainRisk * 100))%"
    Write-Host "Time to action: $($forecast.TimeToAction.TotalHours) hours"
    
    if ($forecast.VulnerableResources.Count -gt 0) {
        Write-Host "`nVulnerable resources:"
        foreach ($resource in $forecast.VulnerableResources) {
            Write-Host "- $($resource.Resource): Risk Level $([Math]::Round($resource.Risk * 100, 1))%"
        }
    }
}

Write-Host "`nPredicted attack chains:"
foreach ($type in $eventTypes) {
    $chain = $predictiveModel.PredictAttackChain($type)
    if ($chain.Sequence.Count -gt 0) {
        Write-Host "`nStarting from $type event:"
        Write-Host "Sequence: $($chain.Sequence -join ' -> ')"
        Write-Host "Chain confidence: $([Math]::Round($chain.Confidence * 100, 1))%"
        Write-Host "Total risk: $([Math]::Round($chain.TotalRisk * 100, 1))%"
        
        if ($chain.BranchingPaths.Count -gt 0) {
            Write-Host "`nAlternative paths:"
            foreach ($path in $chain.BranchingPaths | Select-Object -First 3) {
                Write-Host "- $($path.Sequence -join ' -> ') (Probability: $([Math]::Round($path.Probability * 100, 1))%)"
            }
        }
    }
} 
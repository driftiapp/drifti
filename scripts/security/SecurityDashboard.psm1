using namespace System.Collections.Generic
using module "./SecurityTypes.psm1"
using module "./NetworkGraph.psm1"
using module "./PredictiveAnalysis.psm1"
using module "./SecurityVisualizer.psm1"
using module "./MockAlertSystem.psm1"

class SecurityDashboard {
    hidden [hashtable]$Config
    hidden [object]$ThreatIntel
    hidden [hashtable]$MetricsData
    hidden [List[SecurityAlert]]$AlertQueue
    hidden [int]$MaxAlertQueueSize = 1000
    hidden [bool]$AlertsEnabled = $true
    hidden [scriptblock]$ProcessSecurityEvent
    hidden [NetworkGraph]$NetworkGraph
    hidden [MockAlertSystem.MockAlertSystem]$AdaptiveAlerts
    hidden [object]$TimeSeriesAnalyzer
    hidden [object]$PredictiveModel
    hidden [object]$RiskForecaster
    hidden [object]$Visualizer
    hidden [bool]$IsInitialized
    hidden [string]$VisualizationPath
    hidden [string]$OutputPath
    hidden [MockAlertSystem]$AlertSystem
    hidden [hashtable]$Metrics
    hidden [object]$ThreatAnalyzer
    
    SecurityDashboard([string]$outputPath) {
        $this.OutputPath = $outputPath
        $this.TimeSeriesAnalyzer = New-TimeSeriesAnalyzer
        $this.ThreatAnalyzer = New-AIThreatAnalyzer
        $this.PredictiveModel = New-PredictiveModel -analyzer $this.TimeSeriesAnalyzer
        $this.RiskForecaster = New-RiskForecaster -model $this.PredictiveModel
        $this.Visualizer = New-SecurityVisualizer -outputPath $outputPath
        $this.AlertSystem = [MockAlertSystem]::new()
        $this.AlertQueue = [List[SecurityAlert]]::new()
        $this.Metrics = @{}
        $this.Config = @{
            PredictionHorizon = 24  # Hours
            AlertThresholds = @{
                Critical = 90
                High = 70
                Medium = 40
                Low = 20
            }
            LastAutoTune = Get-Date
            AutoTuneInterval = 24  # Hours
        }
        $this.Initialize()
    }
    
    [void] Initialize() {
        try {
            $this.AdaptiveAlerts = [MockAlertSystem.MockAlertSystem]::new()
            $this.NetworkGraph = [NetworkGraph]::new()
            $this.IsInitialized = $true
        }
        catch {
            Write-Warning "Failed to initialize security dashboard: $_"
            $this.IsInitialized = $false
        }
    }
    
    [void] AddSecurityEvent([hashtable]$event) {
        if (-not $this.IsInitialized) {
            Write-Warning "Security dashboard not initialized. Attempting to reinitialize..."
            $this.Initialize()
            if (-not $this.IsInitialized) {
                throw "Failed to initialize security dashboard"
            }
        }
        
        # Add event to time series analyzer
        $this.TimeSeriesAnalyzer.AddEvent($event)
        
        # Get predictive insights
        $predictions = $this.PredictiveModel.PredictNextEvents(
            $event.Type, 
            $this.Config.PredictionHorizon
        )
        
        # Get risk forecast
        $riskForecast = $this.RiskForecaster.ForecastRisk(
            $event.Type,
            $this.Config.PredictionHorizon
        )
        
        # Analyze with AI threat analyzer
        $aiAnalysis = $this.ThreatAnalyzer.AnalyzeSecurityEvent($event)
        
        # Adjust event severity based on combined analysis
        if ($aiAnalysis.IsAnomaly -or $predictions.Severity -eq "Critical" -or $riskForecast.ImmediateRisk -gt 0.8) {
            $event.Severity = [Math]::Max($event.Severity, 80)  # At least High severity
        }
        
        # Initialize event context if needed
        if (-not $event.ContainsKey("Context")) {
            $event.Context = [System.Collections.Generic.List[string]]::new()
        }
        
        # Add insights
        foreach ($insight in $aiAnalysis.Insights) {
            $event.Context.Add($insight)
        }
        
        if ($predictions.Confidence -gt 0.7) {
            $event.Context.Add("Predicted $($predictions.ExpectedCount) similar events in next $($this.Config.PredictionHorizon) hours")
            foreach ($period in $predictions.TimeRanges) {
                $event.Context.Add("High-risk period: Hour $($period.Start) to $($period.End) (Risk: $([Math]::Round($period.Risk, 2)))")
            }
            
            # Add temporal pattern insights
            $event.Context.Add("Temporal Pattern Analysis:")
            $topHours = $predictions.TemporalPatterns.HourlyTrend.GetEnumerator() | 
                Sort-Object Value -Descending | 
                Select-Object -First 3
            $event.Context.Add("Peak Hours: $($topHours | ForEach-Object { "$($_.Key):00 ($([Math]::Round($_.Value * 100, 1))%)" })")
        }
        
        if ($riskForecast.ImmediateRisk -gt 0.5) {
            $event.Context.Add("Risk Assessment:")
            foreach ($action in $riskForecast.RecommendedActions) {
                $event.Context.Add($action)
            }
            $event.Context.Add("Time to action: $($riskForecast.TimeToAction.TotalHours) hours")
            
            if ($riskForecast.VulnerableResources.Count -gt 0) {
                $event.Context.Add("Vulnerable Resources:")
                foreach ($resource in $riskForecast.VulnerableResources) {
                    $event.Context.Add("- $($resource.Resource): Risk Level $([Math]::Round($resource.Risk * 100, 1))%")
                }
            }
        }
        
        # Process through adaptive alert system
        $this.AdaptiveAlerts.ProcessEvent($event)
        
        # Update network graph
        $this.NetworkGraph.AddSecurityEvent($event)
        
        # Create alert if severity is high enough
        if ($event.Severity -ge $this.Config.AlertThresholds.High) {
            $message = $this.FormatAlertMessage($event)
            $this.AddAlert($event.Type, $message, $this.GetSeverityLevel($event.Severity))
        }
        
        # Auto-tune if needed
        $this.CheckAutoTune()
    }
    
    [void] AddAlert([string]$type, [string]$message, [string]$severity) {
        $alert = [SecurityAlert]::new($type, $message, $severity)
        $this.AlertQueue.Add($alert)
        
        while ($this.AlertQueue.Count -gt $this.MaxAlertQueueSize) {
            $this.AlertQueue.RemoveAt(0)
        }
    }
    
    [string] GenerateNetworkGraph() {
        return $this.NetworkGraph.GenerateGraphViz()
    }
    
    [hashtable] GetAttackPatterns() {
        return $this.NetworkGraph.GetAttackPatterns()
    }
    
    [hashtable] GetSecurityMetrics() {
        $this.MetricsData = @{
            Alerts = @{
                Total = $this.AlertQueue.Count
                Critical = ($this.AlertQueue | Where-Object { $_.Severity -eq 5 }).Count
                High = ($this.AlertQueue | Where-Object { $_.Severity -eq 4 }).Count
                Medium = ($this.AlertQueue | Where-Object { $_.Severity -eq 3 }).Count
                Low = ($this.AlertQueue | Where-Object { $_.Severity -eq 2 }).Count
            }
            Network = @{
                UniqueAttackers = $this.NetworkGraph.Statistics.UniqueAttackers.Count
                TotalAttacks = $this.NetworkGraph.Statistics.TotalAttacks
                TopTargets = $this.NetworkGraph.Statistics.TopTargets
                GeoDistribution = $this.NetworkGraph.Statistics.GeoDistribution
                AttackPatterns = $this.NetworkGraph.Statistics.AttackPatterns
            }
        }
        return $this.MetricsData
    }
    
    [string] FormatAlertMessage([hashtable]$event) {
        $message = "Security event detected: $($event.Type)`n"
        
        switch ($event.Type) {
            "Login" {
                $message += "Failed login attempts: $($event.FailedAttempts) in $($event.TimeWindow) seconds"
            }
            "API" {
                $message += "API errors: $($event.ErrorCount) in $($event.TimeWindow) seconds"
            }
            "SSL" {
                $message += "SSL certificate expiring in $($event.DaysRemaining) days"
            }
            default {
                $message += "Severity: $($this.GetSeverityLevel($event.Severity))"
            }
        }
        
        if ($null -ne $event.Context -and $event.Context.Count -gt 0) {
            $message += "`nAI Insights:`n"
            foreach ($insight in $event.Context) {
                $message += "- $insight`n"
            }
        }
        
        return $message
    }
    
    [string] GetSeverityLevel([double]$score) {
        if ($score -ge $this.Config.AlertThresholds.Critical) { return "Critical" }
        if ($score -ge $this.Config.AlertThresholds.High) { return "High" }
        if ($score -ge $this.Config.AlertThresholds.Medium) { return "Medium" }
        if ($score -ge $this.Config.AlertThresholds.Low) { return "Low" }
        return "Info"
    }
    
    [void] CheckAutoTune() {
        $now = Get-Date
        $hoursSinceLastTune = ($now - $this.Config.LastAutoTune).TotalHours
        
        if ($hoursSinceLastTune -ge $this.Config.AutoTuneInterval) {
            $this.AutoTuneThresholds()
            $this.Config.LastAutoTune = $now
        }
    }
    
    hidden [void] AutoTuneThresholds() {
        # Get false positive rate from recent alerts
        $stats = $this.AdaptiveAlerts.GetAlertStats()
        
        if ($stats.TotalAlerts -eq 0) { return }
        
        $falsePositiveRate = $stats.FalsePositives / $stats.TotalAlerts
        
        # Adjust thresholds based on false positive rate
        if ($falsePositiveRate -gt 0.2) {  # Too many false positives
            $this.Config.AlertThresholds.Low += 5
            $this.Config.AlertThresholds.Medium += 5
            $this.Config.AlertThresholds.High += 3
            $this.Config.AlertThresholds.Critical += 2
        }
        elseif ($falsePositiveRate -lt 0.05) {  # Too few alerts
            $this.Config.AlertThresholds.Low = [Math]::Max(20, $this.Config.AlertThresholds.Low - 5)
            $this.Config.AlertThresholds.Medium = [Math]::Max(40, $this.Config.AlertThresholds.Medium - 5)
            $this.Config.AlertThresholds.High = [Math]::Max(70, $this.Config.AlertThresholds.High - 3)
            $this.Config.AlertThresholds.Critical = [Math]::Max(85, $this.Config.AlertThresholds.Critical - 2)
        }
    }
    
    [hashtable] GetPredictiveInsights() {
        $insights = @{
            Predictions = @{}
            RiskForecasts = @{}
            GlobalPatterns = @{
                TimeOfDay = @{}
                DayOfWeek = @{}
                AttackChains = @{}
            }
        }
        
        # Get predictions for each event type
        $eventTypes = @("Login", "API", "SSL")
        foreach ($type in $eventTypes) {
            $predictions = $this.PredictiveModel.PredictNextEvents(
                $type,
                $this.Config.PredictionHorizon
            )
            $insights.Predictions[$type] = $predictions
            
            $riskForecast = $this.RiskForecaster.ForecastRisk(
                $type,
                $this.Config.PredictionHorizon
            )
            $insights.RiskForecasts[$type] = $riskForecast
        }
        
        # Get attack chain predictions
        foreach ($type in $eventTypes) {
            $chain = $this.PredictiveModel.PredictAttackChain($type)
            if ($chain.Sequence.Count -gt 0) {
                $insights.GlobalPatterns.AttackChains[$type] = $chain
            }
        }
        
        return $insights
    }
    
    [void] ProcessEvent([string]$eventType, [datetime]$timestamp, [hashtable]$eventData) {
        # Update time series analysis
        $this.TimeSeriesAnalyzer.AddEvent($eventType, $timestamp)
        
        # Calculate risk score based on event data
        $riskScore = if ($eventData.ContainsKey("RiskScore")) {
            $eventData.RiskScore
        } else {
            $score = 0.0
            if ($eventData.ContainsKey("FailedAttempts")) {
                $score += [double]$eventData.FailedAttempts * 0.1
            }
            if ($eventData.ContainsKey("Severity")) {
                # Convert severity string to numeric value
                $severityValue = switch ($eventData.Severity) {
                    "Critical" { 1.0 }
                    "High" { 0.8 }
                    "Medium" { 0.5 }
                    "Low" { 0.2 }
                    default { 0.1 }
                }
                $score += $severityValue * 0.2
            }
            if ($eventData.ContainsKey("IsActualThreat") -and $eventData.IsActualThreat) {
                $score += 0.5
            }
            $score
        }
        
        # Get threat prediction
        $prediction = if ($eventData.ContainsKey("Prediction")) {
            $eventData.Prediction
        } else {
            $this.ThreatAnalyzer.PredictThreat($eventType, $timestamp, $riskScore)
        }
        
        # Update metrics
        if (-not $this.Metrics.ContainsKey($eventType)) {
            $this.Metrics[$eventType] = @{
                EventCount = 0
                RiskScores = @()
                Predictions = @()
                Events = [System.Collections.ArrayList]@()
            }
        }
        
        $this.Metrics[$eventType].EventCount++
        $this.Metrics[$eventType].RiskScores += $riskScore
        $this.Metrics[$eventType].Predictions += $prediction
        [void]$this.Metrics[$eventType].Events.Add(@{
            Timestamp = $timestamp
            Count = 1
            RiskScore = $riskScore
            Prediction = $prediction
        })
        
        # Update PredictiveModel
        $this.PredictiveModel.AddEvent($eventType, $timestamp)
        
        # Check if we need to generate an alert
        if ($prediction.ThreatLevel -eq "Critical" -or $prediction.ThreatLevel -eq "High") {
            $this.AlertSystem.SendAlert($eventType, $timestamp, $riskScore, $prediction.Confidence)
        }
    }
    
    [void] GenerateVisualizations() {
        foreach ($eventType in $this.Metrics.Keys) {
            # Generate heatmap
            $timeSeriesData = $this.TimeSeriesAnalyzer.GetEventCounts($eventType)
            if ($null -ne $timeSeriesData) {
                $this.Visualizer.GenerateHeatmap($eventType, $timeSeriesData)
            }
            
            # Generate trend graph
            $predictions = $this.PredictiveModel.PredictNextEvents($eventType, 24) # Predict next 24 hours
            if ($null -ne $predictions -and $null -ne $this.Metrics[$eventType].Events) {
                # Convert event data to numeric array
                $eventData = @()
                foreach ($event in $this.Metrics[$eventType].Events) {
                    $eventData += [PSCustomObject]@{
                        Timestamp = $event.Timestamp
                        Count = [double]$event.Count
                        RiskScore = [double]$event.RiskScore
                    }
                }
                $this.Visualizer.GenerateTrendGraph($eventType, $eventData, $predictions)
            }
        }
        
        # Generate anomaly dashboard
        $anomalyData = @{}
        foreach ($eventType in $this.Metrics.Keys) {
            if ($null -ne $this.Metrics[$eventType].RiskScores -and $null -ne $this.Metrics[$eventType].Predictions) {
                $anomalyData[$eventType] = @{
                    RiskScores = $this.Metrics[$eventType].RiskScores | ForEach-Object { [double]$_ }
                    Predictions = $this.Metrics[$eventType].Predictions | ForEach-Object {
                        if ($_ -is [hashtable]) {
                            @{
                                RiskScore = [double]($_.RiskScore ?? 0)
                                Confidence = [double]($_.Confidence ?? 0.5)
                                IsAnomaly = [bool]($_.IsAnomaly ?? $false)
                                ThreatLevel = $_.ThreatLevel ?? "Low"
                                Insights = $_.Insights ?? @()
                            }
                        } else {
                            $_
                        }
                    }
                }
            }
        }
        if ($anomalyData.Count -gt 0) {
            $this.Visualizer.GenerateAnomalyDashboard($anomalyData)
        }
        
        # Generate resource risk map
        $resourceData = @{}
        foreach ($eventType in $this.Metrics.Keys) {
            if ($null -ne $this.Metrics[$eventType].RiskScores -and $this.Metrics[$eventType].RiskScores.Count -gt 0) {
                $resourceData[$eventType] = @{
                    TotalEvents = [double]$this.Metrics[$eventType].EventCount
                    AverageRisk = [double]($this.Metrics[$eventType].RiskScores | Measure-Object -Average).Average
                }
            }
        }
        if ($resourceData.Count -gt 0) {
            $this.Visualizer.GenerateResourceRiskMap($resourceData)
        }
    }
}

class MockAlertSystem {
    [void] SendAlert([string]$eventType, [datetime]$timestamp, [double]$riskScore, [double]$anomalyScore) {
        Write-Host "ALERT: High risk event detected"
        Write-Host "Type: $eventType"
        Write-Host "Time: $timestamp"
        Write-Host "Risk Score: $riskScore"
        Write-Host "Anomaly Score: $anomalyScore"
    }
}

# Create a function to return a new instance of the class
function New-SecurityDashboard {
    param([string]$outputPath)
    return [SecurityDashboard]::new($outputPath)
}

# Export only the function
Export-ModuleMember -Function New-SecurityDashboard
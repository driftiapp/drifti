using namespace System.Collections.Generic

# Analytics Configuration
$script:AnalyticsConfig = @{
    TrendAnalysis = @{
        TimeWindows = @(
            @{ Name = "Last Hour"; Minutes = 60 }
            @{ Name = "Last Day"; Minutes = 1440 }
            @{ Name = "Last Week"; Minutes = 10080 }
        )
        BaselineThreshold = 2.0  # Standard deviations for anomaly detection
    }
    RiskScoring = @{
        Weights = @{
            Severity = 0.35
            Frequency = 0.25
            Impact = 0.20
            Context = 0.20
        }
        Categories = @{
            Critical = @{ Min = 0.8; Color = "#FF0000" }
            High = @{ Min = 0.6; Color = "#FF6B00" }
            Medium = @{ Min = 0.4; Color = "#FFD700" }
            Low = @{ Min = 0.2; Color = "#00FF00" }
        }
    }
    PatternDetection = @{
        MinimumConfidence = 0.75
        MaxPatternLength = 10
        TimeWindowMinutes = 1440
    }
}

function New-SecurityAnalytics {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$DataPath
    )
    
    $analytics = [PSCustomObject]@{
        DataPath = $DataPath
        Config = $script:AnalyticsConfig
        Cache = @{
            Trends = @{}
            Patterns = @{}
            RiskScores = @{}
        }
    }
    
    # Add methods
    $analytics | Add-Member -MemberType ScriptMethod -Name AnalyzeTrends -Value {
        param(
            [Parameter(Mandatory=$true)]
            [array]$Events,
            [string]$EventType = "All"
        )
        
        $trends = @{
            TimeSeries = @()
            Anomalies = @()
            Statistics = @{
                Mean = 0
                StdDev = 0
                Trend = "stable"
                ChangeRate = 0
            }
            Forecast = @()
        }
        
        # Group events by time windows
        foreach ($window in $this.Config.TrendAnalysis.TimeWindows) {
            $windowEvents = $Events | Where-Object {
                $_.Timestamp -gt (Get-Date).AddMinutes(-$window.Minutes)
            }
            
            # Calculate event frequency
            $frequency = $windowEvents.Count / $window.Minutes
            
            # Add to time series
            $trends.TimeSeries += @{
                Window = $window.Name
                Count = $windowEvents.Count
                Frequency = $frequency
                RiskScore = ($windowEvents | Measure-Object -Property RiskScore -Average).Average
            }
        }
        
        # Calculate statistics
        if ($trends.TimeSeries.Count -gt 0) {
            $trends.Statistics.Mean = ($trends.TimeSeries | Measure-Object -Property Frequency -Average).Average
            $trends.Statistics.StdDev = [Math]::Sqrt(($trends.TimeSeries | ForEach-Object { 
                [Math]::Pow($_.Frequency - $trends.Statistics.Mean, 2)
            } | Measure-Object -Average).Average)
            
            # Detect trend direction
            $firstPoint = $trends.TimeSeries[0].Frequency
            $lastPoint = $trends.TimeSeries[-1].Frequency
            $trends.Statistics.ChangeRate = ($lastPoint - $firstPoint) / $firstPoint
            $trends.Statistics.Trend = switch ($trends.Statistics.ChangeRate) {
                { $_ -gt 0.1 } { "increasing" }
                { $_ -lt -0.1 } { "decreasing" }
                default { "stable" }
            }
        }
        
        # Detect anomalies
        $threshold = $trends.Statistics.Mean + ($this.Config.TrendAnalysis.BaselineThreshold * $trends.Statistics.StdDev)
        $trends.Anomalies = $trends.TimeSeries | Where-Object {
            $_.Frequency -gt $threshold
        }
        
        # Generate forecast
        $trends.Forecast = 1..3 | ForEach-Object {
            $hours = $_ * 24
            @{
                TimeFrame = "Next ${hours}h"
                PredictedCount = [Math]::Round($trends.Statistics.Mean * $hours * 60 * (1 + $trends.Statistics.ChangeRate))
                Confidence = [Math]::Max(0, 1 - ($_ * 0.1))  # Confidence decreases with time
            }
        }
        
        return $trends
    }
    
    $analytics | Add-Member -MemberType ScriptMethod -Name DetectPatterns -Value {
        param(
            [Parameter(Mandatory=$true)]
            [array]$Events
        )
        
        $patterns = @{
            Sequences = @()
            CommonSources = @()
            TimeCorrelations = @()
            RiskPatterns = @()
        }
        
        # Analyze event sequences
        $eventSequence = $Events | Sort-Object Timestamp | Select-Object -First $this.Config.PatternDetection.MaxPatternLength
        $sequenceLength = 2
        while ($sequenceLength -le $eventSequence.Count) {
            $window = 0
            while (($window + $sequenceLength) -le $eventSequence.Count) {
                $sequence = $eventSequence[$window..($window + $sequenceLength - 1)]
                $confidence = $this.CalculatePatternConfidence($sequence, $Events)
                
                if ($confidence -ge $this.Config.PatternDetection.MinimumConfidence) {
                    $patterns.Sequences += @{
                        Events = $sequence
                        Length = $sequenceLength
                        Confidence = $confidence
                        TimeSpan = ($sequence[-1].Timestamp - $sequence[0].Timestamp).TotalMinutes
                    }
                }
                $window++
            }
            $sequenceLength++
        }
        
        # Analyze common sources
        $sourceCounts = $Events | Group-Object Source | Sort-Object Count -Descending
        $patterns.CommonSources = $sourceCounts | Select-Object -First 5 | ForEach-Object {
            @{
                Source = $_.Name
                Count = $_.Count
                Percentage = [Math]::Round(($_.Count / $Events.Count) * 100, 2)
                AverageRiskScore = ($_.Group | Measure-Object RiskScore -Average).Average
            }
        }
        
        # Analyze time correlations
        $timeGroups = $Events | Group-Object { $_.Timestamp.Hour }
        $patterns.TimeCorrelations = $timeGroups | ForEach-Object {
            @{
                Hour = $_.Name
                Count = $_.Count
                AverageRiskScore = ($_.Group | Measure-Object RiskScore -Average).Average
            }
        }
        
        # Analyze risk patterns
        $riskGroups = $Events | Group-Object RiskLevel
        $patterns.RiskPatterns = $riskGroups | ForEach-Object {
            @{
                Level = $_.Name
                Count = $_.Count
                Percentage = [Math]::Round(($_.Count / $Events.Count) * 100, 2)
                AverageScore = ($_.Group | Measure-Object RiskScore -Average).Average
                Sources = ($_.Group | Group-Object Source | Sort-Object Count -Descending | Select-Object -First 3).Name
            }
        }
        
        return $patterns
    }
    
    $analytics | Add-Member -MemberType ScriptMethod -Name CalculateImpact -Value {
        param(
            [Parameter(Mandatory=$true)]
            [hashtable]$Alert
        )
        
        $impact = @{
            Score = 0.0
            Factors = @()
            Affected = @{
                Systems = @()
                Users = 0
                Services = @()
            }
            Mitigation = @{
                Priority = "Low"
                Effort = "Low"
                EstimatedTime = 0
            }
        }
        
        # Calculate base impact score
        $severityWeight = switch ($Alert.RiskLevel) {
            "Critical" { 1.0 }
            "High" { 0.8 }
            "Medium" { 0.5 }
            "Low" { 0.2 }
            default { 0.1 }
        }
        
        # Analyze affected systems
        $impact.Affected.Systems = @(
            "Authentication System"
            "User Database"
            "API Gateway"
        ) | Where-Object { $Alert.Description -match $_ }
        
        # Estimate affected users
        $impact.Affected.Users = switch ($impact.Affected.Systems.Count) {
            0 { 0 }
            1 { 100 }
            2 { 500 }
            default { 1000 }
        }
        
        # Identify affected services
        $impact.Affected.Services = @(
            "Authentication"
            "Authorization"
            "Data Access"
            "API Services"
        ) | Where-Object { $Alert.Description -match $_ }
        
        # Calculate final impact score
        $systemsWeight = $impact.Affected.Systems.Count / 5.0
        $usersWeight = [Math]::Min(1.0, $impact.Affected.Users / 1000.0)
        $servicesWeight = $impact.Affected.Services.Count / 5.0
        
        $impact.Score = ($severityWeight * 0.4) + 
                       ($systemsWeight * 0.2) + 
                       ($usersWeight * 0.2) + 
                       ($servicesWeight * 0.2)
        
        # Determine mitigation details
        $impact.Mitigation = @{
            Priority = if ($impact.Score -gt 0.8) { "Critical" }
                      elseif ($impact.Score -gt 0.6) { "High" }
                      elseif ($impact.Score -gt 0.4) { "Medium" }
                      else { "Low" }
            Effort = if ($impact.Affected.Systems.Count -gt 2) { "High" }
                    elseif ($impact.Affected.Systems.Count -gt 1) { "Medium" }
                    else { "Low" }
            EstimatedTime = switch ($impact.Affected.Systems.Count) {
                0 { 30 }    # 30 minutes
                1 { 60 }    # 1 hour
                2 { 180 }   # 3 hours
                default { 360 }  # 6 hours
            }
        }
        
        # Add impact factors
        $impact.Factors = @(
            if ($impact.Affected.Systems.Count -gt 0) {
                "Affects $($impact.Affected.Systems.Count) critical systems"
            }
            if ($impact.Affected.Users -gt 0) {
                "Potentially impacts $($impact.Affected.Users) users"
            }
            if ($impact.Affected.Services.Count -gt 0) {
                "Disrupts $($impact.Affected.Services.Count) core services"
            }
            "Requires $($impact.Mitigation.EstimatedTime) minutes to mitigate"
        )
        
        return $impact
    }
    
    $analytics | Add-Member -MemberType ScriptMethod -Name GenerateInsights -Value {
        param(
            [Parameter(Mandatory=$true)]
            [array]$Events,
            [Parameter(Mandatory=$true)]
            [hashtable]$Alert
        )
        
        $insights = @{
            Summary = @()
            Trends = $null
            Patterns = $null
            Impact = $null
            Recommendations = @()
        }
        
        # Analyze trends
        $insights.Trends = $this.AnalyzeTrends($Events, $Alert.Type)
        
        # Detect patterns
        $insights.Patterns = $this.DetectPatterns($Events)
        
        # Calculate impact
        $insights.Impact = $this.CalculateImpact($Alert)
        
        # Generate summary insights
        $insights.Summary += @(
            "Alert frequency is $($insights.Trends.Statistics.Trend) with a $([Math]::Abs($insights.Trends.Statistics.ChangeRate * 100))% rate of change"
            
            if ($insights.Trends.Anomalies.Count -gt 0) {
                "Detected $($insights.Trends.Anomalies.Count) anomalous activity periods"
            }
            
            if ($insights.Patterns.Sequences.Count -gt 0) {
                "Identified $($insights.Patterns.Sequences.Count) recurring event patterns"
            }
            
            "Impact assessment: $($insights.Impact.Score) severity score affecting $($insights.Impact.Affected.Users) users"
        )
        
        # Generate recommendations
        $insights.Recommendations += @(
            if ($insights.Impact.Score -gt 0.8) {
                "🚨 Immediate response required - Escalate to incident response team"
            }
            
            if ($insights.Trends.Statistics.Trend -eq "increasing") {
                "📈 Monitor system closely - Alert frequency is trending upward"
            }
            
            if ($insights.Impact.Affected.Systems.Count -gt 0) {
                "🔍 Review security controls for: $($insights.Impact.Affected.Systems -join ', ')"
            }
            
            if ($insights.Patterns.CommonSources.Count -gt 0) {
                "🎯 Investigate top source: $($insights.Patterns.CommonSources[0].Source)"
            }
            
            "⏱️ Estimated resolution time: $($insights.Impact.Mitigation.EstimatedTime) minutes"
        )
        
        return $insights
    }
    
    $analytics | Add-Member -MemberType ScriptMethod -Name CalculatePatternConfidence -Value {
        param(
            [Parameter(Mandatory=$true)]
            [array]$Sequence,
            [Parameter(Mandatory=$true)]
            [array]$AllEvents
        )
        
        # Calculate confidence based on multiple factors
        $confidence = 0.0
        
        # Factor 1: Frequency of occurrence
        $sequencePattern = $Sequence | ForEach-Object { $_.Type } | Join-String -Separator "|"
        $matches = 0
        $window = 0
        while ($window + $Sequence.Count -le $AllEvents.Count) {
            $testSequence = $AllEvents[$window..($window + $Sequence.Count - 1)]
            $testPattern = $testSequence | ForEach-Object { $_.Type } | Join-String -Separator "|"
            if ($testPattern -eq $sequencePattern) {
                $matches++
            }
            $window++
        }
        $frequencyScore = [Math]::Min(1.0, $matches / ($AllEvents.Count / 2))
        
        # Factor 2: Time consistency
        $timeSpans = @()
        $window = 0
        while ($window + $Sequence.Count -le $AllEvents.Count) {
            $testSequence = $AllEvents[$window..($window + $Sequence.Count - 1)]
            $testPattern = $testSequence | ForEach-Object { $_.Type } | Join-String -Separator "|"
            if ($testPattern -eq $sequencePattern) {
                $timeSpans += ($testSequence[-1].Timestamp - $testSequence[0].Timestamp).TotalMinutes
            }
            $window++
        }
        
        if ($timeSpans.Count -gt 1) {
            $meanTimeSpan = ($timeSpans | Measure-Object -Average).Average
            $stdDev = [Math]::Sqrt(($timeSpans | ForEach-Object { [Math]::Pow($_ - $meanTimeSpan, 2) } | Measure-Object -Average).Average)
            $timeConsistencyScore = [Math]::Max(0, 1 - ($stdDev / $meanTimeSpan))
        } else {
            $timeConsistencyScore = 0.5  # Neutral score for single occurrence
        }
        
        # Factor 3: Risk level consistency
        $riskLevels = $Sequence | ForEach-Object { $_.RiskLevel }
        $uniqueRiskLevels = $riskLevels | Select-Object -Unique
        $riskConsistencyScore = 1 - (($uniqueRiskLevels.Count - 1) / 3)  # 3 is max possible difference
        
        # Factor 4: Source consistency
        $sources = $Sequence | ForEach-Object { $_.Source }
        $uniqueSources = $sources | Select-Object -Unique
        $sourceConsistencyScore = 1 - (($uniqueSources.Count - 1) / ($Sequence.Count - 1))
        
        # Calculate final confidence score
        $confidence = ($frequencyScore * 0.4) +
                     ($timeConsistencyScore * 0.3) +
                     ($riskConsistencyScore * 0.2) +
                     ($sourceConsistencyScore * 0.1)
        
        return $confidence
    }
    
    return $analytics
}

# Export functions
Export-ModuleMember -Function @(
    'New-SecurityAnalytics'
) 
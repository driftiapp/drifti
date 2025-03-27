using namespace System.Collections.Generic

class TimeSeriesAnalyzer {
    hidden [hashtable]$EventCounts
    hidden [hashtable]$SeasonalPatterns
    hidden [hashtable]$TrendComponents
    hidden [int]$MaxHistorySize = 10000
    hidden [TimeSpan]$AnalysisWindow = [TimeSpan]::FromDays(7)
    hidden [int]$MaxHistoryDays = 7
    
    TimeSeriesAnalyzer() {
        $this.EventCounts = @{}
        $this.SeasonalPatterns = @{}
        $this.TrendComponents = @{
            ShortTerm = @{}  # 24 hours
            MediumTerm = @{} # 7 days
            LongTerm = @{}   # 30 days
        }
        $this.InitializePatterns()
    }
    
    [void] AddEvent([string]$eventType, [datetime]$timestamp) {
        # Initialize patterns if they don't exist
        if (-not $this.SeasonalPatterns.ContainsKey($eventType)) {
            $this.InitializePatternsForType($eventType)
        }
        
        # Add event to history
        if (-not $this.EventCounts.ContainsKey($eventType)) {
            $this.EventCounts[$eventType] = [System.Collections.ArrayList]@()
        }
        [void]$this.EventCounts[$eventType].Add(@{
            Timestamp = $timestamp
            Count = 1
        })
        
        # Trim old events
        $cutoff = (Get-Date).AddDays(-$this.MaxHistoryDays)
        $this.EventCounts[$eventType] = [System.Collections.ArrayList]@($this.EventCounts[$eventType] | Where-Object { $_.Timestamp -gt $cutoff })
        
        # Update seasonal patterns
        $this.SeasonalPatterns[$eventType].Hourly[$timestamp.Hour]++
        $this.SeasonalPatterns[$eventType].Daily[[int]$timestamp.DayOfWeek]++
    }
    
    [array] GetEventHistory([string]$eventType) {
        if (-not $this.EventCounts.ContainsKey($eventType)) {
            return @()
        }
        return $this.EventCounts[$eventType]
    }
    
    [hashtable] GetSeasonalPatterns([string]$eventType) {
        if (-not $this.SeasonalPatterns.ContainsKey($eventType)) {
            $this.InitializePatternsForType($eventType)
        }
        return $this.SeasonalPatterns[$eventType]
    }
    
    [hashtable] GetEventCounts([string]$eventType) {
        if (-not $this.SeasonalPatterns.ContainsKey($eventType)) {
            $this.InitializePatternsForType($eventType)
        }
        
        # Create a copy of the hourly patterns to avoid modifying the original
        $hourlyPatterns = @{}
        foreach ($hour in 0..23) {
            $hourlyPatterns[$hour] = if ($this.SeasonalPatterns[$eventType].Hourly.ContainsKey($hour)) {
                $this.SeasonalPatterns[$eventType].Hourly[$hour]
            } else {
                0
            }
        }
        
        return $hourlyPatterns
    }
    
    hidden [void] InitializePatterns() {
        @("Login", "API", "SSL") | ForEach-Object {
            $eventType = $_
            $this.InitializePatternsForType($eventType)
        }
    }
    
    hidden [void] InitializePatternsForType([string]$eventType) {
        if (-not $this.SeasonalPatterns.ContainsKey($eventType)) {
            $this.SeasonalPatterns[$eventType] = @{
                Hourly = @{}
                Daily = @{}
            }
            
            # Initialize hourly counts
            0..23 | ForEach-Object {
                $this.SeasonalPatterns[$eventType].Hourly[$_] = 0
            }
            
            # Initialize daily counts (0 = Sunday, 6 = Saturday)
            0..6 | ForEach-Object {
                $this.SeasonalPatterns[$eventType].Daily[$_] = 0
            }
        }
        
        if (-not $this.EventCounts.ContainsKey($eventType)) {
            $this.EventCounts[$eventType] = [System.Collections.ArrayList]@()
        }
    }
}

class PredictiveModel {
    hidden [TimeSeriesAnalyzer]$TimeSeriesAnalyzer
    hidden [hashtable]$EventProbabilities
    hidden [hashtable]$AttackChainProbabilities
    hidden [double]$LearningRate = 0.1
    hidden [int]$MinDataPoints = 10
    hidden [hashtable]$EventStats
    hidden [hashtable]$ExpectedCounts
    hidden [hashtable]$LastEvents
    
    PredictiveModel([TimeSeriesAnalyzer]$analyzer) {
        $this.TimeSeriesAnalyzer = $analyzer
        $this.EventProbabilities = @{}
        $this.AttackChainProbabilities = @{}
        $this.EventStats = @{}
        $this.ExpectedCounts = @{}
        $this.LastEvents = @{}
        
        # Initialize stats for known event types
        @("Login", "API", "SSL") | ForEach-Object {
            $eventType = $_
            $this.EventStats[$eventType] = @{}
            $this.ExpectedCounts[$eventType] = 0
            $this.LastEvents[$eventType] = $null
            
            # Initialize hourly stats
            0..23 | ForEach-Object {
                $hour = $_
                $this.EventStats[$eventType][$hour] = @{
                    Count = 0
                    LastUpdate = $null
                }
            }
        }
    }
    
    [void] AddEvent([string]$eventType, [datetime]$timestamp) {
        # Initialize event type specific collections if needed
        if (-not $this.EventStats.ContainsKey($eventType)) {
            $this.EventStats[$eventType] = @{}
            $this.ExpectedCounts[$eventType] = 0
            
            # Initialize hourly stats
            0..23 | ForEach-Object {
                $hour = $_
                $this.EventStats[$eventType][$hour] = @{
                    Count = 0
                    LastUpdate = $null
                }
            }
        }
        
        # Update hourly stats
        $hour = $timestamp.Hour
        $this.EventStats[$eventType][$hour].Count++
        $this.EventStats[$eventType][$hour].LastUpdate = $timestamp
        
        # Update last event timestamp
        $this.LastEvents[$eventType] = $timestamp
        
        # Update TimeSeriesAnalyzer
        $this.TimeSeriesAnalyzer.AddEvent($eventType, $timestamp)
        
        # Update expected count
        $this.UpdateExpectedCount($eventType)
    }
    
    [hashtable] PredictNextEvents([string]$eventType, [int]$horizon) {
        $predictions = @{
            ExpectedCount = 0
            Probability = 0.0
            TimeRanges = @()
            Severity = "Low"
            Confidence = 0.0
            TemporalPatterns = @{
                HourlyTrend = @{}
                DailyTrend = @{}
                WeeklyTrend = @{}
            }
        }
        
        # Get seasonal patterns
        $patterns = $this.TimeSeriesAnalyzer.GetSeasonalPatterns($eventType)
        
        # Calculate expected count based on historical patterns with exponential smoothing
        $now = Get-Date
        $predictedCounts = @()
        $alpha = 0.3  # Smoothing factor
        $totalProbability = 0.0
        $maxProbability = 0.0
        
        for ($i = 0; $i -lt $horizon; $i++) {
            $futureTime = $now.AddHours($i)
            
            # Calculate weighted temporal patterns
            $hourlyWeight = $this.GetPatternWeight($patterns.Hourly, $futureTime.Hour)
            $dailyWeight = $this.GetPatternWeight($patterns.Daily, [int]$futureTime.DayOfWeek)
            
            # Apply time-based weights (recent patterns have more influence)
            $timeWeight = [Math]::Exp(-$i / ($horizon * 0.5))
            
            # Calculate smoothed prediction
            $rawPrediction = ($hourlyWeight * 0.5 + $dailyWeight * 0.5)
            $smoothedPrediction = if ($predictedCounts.Count -gt 0) {
                $lastPrediction = $predictedCounts[-1]
                $alpha * $rawPrediction + (1 - $alpha) * $lastPrediction
            } else {
                $rawPrediction
            }
            
            $predictedCounts += $smoothedPrediction
            
            # Calculate probability for this hour
            $probability = $smoothedPrediction * $timeWeight
            $totalProbability += $probability
            $maxProbability = [Math]::Max($maxProbability, $probability)
            
            # Add high-risk time ranges
            if ($probability -gt 0.6) {
                $predictions.TimeRanges += @{
                    Start = $futureTime.Hour
                    End = $futureTime.AddHours(1).Hour
                    Risk = $probability
                }
            }
            
            # Update hourly trend
            $predictions.TemporalPatterns.HourlyTrend[$futureTime.Hour] = $probability
        }
        
        # Calculate overall metrics
        $predictions.ExpectedCount = ($predictedCounts | Measure-Object -Sum).Sum
        $predictions.Probability = $totalProbability / $horizon
        $predictions.Confidence = if ($this.EventStats[$eventType].Values.Count -gt $this.MinDataPoints) {
            [Math]::Min(1.0, $maxProbability + 0.3)
        } else {
            [Math]::Min(0.7, $maxProbability + 0.2)
        }
        
        # Set severity based on probability and expected count
        $predictions.Severity = switch ($predictions.Probability) {
            { $_ -gt 0.8 } { "Critical" }
            { $_ -gt 0.6 } { "High" }
            { $_ -gt 0.4 } { "Medium" }
            default { "Low" }
        }
        
        # Update daily and weekly trends
        $patterns.Daily.GetEnumerator() | ForEach-Object {
            $predictions.TemporalPatterns.DailyTrend[$_.Key] = $_.Value
        }
        
        return $predictions
    }
    
    [hashtable] PredictAttackChain([string]$initialEventType) {
        $chain = @{
            Sequence = @()
            Probabilities = @{}
            TimeEstimates = @{}
            TotalRisk = 0.0
            Confidence = 0.0
            BranchingPaths = @()
        }
        
        $currentType = $initialEventType
        $visited = [HashSet[string]]::new()
        $visited.Add($currentType)
        $pathConfidence = 1.0
        
        # Track branching paths
        $branchingPaths = [System.Collections.ArrayList]@()
        
        while ($true) {
            $nextEvents = $this.PredictNextEventsInChain($currentType, $visited)
            if ($nextEvents.Count -eq 0) { break }
            
            # Consider multiple possible paths
            foreach ($nextEvent in $nextEvents) {
                if ($nextEvent.Probability -lt 0.1) { continue }  # Skip unlikely paths
                
                $branchPath = @{
                    Sequence = @($currentType, $nextEvent.Type)
                    Probability = $nextEvent.Probability
                    TimeEstimate = $nextEvent.ExpectedTime
                    Risk = $nextEvent.Risk
                }
                [void]$branchingPaths.Add($branchPath)
            }
            
            # Take the most likely path for main sequence
            $nextEvent = $nextEvents[0]
            $chain.Sequence += $nextEvent.Type
            $chain.Probabilities[$nextEvent.Type] = $nextEvent.Probability
            $chain.TimeEstimates[$nextEvent.Type] = $nextEvent.ExpectedTime
            $chain.TotalRisk += $nextEvent.Risk
            
            $pathConfidence *= $nextEvent.Probability
            $visited.Add($nextEvent.Type)
            $currentType = $nextEvent.Type
            
            if ($chain.Sequence.Count -ge 5) { break }  # Limit chain length
        }
        
        # Store branching paths
        $chain.BranchingPaths = $branchingPaths
        
        # Calculate overall chain confidence
        $chain.Confidence = $this.CalculateChainConfidence($chain)
        
        return $chain
    }
    
    hidden [array] PredictNextEventsInChain([string]$currentType, [HashSet[string]]$visited) {
        if (-not $this.AttackChainProbabilities.ContainsKey($currentType)) {
            return @()
        }
        
        $transitions = $this.AttackChainProbabilities[$currentType]
        $nextEvents = [System.Collections.ArrayList]@()
        
        foreach ($type in $transitions.Keys) {
            if ($visited.Contains($type)) { continue }
            
            [void]$nextEvents.Add(@{
                Type = $type
                Probability = $transitions[$type].Probability
                ExpectedTime = $transitions[$type].TimeToNext
                Risk = $transitions[$type].Risk
            })
        }
        
        # Sort by probability descending
        return $nextEvents | Sort-Object -Property Probability -Descending
    }
    
    hidden [double] CalculateChainConfidence([hashtable]$chain) {
        if ($chain.Sequence.Count -eq 0) { return 0.0 }
        
        # Base confidence on:
        # 1. Path probability
        # 2. Historical occurrence
        # 3. Time window feasibility
        
        # Calculate path probability confidence
        $pathProb = 1.0
        foreach ($prob in $chain.Probabilities.Values) {
            $pathProb *= $prob
        }
        
        # Calculate historical confidence
        $historicalConfidence = 0.0
        $patterns = $this.TimeSeriesAnalyzer.GetSeasonalPatterns($chain.Sequence[0])
        if ($patterns.Hourly.Count -gt 0) {
            $historicalConfidence = 0.5  # Base confidence if we have some history
            
            # Check if sequence has occurred before
            $sequenceCount = 0
            foreach ($event in $this.TimeSeriesAnalyzer.GetEventHistory($chain.Sequence[0])) {
                if ($event.Timestamp -gt (Get-Date).AddDays(-7)) {
                    $sequenceCount++
                }
            }
            if ($sequenceCount -gt 0) {
                $historicalConfidence += 0.3
            }
        }
        
        # Calculate time window feasibility
        $timeWindowConfidence = 1.0
        $totalTime = 0
        foreach ($time in $chain.TimeEstimates.Values) {
            $totalTime += $time.TotalHours
        }
        if ($totalTime -gt 24) {  # Reduce confidence for long chains
            $timeWindowConfidence = 24 / $totalTime
        }
        
        # Combine confidences with weights
        return ($pathProb * 0.4 + $historicalConfidence * 0.4 + $timeWindowConfidence * 0.2)
    }
    
    hidden [double] GetPatternWeight([hashtable]$pattern, [int]$index) {
        if (-not $pattern.ContainsKey($index)) {
            return 0.0
        }
        
        $total = ($pattern.Values | Measure-Object -Sum).Sum
        if ($total -eq 0) {
            return 0.0
        }
        
        return $pattern[$index] / $total
    }
    
    hidden [double] CalculateProbability([string]$eventType, [double]$expectedCount) {
        if ($expectedCount -eq 0) { return 0.0 }
        
        # Get historical statistics
        $historicalAvg = $this.GetHistoricalAverage($eventType)
        if ($historicalAvg -eq 0) { return 0.5 }  # Default probability if no history
        
        # Calculate Z-score for anomaly detection
        $stats = $this.EventStats[$eventType]
        if ($stats -and $stats.Count -gt 0) {
            $values = $stats.Values | ForEach-Object { $_.Count }
            $mean = ($values | Measure-Object -Average).Average
            $stdDev = [Math]::Sqrt(($values | ForEach-Object { [Math]::Pow($_ - $mean, 2) } | Measure-Object -Average).Average)
            
            if ($stdDev -gt 0) {
                $zScore = [Math]::Abs(($expectedCount - $mean) / $stdDev)
                # Adjust probability based on Z-score
                $baseProb = $expectedCount / $historicalAvg
                $anomalyFactor = 1 + ($zScore / 10)  # Increase probability for anomalous predictions
                return [Math]::Min(1.0, $baseProb * $anomalyFactor)
            }
        }
        
        return [Math]::Min(1.0, $expectedCount / $historicalAvg)
    }
    
    hidden [array] IdentifyHighRiskPeriods([array]$predictedCounts, [int]$horizon) {
        # Calculate dynamic threshold using mean and standard deviation
        $mean = ($predictedCounts | Measure-Object -Average).Average
        $stdDev = [Math]::Sqrt(($predictedCounts | ForEach-Object { [Math]::Pow($_ - $mean, 2) } | Measure-Object -Average).Average)
        
        # Use dynamic threshold (mean + 1.5 standard deviations)
        $threshold = $mean + (1.5 * $stdDev)
        
        $periods = @()
        $start = -1
        $currentRisk = 0
        
        for ($i = 0; $i -lt $predictedCounts.Count; $i++) {
            if ($predictedCounts[$i] -gt $threshold) {
                if ($start -eq -1) { 
                    $start = $i 
                    $currentRisk = 0
                }
                # Accumulate risk score
                $currentRisk += ($predictedCounts[$i] - $threshold) / $threshold
            }
            elseif ($start -ne -1) {
                $periods += @{
                    Start = $start
                    End = $i - 1
                    Risk = $currentRisk / ($i - $start)  # Average risk over period
                    Confidence = $this.CalculateRiskConfidence($predictedCounts[$start..($i-1)], $threshold)
                }
                $start = -1
            }
        }
        
        if ($start -ne -1) {
            $periods += @{
                Start = $start
                End = $predictedCounts.Count - 1
                Risk = $currentRisk / ($predictedCounts.Count - $start)
                Confidence = $this.CalculateRiskConfidence(
                    $predictedCounts[$start..($predictedCounts.Count-1)], 
                    $threshold
                )
            }
        }
        
        # Sort periods by risk score
        return $periods | Sort-Object -Property Risk -Descending
    }
    
    hidden [double] CalculateRiskConfidence([array]$values, [double]$threshold) {
        if ($values.Count -eq 0) { return 0.0 }
        
        # Calculate what percentage of values are above threshold
        $aboveThreshold = ($values | Where-Object { $_ -gt $threshold }).Count
        $confidence = $aboveThreshold / $values.Count
        
        # Adjust confidence based on sample size
        $sampleSizeFactor = [Math]::Min(1.0, $values.Count / 24)  # Max confidence at 24 samples
        
        return $confidence * $sampleSizeFactor
    }
    
    hidden [string] EstimateSeverity([double]$expectedCount, [string]$eventType) {
        $historicalAvg = $this.GetHistoricalAverage($eventType)
        if ($historicalAvg -eq 0) { return "Low" }
        
        $ratio = $expectedCount / $historicalAvg
        if ($ratio -ge 2.0) { return "Critical" }
        if ($ratio -ge 1.5) { return "High" }
        if ($ratio -ge 1.0) { return "Medium" }
        return "Low"
    }
    
    hidden [double] CalculateConfidence([string]$eventType) {
        $stats = $this.EventStats[$eventType]
        if (-not $stats) { return 0.0 }
        
        $values = $stats.Values | ForEach-Object { $_.Count }
        if (-not $values -or $values.Count -eq 0) { return 0.0 }
        
        $mean = ($values | Measure-Object -Average).Average
        $stdDev = [Math]::Sqrt(($values | ForEach-Object { [Math]::Pow($_ - $mean, 2) } | Measure-Object -Average).Average)
        
        if ($stdDev -eq 0) { return 1.0 }
        
        $expectedCount = if ($this.ExpectedCounts.ContainsKey($eventType)) {
            [double]$this.ExpectedCounts[$eventType]
        } else {
            $mean
        }
        
        $zScore = [Math]::Abs(($expectedCount - $mean) / $stdDev)
        return 1.0 / (1.0 + $zScore)
    }
    
    hidden [double] GetHistoricalAverage([string]$eventType) {
        $patterns = $this.TimeSeriesAnalyzer.GetSeasonalPatterns($eventType)
        $hourlyAvg = ($patterns.Hourly.Values | Measure-Object -Average).Average
        $dailyAvg = ($patterns.Daily.Values | Measure-Object -Average).Average
        
        return ($hourlyAvg + $dailyAvg) / 2
    }
    
    hidden [void] UpdateExpectedCount([string]$eventType) {
        $patterns = $this.TimeSeriesAnalyzer.GetSeasonalPatterns($eventType)
        $hourlyAvg = ($patterns.Hourly.Values | Measure-Object -Average).Average
        $dailyAvg = ($patterns.Daily.Values | Measure-Object -Average).Average
        
        $this.ExpectedCounts[$eventType] = ($hourlyAvg + $dailyAvg) / 2
    }
}

class RiskForecaster {
    hidden [PredictiveModel]$PredictiveModel
    hidden [hashtable]$RiskFactors
    hidden [hashtable]$ResourceWeights
    hidden [double]$RiskThreshold = 0.7
    
    RiskForecaster([PredictiveModel]$model) {
        $this.PredictiveModel = $model
        $this.InitializeRiskFactors()
        $this.InitializeResourceWeights()
    }
    
    [hashtable] ForecastRisk([string]$eventType, [int]$horizon) {
        $predictions = $this.PredictiveModel.PredictNextEvents($eventType, $horizon)
        $attackChain = $this.PredictiveModel.PredictAttackChain($eventType)
        
        $risk = @{
            ImmediateRisk = $this.CalculateImmediateRisk($predictions)
            ChainRisk = $this.CalculateChainRisk($attackChain)
            VulnerableResources = $this.IdentifyVulnerableResources($attackChain)
            RecommendedActions = @()
            TimeToAction = $this.CalculateTimeToAction($predictions)
        }
        
        $risk.RecommendedActions = $this.GenerateRecommendations($risk)
        
        return $risk
    }
    
    hidden [void] InitializeRiskFactors() {
        $this.RiskFactors = @{
            Frequency = 0.3
            Severity = 0.3
            ChainProbability = 0.2
            ResourceImpact = 0.2
        }
    }
    
    hidden [void] InitializeResourceWeights() {
        $this.ResourceWeights = @{
            Database = 1.0
            API = 0.8
            Authentication = 0.9
            FileSystem = 0.7
            Network = 0.6
        }
    }
    
    hidden [double] CalculateImmediateRisk([hashtable]$predictions) {
        $severityWeight = switch ($predictions.Severity) {
            "Critical" { 1.0 }
            "High" { 0.8 }
            "Medium" { 0.5 }
            "Low" { 0.2 }
            default { 0.1 }
        }
        
        return [Math]::Min(1.0, 
            ($predictions.Probability * $this.RiskFactors.Frequency) +
            ($severityWeight * $this.RiskFactors.Severity))
    }
    
    hidden [double] CalculateChainRisk([hashtable]$attackChain) {
        if ($attackChain.Sequence.Count -eq 0) { return 0.0 }
        
        $chainProb = 1.0
        foreach ($prob in $attackChain.Probabilities.Values) {
            $chainProb *= $prob
        }
        
        return $chainProb * $this.RiskFactors.ChainProbability
    }
    
    hidden [array] IdentifyVulnerableResources([hashtable]$attackChain) {
        $vulnerable = @()
        
        foreach ($eventType in $attackChain.Sequence) {
            $resources = switch -Wildcard ($eventType) {
                "*Database*" { "Database" }
                "*API*" { "API" }
                "*Login*" { "Authentication" }
                "*File*" { "FileSystem" }
                "*Network*" { "Network" }
                default { $null }
            }
            
            if ($resources -and $this.ResourceWeights.ContainsKey($resources)) {
                $vulnerable += @{
                    Resource = $resources
                    Risk = $attackChain.Probabilities[$eventType] * $this.ResourceWeights[$resources]
                }
            }
        }
        
        return $vulnerable | Sort-Object -Property Risk -Descending
    }
    
    hidden [TimeSpan] CalculateTimeToAction([hashtable]$predictions) {
        if ($predictions.TimeRanges.Count -eq 0) {
            return [TimeSpan]::FromHours(24)  # Default window
        }
        
        $firstRisk = $predictions.TimeRanges[0]
        $timeToRisk = [TimeSpan]::FromHours($firstRisk.Start)
        
        # Adjust based on severity
        $urgencyFactor = switch ($predictions.Severity) {
            "Critical" { 0.25 }  # Reduce time by 75%
            "High" { 0.5 }      # Reduce time by 50%
            "Medium" { 0.75 }   # Reduce time by 25%
            default { 1.0 }
        }
        
        return [TimeSpan]::FromTicks([Math]::Max(
            [TimeSpan]::FromHours(1).Ticks,
            $timeToRisk.Ticks * $urgencyFactor
        ))
    }
    
    hidden [array] GenerateRecommendations([hashtable]$risk) {
        $recommendations = @()
        
        # Immediate actions based on risk level
        if ($risk.ImmediateRisk -gt $this.RiskThreshold) {
            $recommendations += "Implement immediate defensive measures"
            $recommendations += "Increase monitoring frequency"
        }
        
        # Resource-specific recommendations
        foreach ($resource in $risk.VulnerableResources) {
            if ($resource.Risk -gt $this.RiskThreshold) {
                $recommendations += "Enhance security controls for $($resource.Resource)"
                $recommendations += "Review access patterns for $($resource.Resource)"
            }
        }
        
        # Chain-based recommendations
        if ($risk.ChainRisk -gt $this.RiskThreshold) {
            $recommendations += "Implement additional security layers"
            $recommendations += "Review security policies for connected systems"
        }
        
        return $recommendations
    }
}

class AIThreatAnalyzer {
    hidden [hashtable]$ThreatPatterns
    hidden [hashtable]$RiskThresholds
    hidden [hashtable]$ConfidenceScores
    
    AIThreatAnalyzer() {
        $this.ThreatPatterns = @{}
        $this.RiskThresholds = @{
            Low = 0.3
            Medium = 0.5
            High = 0.7
            Critical = 0.9
        }
        $this.ConfidenceScores = @{}
        
        # Initialize patterns for known event types
        @("Login", "API", "SSL") | ForEach-Object {
            $eventType = $_
            $this.ThreatPatterns[$eventType] = @{
                LastUpdate = Get-Date
                Patterns = @()
                Confidence = 0.0
            }
        }
    }
    
    [hashtable] PredictThreat([string]$eventType, [datetime]$timestamp, [double]$riskScore) {
        # Initialize event type if not exists
        if (-not $this.ThreatPatterns.ContainsKey($eventType)) {
            $this.ThreatPatterns[$eventType] = @{
                LastUpdate = $timestamp
                Patterns = @()
                Confidence = 0.0
            }
        }
        
        # Update patterns
        $pattern = @{
            Timestamp = $timestamp
            RiskScore = $riskScore
            HourOfDay = $timestamp.Hour
            DayOfWeek = [int]$timestamp.DayOfWeek
        }
        $this.ThreatPatterns[$eventType].Patterns += $pattern
        
        # Keep only last 100 patterns
        if ($this.ThreatPatterns[$eventType].Patterns.Count -gt 100) {
            $this.ThreatPatterns[$eventType].Patterns = $this.ThreatPatterns[$eventType].Patterns[-100..-1]
        }
        
        # Calculate prediction
        $prediction = @{
            IsAnomaly = $false
            Confidence = 0.0
            ThreatLevel = "Low"
            Insights = @()
        }
        
        # Calculate average risk score
        $patterns = $this.ThreatPatterns[$eventType].Patterns
        $avgRiskScore = if ($patterns.Count -gt 0) {
            ($patterns | Measure-Object -Property RiskScore -Average).Average
        } else {
            0.0
        }
        
        # Calculate standard deviation
        $stdDev = if ($patterns.Count -gt 1) {
            $sumSquares = ($patterns | ForEach-Object { [Math]::Pow($_.RiskScore - $avgRiskScore, 2) } | Measure-Object -Sum).Sum
            [Math]::Sqrt($sumSquares / ($patterns.Count - 1))
        } else {
            0.0
        }
        
        # Check if current risk score is anomalous (more than 2 standard deviations from mean)
        $zScore = 0.0
        if ($stdDev -gt 0) {
            $zScore = [Math]::Abs(($riskScore - $avgRiskScore) / $stdDev)
            $prediction.IsAnomaly = $zScore -gt 2
        }
        
        # Calculate confidence based on pattern count
        $prediction.Confidence = [Math]::Min(1.0, $patterns.Count / 20.0)  # Max confidence at 20 patterns
        
        # Set threat level based on risk score and anomaly status
        $prediction.ThreatLevel = if ($prediction.IsAnomaly) {
            if ($riskScore -gt $avgRiskScore) { "Critical" } else { "High" }
        } else {
            switch ($riskScore) {
                { $_ -gt $this.RiskThresholds.Critical } { "Critical" }
                { $_ -gt $this.RiskThresholds.High } { "High" }
                { $_ -gt $this.RiskThresholds.Medium } { "Medium" }
                default { "Low" }
            }
        }
        
        # Generate insights
        $prediction.Insights = @()
        
        # Add basic risk assessment
        $prediction.Insights += "Current risk score: $([Math]::Round($riskScore, 2))"
        $prediction.Insights += "Average risk score: $([Math]::Round($avgRiskScore, 2))"
        
        # Add temporal patterns
        $hourlyPatterns = $patterns | Group-Object -Property HourOfDay
        $riskiestHour = $hourlyPatterns | Sort-Object { ($_.Group | Measure-Object -Property RiskScore -Average).Average } -Descending | Select-Object -First 1
        if ($riskiestHour) {
            $avgHourlyRisk = ($riskiestHour.Group | Measure-Object -Property RiskScore -Average).Average
            $prediction.Insights += "Highest risk hour: $($riskiestHour.Name):00 (Avg Risk: $([Math]::Round($avgHourlyRisk, 2)))"
        }
        
        # Add anomaly insights
        if ($prediction.IsAnomaly) {
            $prediction.Insights += "ANOMALY DETECTED: Risk score deviates significantly from historical patterns"
            $prediction.Insights += "Z-Score: $([Math]::Round($zScore, 2))"
        }
        
        # Update confidence scores
        $this.ConfidenceScores[$eventType] = $prediction.Confidence
        
        return $prediction
    }
}

# Create functions to return new instances of the classes
function New-TimeSeriesAnalyzer {
    return [TimeSeriesAnalyzer]::new()
}

function New-PredictiveModel {
    param([TimeSeriesAnalyzer]$analyzer)
    return [PredictiveModel]::new($analyzer)
}

function New-RiskForecaster {
    param([PredictiveModel]$model)
    return [RiskForecaster]::new($model)
}

function New-AIThreatAnalyzer {
    return [AIThreatAnalyzer]::new()
}

# Export only the functions
Export-ModuleMember -Function New-TimeSeriesAnalyzer, New-PredictiveModel, New-RiskForecaster, New-AIThreatAnalyzer 
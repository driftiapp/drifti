using namespace System.Collections.Generic

class FeatureVector {
    [double[]]$Values
    [hashtable]$Metadata
    
    FeatureVector([double[]]$values, [hashtable]$metadata) {
        $this.Values = $values
        $this.Metadata = $metadata
    }
    
    [double] DistanceTo([FeatureVector]$other) {
        if ($this.Values.Length -ne $other.Values.Length) {
            throw "Feature vectors must have same dimension"
        }
        
        $sumSquared = 0.0
        for ($i = 0; $i -lt $this.Values.Length; $i++) {
            $diff = $this.Values[$i] - $other.Values[$i]
            $sumSquared += $diff * $diff
        }
        
        return [Math]::Sqrt($sumSquared)
    }
}

class Cluster {
    [FeatureVector]$Centroid
    [List[FeatureVector]]$Points
    [double]$AverageDistance
    [double]$MaxDistance
    [bool]$IsAnomaly
    
    Cluster([FeatureVector]$centroid) {
        $this.Centroid = $centroid
        $this.Points = [List[FeatureVector]]::new()
        $this.AverageDistance = 0.0
        $this.MaxDistance = 0.0
        $this.IsAnomaly = $false
    }
    
    [void] AddPoint([FeatureVector]$point) {
        $this.Points.Add($point)
        $this.UpdateStatistics()
    }
    
    [void] UpdateCentroid() {
        if ($this.Points.Count -eq 0) { return }
        
        $dimension = $this.Centroid.Values.Length
        $newValues = [double[]]::new($dimension)
        
        for ($i = 0; $i -lt $dimension; $i++) {
            $sum = 0.0
            foreach ($point in $this.Points) {
                $sum += $point.Values[$i]
            }
            $newValues[$i] = $sum / $this.Points.Count
        }
        
        $this.Centroid = [FeatureVector]::new($newValues, @{})
        $this.UpdateStatistics()
    }
    
    hidden [void] UpdateStatistics() {
        if ($this.Points.Count -eq 0) {
            $this.AverageDistance = 0.0
            $this.MaxDistance = 0.0
            return
        }
        
        $totalDistance = 0.0
        $maxDist = 0.0
        
        foreach ($point in $this.Points) {
            $distance = $this.Centroid.DistanceTo($point)
            $totalDistance += $distance
            if ($distance -gt $maxDist) {
                $maxDist = $distance
            }
        }
        
        $this.AverageDistance = $totalDistance / $this.Points.Count
        $this.MaxDistance = $maxDist
    }
}

class DBSCANClusterer {
    [double]$Epsilon
    [int]$MinPoints
    [List[FeatureVector]]$Points
    [List[Cluster]]$Clusters
    [List[FeatureVector]]$NoisePoints
    
    DBSCANClusterer([double]$epsilon, [int]$minPoints) {
        $this.Epsilon = $epsilon
        $this.MinPoints = $minPoints
        $this.Points = [List[FeatureVector]]::new()
        $this.Clusters = [List[Cluster]]::new()
        $this.NoisePoints = [List[FeatureVector]]::new()
    }
    
    [void] AddPoint([FeatureVector]$point) {
        $this.Points.Add($point)
    }
    
    [void] Cluster() {
        $visited = [HashSet[FeatureVector]]::new()
        $clustered = [HashSet[FeatureVector]]::new()
        
        foreach ($point in $this.Points) {
            if ($visited.Contains($point)) { continue }
            $visited.Add($point)
            
            $neighbors = $this.GetNeighbors($point)
            
            if ($neighbors.Count -lt $this.MinPoints) {
                $this.NoisePoints.Add($point)
                continue
            }
            
            $cluster = [Cluster]::new($point)
            $this.ExpandCluster($point, $neighbors, $cluster, $visited, $clustered)
            $this.Clusters.Add($cluster)
        }
        
        # Mark small clusters and isolated points as anomalies
        foreach ($cluster in $this.Clusters) {
            if ($cluster.Points.Count -lt $this.MinPoints) {
                $cluster.IsAnomaly = $true
            }
        }
    }
    
    hidden [List[FeatureVector]] GetNeighbors([FeatureVector]$point) {
        $neighbors = [List[FeatureVector]]::new()
        
        foreach ($other in $this.Points) {
            if ($point -eq $other) { continue }
            
            if ($point.DistanceTo($other) -le $this.Epsilon) {
                $neighbors.Add($other)
            }
        }
        
        return $neighbors
    }
    
    hidden [void] ExpandCluster([FeatureVector]$point, [List[FeatureVector]]$neighbors, [Cluster]$cluster, [HashSet[FeatureVector]]$visited, [HashSet[FeatureVector]]$clustered) {
        $cluster.AddPoint($point)
        $clustered.Add($point)
        
        $queue = [Queue[FeatureVector]]::new($neighbors)
        
        while ($queue.Count -gt 0) {
            $current = $queue.Dequeue()
            
            if (-not $visited.Contains($current)) {
                $visited.Add($current)
                $currentNeighbors = $this.GetNeighbors($current)
                
                if ($currentNeighbors.Count -ge $this.MinPoints) {
                    foreach ($neighbor in $currentNeighbors) {
                        if (-not $queue.Contains($neighbor)) {
                            $queue.Enqueue($neighbor)
                        }
                    }
                }
            }
            
            if (-not $clustered.Contains($current)) {
                $cluster.AddPoint($current)
                $clustered.Add($current)
            }
        }
    }
}

class AIThreatAnalyzer {
    hidden [DBSCANClusterer]$Clusterer
    hidden [double]$AnomalyThreshold = 3.0  # Increased from 2.0 to reduce false positives
    hidden [hashtable]$FeatureStats
    hidden [List[FeatureVector]]$RecentVectors
    hidden [int]$MaxVectorHistory = 1000
    hidden [hashtable]$EventTypeThresholds
    hidden [hashtable]$FeatureNames
    hidden [hashtable]$EventHistory
    hidden [hashtable]$AnomalyThresholds
    
    AIThreatAnalyzer() {
        $this.Clusterer = [DBSCANClusterer]::new(0.4, 3)  # Increased epsilon from 0.3 to 0.4 for more lenient clustering
        $this.RecentVectors = [List[FeatureVector]]::new()
        $this.FeatureStats = @{
            Mean = @{}
            StdDev = @{}
            Min = @{}
            Max = @{}
        }
        
        # Event-specific thresholds
        $this.EventTypeThresholds = @{
            Login = @{
                FailedAttempts = 5
                TimeWindow = 300  # 5 minutes
                AttemptsPerMinute = 1.0
            }
            API = @{
                ErrorCount = 50
                TimeWindow = 300  # 5 minutes
                ErrorRate = 0.2  # 20% error rate
            }
            SSL = @{
                DaysRemaining = 7  # 1 week
            }
        }
        
        # Define standard feature names for each event type
        $this.FeatureNames = @{
            Login = @("TimeOfDay", "FailedAttempts", "TimeWindow", "AttemptsPerMinute")
            API = @("TimeOfDay", "ErrorCount", "TimeWindow", "ErrorRate")
            SSL = @("TimeOfDay", "DaysRemaining", "CertificateRisk")
        }
        
        $this.EventHistory = @{}
        $this.AnomalyThresholds = @{
            Login = 0.8
            API = 0.75
            SSL = 0.85
        }
    }
    
    [hashtable] AnalyzeSecurityEvent([hashtable]$event) {
        $analysis = @{
            IsAnomaly = $false
            Confidence = 0.0
            Insights = [List[string]]::new()
            RiskScore = 0.0
        }
        
        # Calculate baseline metrics
        $baseline = $this.GetEventBaseline($event.Type)
        $anomalyScore = $this.CalculateAnomalyScore($event, $baseline)
        
        # Determine if this is an anomaly
        $threshold = $this.AnomalyThresholds[$event.Type]
        $analysis.IsAnomaly = $anomalyScore -gt $threshold
        
        # Calculate confidence based on sample size
        $sampleSize = $this.GetSampleSize($event.Type)
        $analysis.Confidence = [Math]::Min(1.0, $sampleSize / 100.0)
        
        # Generate insights
        if ($analysis.IsAnomaly) {
            $analysis.Insights.Add("Anomalous behavior detected (Score: $([Math]::Round($anomalyScore, 2)))")
            $analysis.Insights.Add("Confidence: $([Math]::Round($analysis.Confidence * 100, 1))%")
            
            # Add specific insights based on event type
            switch ($event.Type) {
                "Login" {
                    if ($event.FailedAttempts -gt $baseline.AvgFailedAttempts * 2) {
                        $analysis.Insights.Add("Unusually high number of failed login attempts")
                    }
                }
                "API" {
                    if ($event.ErrorCount -gt $baseline.AvgErrorCount * 2) {
                        $analysis.Insights.Add("Significant increase in API errors")
                    }
                }
                "SSL" {
                    if ($event.DaysRemaining -lt 7) {
                        $analysis.Insights.Add("Critical: SSL certificate expiring soon")
                    }
                }
            }
        }
        
        # Calculate risk score
        $analysis.RiskScore = $this.CalculateRiskScore($event, $anomalyScore)
        
        # Update event history
        $this.UpdateEventHistory($event)
        
        return $analysis
    }
    
    [hashtable] GetAnomalyScores([array]$events) {
        $scores = @{}
        
        foreach ($event in $events) {
            $baseline = $this.GetEventBaseline($event.Type)
            $anomalyScore = $this.CalculateAnomalyScore($event, $baseline)
            $scores[$event.Timestamp] = $anomalyScore
        }
        
        return $scores
    }
    
    hidden [double] CalculateAnomalyScore([hashtable]$event, [hashtable]$baseline) {
        $score = 0.0
        
        switch ($event.Type) {
            "Login" {
                if ($baseline.AvgFailedAttempts -gt 0) {
                    $score = $event.FailedAttempts / $baseline.AvgFailedAttempts
                }
            }
            "API" {
                if ($baseline.AvgErrorCount -gt 0) {
                    $score = $event.ErrorCount / $baseline.AvgErrorCount
                }
            }
            "SSL" {
                $score = [Math]::Max(0, (30 - $event.DaysRemaining) / 30)
            }
        }
        
        return $score
    }
    
    hidden [double] CalculateRiskScore([hashtable]$event, [double]$anomalyScore) {
        $baseRisk = $event.Severity / 100.0
        $weightedAnomaly = $anomalyScore * 0.7
        $weightedSeverity = $baseRisk * 0.3
        
        return [Math]::Min(1.0, $weightedAnomaly + $weightedSeverity)
    }
    
    hidden [void] UpdateEventHistory([hashtable]$event) {
        if (-not $this.EventHistory.ContainsKey($event.Type)) {
            $this.EventHistory[$event.Type] = [List[hashtable]]::new()
        }
        
        $this.EventHistory[$event.Type].Add(@{
            Timestamp = $event.Timestamp
            Severity = $event.Severity
            IsActualThreat = $event.IsActualThreat
        })
        
        # Keep only last 1000 events per type
        if ($this.EventHistory[$event.Type].Count -gt 1000) {
            $this.EventHistory[$event.Type].RemoveAt(0)
        }
    }
    
    hidden [hashtable] GetEventBaseline([string]$eventType) {
        $baseline = @{
            AvgSeverity = 0.0
            AvgFailedAttempts = 0.0
            AvgErrorCount = 0.0
            ThreatProbability = 0.0
        }
        
        if (-not $this.EventHistory.ContainsKey($eventType)) {
            return $baseline
        }
        
        $events = $this.EventHistory[$eventType]
        if ($events.Count -eq 0) {
            return $baseline
        }
        
        $baseline.AvgSeverity = ($events | Measure-Object -Property Severity -Average).Average
        $baseline.ThreatProbability = ($events | Where-Object { $_.IsActualThreat } | Measure-Object).Count / $events.Count
        
        return $baseline
    }
    
    hidden [int] GetSampleSize([string]$eventType) {
        if (-not $this.EventHistory.ContainsKey($eventType)) {
            return 0
        }
        return $this.EventHistory[$eventType].Count
    }
}

# Export the module
Export-ModuleMember -Function * -Variable * -Alias * 
Export-ModuleMember -Function * -Variable * -Alias * 
using module "./PredictiveAnalysis.psm1"

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
        if (-not $this.ThreatPatterns.ContainsKey($eventType)) {
            $this.ThreatPatterns[$eventType] = @{
                LastUpdate = $timestamp
                Patterns = @()
                Confidence = 0.0
            }
        }
        
        # Update threat patterns
        $pattern = @{
            Timestamp = $timestamp
            RiskScore = $riskScore
            Hour = $timestamp.Hour
            DayOfWeek = [int]$timestamp.DayOfWeek
        }
        $this.ThreatPatterns[$eventType].Patterns += $pattern
        
        # Trim old patterns (keep last 7 days)
        $cutoff = $timestamp.AddDays(-7)
        $this.ThreatPatterns[$eventType].Patterns = @(
            $this.ThreatPatterns[$eventType].Patterns | Where-Object { $_.Timestamp -gt $cutoff }
        )
        
        # Calculate threat prediction
        $prediction = @{
            IsThreatPredicted = $false
            Confidence = 0.0
            RiskLevel = "Low"
            TimeWindow = $null
        }
        
        # Check if risk score exceeds thresholds
        if ($riskScore -ge $this.RiskThresholds.Critical) {
            $prediction.IsThreatPredicted = $true
            $prediction.RiskLevel = "Critical"
            $prediction.Confidence = 0.9
        }
        elseif ($riskScore -ge $this.RiskThresholds.High) {
            $prediction.IsThreatPredicted = $true
            $prediction.RiskLevel = "High"
            $prediction.Confidence = 0.7
        }
        elseif ($riskScore -ge $this.RiskThresholds.Medium) {
            $prediction.IsThreatPredicted = $true
            $prediction.RiskLevel = "Medium"
            $prediction.Confidence = 0.5
        }
        
        # Adjust confidence based on historical patterns
        $patterns = $this.ThreatPatterns[$eventType].Patterns
        $similarPatterns = $patterns | Where-Object {
            $_.Hour -eq $pattern.Hour -and
            $_.DayOfWeek -eq $pattern.DayOfWeek -and
            [Math]::Abs($_.RiskScore - $riskScore) -lt 0.2
        }
        
        if ($similarPatterns.Count -gt 0) {
            $historicalConfidence = $similarPatterns.Count / $patterns.Count
            $prediction.Confidence = ($prediction.Confidence + $historicalConfidence) / 2
        }
        
        # Calculate time window for potential threats
        if ($prediction.IsThreatPredicted) {
            $prediction.TimeWindow = @{
                Start = $timestamp
                End = $timestamp.AddHours(4)  # Look ahead 4 hours
                Probability = $prediction.Confidence
            }
        }
        
        return $prediction
    }
}

# Create a function to return a new instance of the class
function New-AIThreatAnalyzer {
    return [AIThreatAnalyzer]::new()
}

Export-ModuleMember -Function New-AIThreatAnalyzer 
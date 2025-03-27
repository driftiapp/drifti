using namespace System.Collections.Generic

class MockAlertSystem {
    hidden [List[hashtable]]$Alerts
    hidden [hashtable]$Stats
    
    MockAlertSystem() {
        $this.Alerts = [List[hashtable]]::new()
        $this.Stats = @{
            TotalAlerts = 0
            FalsePositives = 0
            TruePositives = 0
            LastUpdate = Get-Date
        }
    }
    
    [void] ProcessEvent([hashtable]$event) {
        $alert = @{
            Type = $event.Type
            Timestamp = $event.Timestamp
            Severity = $event.Severity
            IsActualThreat = $event.IsActualThreat
            Context = $event.Context
        }
        
        $this.Alerts.Add($alert)
        $this.Stats.TotalAlerts++
        
        if ($event.IsActualThreat) {
            $this.Stats.TruePositives++
        } else {
            $this.Stats.FalsePositives++
        }
    }
    
    [hashtable] GetAlertStats() {
        return $this.Stats.Clone()
    }
    
    [array] GetRecentAlerts([int]$count = 10) {
        return $this.Alerts | Sort-Object Timestamp -Descending | Select-Object -First $count
    }
    
    [void] ClearOldAlerts([int]$daysToKeep = 30) {
        $cutoffDate = (Get-Date).AddDays(-$daysToKeep)
        $this.Alerts = [List[hashtable]]($this.Alerts | Where-Object { $_.Timestamp -gt $cutoffDate })
    }
}

# Export the module
Export-ModuleMember -Function * -Variable * -Alias * 
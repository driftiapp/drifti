using namespace System.Collections.Generic
using namespace System.Collections.Concurrent
using namespace System.Threading

# Configuration for monitoring thresholds
$MonitorConfig = @{
    ResponseTime = @{
        Warning = @{
            Critical = 15  # minutes
            High = 30
            Medium = 60
            Low = 120
        }
        Critical = @{
            Critical = 30  # minutes
            High = 60
            Medium = 120
            Low = 240
        }
        CheckInterval = 5  # minutes
    }
    ApprovalRate = @{
        Warning = 0.80  # 80%
        Critical = 0.60  # 60%
        Window = 24  # hours
        CheckInterval = 30  # minutes
    }
    EscalationRate = @{
        Warning = 0.30  # 30%
        Critical = 0.50  # 50%
        Window = 24  # hours
        CheckInterval = 30  # minutes
    }
    PendingRequests = @{
        Warning = @{
            Critical = 3
            High = 5
            Medium = 10
            Low = 20
        }
        Critical = @{
            Critical = 5
            High = 10
            Medium = 20
            Low = 40
        }
        CheckInterval = 5  # minutes
    }
}

function New-SecurityMonitor {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$DataPath,
        
        [Parameter(Mandatory=$false)]
        [PSObject]$Reporter
    )
    
    $monitor = [PSCustomObject]@{
        DataPath = $DataPath
        Reporter = $Reporter
        Config = $MonitorConfig
        State = @{
            IsRunning = $false
            Jobs = [ConcurrentDictionary[string,object]]::new()
            ActiveAlerts = [ConcurrentBag[object]]::new()
            AlertHistory = [ConcurrentBag[object]]::new()
        }
    }
    
    # Method to start monitoring
    $monitor | Add-Member -MemberType ScriptMethod -Name StartMonitoring -Value {
        if ($this.State.IsRunning) {
            Write-Warning "Monitoring is already running"
            return
        }
        
        $this.State.IsRunning = $true
        Write-Host "Starting security monitoring..."
        
        # Start response time monitoring job
        $job = Start-Job -ScriptBlock {
            param($config, $dataPath)
            while ($true) {
                try {
                    # Check response times for pending approvals
                    $pendingApprovals = Get-PendingApprovals -DataPath $dataPath
                    foreach ($approval in $pendingApprovals) {
                        $waitTime = (Get-Date) - $approval.RequestTime
                        $threshold = $config.ResponseTime
                        
                        if ($waitTime.TotalMinutes -gt $threshold.Critical[$approval.RiskLevel]) {
                            New-MonitorAlert -Type "ResponseTime" -Severity "Critical" `
                                -Message "Response time exceeded critical threshold for $($approval.RiskLevel) risk approval" `
                                -Data $approval
                        }
                        elseif ($waitTime.TotalMinutes -gt $threshold.Warning[$approval.RiskLevel]) {
                            New-MonitorAlert -Type "ResponseTime" -Severity "Warning" `
                                -Message "Response time exceeded warning threshold for $($approval.RiskLevel) risk approval" `
                                -Data $approval
                        }
                    }
                }
                catch {
                    Write-Error "Error in response time monitoring: $_"
                }
                Start-Sleep -Seconds ($config.ResponseTime.CheckInterval * 60)
            }
        } -ArgumentList $this.Config, $this.DataPath
        $this.State.Jobs.TryAdd("ResponseTime", $job)
        
        # Start approval rate monitoring job
        $job = Start-Job -ScriptBlock {
            param($config, $dataPath)
            while ($true) {
                try {
                    # Calculate approval rate for the configured window
                    $approvals = Get-ApprovalHistory -DataPath $dataPath -Hours $config.ApprovalRate.Window
                    $rate = ($approvals | Where-Object { $_.Status -eq 'Approved' }).Count / $approvals.Count
                    
                    if ($rate -lt $config.ApprovalRate.Critical) {
                        New-MonitorAlert -Type "ApprovalRate" -Severity "Critical" `
                            -Message "Approval rate below critical threshold: $([Math]::Round($rate * 100))%" `
                            -Data @{ Rate = $rate; Window = $config.ApprovalRate.Window }
                    }
                    elseif ($rate -lt $config.ApprovalRate.Warning) {
                        New-MonitorAlert -Type "ApprovalRate" -Severity "Warning" `
                            -Message "Approval rate below warning threshold: $([Math]::Round($rate * 100))%" `
                            -Data @{ Rate = $rate; Window = $config.ApprovalRate.Window }
                    }
                }
                catch {
                    Write-Error "Error in approval rate monitoring: $_"
                }
                Start-Sleep -Seconds ($config.ApprovalRate.CheckInterval * 60)
            }
        } -ArgumentList $this.Config, $this.DataPath
        $this.State.Jobs.TryAdd("ApprovalRate", $job)
        
        # Start escalation rate monitoring job
        $job = Start-Job -ScriptBlock {
            param($config, $dataPath)
            while ($true) {
                try {
                    # Calculate escalation rate for the configured window
                    $approvals = Get-ApprovalHistory -DataPath $dataPath -Hours $config.EscalationRate.Window
                    $rate = ($approvals | Where-Object { $_.IsEscalated }).Count / $approvals.Count
                    
                    if ($rate -gt $config.EscalationRate.Critical) {
                        New-MonitorAlert -Type "EscalationRate" -Severity "Critical" `
                            -Message "Escalation rate above critical threshold: $([Math]::Round($rate * 100))%" `
                            -Data @{ Rate = $rate; Window = $config.EscalationRate.Window }
                    }
                    elseif ($rate -gt $config.EscalationRate.Warning) {
                        New-MonitorAlert -Type "EscalationRate" -Severity "Warning" `
                            -Message "Escalation rate above warning threshold: $([Math]::Round($rate * 100))%" `
                            -Data @{ Rate = $rate; Window = $config.EscalationRate.Window }
                    }
                }
                catch {
                    Write-Error "Error in escalation rate monitoring: $_"
                }
                Start-Sleep -Seconds ($config.EscalationRate.CheckInterval * 60)
            }
        } -ArgumentList $this.Config, $this.DataPath
        $this.State.Jobs.TryAdd("EscalationRate", $job)
        
        # Start pending requests monitoring job
        $job = Start-Job -ScriptBlock {
            param($config, $dataPath)
            while ($true) {
                try {
                    # Check pending requests by risk level
                    $pendingByRisk = Get-PendingApprovalsByRiskLevel -DataPath $dataPath
                    foreach ($risk in $pendingByRisk.Keys) {
                        $count = $pendingByRisk[$risk]
                        $threshold = $config.PendingRequests
                        
                        if ($count -gt $threshold.Critical[$risk]) {
                            New-MonitorAlert -Type "PendingRequests" -Severity "Critical" `
                                -Message "Pending $risk risk approvals above critical threshold: $count" `
                                -Data @{ RiskLevel = $risk; Count = $count }
                        }
                        elseif ($count -gt $threshold.Warning[$risk]) {
                            New-MonitorAlert -Type "PendingRequests" -Severity "Warning" `
                                -Message "Pending $risk risk approvals above warning threshold: $count" `
                                -Data @{ RiskLevel = $risk; Count = $count }
                        }
                    }
                }
                catch {
                    Write-Error "Error in pending requests monitoring: $_"
                }
                Start-Sleep -Seconds ($config.PendingRequests.CheckInterval * 60)
            }
        } -ArgumentList $this.Config, $this.DataPath
        $this.State.Jobs.TryAdd("PendingRequests", $job)
    }
    
    # Method to stop monitoring
    $monitor | Add-Member -MemberType ScriptMethod -Name StopMonitoring -Value {
        if (-not $this.State.IsRunning) {
            Write-Warning "Monitoring is not running"
            return
        }
        
        Write-Host "Stopping security monitoring..."
        foreach ($job in $this.State.Jobs.Values) {
            Stop-Job -Job $job
            Remove-Job -Job $job
        }
        $this.State.Jobs.Clear()
        $this.State.IsRunning = $false
    }
    
    # Method to raise a new alert
    $monitor | Add-Member -MemberType ScriptMethod -Name RaiseAlert -Value {
        param(
            [string]$Type,
            [string]$Severity,
            [string]$Message,
            [hashtable]$Data
        )
        
        $alert = @{
            Id = [System.Guid]::NewGuid().ToString()
            Type = $Type
            Severity = $Severity
            Message = $Message
            Data = $Data
            Timestamp = Get-Date
            Status = "Active"
        }
        
        $this.State.ActiveAlerts.Add($alert)
        $this.State.AlertHistory.Add($alert)
        
        # Send notifications if reporter is available
        if ($this.Reporter) {
            $notificationAlert = @{
                Id = $alert.Id
                Type = "Monitor Alert: $Type"
                RiskLevel = switch ($Severity) {
                    "Critical" { "Critical" }
                    "Warning" { "High" }
                    default { "Medium" }
                }
                Description = $Message
                Source = "Security Monitor"
                RiskScore = switch ($Severity) {
                    "Critical" { 0.9 }
                    "Warning" { 0.7 }
                    default { 0.5 }
                }
                Timestamp = $alert.Timestamp
                Data = $Data
            }
            
            if ($this.Reporter.Config.Notifications.Email.Enabled) {
                $this.Reporter.SendEmailAlert($notificationAlert)
            }
            if ($this.Reporter.Config.Notifications.Slack.Enabled) {
                $this.Reporter.SendSlackAlert($notificationAlert)
            }
            if ($this.Reporter.Config.Notifications.Teams.Enabled) {
                $this.Reporter.SendTeamsAlert($notificationAlert)
            }
        }
        
        return $alert
    }
    
    # Method to clear an alert
    $monitor | Add-Member -MemberType ScriptMethod -Name ClearAlert -Value {
        param(
            [string]$AlertId,
            [string]$Resolution = "Resolved"
        )
        
        $alert = $this.State.ActiveAlerts | Where-Object { $_.Id -eq $AlertId } | Select-Object -First 1
        if ($alert) {
            $alert.Status = $Resolution
            $alert.ResolutionTime = Get-Date
            $this.State.ActiveAlerts.TryTake([ref]$alert)
        }
    }
    
    # Method to get active alerts
    $monitor | Add-Member -MemberType ScriptMethod -Name GetActiveAlerts -Value {
        param(
            [string]$Type,
            [string]$Severity
        )
        
        $alerts = $this.State.ActiveAlerts.ToArray()
        if ($Type) {
            $alerts = $alerts | Where-Object { $_.Type -eq $Type }
        }
        if ($Severity) {
            $alerts = $alerts | Where-Object { $_.Severity -eq $Severity }
        }
        
        return $alerts
    }
    
    # Method to get alert history
    $monitor | Add-Member -MemberType ScriptMethod -Name GetAlertHistory -Value {
        param(
            [int]$Hours = 24,
            [string]$Type,
            [string]$Severity
        )
        
        $cutoff = (Get-Date).AddHours(-$Hours)
        $alerts = $this.State.AlertHistory.ToArray() | Where-Object { $_.Timestamp -gt $cutoff }
        
        if ($Type) {
            $alerts = $alerts | Where-Object { $_.Type -eq $Type }
        }
        if ($Severity) {
            $alerts = $alerts | Where-Object { $_.Severity -eq $Severity }
        }
        
        return $alerts
    }
    
    # Method to generate monitoring report
    $monitor | Add-Member -MemberType ScriptMethod -Name GenerateReport -Value {
        param(
            [string]$OutputPath,
            [int]$Hours = 24
        )
        
        $history = $this.GetAlertHistory($Hours)
        $activeAlerts = $this.GetActiveAlerts()
        
        $report = @{
            GeneratedAt = Get-Date
            Period = "$Hours hours"
            ActiveAlerts = $activeAlerts
            Statistics = @{
                TotalAlerts = $history.Count
                BySeverity = @{
                    Critical = ($history | Where-Object { $_.Severity -eq "Critical" }).Count
                    Warning = ($history | Where-Object { $_.Severity -eq "Warning" }).Count
                }
                ByType = @{
                    ResponseTime = ($history | Where-Object { $_.Type -eq "ResponseTime" }).Count
                    ApprovalRate = ($history | Where-Object { $_.Type -eq "ApprovalRate" }).Count
                    EscalationRate = ($history | Where-Object { $_.Type -eq "EscalationRate" }).Count
                    PendingRequests = ($history | Where-Object { $_.Type -eq "PendingRequests" }).Count
                }
            }
            Timeline = $history | Sort-Object Timestamp
        }
        
        $reportJson = ConvertTo-Json $report -Depth 10
        Set-Content -Path $OutputPath -Value $reportJson
        return $report
    }
    
    return $monitor
}

# Export module members
Export-ModuleMember -Function New-SecurityMonitor 
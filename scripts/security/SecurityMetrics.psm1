using namespace System.Collections.Generic

# Metrics Configuration
$script:MetricsConfig = @{
    TimeWindows = @{
        Hour = 1
        Day = 24
        Week = 168
        Month = 720
    }
    Thresholds = @{
        ResponseTime = @{
            Critical = 15  # minutes
            High = 30
            Medium = 60
            Low = 120
        }
        EscalationRate = @{
            Warning = 0.3  # 30% of requests requiring escalation
            Critical = 0.5  # 50% of requests requiring escalation
        }
        ApprovalRate = @{
            Min = 0.6  # Minimum healthy approval rate
            Target = 0.8  # Target approval rate
        }
    }
    Reports = @{
        Daily = @{
            Enabled = $true
            Time = "00:00"
            Format = "HTML"
            Recipients = @()
        }
        Weekly = @{
            Enabled = $true
            DayOfWeek = "Monday"
            Time = "00:00"
            Format = "HTML"
            Recipients = @()
        }
    }
}

function New-SecurityMetrics {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$DataPath
    )
    
    $metrics = [PSCustomObject]@{
        DataPath = $DataPath
        Config = $script:MetricsConfig
        Cache = @{
            LastUpdate = $null
            Metrics = @{}
        }
    }
    
    # Add methods
    $metrics | Add-Member -MemberType ScriptMethod -Name CalculateMetrics -Value {
        param(
            [Parameter(Mandatory=$true)]
            [PSObject]$Approval,
            [Parameter(Mandatory=$false)]
            [int]$Hours = 24
        )
        
        $now = Get-Date
        $startTime = $now.AddHours(-$Hours)
        
        # Initialize metrics structure
        $metrics = @{
            TimeRange = @{
                Start = $startTime
                End = $now
                Hours = $Hours
            }
            Summary = @{
                TotalRequests = 0
                ApprovedRequests = 0
                RejectedRequests = 0
                PendingRequests = 0
                TimedOutRequests = 0
                AverageResponseTime = 0
                EscalationRate = 0
                ApprovalRate = 0
            }
            ByRiskLevel = @{}
            ByRole = @{}
            ByAction = @{}
            ResponseTimes = @{
                Min = $null
                Max = $null
                Average = $null
                P50 = $null
                P90 = $null
                P95 = $null
                P99 = $null
            }
            Trends = @{
                HourlyVolume = @{}
                ApprovalRates = @{}
                ResponseTimes = @{}
            }
            Bottlenecks = @{
                LongPending = @()
                FrequentEscalations = @()
                HighRejectionRates = @()
            }
            Recommendations = @()
        }
        
        # Process approval history
        $relevantRequests = $Approval.ApprovalHistory | Where-Object {
            $_.Created -ge $startTime -and $_.Created -le $now
        }
        
        $metrics.Summary.TotalRequests = $relevantRequests.Count
        $metrics.Summary.ApprovedRequests = ($relevantRequests | Where-Object { $_.Status -eq "Approved" }).Count
        $metrics.Summary.RejectedRequests = ($relevantRequests | Where-Object { $_.Status -eq "Rejected" }).Count
        $metrics.Summary.TimedOutRequests = ($relevantRequests | Where-Object { $_.Status -eq "TimedOut" }).Count
        
        # Calculate metrics by risk level
        $riskLevels = @("Critical", "High", "Medium", "Low")
        foreach ($level in $riskLevels) {
            $levelRequests = $relevantRequests | Where-Object { $_.Alert.RiskLevel -eq $level }
            if ($levelRequests) {
                $metrics.ByRiskLevel[$level] = @{
                    Total = $levelRequests.Count
                    Approved = ($levelRequests | Where-Object { $_.Status -eq "Approved" }).Count
                    Rejected = ($levelRequests | Where-Object { $_.Status -eq "Rejected" }).Count
                    AverageResponseTime = $this.CalculateAverageResponseTime($levelRequests)
                    EscalationRate = ($levelRequests | Where-Object { $_.EscalationLevel -gt 0 }).Count / $levelRequests.Count
                }
            }
        }
        
        # Calculate metrics by role
        $roles = $Approval.Config.Roles.Keys
        foreach ($role in $roles) {
            $roleDecisions = $relevantRequests | ForEach-Object {
                $_.Approvals + $_.Rejections | Where-Object { $_.Role -eq $role }
            } | Where-Object { $_ }
            
            if ($roleDecisions) {
                $metrics.ByRole[$role] = @{
                    TotalDecisions = $roleDecisions.Count
                    ApprovalRate = ($roleDecisions | Where-Object { $_.IsApproved }).Count / $roleDecisions.Count
                    AverageResponseTime = $this.CalculateAverageResponseTime($roleDecisions)
                }
            }
        }
        
        # Calculate response time percentiles
        $responseTimes = $relevantRequests | ForEach-Object {
            if ($_.Status -in @("Approved", "Rejected")) {
                $firstDecision = ($_.Approvals + $_.Rejections | Sort-Object Timestamp)[0]
                ($firstDecision.Timestamp - $_.Created).TotalMinutes
            }
        } | Where-Object { $_ }
        
        if ($responseTimes) {
            $sortedTimes = $responseTimes | Sort-Object
            $metrics.ResponseTimes.Min = $sortedTimes[0]
            $metrics.ResponseTimes.Max = $sortedTimes[-1]
            $metrics.ResponseTimes.Average = ($sortedTimes | Measure-Object -Average).Average
            $metrics.ResponseTimes.P50 = $this.CalculatePercentile($sortedTimes, 50)
            $metrics.ResponseTimes.P90 = $this.CalculatePercentile($sortedTimes, 90)
            $metrics.ResponseTimes.P95 = $this.CalculatePercentile($sortedTimes, 95)
            $metrics.ResponseTimes.P99 = $this.CalculatePercentile($sortedTimes, 99)
        }
        
        # Calculate hourly trends
        $hourlyBuckets = 0..($Hours - 1) | ForEach-Object {
            $hour = $now.AddHours(-$_)
            $hourStart = $hour.Date.AddHours($hour.Hour)
            $hourEnd = $hourStart.AddHours(1)
            
            $hourRequests = $relevantRequests | Where-Object {
                $_.Created -ge $hourStart -and $_.Created -lt $hourEnd
            }
            
            if ($hourRequests) {
                $metrics.Trends.HourlyVolume[$hourStart.ToString("yyyy-MM-dd HH:00")] = @{
                    Total = $hourRequests.Count
                    Approved = ($hourRequests | Where-Object { $_.Status -eq "Approved" }).Count
                    Rejected = ($hourRequests | Where-Object { $_.Status -eq "Rejected" }).Count
                    AverageResponseTime = $this.CalculateAverageResponseTime($hourRequests)
                }
            }
        }
        
        # Identify bottlenecks
        $metrics.Bottlenecks.LongPending = $Approval.PendingApprovals | Where-Object {
            $age = ($now - $_.Created).TotalMinutes
            $age -gt $this.Config.Thresholds.ResponseTime[$_.Alert.RiskLevel]
        } | ForEach-Object {
            @{
                RequestId = $_.Id
                Age = ($now - $_.Created).TotalMinutes
                RiskLevel = $_.Alert.RiskLevel
                Action = $_.Action.Name
            }
        }
        
        # Generate recommendations
        $metrics.Recommendations = $this.GenerateRecommendations($metrics)
        
        # Update cache
        $this.Cache.LastUpdate = $now
        $this.Cache.Metrics = $metrics
        
        return $metrics
    }
    
    $metrics | Add-Member -MemberType ScriptMethod -Name GenerateReport -Value {
        param(
            [Parameter(Mandatory=$true)]
            [hashtable]$Metrics,
            [Parameter(Mandatory=$false)]
            [string]$Format = "HTML"
        )
        
        switch ($Format) {
            "HTML" {
                $report = @"
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Approval Metrics Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .metric-card {
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        .chart {
            width: 100%;
            height: 300px;
            margin: 20px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            color: white;
        }
        .status-good { background-color: #28a745; }
        .status-warning { background-color: #ffc107; }
        .status-critical { background-color: #dc3545; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th { background-color: #f8f9fa; }
    </style>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Security Approval Metrics Report</h1>
            <p>Time Range: $($Metrics.TimeRange.Start) to $($Metrics.TimeRange.End)</p>
        </div>
        
        <div class="section">
            <h2>Summary</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <h3>Total Requests</h3>
                    <p class="metric-value">$($Metrics.Summary.TotalRequests)</p>
                </div>
                <div class="metric-card">
                    <h3>Approval Rate</h3>
                    <p class="metric-value">$([Math]::Round($Metrics.Summary.ApprovalRate * 100, 1))%</p>
                </div>
                <div class="metric-card">
                    <h3>Average Response Time</h3>
                    <p class="metric-value">$([Math]::Round($Metrics.ResponseTimes.Average, 1)) minutes</p>
                </div>
                <div class="metric-card">
                    <h3>Escalation Rate</h3>
                    <p class="metric-value">$([Math]::Round($Metrics.Summary.EscalationRate * 100, 1))%</p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Response Time Distribution</h2>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value (minutes)</th>
                </tr>
                <tr>
                    <td>Minimum</td>
                    <td>$([Math]::Round($Metrics.ResponseTimes.Min, 1))</td>
                </tr>
                <tr>
                    <td>50th Percentile</td>
                    <td>$([Math]::Round($Metrics.ResponseTimes.P50, 1))</td>
                </tr>
                <tr>
                    <td>90th Percentile</td>
                    <td>$([Math]::Round($Metrics.ResponseTimes.P90, 1))</td>
                </tr>
                <tr>
                    <td>95th Percentile</td>
                    <td>$([Math]::Round($Metrics.ResponseTimes.P95, 1))</td>
                </tr>
                <tr>
                    <td>99th Percentile</td>
                    <td>$([Math]::Round($Metrics.ResponseTimes.P99, 1))</td>
                </tr>
                <tr>
                    <td>Maximum</td>
                    <td>$([Math]::Round($Metrics.ResponseTimes.Max, 1))</td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Metrics by Risk Level</h2>
            <table>
                <tr>
                    <th>Risk Level</th>
                    <th>Total</th>
                    <th>Approved</th>
                    <th>Rejected</th>
                    <th>Avg Response Time</th>
                    <th>Escalation Rate</th>
                </tr>
                $(foreach ($level in $Metrics.ByRiskLevel.Keys) {
                    $data = $Metrics.ByRiskLevel[$level]
                    @"
                <tr>
                    <td>$level</td>
                    <td>$($data.Total)</td>
                    <td>$($data.Approved)</td>
                    <td>$($data.Rejected)</td>
                    <td>$([Math]::Round($data.AverageResponseTime, 1))</td>
                    <td>$([Math]::Round($data.EscalationRate * 100, 1))%</td>
                </tr>
"@
                })
            </table>
        </div>
        
        <div class="section">
            <h2>Metrics by Role</h2>
            <table>
                <tr>
                    <th>Role</th>
                    <th>Total Decisions</th>
                    <th>Approval Rate</th>
                    <th>Avg Response Time</th>
                </tr>
                $(foreach ($role in $Metrics.ByRole.Keys) {
                    $data = $Metrics.ByRole[$role]
                    @"
                <tr>
                    <td>$role</td>
                    <td>$($data.TotalDecisions)</td>
                    <td>$([Math]::Round($data.ApprovalRate * 100, 1))%</td>
                    <td>$([Math]::Round($data.AverageResponseTime, 1))</td>
                </tr>
"@
                })
            </table>
        </div>
        
        <div class="section">
            <h2>Bottlenecks</h2>
            <div class="metric-card">
                <h3>Long Pending Requests</h3>
                $(if ($Metrics.Bottlenecks.LongPending) {
                    "<table>
                        <tr>
                            <th>Request ID</th>
                            <th>Age (minutes)</th>
                            <th>Risk Level</th>
                            <th>Action</th>
                        </tr>"
                    foreach ($req in $Metrics.Bottlenecks.LongPending) {
                        @"
                        <tr>
                            <td>$($req.RequestId)</td>
                            <td>$([Math]::Round($req.Age, 1))</td>
                            <td>$($req.RiskLevel)</td>
                            <td>$($req.Action)</td>
                        </tr>
"@
                    }
                    "</table>"
                } else {
                    "<p>No long pending requests</p>"
                })
            </div>
        </div>
        
        <div class="section">
            <h2>Recommendations</h2>
            <div class="metric-card">
                <ul>
                    $(foreach ($rec in $Metrics.Recommendations) {
                        "<li>$rec</li>"
                    })
                </ul>
            </div>
        </div>
    </div>
    
    <script>
        // Add interactive charts here using Plotly.js
        const hourlyData = $($Metrics.Trends.HourlyVolume | ConvertTo-Json);
        
        // Volume trend chart
        const volumeData = [{
            x: Object.keys(hourlyData),
            y: Object.values(hourlyData).map(h => h.Total),
            type: 'scatter',
            name: 'Total Requests'
        }];
        
        Plotly.newPlot('volumeChart', volumeData, {
            title: 'Hourly Request Volume',
            xaxis: { title: 'Hour' },
            yaxis: { title: 'Number of Requests' }
        });
    </script>
</body>
</html>
"@
                return $report
            }
            
            "JSON" {
                return $Metrics | ConvertTo-Json -Depth 10
            }
            
            default {
                throw "Unsupported report format: $Format"
            }
        }
    }
    
    $metrics | Add-Member -MemberType ScriptMethod -Name CalculateAverageResponseTime -Value {
        param($Requests)
        
        $times = $Requests | ForEach-Object {
            if ($_.Status -in @("Approved", "Rejected")) {
                $firstDecision = ($_.Approvals + $_.Rejections | Sort-Object Timestamp)[0]
                ($firstDecision.Timestamp - $_.Created).TotalMinutes
            }
        } | Where-Object { $_ }
        
        if ($times) {
            return ($times | Measure-Object -Average).Average
        }
        return 0
    }
    
    $metrics | Add-Member -MemberType ScriptMethod -Name CalculatePercentile -Value {
        param(
            [double[]]$Values,
            [int]$Percentile
        )
        
        if (-not $Values -or $Values.Count -eq 0) { return 0 }
        
        $sorted = $Values | Sort-Object
        $index = [Math]::Ceiling($Percentile / 100 * $sorted.Count) - 1
        return $sorted[$index]
    }
    
    $metrics | Add-Member -MemberType ScriptMethod -Name GenerateRecommendations -Value {
        param($Metrics)
        
        $recommendations = [System.Collections.ArrayList]::new()
        
        # Check response times
        foreach ($level in $Metrics.ByRiskLevel.Keys) {
            $threshold = $this.Config.Thresholds.ResponseTime[$level]
            $actual = $Metrics.ByRiskLevel[$level].AverageResponseTime
            
            if ($actual -gt $threshold) {
                $recommendations.Add(
                    "Response time for $level alerts ($([Math]::Round($actual, 1)) minutes) exceeds threshold ($threshold minutes). Consider adjusting auto-escalation timing or adding more approvers."
                ) | Out-Null
            }
        }
        
        # Check escalation rates
        $overallEscalationRate = ($Metrics.Summary.TotalRequests -gt 0) ?
            ($Metrics.Bottlenecks.FrequentEscalations.Count / $Metrics.Summary.TotalRequests) : 0
            
        if ($overallEscalationRate -gt $this.Config.Thresholds.EscalationRate.Warning) {
            $recommendations.Add(
                "High escalation rate ($([Math]::Round($overallEscalationRate * 100, 1))%). Review approval thresholds and consider delegating more authority to lower levels."
            ) | Out-Null
        }
        
        # Check approval rates
        if ($Metrics.Summary.ApprovalRate -lt $this.Config.Thresholds.ApprovalRate.Min) {
            $recommendations.Add(
                "Low approval rate ($([Math]::Round($Metrics.Summary.ApprovalRate * 100, 1))%). Review security policies and approval criteria."
            ) | Out-Null
        }
        
        # Check for bottlenecks
        if ($Metrics.Bottlenecks.LongPending.Count -gt 0) {
            $recommendations.Add(
                "$($Metrics.Bottlenecks.LongPending.Count) requests pending longer than threshold. Review staffing levels and notification settings."
            ) | Out-Null
        }
        
        return $recommendations
    }
    
    return $metrics
}

# Export functions
Export-ModuleMember -Function @(
    'New-SecurityMetrics'
) 
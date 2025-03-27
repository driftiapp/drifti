using namespace System.Collections.Generic
using namespace System.Net.Mail

# Module manifest
@{
    ModuleVersion = '1.0'
    GUID = 'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a'
    Author = 'Security Team'
    Description = 'Security Reporter Module'
    PowerShellVersion = '5.1'
}

# Create a function to return a new instance of the class
function New-SecurityReporter {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$OutputPath
    )
    
    $reporter = [PSCustomObject]@{
        OutputPath = $OutputPath
        Config = @{
            AlertThresholds = @{
                Critical = 0.8
                High = 0.6
                Medium = 0.4
                Low = 0.2
            }
            Notifications = @{
                Email = @{
                    Enabled = $false
                    SmtpServer = ""
                    Port = 587
                    UseSsl = $true
                    From = ""
                    To = @()
                    Username = ""
                    Password = ""
                }
                Slack = @{
                    Enabled = $false
                    WebhookUrl = ""
                    Channel = "#security-alerts"
                }
                Teams = @{
                    Enabled = $false
                    WebhookUrl = ""
                }
                Twilio = @{
                    Enabled = $false
                    AccountSid = ""
                    AuthToken = ""
                    From = ""
                    To = @()
                    MinimumSeverity = "Low"
                }
                Webhooks = @{}
            }
            Reports = @{
                Daily = @{
                    Enabled = $true
                    Time = "00:00"
                    Format = "HTML"
                }
                Weekly = @{
                    Enabled = $true
                    DayOfWeek = "Monday"
                    Time = "00:00"
                    Format = "HTML"
                }
            }
            RetentionPolicy = @{
                AlertRetentionDays = 90
                ReportRetentionDays = 365
                ComplianceMode = $false
            }
        }
        AlertQueue = @()
        ReportHistory = [System.Collections.ArrayList]::new()
    }
    
    # Add methods
    $reporter | Add-Member -MemberType ScriptMethod -Name ConfigureNotifications -Value {
        param([hashtable]$settings)
        foreach ($key in $settings.Keys) {
            if ($this.Config.Notifications.ContainsKey($key)) {
                $this.Config.Notifications[$key] = $settings[$key]
            }
        }
    }
    
    $reporter | Add-Member -MemberType ScriptMethod -Name TestEmailConnection -Value {
        try {
            $smtp = [System.Net.Mail.SmtpClient]::new(
                $this.Config.Notifications.Email.SmtpServer,
                $this.Config.Notifications.Email.Port
            )
            $smtp.EnableSsl = $this.Config.Notifications.Email.UseSsl
            $smtp.Credentials = [System.Net.NetworkCredential]::new(
                $this.Config.Notifications.Email.Username,
                $this.Config.Notifications.Email.Password
            )
            
            # Test connection without sending
            $smtp.TargetName = "SMTPSVC/" + $this.Config.Notifications.Email.SmtpServer
            $smtp.Connect()
            $smtp.Disconnect()
            Write-Host "✅ Email connection test successful"
            return $true
        }
        catch {
            Write-Error "❌ Email connection test failed: $_"
            return $false
        }
    }
    
    $reporter | Add-Member -MemberType ScriptMethod -Name TestSlackConnection -Value {
        try {
            $testPayload = @{
                channel = $this.Config.Notifications.Slack.Channel
                username = "Security Bot"
                text = "🔒 Connection test from Security Reporter"
                icon_emoji = ":white_check_mark:"
            }
            
            $body = ConvertTo-Json $testPayload -Compress
            $response = Invoke-RestMethod `
                -Uri $this.Config.Notifications.Slack.WebhookUrl `
                -Method Post `
                -Body $body `
                -ContentType 'application/json'
            
            Write-Host "✅ Slack connection test successful"
            return $true
        }
        catch {
            Write-Error "❌ Slack connection test failed: $_"
            return $false
        }
    }
    
    $reporter | Add-Member -MemberType ScriptMethod -Name TestTeamsConnection -Value {
        try {
            $testPayload = @{
                "@type" = "MessageCard"
                "@context" = "http://schema.org/extensions"
                summary = "Connection Test"
                themeColor = "00ff00"
                title = "🔒 Security Reporter Connection Test"
                text = "Connection test successful"
            }
            
            $body = ConvertTo-Json $testPayload -Compress
            $response = Invoke-RestMethod `
                -Uri $this.Config.Notifications.Teams.WebhookUrl `
                -Method Post `
                -Body $body `
                -ContentType 'application/json'
            
            Write-Host "✅ Teams connection test successful"
            return $true
        }
        catch {
            Write-Error "❌ Teams connection test failed: $_"
            return $false
        }
    }
    
    $reporter | Add-Member -MemberType ScriptMethod -Name TestTwilioConnection -Value {
        try {
            $twilioConfig = $this.Config.Notifications.Twilio
            $twilioUri = "https://api.twilio.com/2010-04-01/Accounts/$($twilioConfig.AccountSid)/Messages.json"
            $twilioAuth = [Convert]::ToBase64String(
                [Text.Encoding]::ASCII.GetBytes("$($twilioConfig.AccountSid):$($twilioConfig.AuthToken)")
            )
            
            $payload = @{
                To = $twilioConfig.To[0]
                From = $twilioConfig.From
                Body = "🔒 Connection test from Security Reporter"
            }
            
            $response = Invoke-RestMethod `
                -Uri $twilioUri `
                -Method Post `
                -Headers @{
                    Authorization = "Basic $twilioAuth"
                } `
                -Body $payload
            
            Write-Host "✅ Twilio connection test successful"
            return $true
        }
        catch {
            Write-Error "❌ Twilio connection test failed: $_"
            return $false
        }
    }
    
    $reporter | Add-Member -MemberType ScriptMethod -Name TestWebhookConnection -Value {
        param([string]$webhookName)
        try {
            if (-not $this.Config.Notifications.Webhooks.ContainsKey($webhookName)) {
                Write-Error "❌ Webhook '$webhookName' not found in configuration"
                return $false
            }
            
            $webhook = $this.Config.Notifications.Webhooks[$webhookName]
            $testPayload = @{
                type = "connection_test"
                timestamp = Get-Date -Format "o"
                webhook = $webhookName
            }
            
            $body = if ($webhook.Format -eq "Template") {
                $webhook.Template -replace "{severity}", "Test" -replace "{message}", "Connection test"
            }
            else {
                ConvertTo-Json $testPayload -Compress
            }
            
            $response = Invoke-RestMethod `
                -Uri $webhook.Url `
                -Method $webhook.Method `
                -Headers $webhook.Headers `
                -Body $body
            
            Write-Host "✅ Webhook '$webhookName' connection test successful"
            return $true
        }
        catch {
            Write-Error "❌ Webhook '$webhookName' connection test failed: $_"
            return $false
        }
    }
    
    # Add automation property to reporter object
    $reporter | Add-Member -MemberType NoteProperty -Name Automation -Value $null

    # Update New-SecurityReporter function to initialize automation
    $reporter | Add-Member -MemberType ScriptMethod -Name InitializeAutomation -Value {
        $this.Automation = New-SecurityAutomation -DataPath $this.OutputPath
    }
    
    # Add enhanced formatting methods
    $reporter | Add-Member -MemberType ScriptMethod -Name FormatEmailHtml -Value {
        param([hashtable]$alert)
        $riskColor = switch ($alert.RiskLevel) {
            "Critical" { "#FF0000" }
            "High" { "#FF6B00" }
            "Medium" { "#FFD700" }
            "Low" { "#00FF00" }
            default { "#808080" }
        }
        
        # Generate unique tracking ID for actions
        $trackingId = [System.Guid]::NewGuid().ToString()
        $baseActionUrl = "https://security-dashboard/api/actions"
        
        # Get analytics insights
        $analytics = New-SecurityAnalytics -DataPath $this.OutputPath
        $recentEvents = $this.GetRecentEvents($alert.Type)
        $insights = $analytics.GenerateInsights($recentEvents, $alert)
        
        $html = @"
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
        .risk-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            color: white;
            background-color: $riskColor;
            font-weight: bold;
        }
        .details { margin: 20px 0; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px; }
        .metric { margin: 10px 0; }
        .metric-label { font-weight: bold; color: #666; }
        .insights { margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; }
        .recommendation { margin: 10px 0; padding: 10px; background-color: #e9ecef; border-radius: 5px; }
        .action-buttons {
            margin: 20px 0;
            text-align: center;
        }
        .action-button {
            display: inline-block;
            padding: 10px 20px;
            margin: 0 10px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
        }
        .acknowledge {
            background-color: #28a745;
            color: white;
        }
        .investigate {
            background-color: #007bff;
            color: white;
        }
        .dismiss {
            background-color: #6c757d;
            color: white;
        }
        .timeline {
            margin: 20px 0;
            padding: 15px;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .timeline-item {
            margin: 10px 0;
            padding-left: 20px;
            border-left: 3px solid #007bff;
        }
        .timeline-time {
            color: #666;
            font-size: 0.9em;
        }
        @media (max-width: 600px) {
            .action-buttons { flex-direction: column; }
            .action-button { margin: 5px 0; }
        }
        
        .analytics-section {
            margin: 20px 0;
            padding: 20px;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .trend-chart {
            width: 100%;
            height: 300px;
            margin: 20px 0;
        }
        
        .impact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .impact-card {
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            text-align: center;
        }
        
        .impact-card h4 {
            margin: 0 0 10px 0;
            color: #666;
        }
        
        .impact-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        .forecast-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .forecast-table th,
        .forecast-table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .forecast-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .confidence-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            color: white;
            background-color: #28a745;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🚨 Security Alert</h2>
            <div class="risk-badge">$($alert.RiskLevel) Risk</div>
            <p>Event Type: $($alert.Type)</p>
            <p>Detected: $($alert.Timestamp)</p>
        </div>
        
        <div class="action-buttons">
            <a href="$baseActionUrl/acknowledge?id=$($alert.Id)&tracking=$trackingId" class="action-button acknowledge">✓ Acknowledge</a>
            <a href="$baseActionUrl/investigate?id=$($alert.Id)&tracking=$trackingId" class="action-button investigate">🔍 Investigate</a>
            <a href="$baseActionUrl/dismiss?id=$($alert.Id)&tracking=$trackingId" class="action-button dismiss">✗ Dismiss</a>
        </div>
        
        <div class="details">
            <div class="metric">
                <span class="metric-label">Risk Score:</span>
                <span>$($alert.RiskScore)</span>
            </div>
            <div class="metric">
                <span class="metric-label">Source:</span>
                <span>$($alert.Source)</span>
            </div>
            <div class="metric">
                <span class="metric-label">Description:</span>
                <span>$($alert.Description)</span>
            </div>
        </div>
        
        <div class="timeline">
            <h3>🕒 Recent Activity</h3>
            $(
                $timelineItems = @(
                    @{ Time = (Get-Date).AddMinutes(-5); Event = "Alert triggered" }
                    @{ Time = (Get-Date).AddMinutes(-4); Event = "Automatic analysis completed" }
                    @{ Time = (Get-Date).AddMinutes(-3); Event = "AI insights generated" }
                    @{ Time = (Get-Date).AddMinutes(-2); Event = "Notifications dispatched" }
                )
                foreach ($item in $timelineItems) {
                    @"
                    <div class="timeline-item">
                        <div class="timeline-time">$($item.Time.ToString('HH:mm:ss'))</div>
                        <div>$($item.Event)</div>
                    </div>
"@
                }
            )
        </div>
        
        <div class="analytics-section">
            <h3>📊 Analytics Insights</h3>
            
            <div class="impact-grid">
                <div class="impact-card">
                    <h4>Impact Score</h4>
                    <div class="impact-value">$([Math]::Round($insights.Impact.Score * 100))%</div>
                </div>
                <div class="impact-card">
                    <h4>Affected Users</h4>
                    <div class="impact-value">$($insights.Impact.Affected.Users)</div>
                </div>
                <div class="impact-card">
                    <h4>Resolution Time</h4>
                    <div class="impact-value">$($insights.Impact.Mitigation.EstimatedTime)m</div>
                </div>
                <div class="impact-card">
                    <h4>Effort Level</h4>
                    <div class="impact-value">$($insights.Impact.Mitigation.Effort)</div>
                </div>
            </div>
            
            <div id="trendChart" class="trend-chart"></div>
            <script>
                const timeSeriesData = $($insights.Trends.TimeSeries | ConvertTo-Json);
                const trendData = {
                    x: timeSeriesData.map(d => d.Window),
                    y: timeSeriesData.map(d => d.Frequency),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Event Frequency',
                    line: { color: '#007bff' }
                };
                
                const anomalyData = $($insights.Trends.Anomalies | ConvertTo-Json);
                const anomalies = {
                    x: anomalyData.map(d => d.Window),
                    y: anomalyData.map(d => d.Frequency),
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Anomalies',
                    marker: { color: '#dc3545', size: 10 }
                };
                
                const layout = {
                    title: 'Event Frequency Trend',
                    xaxis: { title: 'Time Window' },
                    yaxis: { title: 'Events per Minute' },
                    showlegend: true
                };
                
                Plotly.newPlot('trendChart', [trendData, anomalies], layout);
            </script>
            
            <h4>🔮 Forecast</h4>
            <table class="forecast-table">
                <tr>
                    <th>Time Frame</th>
                    <th>Predicted Events</th>
                    <th>Confidence</th>
                </tr>
                $(foreach ($forecast in $insights.Trends.Forecast) {
                    $confidenceColor = switch ([Math]::Round($forecast.Confidence * 100)) {
                        { $_ -gt 80 } { "#28a745" }
                        { $_ -gt 60 } { "#ffc107" }
                        default { "#dc3545" }
                    }
                    @"
                <tr>
                    <td>$($forecast.TimeFrame)</td>
                    <td>$($forecast.PredictedCount)</td>
                    <td><span class="confidence-badge" style="background-color: $confidenceColor">$([Math]::Round($forecast.Confidence * 100))%</span></td>
                </tr>
"@
                })
            </table>
            
            <h4>🎯 Key Findings</h4>
            <ul>
                $(foreach ($finding in $insights.Summary) {
                    "<li>$finding</li>"
                })
            </ul>
            
            <h4>📋 Recommendations</h4>
            $(foreach ($rec in $insights.Recommendations) {
                "<div class='recommendation'>$rec</div>"
            })
        </div>
    </div>
</body>
</html>
"@
        
        # Add automation response section if available
        if ($alert.AutomationResponse) {
            $html = $html -replace '</body>',@"
            <div class="automation-section">
                <h3>🤖 Automated Response Actions</h3>
                <div class="automation-grid">
                    $(
                        foreach ($action in $alert.AutomationResponse.ExecutedActions) {
                            @"
                            <div class="automation-card">
                                <h4>$($action.Name)</h4>
                                <div class="automation-details">
                                    <p><strong>Status:</strong> $($action.Status)</p>
                                    <p><strong>Action:</strong> $($action.Action)</p>
                                    $(
                                        if ($action.Result) {
                                            $resultDetails = $action.Result | ConvertTo-Json
                                            "<p><strong>Details:</strong> <pre>$resultDetails</pre></p>"
                                        }
                                    )
                                </div>
                            </div>
"@
                        }
                    )
                </div>
                
                $(
                    if ($alert.AutomationResponse.PendingActions.Count -gt 0) {
                        @"
                        <div class="pending-actions">
                            <h4>⏳ Pending Actions</h4>
                            <ul>
                                $(
                                    foreach ($action in $alert.AutomationResponse.PendingActions) {
                                        "<li>$($action.Name) (Requires Approval)</li>"
                                    }
                                )
                            </ul>
                        </div>
"@
                    }
                )
            </div>
            </body>
"@
        }
        
        return $html
    }
    
    $reporter | Add-Member -MemberType ScriptMethod -Name FormatSlackMessage -Value {
        param([hashtable]$alert)
        $color = switch ($alert.RiskLevel) {
            "Critical" { "danger" }
            "High" { "warning" }
            "Medium" { "#FFD700" }
            "Low" { "good" }
            default { "#808080" }
        }
        
        # Generate unique tracking ID for actions
        $trackingId = [System.Guid]::NewGuid().ToString()
        
        $blocks = @(
            @{
                type = "header"
                text = @{
                    type = "plain_text"
                    text = "🚨 Security Alert"
                    emoji = $true
                }
            }
            @{
                type = "section"
                fields = @(
                    @{
                        type = "mrkdwn"
                        text = "*Risk Level:*\n$($alert.RiskLevel)"
                    }
                    @{
                        type = "mrkdwn"
                        text = "*Event Type:*\n$($alert.Type)"
                    }
                )
            }
            @{
                type = "section"
                fields = @(
                    @{
                        type = "mrkdwn"
                        text = "*Risk Score:*\n$($alert.RiskScore)"
                    }
                    @{
                        type = "mrkdwn"
                        text = "*Source:*\n$($alert.Source)"
                    }
                )
            }
            @{
                type = "section"
                text = @{
                    type = "mrkdwn"
                    text = "*Description:*\n$($alert.Description)"
                }
            }
            @{
                type = "divider"
            }
            @{
                type = "section"
                text = @{
                    type = "mrkdwn"
                    text = "*🔍 AI Insights:*\n" + ($alert.Insights -join "\n• ")
                }
            }
            @{
                type = "section"
                text = @{
                    type = "mrkdwn"
                    text = "*📋 Recommendations:*\n" + ($alert.Recommendations -join "\n• ")
                }
            }
            @{
                type = "actions"
                elements = @(
                    @{
                        type = "button"
                        text = @{
                            type = "plain_text"
                            text = "✓ Acknowledge"
                            emoji = $true
                        }
                        style = "primary"
                        value = "acknowledge|$($alert.Id)|$trackingId"
                        action_id = "acknowledge_alert"
                    }
                    @{
                        type = "button"
                        text = @{
                            type = "plain_text"
                            text = "🔍 Investigate"
                            emoji = $true
                        }
                        value = "investigate|$($alert.Id)|$trackingId"
                        action_id = "investigate_alert"
                    }
                    @{
                        type = "button"
                        text = @{
                            type = "plain_text"
                            text = "✗ Dismiss"
                            emoji = $true
                        }
                        style = "danger"
                        value = "dismiss|$($alert.Id)|$trackingId"
                        action_id = "dismiss_alert"
                        confirm = @{
                            title = @{
                                type = "plain_text"
                                text = "Confirm Dismissal"
                            }
                            text = @{
                                type = "mrkdwn"
                                text = "Are you sure you want to dismiss this alert? This action cannot be undone."
                            }
                            confirm = @{
                                type = "plain_text"
                                text = "Yes, dismiss it"
                            }
                            deny = @{
                                type = "plain_text"
                                text = "No, keep it"
                            }
                        }
                    }
                )
            }
            @{
                type = "actions"
                elements = @(
                    @{
                        type = "static_select"
                        placeholder = @{
                            type = "plain_text"
                            text = "Assign to..."
                            emoji = $true
                        }
                        options = @(
                            @{
                                text = @{
                                    type = "plain_text"
                                    text = "👤 Security Team"
                                    emoji = $true
                                }
                                value = "security_team|$($alert.Id)|$trackingId"
                            }
                            @{
                                text = @{
                                    type = "plain_text"
                                    text = "👥 Network Team"
                                    emoji = $true
                                }
                                value = "network_team|$($alert.Id)|$trackingId"
                            }
                            @{
                                text = @{
                                    type = "plain_text"
                                    text = "🛡️ Incident Response"
                                    emoji = $true
                                }
                                value = "ir_team|$($alert.Id)|$trackingId"
                            }
                        )
                        action_id = "assign_alert"
                    }
                    @{
                        type = "static_select"
                        placeholder = @{
                            type = "plain_text"
                            text = "Set Priority..."
                            emoji = $true
                        }
                        options = @(
                            @{
                                text = @{
                                    type = "plain_text"
                                    text = "🔴 P1 - Critical"
                                    emoji = $true
                                }
                                value = "p1|$($alert.Id)|$trackingId"
                            }
                            @{
                                text = @{
                                    type = "plain_text"
                                    text = "🟠 P2 - High"
                                    emoji = $true
                                }
                                value = "p2|$($alert.Id)|$trackingId"
                            }
                            @{
                                text = @{
                                    type = "plain_text"
                                    text = "🟡 P3 - Medium"
                                    emoji = $true
                                }
                                value = "p3|$($alert.Id)|$trackingId"
                            }
                            @{
                                text = @{
                                    type = "plain_text"
                                    text = "🟢 P4 - Low"
                                    emoji = $true
                                }
                                value = "p4|$($alert.Id)|$trackingId"
                            }
                        )
                        action_id = "set_priority"
                    }
                )
            }
        )
        
        # Get analytics insights
        $analytics = New-SecurityAnalytics -DataPath $this.OutputPath
        $recentEvents = $this.GetRecentEvents($alert.Type)
        $insights = $analytics.GenerateInsights($recentEvents, $alert)
        
        # Add analytics section to blocks
        $blocks += @(
            @{
                type = "divider"
            }
            @{
                type = "section"
                text = @{
                    type = "mrkdwn"
                    text = "*📊 Analytics Insights*\n" + ($insights.Summary -join "\n• ")
                }
            }
            @{
                type = "section"
                fields = @(
                    @{
                        type = "mrkdwn"
                        text = "*Impact Score:*\n$([Math]::Round($insights.Impact.Score * 100))%"
                    }
                    @{
                        type = "mrkdwn"
                        text = "*Affected Users:*\n$($insights.Impact.Affected.Users)"
                    }
                    @{
                        type = "mrkdwn"
                        text = "*Resolution Time:*\n$($insights.Impact.Mitigation.EstimatedTime)m"
                    }
                    @{
                        type = "mrkdwn"
                        text = "*Effort Level:*\n$($insights.Impact.Mitigation.Effort)"
                    }
                )
            }
            @{
                type = "section"
                text = @{
                    type = "mrkdwn"
                    text = "*📈 Forecast*\n" + (
                        $insights.Trends.Forecast | ForEach-Object {
                            "• $($_.TimeFrame): $($_.PredictedCount) events ($([Math]::Round($_.Confidence * 100))% confidence)"
                        } | Join-String -Separator "`n"
                    )
                }
            }
        )
        
        # Add automation response section if available
        if ($alert.AutomationResponse) {
            $blocks += @(
                @{
                    type = "divider"
                }
                @{
                    type = "section"
                    text = @{
                        type = "mrkdwn"
                        text = "*🤖 Automated Response Actions*"
                    }
                }
            )
            
            foreach ($action in $alert.AutomationResponse.ExecutedActions) {
                $blocks += @{
                    type = "section"
                    text = @{
                        type = "mrkdwn"
                        text = "*$($action.Name)*\nStatus: $($action.Status)\nAction: $($action.Action)"
                    }
                }
            }
            
            if ($alert.AutomationResponse.PendingActions.Count -gt 0) {
                $blocks += @{
                    type = "section"
                    text = @{
                        type = "mrkdwn"
                        text = "*⏳ Pending Actions*\n" + (
                            $alert.AutomationResponse.PendingActions | ForEach-Object {
                                "• $($_.Name) (Requires Approval)"
                            } | Join-String -Separator "`n"
                        )
                    }
                }
            }
        }
        
        return @{
            blocks = $blocks
            attachments = @(
                @{
                    color = $color
                    blocks = @(
                        @{
                            type = "context"
                            elements = @(
                                @{
                                    type = "mrkdwn"
                                    text = "🕒 Detected: $($alert.Timestamp)"
                                }
                            )
                        }
                    )
                }
            )
        }
    }
    
    $reporter | Add-Member -MemberType ScriptMethod -Name FormatTeamsCard -Value {
        param([hashtable]$alert)
        $color = switch ($alert.RiskLevel) {
            "Critical" { "FF0000" }
            "High" { "FF6B00" }
            "Medium" { "FFD700" }
            "Low" { "00FF00" }
            default { "808080" }
        }
        
        # Generate unique tracking ID for actions
        $trackingId = [System.Guid]::NewGuid().ToString()
        $baseActionUrl = "https://security-dashboard/api/actions"
        
        # Get analytics insights
        $analytics = New-SecurityAnalytics -DataPath $this.OutputPath
        $recentEvents = $this.GetRecentEvents($alert.Type)
        $insights = $analytics.GenerateInsights($recentEvents, $alert)
        
        $sections = @(
            @{
                activityTitle = "🚨 Security Alert"
                activitySubtitle = "Detected: $($alert.Timestamp)"
                facts = @(
                    @{
                        name = "Risk Level"
                        value = $alert.RiskLevel
                    }
                    @{
                        name = "Event Type"
                        value = $alert.Type
                    }
                    @{
                        name = "Risk Score"
                        value = $alert.RiskScore
                    }
                    @{
                        name = "Source"
                        value = $alert.Source
                    }
                )
            }
            @{
                title = "Description"
                text = $alert.Description
            }
            @{
                title = "🔍 AI Insights"
                text = "- " + ($alert.Insights -join "`n- ")
            }
            @{
                title = "📋 Recommendations"
                text = "- " + ($alert.Recommendations -join "`n- ")
            }
        )
        
        $sections += @(
            @{
                title = "📊 Analytics Insights"
                facts = @(
                    @{
                        name = "Impact Score"
                        value = "$([Math]::Round($insights.Impact.Score * 100))%"
                    }
                    @{
                        name = "Affected Users"
                        value = $insights.Impact.Affected.Users
                    }
                    @{
                        name = "Resolution Time"
                        value = "$($insights.Impact.Mitigation.EstimatedTime) minutes"
                    }
                    @{
                        name = "Effort Level"
                        value = $insights.Impact.Mitigation.Effort
                    }
                )
            }
            @{
                title = "📈 Trend Analysis"
                text = $insights.Summary -join "`n- "
            }
            @{
                title = "🔮 Forecast"
                text = $insights.Trends.Forecast | ForEach-Object {
                    "- $($_.TimeFrame): $($_.PredictedCount) events ($([Math]::Round($_.Confidence * 100))% confidence)"
                } | Join-String -Separator "`n"
            }
        )
        
        $potentialAction = @(
            @{
                "@type" = "ActionCard"
                name = "Update Status"
                inputs = @(
                    @{
                        "@type" = "MultichoiceInput"
                        id = "status"
                        title = "Select Status"
                        choices = @(
                            @{
                                display = "In Progress"
                                value = "in_progress"
                            }
                            @{
                                display = "Under Investigation"
                                value = "investigating"
                            }
                            @{
                                display = "Resolved"
                                value = "resolved"
                            }
                            @{
                                display = "False Positive"
                                value = "false_positive"
                            }
                        )
                    }
                )
                actions = @(
                    @{
                        "@type" = "HttpPOST"
                        name = "Update"
                        target = "$baseActionUrl/status?id=$($alert.Id)&tracking=$trackingId"
                    }
                )
            }
            @{
                "@type" = "ActionCard"
                name = "Assign To"
                inputs = @(
                    @{
                        "@type" = "MultichoiceInput"
                        id = "assignee"
                        title = "Select Team"
                        choices = @(
                            @{
                                display = "Security Team"
                                value = "security_team"
                            }
                            @{
                                display = "Network Team"
                                value = "network_team"
                            }
                            @{
                                display = "Incident Response"
                                value = "ir_team"
                            }
                        )
                    }
                )
                actions = @(
                    @{
                        "@type" = "HttpPOST"
                        name = "Assign"
                        target = "$baseActionUrl/assign?id=$($alert.Id)&tracking=$trackingId"
                    }
                )
            }
            @{
                "@type" = "ActionCard"
                name = "Add Comment"
                inputs = @(
                    @{
                        "@type" = "TextInput"
                        id = "comment"
                        title = "Comment"
                        isMultiline = $true
                    }
                )
                actions = @(
                    @{
                        "@type" = "HttpPOST"
                        name = "Submit"
                        target = "$baseActionUrl/comment?id=$($alert.Id)&tracking=$trackingId"
                    }
                )
            }
            @{
                "@type" = "OpenUri"
                name = "View Details"
                targets = @(
                    @{
                        os = "default"
                        uri = "https://security-dashboard/alerts/$($alert.Id)?tracking=$trackingId"
                    }
                )
            }
        )
        
        # Add automation response section if available
        if ($alert.AutomationResponse) {
            $sections += @{
                title = "🤖 Automated Response Actions"
                facts = $alert.AutomationResponse.ExecutedActions | ForEach-Object {
                    @{
                        name = $_.Name
                        value = "Status: $($_.Status)`nAction: $($_.Action)"
                    }
                }
            }
            
            if ($alert.AutomationResponse.PendingActions.Count -gt 0) {
                $sections += @{
                    title = "⏳ Pending Actions"
                    text = "- " + ($alert.AutomationResponse.PendingActions | ForEach-Object {
                        "$($_.Name) (Requires Approval)"
                    } | Join-String -Separator "`n- ")
                }
            }
        }
        
        return @{
            "@type" = "MessageCard"
            "@context" = "http://schema.org/extensions"
            themeColor = $color
            summary = "Security Alert: $($alert.Type) - $($alert.RiskLevel) Risk"
            sections = $sections
            potentialAction = $potentialAction
        }
    }
    
    $reporter | Add-Member -MemberType ScriptMethod -Name GetRecentEvents -Value {
        param(
            [string]$EventType = "All",
            [int]$Hours = 24
        )
        
        # In a real implementation, this would fetch events from a database or log files
        # For now, we'll generate some sample data
        $events = @()
        $startTime = (Get-Date).AddHours(-$Hours)
        $eventTypes = @("Login", "API", "Database", "Firewall")
        $sources = @("192.168.1.100", "10.0.0.50", "172.16.0.25")
        $riskLevels = @("Low", "Medium", "High", "Critical")
        
        1..100 | ForEach-Object {
            $timestamp = $startTime.AddMinutes((Get-Random -Minimum 1 -Maximum ($Hours * 60)))
            $type = if ($EventType -eq "All") { Get-Random -InputObject $eventTypes } else { $EventType }
            
            $events += @{
                Id = [System.Guid]::NewGuid().ToString()
                Timestamp = $timestamp
                Type = $type
                Source = Get-Random -InputObject $sources
                RiskLevel = Get-Random -InputObject $riskLevels
                RiskScore = Get-Random -Minimum 0.1 -Maximum 1.0
                Description = "Sample security event for testing"
            }
        }
        
        return $events | Sort-Object Timestamp
    }
    
    # Update SendEmailAlert to use enhanced HTML formatting
    $reporter | Add-Member -MemberType ScriptMethod -Name SendEmailAlert -Value {
        param([hashtable]$alert)
        try {
            # Get analytics insights for automation
            $analytics = New-SecurityAnalytics -DataPath $this.OutputPath
            $recentEvents = $this.GetRecentEvents($alert.Type)
            $insights = $analytics.GenerateInsights($recentEvents, $alert)
            
            # Process alert through automation
            if ($this.Automation) {
                $automationResponse = $this.Automation.ProcessAlert($alert, $insights)
                $alert.AutomationResponse = $automationResponse
            }
            
            $smtp = [System.Net.Mail.SmtpClient]::new(
                $this.Config.Notifications.Email.SmtpServer,
                $this.Config.Notifications.Email.Port
            )
            $smtp.EnableSsl = $this.Config.Notifications.Email.UseSsl
            $smtp.Credentials = [System.Net.NetworkCredential]::new(
                $this.Config.Notifications.Email.Username,
                $this.Config.Notifications.Email.Password
            )
            
            $mail = [System.Net.Mail.MailMessage]::new()
            $mail.From = [System.Net.Mail.MailAddress]::new(
                $this.Config.Notifications.Email.From,
                "Security Reporter"
            )
            foreach ($to in $this.Config.Notifications.Email.To) {
                $mail.To.Add([System.Net.Mail.MailAddress]::new($to))
            }
            
            $mail.Subject = "Security Alert: $($alert.Type) - $($alert.RiskLevel) Risk"
            $mail.IsBodyHtml = $true
            $mail.Body = $this.FormatEmailHtml($alert)
            
            $mail.Priority = switch ($alert.RiskLevel) {
                "Critical" { [System.Net.Mail.MailPriority]::High }
                "High" { [System.Net.Mail.MailPriority]::High }
                "Medium" { [System.Net.Mail.MailPriority]::Normal }
                "Low" { [System.Net.Mail.MailPriority]::Low }
            }
            
            $smtp.Send($mail)
            Write-Host "✅ Email alert sent successfully"
        }
        catch {
            Write-Error "❌ Failed to send email alert: $_"
        }
    }
    
    # Update SendSlackAlert to use enhanced message formatting
    $reporter | Add-Member -MemberType ScriptMethod -Name SendSlackAlert -Value {
        param([hashtable]$alert)
        try {
            # Get analytics insights for automation
            $analytics = New-SecurityAnalytics -DataPath $this.OutputPath
            $recentEvents = $this.GetRecentEvents($alert.Type)
            $insights = $analytics.GenerateInsights($recentEvents, $alert)
            
            # Process alert through automation
            if ($this.Automation) {
                $automationResponse = $this.Automation.ProcessAlert($alert, $insights)
                $alert.AutomationResponse = $automationResponse
            }
            
            $message = $this.FormatSlackMessage($alert)
            $body = ConvertTo-Json $message -Depth 10 -Compress
            
            $response = Invoke-RestMethod `
                -Uri $this.Config.Notifications.Slack.WebhookUrl `
                -Method Post `
                -Body $body `
                -ContentType 'application/json'
            
            Write-Host "✅ Slack alert sent successfully"
        }
        catch {
            Write-Error "❌ Failed to send Slack alert: $_"
        }
    }
    
    # Update SendTeamsAlert to use enhanced card formatting
    $reporter | Add-Member -MemberType ScriptMethod -Name SendTeamsAlert -Value {
        param([hashtable]$alert)
        try {
            # Get analytics insights for automation
            $analytics = New-SecurityAnalytics -DataPath $this.OutputPath
            $recentEvents = $this.GetRecentEvents($alert.Type)
            $insights = $analytics.GenerateInsights($recentEvents, $alert)
            
            # Process alert through automation
            if ($this.Automation) {
                $automationResponse = $this.Automation.ProcessAlert($alert, $insights)
                $alert.AutomationResponse = $automationResponse
            }
            
            $card = $this.FormatTeamsCard($alert)
            $body = ConvertTo-Json $card -Depth 10 -Compress
            
            $response = Invoke-RestMethod `
                -Uri $this.Config.Notifications.Teams.WebhookUrl `
                -Method Post `
                -Body $body `
                -ContentType 'application/json'
            
            Write-Host "✅ Teams alert sent successfully"
        }
        catch {
            Write-Error "❌ Failed to send Teams alert: $_"
        }
    }
    
    # Method to log events
    $reporter | Add-Member -MemberType ScriptMethod -Name LogEvent -Value {
        param(
            [string]$Category,
            [hashtable]$Event
        )
        
        $logEntry = @{
            Category = $Category
            Event = $Event
            Timestamp = Get-Date
        }
        
        # Add to event log
        $logPath = Join-Path $this.OutputPath "event_log.json"
        $eventLog = @()
        
        if (Test-Path $logPath) {
            $eventLog = @(Get-Content $logPath | ConvertFrom-Json)
        }
        
        $eventLog = @($eventLog) + @($logEntry)
        $eventLog | ConvertTo-Json -Depth 10 | Set-Content $logPath
        
        # Send notifications if configured
        if ($this.Config.Notifications.Email.Enabled) {
            $this.SendEmailAlert(@{
                Type = "Event Log"
                RiskLevel = "Low"
                Description = "$Category event: $($Event.Message)"
                Source = "Event Logger"
                RiskScore = 0.1
                Timestamp = Get-Date
                Data = $Event
            })
        }
    }
    
    return $reporter
}

# Create wrapper functions for class methods
function Test-EmailConnection {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSObject]$Reporter
    )
    return $Reporter.TestEmailConnection()
}

function Test-SlackConnection {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSObject]$Reporter
    )
    return $Reporter.TestSlackConnection()
}

function Test-TeamsConnection {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSObject]$Reporter
    )
    return $Reporter.TestTeamsConnection()
}

function Test-TwilioConnection {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSObject]$Reporter
    )
    return $Reporter.TestTwilioConnection()
}

function Test-WebhookConnection {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSObject]$Reporter,
        
        [Parameter(Mandatory=$true)]
        [string]$WebhookName
    )
    return $Reporter.TestWebhookConnection($WebhookName)
}

# Export the functions
Export-ModuleMember -Function @(
    'New-SecurityReporter',
    'Test-EmailConnection',
    'Test-SlackConnection',
    'Test-TeamsConnection',
    'Test-TwilioConnection',
    'Test-WebhookConnection'
) 
Export-ModuleMember -Function New-SecurityReporter 
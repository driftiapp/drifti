using namespace System.Collections.Generic

# Automation Configuration
$script:AutomationConfig = @{
    ResponseRules = @{
        Critical = @(
            @{
                Name = "Block Malicious IP"
                Condition = { param($Alert) $Alert.Type -match "Brute Force|Unauthorized Access" }
                Action = "BlockIP"
                Priority = 1
            }
            @{
                Name = "Enable Enhanced Monitoring"
                Condition = { param($Alert) $true }  # Always enable for Critical
                Action = "EnableMonitoring"
                Priority = 2
            }
            @{
                Name = "Escalate to IR Team"
                Condition = { param($Alert) $Alert.Impact.Score -gt 0.8 }
                Action = "EscalateIR"
                Priority = 3
            }
        )
        High = @(
            @{
                Name = "Rate Limit IP"
                Condition = { param($Alert) $Alert.Type -match "API|Network" }
                Action = "RateLimitIP"
                Priority = 1
            }
            @{
                Name = "Enable Threat Hunting"
                Condition = { param($Alert) $Alert.Patterns.Sequences.Count -gt 0 }
                Action = "EnableThreatHunting"
                Priority = 2
            }
        )
        Medium = @(
            @{
                Name = "Monitor IP"
                Condition = { param($Alert) $true }
                Action = "MonitorIP"
                Priority = 1
            }
            @{
                Name = "Update WAF Rules"
                Condition = { param($Alert) $Alert.Type -match "Web|API" }
                Action = "UpdateWAF"
                Priority = 2
            }
        )
        Low = @(
            @{
                Name = "Log Event"
                Condition = { param($Alert) $true }
                Action = "LogEvent"
                Priority = 1
            }
        )
    }
    ActionConfig = @{
        BlockIP = @{
            Duration = "24h"
            NotifyUser = $true
            RequireApproval = $true
        }
        RateLimitIP = @{
            RequestsPerMinute = 30
            Duration = "1h"
            NotifyUser = $true
        }
        EnableMonitoring = @{
            Duration = "48h"
            Interval = "1m"
            Metrics = @("CPU", "Memory", "Network", "Disk", "Processes")
        }
    }
    Thresholds = @{
        AutoBlockThreshold = 0.9  # Auto-block if risk score > 0.9
        AutoApprovalThreshold = 0.8  # Auto-approve actions if confidence > 0.8
        EscalationThreshold = 0.7  # Auto-escalate if impact score > 0.7
    }
}

function New-SecurityAutomation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$DataPath
    )
    
    $automation = [PSCustomObject]@{
        DataPath = $DataPath
        Config = $script:AutomationConfig
        ActionHistory = [System.Collections.ArrayList]::new()
    }
    
    # Add methods
    $automation | Add-Member -MemberType ScriptMethod -Name ProcessAlert -Value {
        param(
            [Parameter(Mandatory=$true)]
            [hashtable]$Alert,
            [Parameter(Mandatory=$true)]
            [hashtable]$Insights
        )
        
        $responses = @{
            Actions = @()
            Workflows = @()
            Status = "Processing"
            ExecutedActions = @()
            PendingActions = @()
            PendingApprovals = @()
            Errors = @()
        }
        
        # Get rules for alert level
        $rules = $this.Config.ResponseRules[$Alert.RiskLevel]
        if (-not $rules) {
            $responses.Status = "NoRules"
            return $responses
        }
        
        # Evaluate each rule
        foreach ($rule in $rules) {
            try {
                $condition = $rule.Condition
                if ($condition.Invoke($Alert)) {
                    $action = @{
                        Name = $rule.Name
                        Action = $rule.Action
                        Priority = $rule.Priority
                        Status = "Pending"
                        Timestamp = Get-Date
                        AlertId = $Alert.Id
                        Config = $this.Config.ActionConfig[$rule.Action]
                    }
                    
                    # Check if action requires approval
                    $requiresApproval = $action.Config.RequireApproval
                    if ($requiresApproval -and $Insights.Impact.Score -gt $this.Config.Thresholds.AutoApprovalThreshold) {
                        $requiresApproval = $false  # Auto-approve for high-confidence threats
                    }
                    
                    if ($requiresApproval -and $this.Approval) {
                        # Create approval request
                        $approvalRequest = $this.Approval.CreateApprovalRequest($action, $Alert)
                        $action.ApprovalRequest = $approvalRequest
                        $responses.PendingApprovals += $approvalRequest
                        $responses.PendingActions += $action
                    } else {
                        $result = $this.ExecuteAction($action, $Alert)
                        $action.Status = $result.Status
                        $action.Result = $result.Result
                        $responses.ExecutedActions += $action
                    }
                    
                    $responses.Actions += $action
                }
            }
            catch {
                $responses.Errors += @{
                    Rule = $rule.Name
                    Error = $_.Exception.Message
                    Timestamp = Get-Date
                }
            }
        }
        
        # Create workflow if multiple actions are triggered
        if ($responses.Actions.Count -gt 1) {
            $workflow = @{
                Id = [System.Guid]::NewGuid().ToString()
                AlertId = $Alert.Id
                Actions = $responses.Actions
                Status = "InProgress"
                StartTime = Get-Date
                Priority = [Math]::Min(($responses.Actions | Measure-Object -Property Priority -Minimum).Minimum, 1)
            }
            $responses.Workflows += $workflow
        }
        
        $responses.Status = if ($responses.Errors.Count -eq 0) { "Success" } else { "PartialSuccess" }
        
        # Process any pending escalations
        if ($this.Approval) {
            $escalated = $this.Approval.ProcessEscalations()
            if ($escalated.Count -gt 0) {
                $responses.Escalations = $escalated
            }
        }
        
        # Log the response
        $this.LogResponse($responses)
        
        return $responses
    }
    
    $automation | Add-Member -MemberType ScriptMethod -Name ExecuteAction -Value {
        param(
            [Parameter(Mandatory=$true)]
            [hashtable]$Action,
            [Parameter(Mandatory=$true)]
            [hashtable]$Alert
        )
        
        $result = @{
            Status = "Unknown"
            Result = $null
            Error = $null
            Timestamp = Get-Date
        }
        
        try {
            switch ($Action.Action) {
                "BlockIP" {
                    # Simulate blocking IP
                    $result.Result = @{
                        IP = $Alert.Source
                        Duration = $Action.Config.Duration
                        Rule = "BLOCK-$($Alert.Id)"
                    }
                    $result.Status = "Success"
                }
                
                "RateLimitIP" {
                    # Simulate rate limiting
                    $result.Result = @{
                        IP = $Alert.Source
                        Rate = $Action.Config.RequestsPerMinute
                        Duration = $Action.Config.Duration
                        Rule = "RATELIMIT-$($Alert.Id)"
                    }
                    $result.Status = "Success"
                }
                
                "EnableMonitoring" {
                    # Simulate enabling enhanced monitoring
                    $result.Result = @{
                        Target = $Alert.Source
                        Metrics = $Action.Config.Metrics
                        Interval = $Action.Config.Interval
                        Duration = $Action.Config.Duration
                    }
                    $result.Status = "Success"
                }
                
                "EnableThreatHunting" {
                    # Simulate enabling threat hunting
                    $result.Result = @{
                        Target = $Alert.Source
                        Mode = "Active"
                        StartTime = Get-Date
                    }
                    $result.Status = "Success"
                }
                
                "MonitorIP" {
                    # Simulate IP monitoring
                    $result.Result = @{
                        IP = $Alert.Source
                        MonitoringLevel = "Enhanced"
                        StartTime = Get-Date
                    }
                    $result.Status = "Success"
                }
                
                "UpdateWAF" {
                    # Simulate WAF rule update
                    $result.Result = @{
                        RuleSet = "CUSTOM-$($Alert.Id)"
                        Target = $Alert.Source
                        Action = "BLOCK"
                    }
                    $result.Status = "Success"
                }
                
                "LogEvent" {
                    # Simulate event logging
                    $result.Result = @{
                        EventId = "LOG-$($Alert.Id)"
                        Timestamp = Get-Date
                        Details = $Alert
                    }
                    $result.Status = "Success"
                }
                
                "EscalateIR" {
                    # Simulate IR team escalation
                    $result.Result = @{
                        TicketId = "IR-$($Alert.Id)"
                        Priority = "High"
                        AssignedTeam = "Incident Response"
                        Status = "Assigned"
                    }
                    $result.Status = "Success"
                }
                
                default {
                    throw "Unknown action type: $($Action.Action)"
                }
            }
            
            # Log the executed action
            $this.ActionHistory.Add(@{
                Action = $Action
                Result = $result
                Timestamp = Get-Date
            }) | Out-Null
        }
        catch {
            $result.Status = "Failed"
            $result.Error = $_.Exception.Message
        }
        
        return $result
    }
    
    $automation | Add-Member -MemberType ScriptMethod -Name LogResponse -Value {
        param(
            [Parameter(Mandatory=$true)]
            [hashtable]$Response
        )
        
        $logEntry = @{
            Timestamp = Get-Date
            Response = $Response
        }
        
        # In a real implementation, this would write to a log file or database
        $logPath = Join-Path $this.DataPath "automation_logs"
        if (-not (Test-Path $logPath)) {
            New-Item -ItemType Directory -Path $logPath | Out-Null
        }
        
        $logFile = Join-Path $logPath "automation_$(Get-Date -Format 'yyyy-MM-dd').json"
        $logEntry | ConvertTo-Json -Depth 10 | Add-Content -Path $logFile
    }
    
    # Add approval system to automation object
    $automation | Add-Member -MemberType NoteProperty -Name Approval -Value $null

    # Update New-SecurityAutomation function to initialize approval system
    $automation | Add-Member -MemberType ScriptMethod -Name InitializeApproval -Value {
        $this.Approval = New-SecurityApproval -DataPath $this.DataPath
    }

    # Add method to process approved actions
    $automation | Add-Member -MemberType ScriptMethod -Name ProcessApprovedAction -Value {
        param(
            [Parameter(Mandatory=$true)]
            [string]$RequestId
        )
        
        if (-not $this.Approval) {
            throw "Approval system not initialized"
        }
        
        # Find the approval request
        $request = $this.Approval.PendingApprovals | Where-Object { $_.Id -eq $RequestId } | Select-Object -First 1
        if (-not $request -or $request.Status -ne "Approved") {
            throw "Invalid or unapproved request: $RequestId"
        }
        
        # Execute the approved action
        $result = $this.ExecuteAction($request.Action, $request.Alert)
        
        # Update the action status
        $request.Action.Status = $result.Status
        $request.Action.Result = $result.Result
        
        # Log the execution
        $this.LogResponse(@{
            Type = "ApprovedActionExecuted"
            RequestId = $RequestId
            Action = $request.Action
            Result = $result
            Timestamp = Get-Date
        })
        
        return $result
    }
    
    return $automation
}

# Export functions
Export-ModuleMember -Function @(
    'New-SecurityAutomation'
) 
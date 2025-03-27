using namespace System.Collections.Generic

# Approval Configuration
$script:ApprovalConfig = @{
    Roles = @{
        SecurityAnalyst = @{
            Level = 1
            CanApprove = @("MonitorIP", "LogEvent", "EnableMonitoring")
            MaxRiskScore = 0.5
        }
        SecurityEngineer = @{
            Level = 2
            CanApprove = @("RateLimitIP", "UpdateWAF", "EnableThreatHunting")
            MaxRiskScore = 0.7
        }
        SecurityLead = @{
            Level = 3
            CanApprove = @("BlockIP", "EscalateIR")
            MaxRiskScore = 0.9
        }
        CISO = @{
            Level = 4
            CanApprove = "*"  # Can approve any action
            MaxRiskScore = 1.0
        }
    }
    ApprovalRules = @{
        Critical = @{
            RequiredApprovals = 2  # Number of approvals needed
            MinimumLevel = 3  # Minimum role level required
            TimeoutMinutes = 30  # How long before auto-escalation
            AutoEscalateAfter = 15  # Minutes before escalating to next level
        }
        High = @{
            RequiredApprovals = 1
            MinimumLevel = 2
            TimeoutMinutes = 60
            AutoEscalateAfter = 30
        }
        Medium = @{
            RequiredApprovals = 1
            MinimumLevel = 1
            TimeoutMinutes = 120
            AutoEscalateAfter = 60
        }
        Low = @{
            RequiredApprovals = 1
            MinimumLevel = 1
            TimeoutMinutes = 240
            AutoEscalateAfter = 120
        }
    }
    JustInTime = @{
        Enabled = $true
        ExpiryMinutes = 60
        RequireMFA = $true
        AllowedIPs = @("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")
    }
}

function New-SecurityApproval {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$DataPath
    )
    
    $approval = [PSCustomObject]@{
        DataPath = $DataPath
        Config = $script:ApprovalConfig
        PendingApprovals = [System.Collections.ArrayList]::new()
        ApprovalHistory = [System.Collections.ArrayList]::new()
        ActiveJITSessions = [System.Collections.ArrayList]::new()
    }
    
    # Add methods
    $approval | Add-Member -MemberType ScriptMethod -Name CreateApprovalRequest -Value {
        param(
            [Parameter(Mandatory=$true)]
            [hashtable]$Action,
            [Parameter(Mandatory=$true)]
            [hashtable]$Alert
        )
        
        $request = @{
            Id = [System.Guid]::NewGuid().ToString()
            Action = $Action
            Alert = $Alert
            Status = "Pending"
            Created = Get-Date
            RequiredApprovals = $this.Config.ApprovalRules[$Alert.RiskLevel].RequiredApprovals
            MinimumLevel = $this.Config.ApprovalRules[$Alert.RiskLevel].MinimumLevel
            Timeout = (Get-Date).AddMinutes($this.Config.ApprovalRules[$Alert.RiskLevel].TimeoutMinutes)
            AutoEscalateAt = (Get-Date).AddMinutes($this.Config.ApprovalRules[$Alert.RiskLevel].AutoEscalateAfter)
            Approvals = @()
            Rejections = @()
            Comments = @()
            EscalationLevel = 0
            EscalationHistory = @()
        }
        
        $this.PendingApprovals.Add($request) | Out-Null
        
        # Log the request
        $this.LogApprovalActivity(@{
            Type = "RequestCreated"
            RequestId = $request.Id
            Timestamp = Get-Date
            Details = $request
        })
        
        return $request
    }
    
    $approval | Add-Member -MemberType ScriptMethod -Name ProcessApproval -Value {
        param(
            [Parameter(Mandatory=$true)]
            [string]$RequestId,
            [Parameter(Mandatory=$true)]
            [string]$ApproverId,
            [Parameter(Mandatory=$true)]
            [string]$Role,
            [Parameter(Mandatory=$false)]
            [string]$Comment,
            [Parameter(Mandatory=$false)]
            [bool]$IsApproved = $true
        )
        
        # Find the request
        $request = $this.PendingApprovals | Where-Object { $_.Id -eq $RequestId } | Select-Object -First 1
        if (-not $request) {
            throw "Approval request not found: $RequestId"
        }
        
        # Validate role permissions
        $roleConfig = $this.Config.Roles[$Role]
        if (-not $roleConfig) {
            throw "Invalid role: $Role"
        }
        
        if ($roleConfig.Level -lt $request.MinimumLevel) {
            throw "Insufficient role level for approval"
        }
        
        # Check if action is allowed for role
        if ($roleConfig.CanApprove -ne "*" -and $roleConfig.CanApprove -notcontains $request.Action.Action) {
            throw "Action not allowed for role: $Role"
        }
        
        # Check if already approved/rejected by this approver
        if ($request.Approvals.ApproverId -contains $ApproverId -or $request.Rejections.ApproverId -contains $ApproverId) {
            throw "Already processed by approver: $ApproverId"
        }
        
        # Record the approval/rejection
        $decision = @{
            ApproverId = $ApproverId
            Role = $Role
            Timestamp = Get-Date
            Comment = $Comment
        }
        
        if ($IsApproved) {
            $request.Approvals += $decision
        } else {
            $request.Rejections += $decision
        }
        
        # Update request status
        if ($request.Rejections.Count -gt 0) {
            $request.Status = "Rejected"
        } elseif ($request.Approvals.Count -ge $request.RequiredApprovals) {
            $request.Status = "Approved"
        }
        
        # Log the approval activity
        $this.LogApprovalActivity(@{
            Type = if ($IsApproved) { "Approved" } else { "Rejected" }
            RequestId = $request.Id
            ApproverId = $ApproverId
            Role = $Role
            Timestamp = Get-Date
            Comment = $Comment
        })
        
        # Remove from pending if complete
        if ($request.Status -in @("Approved", "Rejected")) {
            $this.PendingApprovals.Remove($request)
            $this.ApprovalHistory.Add($request)
        }
        
        return $request
    }
    
    $approval | Add-Member -MemberType ScriptMethod -Name RequestJITAccess -Value {
        param(
            [Parameter(Mandatory=$true)]
            [string]$UserId,
            [Parameter(Mandatory=$true)]
            [string]$Role,
            [Parameter(Mandatory=$true)]
            [string]$Reason,
            [Parameter(Mandatory=$true)]
            [string]$SourceIP
        )
        
        if (-not $this.Config.JustInTime.Enabled) {
            throw "JIT access is not enabled"
        }
        
        # Validate IP is allowed
        $ipAllowed = $false
        foreach ($network in $this.Config.JustInTime.AllowedIPs) {
            # In real implementation, check if SourceIP is in network range
            if ($SourceIP -match $network) {
                $ipAllowed = $true
                break
            }
        }
        
        if (-not $ipAllowed) {
            throw "Source IP not allowed for JIT access: $SourceIP"
        }
        
        $session = @{
            Id = [System.Guid]::NewGuid().ToString()
            UserId = $UserId
            Role = $Role
            Reason = $Reason
            SourceIP = $SourceIP
            Created = Get-Date
            Expires = (Get-Date).AddMinutes($this.Config.JustInTime.ExpiryMinutes)
            Status = "Active"
        }
        
        $this.ActiveJITSessions.Add($session) | Out-Null
        
        # Log the JIT access request
        $this.LogApprovalActivity(@{
            Type = "JITAccessGranted"
            SessionId = $session.Id
            UserId = $UserId
            Role = $Role
            Timestamp = Get-Date
            ExpiresAt = $session.Expires
            Reason = $Reason
        })
        
        return $session
    }
    
    $approval | Add-Member -MemberType ScriptMethod -Name ValidateJITAccess -Value {
        param(
            [Parameter(Mandatory=$true)]
            [string]$SessionId,
            [Parameter(Mandatory=$true)]
            [string]$Action
        )
        
        $session = $this.ActiveJITSessions | Where-Object { $_.Id -eq $SessionId } | Select-Object -First 1
        if (-not $session) {
            return $false
        }
        
        # Check if session is expired
        if ($session.Expires -lt (Get-Date)) {
            $session.Status = "Expired"
            return $false
        }
        
        # Check if action is allowed for role
        $roleConfig = $this.Config.Roles[$session.Role]
        if (-not $roleConfig) {
            return $false
        }
        
        return $roleConfig.CanApprove -eq "*" -or $roleConfig.CanApprove -contains $Action
    }
    
    $approval | Add-Member -MemberType ScriptMethod -Name ProcessEscalations -Value {
        param()
        
        $now = Get-Date
        $escalated = @()
        
        foreach ($request in $this.PendingApprovals) {
            if ($request.Status -ne "Pending") { continue }
            
            if ($request.Timeout -lt $now) {
                # Request has timed out
                $request.Status = "TimedOut"
                $this.PendingApprovals.Remove($request)
                $this.ApprovalHistory.Add($request)
                
                $this.LogApprovalActivity(@{
                    Type = "RequestTimedOut"
                    RequestId = $request.Id
                    Timestamp = $now
                })
                
                continue
            }
            
            if ($request.AutoEscalateAt -lt $now) {
                # Time to escalate
                $request.EscalationLevel++
                $request.AutoEscalateAt = $now.AddMinutes($this.Config.ApprovalRules[$request.Alert.RiskLevel].AutoEscalateAfter)
                
                $this.LogApprovalActivity(@{
                    Type = "RequestEscalated"
                    RequestId = $request.Id
                    Timestamp = $now
                    NewLevel = $request.EscalationLevel
                })
                
                $escalated += $request
            }
        }
        
        return $escalated
    }
    
    $approval | Add-Member -MemberType ScriptMethod -Name LogApprovalActivity -Value {
        param(
            [Parameter(Mandatory=$true)]
            [hashtable]$Activity
        )
        
        # In a real implementation, this would write to a log file or database
        $logPath = Join-Path $this.DataPath "approval_logs"
        if (-not (Test-Path $logPath)) {
            New-Item -ItemType Directory -Path $logPath | Out-Null
        }
        
        $logFile = Join-Path $logPath "approvals_$(Get-Date -Format 'yyyy-MM-dd').json"
        $Activity | ConvertTo-Json -Depth 10 | Add-Content -Path $logFile
    }
    
    return $approval
}

# Export functions
Export-ModuleMember -Function @(
    'New-SecurityApproval'
) 
using namespace System.Collections.Generic

class SecurityMetrics {
    [hashtable]$AlertStats
    [hashtable]$EventStats
    [hashtable]$ResourceStats
    
    SecurityMetrics() {
        $this.AlertStats = @{
            Total = 0
            Critical = 0
            High = 0
            Medium = 0
            Low = 0
        }
        $this.EventStats = @{
            Login = @{
                Total = 0
                Failed = 0
                Suspicious = 0
            }
            API = @{
                Total = 0
                Errors = 0
                RateLimit = 0
            }
            SSL = @{
                Total = 0
                Expiring = 0
                Invalid = 0
            }
        }
        $this.ResourceStats = @{
            CPU = 0.0
            Memory = 0.0
            Disk = 0.0
            Network = 0.0
        }
    }
}

class SecurityAlert {
    [string]$Type
    [string]$Message
    [string]$Severity
    [datetime]$Timestamp

    SecurityAlert([string]$type, [string]$message, [string]$severity) {
        $this.Type = $type
        $this.Message = $message
        $this.Severity = $severity
        $this.Timestamp = Get-Date
    }
}

# Export the module
Export-ModuleMember -Function * -Variable * -Alias *

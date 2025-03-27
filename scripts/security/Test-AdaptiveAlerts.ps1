using module "./SecurityTypes.psm1"
using module "./SecurityDashboard.psm1"
using module "./SecurityTestHarness.psm1"

# Create a test configuration
$config = @{
    GeoIP = @{
        ApiKey = "test_key"
    }
    AutoRemediation = @{
        RateLimiting = @{
            RequestsPerMinute = 100
            BurstSize = 150
            BlockDuration = 300
        }
        BlockMaliciousIPs = @{
            WhitelistedIPs = @()
        }
    }
    SSLMonitoring = @{
        AutoRenew = @{
            EmailContact = "admin@example.com"
            Provider = "lets-encrypt"
        }
    }
}

# Create a mock threat intelligence provider
$threatIntel = [PSCustomObject]@{
    CheckIP = {
        param([string]$ip)
        return @{
            IP = $ip
            AbuseConfidenceScore = 90
            TotalReports = 50
            IsKnownBad = $true
            Categories = @("brute-force", "web-attack")
            Source = "test-source"
        }
    }
}

# Initialize the security dashboard
$dashboard = [SecurityDashboard]::new($config, $threatIntel)

# Run the tests
Write-Host "Starting Adaptive Alert System Tests..." -ForegroundColor Cyan
Test-SecurityAlerts -Dashboard $dashboard 
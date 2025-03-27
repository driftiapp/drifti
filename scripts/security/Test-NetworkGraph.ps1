using module "./SecurityTypes.psm1"
using module "./SecurityDashboard.psm1"
using module "./SecurityTestHarness.psm1"

# Create a test configuration
$config = @{
    GeoIP = @{
        ApiKey = "test_key"
    }
}

# Create a mock threat intelligence provider with geo-location data
$threatIntel = [PSCustomObject]@{
    CheckIP = {
        param([string]$ip)
        $geoLocations = @{
            "192.168.1.100" = "New York, US"
            "192.168.1.101" = "London, UK"
            "192.168.1.102" = "Tokyo, JP"
            "192.168.1.103" = "Sydney, AU"
            "192.168.1.104" = "Moscow, RU"
        }
        
        return @{
            IP = $ip
            AbuseConfidenceScore = 90
            TotalReports = 50
            IsKnownBad = $true
            Categories = @("brute-force", "web-attack")
            GeoLocation = $geoLocations[$ip]
            Source = "test-source"
        }
    }
}

# Initialize the security dashboard
$dashboard = [SecurityDashboard]::new($config, $threatIntel)

# Simulate a series of attacks
$events = @(
    @{
        Type = "Login"
        IP = "192.168.1.100"
        Username = "admin"
        FailedAttempts = 10
        TimeWindow = 300
    },
    @{
        Type = "API"
        IP = "192.168.1.101"
        Endpoint = "/api/admin"
        ErrorCount = 75
        TimeWindow = 300
    },
    @{
        Type = "SSL"
        IP = "192.168.1.102"
        Endpoint = "https://example.com"
        DaysRemaining = 5
    },
    @{
        Type = "Login"
        IP = "192.168.1.103"
        Username = "system"
        FailedAttempts = 15
        TimeWindow = 300
    },
    @{
        Type = "API"
        IP = "192.168.1.104"
        Endpoint = "/api/users"
        ErrorCount = 100
        TimeWindow = 300
    }
)

# Process events
Write-Host "Processing security events..." -ForegroundColor Cyan
foreach ($event in $events) {
    $dashboard.AddSecurityEvent($event)
}

# Generate and save the network graph
Write-Host "`nGenerating attack visualization..." -ForegroundColor Cyan
$graphviz = $dashboard.GenerateNetworkGraph()
$graphPath = Join-Path $PSScriptRoot "../../logs/security/attack_graph.dot"

# Create logs directory if it doesn't exist
$logsDir = Split-Path $graphPath -Parent
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# Save the GraphViz file
$graphviz | Set-Content $graphPath
Write-Host "Network graph saved to: $graphPath"

# Display attack patterns
Write-Host "`nAnalyzing attack patterns..." -ForegroundColor Cyan
$patterns = $dashboard.GetAttackPatterns()

Write-Host "`nSource IP Analysis:"
foreach ($ip in $patterns.SourceIPs.Keys) {
    $info = $patterns.SourceIPs[$ip]
    Write-Host "IP: $ip"
    Write-Host "  Location: $($info.GeoLocation)"
    Write-Host "  Attack Count: $($info.AttackCount)"
    Write-Host "  First Seen: $($info.FirstSeen)"
    Write-Host "  Last Seen: $($info.LastSeen)"
}

Write-Host "`nTarget Distribution:"
foreach ($target in $patterns.TargetDistribution.Keys) {
    Write-Host "$target : $($patterns.TargetDistribution[$target]) attacks"
}

Write-Host "`nTime-Based Patterns:"
foreach ($hour in ($patterns.TimeBasedPatterns.Keys | Sort-Object)) {
    Write-Host "Hour $hour : $($patterns.TimeBasedPatterns[$hour]) events"
}

Write-Host "`nAttack Chains:"
foreach ($chain in $patterns.AttackChains.Keys) {
    Write-Host "$chain : $($patterns.AttackChains[$chain]) occurrences"
}

# Display security metrics
Write-Host "`nSecurity Metrics:" -ForegroundColor Cyan
$metrics = $dashboard.GetSecurityMetrics()

Write-Host "`nAlert Summary:"
Write-Host "Total Alerts: $($metrics.Alerts.Total)"
Write-Host "Critical: $($metrics.Alerts.Critical)"
Write-Host "High: $($metrics.Alerts.High)"
Write-Host "Medium: $($metrics.Alerts.Medium)"
Write-Host "Low: $($metrics.Alerts.Low)"

Write-Host "`nNetwork Statistics:"
Write-Host "Unique Attackers: $($metrics.Network.UniqueAttackers)"
Write-Host "Total Attacks: $($metrics.Network.TotalAttacks)"

Write-Host "`nGeographic Distribution:"
foreach ($location in $metrics.Network.GeoDistribution.Keys) {
    Write-Host "$location : $($metrics.Network.GeoDistribution[$location]) attacks"
}

Write-Host "`nTo visualize the attack graph, install Graphviz and run:"
Write-Host "dot -Tpng $graphPath -o attack_graph.png" -ForegroundColor Yellow 
using namespace System.Collections.Generic

class ThreatIntelCache {
    [string]$RedisHost
    [int]$RedisPort
    [string]$RedisPassword
    [int]$DefaultTTL
    hidden [object]$RedisConnection

    ThreatIntelCache(
        [string]$host = "localhost",
        [int]$port = 6379,
        [string]$password = "",
        [int]$defaultTTLHours = 24
    ) {
        $this.RedisHost = $host
        $this.RedisPort = $port
        $this.RedisPassword = $password
        $this.DefaultTTL = $defaultTTLHours * 3600  # Convert to seconds
        $this.InitializeRedis()
    }

    hidden [void] InitializeRedis() {
        try {
            # Ensure StackExchange.Redis module is installed
            if (-not (Get-Module -ListAvailable -Name 'StackExchange.Redis')) {
                Install-Module -Name 'StackExchange.Redis' -Force -AllowClobber
            }

            # Build connection string
            $connectionString = "$($this.RedisHost):$($this.RedisPort)"
            if ($this.RedisPassword) {
                $connectionString += ",password=$($this.RedisPassword)"
            }

            # Connect to Redis
            $this.RedisConnection = Connect-RedisInstance -ConnectionString $connectionString
            Write-Host "✓ Connected to Redis cache" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to initialize Redis: $_"
            Write-Warning "Falling back to file-based caching"
            $this.RedisConnection = $null
        }
    }

    [object] GetCachedThreatInfo([string]$ip) {
        $key = "threat:ip:$ip"
        
        try {
            if ($this.RedisConnection) {
                $cachedData = $this.RedisConnection.GetDatabase().StringGet($key)
                if ($cachedData) {
                    return $cachedData | ConvertFrom-Json
                }
            }
            else {
                # Fallback to file-based cache
                $cacheFile = Join-Path $env:TEMP "threat_intel_cache.json"
                if (Test-Path $cacheFile) {
                    $cache = Get-Content $cacheFile | ConvertFrom-Json
                    $ipInfo = $cache.IPs.$ip
                    if ($ipInfo -and $ipInfo.ExpiresAt -gt (Get-Date).ToUniversalTime()) {
                        return $ipInfo.Data
                    }
                }
            }
        }
        catch {
            Write-Warning "Cache read error for IP $ip : $_"
        }
        
        return $null
    }

    [void] CacheThreatInfo([string]$ip, [object]$threatInfo) {
        $key = "threat:ip:$ip"
        
        try {
            if ($this.RedisConnection) {
                $jsonData = $threatInfo | ConvertTo-Json -Compress
                $this.RedisConnection.GetDatabase().StringSet($key, $jsonData, [TimeSpan]::FromSeconds($this.DefaultTTL))
            }
            else {
                # Fallback to file-based cache
                $cacheFile = Join-Path $env:TEMP "threat_intel_cache.json"
                $cache = @{ IPs = @{} }
                
                if (Test-Path $cacheFile) {
                    $cache = Get-Content $cacheFile | ConvertFrom-Json
                }
                
                $cache.IPs.$ip = @{
                    Data = $threatInfo
                    ExpiresAt = (Get-Date).AddHours($this.DefaultTTL / 3600).ToUniversalTime()
                }
                
                $cache | ConvertTo-Json -Depth 10 | Set-Content $cacheFile
            }
        }
        catch {
            Write-Warning "Cache write error for IP $ip : $_"
        }
    }

    [void] InvalidateCache([string]$ip) {
        $key = "threat:ip:$ip"
        
        try {
            if ($this.RedisConnection) {
                $this.RedisConnection.GetDatabase().KeyDelete($key)
            }
            else {
                # Fallback to file-based cache
                $cacheFile = Join-Path $env:TEMP "threat_intel_cache.json"
                if (Test-Path $cacheFile) {
                    $cache = Get-Content $cacheFile | ConvertFrom-Json
                    $cache.IPs.PSObject.Properties.Remove($ip)
                    $cache | ConvertTo-Json -Depth 10 | Set-Content $cacheFile
                }
            }
        }
        catch {
            Write-Warning "Cache invalidation error for IP $ip : $_"
        }
    }

    [void] CleanExpiredEntries() {
        try {
            if (-not $this.RedisConnection) {
                # Only needed for file-based cache as Redis handles expiration automatically
                $cacheFile = Join-Path $env:TEMP "threat_intel_cache.json"
                if (Test-Path $cacheFile) {
                    $cache = Get-Content $cacheFile | ConvertFrom-Json
                    $now = (Get-Date).ToUniversalTime()
                    
                    $expiredIPs = @()
                    foreach ($ip in $cache.IPs.PSObject.Properties) {
                        if ($ip.Value.ExpiresAt -lt $now) {
                            $expiredIPs += $ip.Name
                        }
                    }
                    
                    foreach ($ip in $expiredIPs) {
                        $cache.IPs.PSObject.Properties.Remove($ip)
                    }
                    
                    $cache | ConvertTo-Json -Depth 10 | Set-Content $cacheFile
                }
            }
        }
        catch {
            Write-Warning "Cache cleanup error: $_"
        }
    }
}

# Helper function to connect to Redis
function Connect-RedisInstance {
    param (
        [string]$ConnectionString
    )
    
    # Import StackExchange.Redis
    Import-Module StackExchange.Redis
    
    # Create connection multiplexer
    $configOptions = [StackExchange.Redis.ConfigurationOptions]::new()
    $configOptions.EndPoints.Add($ConnectionString)
    $configOptions.ConnectTimeout = 5000
    $configOptions.SyncTimeout = 5000
    
    return [StackExchange.Redis.ConnectionMultiplexer]::Connect($configOptions)
}

# Export the class
Export-ModuleMember -Function Connect-RedisInstance 
# Add module imports at the top
using module "./SecurityTypes.psm1"
using module "./ThreatIntelCache.psm1"
using namespace System.Collections.Generic

class ThreatIntelligence {
    [string]$AbuseIPDBKey
    [string]$VirusTotalKey
    hidden [ThreatIntelCache]$Cache
    
    ThreatIntelligence(
        [string]$abuseIPDBKey,
        [string]$virusTotalKey,
        [string]$redisHost = "localhost",
        [int]$redisPort = 6379,
        [string]$redisPassword = ""
    ) {
        $this.AbuseIPDBKey = $abuseIPDBKey
        $this.VirusTotalKey = $virusTotalKey
        
        # Initialize cache
        Import-Module "$PSScriptRoot/ThreatIntelCache.psm1"
        $this.Cache = [ThreatIntelCache]::new($redisHost, $redisPort, $redisPassword)
    }
    
    [IPThreatInfo] CheckIP([string]$ip) {
        # Check cache first
        $cachedInfo = $this.Cache.GetCachedThreatInfo($ip)
        if ($cachedInfo) {
            return [IPThreatInfo]$cachedInfo
        }
        
        # Query threat intelligence sources
        $threatInfo = [IPThreatInfo]::new()
        $threatInfo.IP = $ip
        
        # Query AbuseIPDB
        $abuseIPDBInfo = $this.QueryAbuseIPDB($ip)
        if ($abuseIPDBInfo) {
            $threatInfo.AbuseConfidenceScore = $abuseIPDBInfo.abuseConfidenceScore
            $threatInfo.TotalReports = $abuseIPDBInfo.totalReports
            $threatInfo.LastReportedAt = $abuseIPDBInfo.lastReportedAt
            $threatInfo.Categories = $abuseIPDBInfo.reports.categories
            $threatInfo.IsKnownBad = $threatInfo.AbuseConfidenceScore -gt 80
            $threatInfo.Source = "AbuseIPDB"
        }
        
        # Query VirusTotal if AbuseIPDB didn't find anything conclusive
        if (-not $threatInfo.IsKnownBad) {
            $virusTotalInfo = $this.QueryVirusTotal($ip)
            if ($virusTotalInfo) {
                $threatInfo.IsKnownBad = $virusTotalInfo.malicious -gt 0
                if ($threatInfo.IsKnownBad) {
                    $threatInfo.Source = "VirusTotal"
                    $threatInfo.Categories = @("malicious")
                }
            }
        }
        
        # Cache the results
        $this.Cache.CacheThreatInfo($ip, $threatInfo)
        
        return $threatInfo
    }
    
    [object] QueryAbuseIPDB([string]$ip) {
        $headers = @{
            "Key" = $this.AbuseIPDBKey
            "Accept" = "application/json"
        }
        
        try {
            $response = Invoke-RestMethod -Uri "https://api.abuseipdb.com/api/v2/check?ipAddress=$ip&maxAgeInDays=90&verbose" `
                -Headers $headers -Method Get
            return $response.data
        }
        catch {
            Write-Warning "AbuseIPDB query failed for IP $ip : $_"
            return $null
        }
    }
    
    [object] QueryVirusTotal([string]$ip) {
        $headers = @{
            "x-apikey" = $this.VirusTotalKey
            "Accept" = "application/json"
        }
        
        try {
            $response = Invoke-RestMethod -Uri "https://www.virustotal.com/api/v3/ip_addresses/$ip" `
                -Headers $headers -Method Get
            return $response.data.attributes.last_analysis_stats
        }
        catch {
            Write-Warning "VirusTotal query failed for IP $ip : $_"
            return $null
        }
    }
    
    [void] ReportIP([string]$ip, [string]$comment) {
        if (-not $this.AbuseIPDBKey) {
            Write-Warning "Cannot report IP: Missing AbuseIPDB API key"
            return
        }
        
        $headers = @{
            "Key" = $this.AbuseIPDBKey
            "Accept" = "application/json"
        }
        
        $body = @{
            ip = $ip
            categories = @(21)  # Security Policy Violation
            comment = $comment
        }
        
        try {
            Invoke-RestMethod -Uri "https://api.abuseipdb.com/api/v2/report" `
                -Headers $headers -Method Post -Body $body
            
            # Invalidate cache for this IP
            $this.Cache.InvalidateCache($ip)
        }
        catch {
            Write-Warning "Failed to report IP $ip : $_"
        }
    }
    
    [void] AnalyzeLogFile([string]$logFile) {
        if (-not (Test-Path $logFile)) {
            Write-Warning "Log file not found: $logFile"
            return
        }
        
        $ipPattern = '\b(?:\d{1,3}\.){3}\d{1,3}\b'
        $ips = Select-String -Path $logFile -Pattern $ipPattern -AllMatches | 
            ForEach-Object { $_.Matches } | 
            ForEach-Object { $_.Value } | 
            Sort-Object -Unique
        
        foreach ($ip in $ips) {
            $threatInfo = $this.CheckIP($ip)
            if ($threatInfo.IsKnownBad) {
                Write-Warning "Found malicious IP in logs: $ip (Confidence: $($threatInfo.AbuseConfidenceScore)%)"
            }
        }
    }
}

# Export the class
Export-ModuleMember -Function * 
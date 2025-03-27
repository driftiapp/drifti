using namespace System.Collections.Generic

class NetworkNode {
    [string]$ID
    [string]$Type  # IP, Endpoint, User, etc.
    [hashtable]$Properties
    [int]$Weight = 1
    [System.Drawing.Color]$Color
    
    NetworkNode([string]$id, [string]$type) {
        $this.ID = $id
        $this.Type = $type
        $this.Properties = @{}
        $this.Color = [System.Drawing.Color]::LightGray
    }
}

class NetworkEdge {
    [string]$Source
    [string]$Target
    [string]$Type  # Attack, Request, Auth, etc.
    [hashtable]$Properties
    [int]$Weight = 1
    [System.Drawing.Color]$Color
    
    NetworkEdge([string]$source, [string]$target, [string]$type) {
        $this.Source = $source
        $this.Target = $target
        $this.Type = $type
        $this.Properties = @{}
        $this.Color = [System.Drawing.Color]::Gray
    }
}

class NetworkGraph {
    [Dictionary[string, NetworkNode]]$Nodes
    [List[NetworkEdge]]$Edges
    [hashtable]$Statistics
    [TimeSpan]$TimeWindow = [TimeSpan]::FromHours(1)
    [int]$MaxNodes = 1000
    [int]$MaxEdges = 5000
    
    NetworkGraph() {
        $this.Nodes = [Dictionary[string, NetworkNode]]::new()
        $this.Edges = [List[NetworkEdge]]::new()
        $this.Statistics = @{
            TotalAttacks = 0
            UniqueAttackers = [HashSet[string]]::new()
            TopTargets = @{}
            AttackPatterns = @{}
            GeoDistribution = @{}
        }
    }
    
    [void] AddSecurityEvent([hashtable]$event) {
        $timestamp = $event.Timestamp
        $eventType = $event.Type
        $sourceIP = $event.Details.IP
        
        # Add source node (attacker IP)
        if (-not $this.Nodes.ContainsKey($sourceIP)) {
            $node = [NetworkNode]::new($sourceIP, "IP")
            $node.Properties.FirstSeen = $timestamp
            $node.Properties.LastSeen = $timestamp
            $node.Properties.AttackCount = 0
            $node.Properties.Severity = "Low"
            $this.Nodes[$sourceIP] = $node
        }
        
        $sourceNode = $this.Nodes[$sourceIP]
        $sourceNode.Properties.LastSeen = $timestamp
        $sourceNode.Properties.AttackCount++
        
        # Update node appearance based on threat level
        $sourceNode.Weight = [Math]::Min(10, [Math]::Ceiling($sourceNode.Properties.AttackCount / 10))
        $sourceNode.Color = switch ($event.Severity) {
            "Critical" { [System.Drawing.Color]::DarkRed }
            "High" { [System.Drawing.Color]::Red }
            "Medium" { [System.Drawing.Color]::Orange }
            default { [System.Drawing.Color]::Yellow }
        }
        
        # Add target node based on event type
        $targetId = switch ($eventType) {
            "Login" { $event.Details.Username }
            "API" { $event.Details.Endpoint }
            "SSL" { $event.Details.Endpoint }
            default { "system" }
        }
        
        if (-not $this.Nodes.ContainsKey($targetId)) {
            $node = [NetworkNode]::new($targetId, $eventType)
            $node.Properties.FirstSeen = $timestamp
            $node.Properties.LastSeen = $timestamp
            $node.Properties.AttackCount = 0
            $this.Nodes[$targetId] = $node
        }
        
        $targetNode = $this.Nodes[$targetId]
        $targetNode.Properties.LastSeen = $timestamp
        $targetNode.Properties.AttackCount++
        
        # Add edge
        $edge = [NetworkEdge]::new($sourceIP, $targetId, $eventType)
        $edge.Properties.Timestamp = $timestamp
        $edge.Properties.Severity = $event.Severity
        $edge.Properties.Score = $event.Score
        $edge.Weight = [Math]::Min(5, [Math]::Ceiling($event.Score / 20))
        $edge.Color = switch ($event.Severity) {
            "Critical" { [System.Drawing.Color]::DarkRed }
            "High" { [System.Drawing.Color]::Red }
            "Medium" { [System.Drawing.Color]::Orange }
            default { [System.Drawing.Color]::Yellow }
        }
        
        $this.Edges.Add($edge)
        
        # Update statistics
        $this.Statistics.TotalAttacks++
        $this.Statistics.UniqueAttackers.Add($sourceIP)
        
        if (-not $this.Statistics.TopTargets.ContainsKey($targetId)) {
            $this.Statistics.TopTargets[$targetId] = 0
        }
        $this.Statistics.TopTargets[$targetId]++
        
        $pattern = "$eventType-$($event.Severity)"
        if (-not $this.Statistics.AttackPatterns.ContainsKey($pattern)) {
            $this.Statistics.AttackPatterns[$pattern] = 0
        }
        $this.Statistics.AttackPatterns[$pattern]++
        
        # Prune old edges
        $this.PruneOldData($timestamp)
    }
    
    [void] AddGeoLocation([string]$ip, [string]$location) {
        if ($this.Nodes.ContainsKey($ip)) {
            $this.Nodes[$ip].Properties.GeoLocation = $location
            
            if (-not $this.Statistics.GeoDistribution.ContainsKey($location)) {
                $this.Statistics.GeoDistribution[$location] = 0
            }
            $this.Statistics.GeoDistribution[$location]++
        }
    }
    
    [hashtable] GetAttackPatterns() {
        $patterns = @{
            SourceIPs = @{}
            TargetDistribution = @{}
            TimeBasedPatterns = @{}
            AttackChains = @{}
        }
        
        # Analyze source IP patterns
        foreach ($node in $this.Nodes.Values | Where-Object { $_.Type -eq "IP" }) {
            $patterns.SourceIPs[$node.ID] = @{
                AttackCount = $node.Properties.AttackCount
                FirstSeen = $node.Properties.FirstSeen
                LastSeen = $node.Properties.LastSeen
                GeoLocation = $node.Properties.GeoLocation
            }
        }
        
        # Analyze target distribution
        foreach ($edge in $this.Edges) {
            $targetType = $this.Nodes[$edge.Target].Type
            if (-not $patterns.TargetDistribution.ContainsKey($targetType)) {
                $patterns.TargetDistribution[$targetType] = 0
            }
            $patterns.TargetDistribution[$targetType]++
        }
        
        # Analyze time-based patterns
        $timeSlots = @{}
        foreach ($edge in $this.Edges) {
            $hour = $edge.Properties.Timestamp.Hour
            if (-not $timeSlots.ContainsKey($hour)) {
                $timeSlots[$hour] = 0
            }
            $timeSlots[$hour]++
        }
        $patterns.TimeBasedPatterns = $timeSlots
        
        # Analyze attack chains
        $sourceEdges = $this.Edges | Group-Object Source
        foreach ($sourceGroup in $sourceEdges) {
            $chain = $sourceGroup.Group | Sort-Object { $_.Properties.Timestamp } | ForEach-Object {
                "$($this.Nodes[$_.Target].Type):$($_.Properties.Severity)"
            }
            $chainKey = $chain -join " -> "
            
            if (-not $patterns.AttackChains.ContainsKey($chainKey)) {
                $patterns.AttackChains[$chainKey] = 0
            }
            $patterns.AttackChains[$chainKey]++
        }
        
        return $patterns
    }
    
    [string] GenerateGraphViz() {
        $sb = [System.Text.StringBuilder]::new()
        [void]$sb.AppendLine("digraph SecurityGraph {")
        [void]$sb.AppendLine("  rankdir=LR;")
        [void]$sb.AppendLine("  node [style=filled];")
        
        # Add nodes
        foreach ($node in $this.Nodes.Values) {
            $color = "#{0:X2}{1:X2}{2:X2}" -f $node.Color.R, $node.Color.G, $node.Color.B
            $label = "$($node.ID)\n$($node.Type)"
            if ($node.Properties.ContainsKey("GeoLocation")) {
                $label += "\n$($node.Properties.GeoLocation)"
            }
            [void]$sb.AppendLine("  `"$($node.ID)`" [label=`"$label`",fillcolor=`"$color`",width=$($node.Weight/2)];")
        }
        
        # Add edges
        foreach ($edge in $this.Edges) {
            $color = "#{0:X2}{1:X2}{2:X2}" -f $edge.Color.R, $edge.Color.G, $edge.Color.B
            [void]$sb.AppendLine("  `"$($edge.Source)`" -> `"$($edge.Target)`" [color=`"$color`",penwidth=$($edge.Weight)];")
        }
        
        [void]$sb.AppendLine("}")
        return $sb.ToString()
    }
    
    hidden [void] PruneOldData([DateTime]$currentTime) {
        # Remove old edges
        $oldEdges = $this.Edges | Where-Object { ($currentTime - $_.Properties.Timestamp) -gt $this.TimeWindow }
        foreach ($edge in $oldEdges) {
            $this.Edges.Remove($edge)
        }
        
        # Remove orphaned nodes
        $activeNodes = [HashSet[string]]::new()
        foreach ($edge in $this.Edges) {
            $activeNodes.Add($edge.Source)
            $activeNodes.Add($edge.Target)
        }
        
        $orphanedNodes = $this.Nodes.Keys | Where-Object { -not $activeNodes.Contains($_) }
        foreach ($nodeId in $orphanedNodes) {
            $this.Nodes.Remove($nodeId)
        }
        
        # Enforce size limits
        while ($this.Nodes.Count -gt $this.MaxNodes) {
            $oldestNode = $this.Nodes.Values | Sort-Object { $_.Properties.LastSeen } | Select-Object -First 1
            $this.Nodes.Remove($oldestNode.ID)
        }
        
        while ($this.Edges.Count -gt $this.MaxEdges) {
            $this.Edges.RemoveAt(0)
        }
    }
}

# Export the module
Export-ModuleMember -Function * -Variable * -Alias * 
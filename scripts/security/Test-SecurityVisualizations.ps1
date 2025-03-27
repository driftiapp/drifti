# Import required modules
using module "./PredictiveAnalysis.psm1"
using module "./SecurityDashboard.psm1"
using module "./SecurityVisualizer.psm1"

# Create output directory if it doesn't exist
$outputPath = "security_visualizations"
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

Write-Host "`nInitializing security dashboard with visualizations..."

# Initialize security dashboard with visualizations
$dashboard = New-SecurityDashboard -outputPath $outputPath

Write-Host "`nProcessing test events..."

# Generate test events
$now = Get-Date
$testEvents = @(
    @{
        Type = "Login"
        Timestamp = $now.AddDays(-2)
        FailedAttempts = 3
        Severity = "Medium"
        IsActualThreat = $false
        RiskScore = 0.5
        Prediction = @{
            IsAnomaly = $false
            Confidence = 0.7
            ThreatLevel = "Medium"
            Insights = @(
                "Current risk score: 0.5",
                "Average risk score: 0.4"
            )
        }
    },
    @{
        Type = "Login"
        Timestamp = $now.AddDays(-1)
        FailedAttempts = 5
        Severity = "High"
        IsActualThreat = $true
        RiskScore = 0.8
        Prediction = @{
            IsAnomaly = $true
            Confidence = 0.9
            ThreatLevel = "High"
            Insights = @(
                "Current risk score: 0.8",
                "Average risk score: 0.4",
                "ANOMALY DETECTED: Risk score deviates significantly"
            )
        }
    },
    @{
        Type = "API"
        Timestamp = $now.AddHours(-15)
        FailedAttempts = 2
        Severity = "Low"
        IsActualThreat = $false
        RiskScore = 0.3
        Prediction = @{
            IsAnomaly = $false
            Confidence = 0.6
            ThreatLevel = "Low"
            Insights = @(
                "Current risk score: 0.3",
                "Average risk score: 0.4"
            )
        }
    },
    @{
        Type = "SSL"
        Timestamp = $now.AddHours(-9)
        FailedAttempts = 4
        Severity = "Medium"
        IsActualThreat = $true
        RiskScore = 0.6
        Prediction = @{
            IsAnomaly = $false
            Confidence = 0.8
            ThreatLevel = "Medium"
            Insights = @(
                "Current risk score: 0.6",
                "Average risk score: 0.5"
            )
        }
    }
)

# Process each test event
foreach ($event in $testEvents) {
    Write-Host "Adding $($event.Type) event from $($event.Timestamp)"
    try {
        $dashboard.ProcessEvent($event.Type, $event.Timestamp, $event)
    }
    catch {
        Write-Host "Error processing event: $_" -ForegroundColor Red
    }
}

Write-Host "`nGenerating security visualizations..."

# Generate visualizations
$dashboard.GenerateVisualizations()

Write-Host "`nVisualization files generated:`n"

# List generated files by type
Write-Host "Heatmaps:"
Get-ChildItem -Path $outputPath -Filter "*heatmap.html" | ForEach-Object {
    $type = $_.Name -replace "_Event_Frequency_Heatmap_heatmap.html", ""
    Write-Host "- $type : $($_.FullName)"
}

Write-Host "`nTrend Graphs:"
Get-ChildItem -Path $outputPath -Filter "*trend.html" | ForEach-Object {
    $type = $_.Name -replace "_Event_Trends_and_Predictions_trend.html", ""
    Write-Host "- $type : $($_.FullName)"
}

Write-Host "`nAnomaly Dashboard:"
Get-ChildItem -Path $outputPath -Filter "anomaly_dashboard.html" | ForEach-Object {
    Write-Host "- $($_.FullName)"
}

Write-Host "`nResource Risk Map:"
Get-ChildItem -Path $outputPath -Filter "resource_risk_map.html" | ForEach-Object {
    Write-Host "- $($_.FullName)"
}

Write-Host "`nVisualization generation complete. Files are located in: $outputPath"
Write-Host "Open the HTML files in a web browser to view the interactive visualizations." 
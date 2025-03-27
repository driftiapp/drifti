using namespace System.Collections.Generic

class SecurityVisualizer {
    hidden [string]$OutputPath
    hidden [hashtable]$ColorScheme
    hidden [hashtable]$Config
    
    SecurityVisualizer([string]$outputPath) {
        $this.OutputPath = $outputPath
        $this.ColorScheme = @{
            Heatmap = @{
                Low = "#00ff00"  # Green
                Medium = "#ffff00"  # Yellow
                High = "#ff9900"  # Orange
                Critical = "#ff0000"  # Red
            }
            TrendGraph = @{
                Actual = "#0066cc"  # Blue
                Predicted = "#ff6600"  # Orange
                Anomaly = "#ff0000"  # Red
            }
            RiskMap = @{
                Low = "#00ff00"  # Green
                Medium = "#ffff00"  # Yellow
                High = "#ff9900"  # Orange
                Critical = "#ff0000"  # Red
            }
        }
        $this.Config = @{
            HeatmapSize = @{
                Width = 800
                Height = 400
            }
            TrendGraphSize = @{
                Width = 800
                Height = 400
            }
            AnomalyDashboardSize = @{
                Width = 800
                Height = 600
            }
            RiskMapSize = @{
                Width = 800
                Height = 600
            }
        }
    }
    
    [string] GenerateHeatmap([string]$eventType, [hashtable]$patterns) {
        $outputFile = Join-Path $this.OutputPath "${eventType}_Event_Frequency_Heatmap_heatmap.html"
        
        # Create data structure for heatmap
        $hours = 0..23
        $days = 0..6
        $z = New-Object 'double[,]' 7,24
        $text = New-Object 'string[,]' 7,24
        $dayNames = @('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
        
        # Ensure patterns is not null and has Hourly property
        if ($null -eq $patterns -or -not $patterns.ContainsKey("Hourly")) {
            $patterns = @{
                Hourly = @{}
                Daily = @{}
            }
            
            # Initialize hourly counts
            0..23 | ForEach-Object {
                $patterns.Hourly[$_] = 0
            }
            
            # Initialize daily counts
            0..6 | ForEach-Object {
                $patterns.Daily[$_] = 0
            }
        }
        
        # Populate z array with actual values and create tooltip text
        foreach ($day in $days) {
            foreach ($hour in $hours) {
                $value = if ($patterns.Hourly.ContainsKey($hour)) {
                    $patterns.Hourly[$hour]
                } else {
                    0
                }
                $z[$day,$hour] = $value
                $text[$day,$hour] = "$($dayNames[$day])<br>Hour: $($hour):00<br>Events: $value"
            }
        }
        
        # Generate HTML content
        $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>$eventType Event Frequency Heatmap</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        .control-panel {
            margin: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f8f9fa;
        }
        .filter-group {
            margin: 10px 0;
        }
        select, input {
            margin: 5px;
            padding: 5px;
            border-radius: 3px;
            border: 1px solid #ccc;
        }
        button {
            padding: 8px 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="control-panel">
        <div class="filter-group">
            <label>Day Filter:</label>
            <select id="dayFilter" multiple>
                <option value="all" selected>All Days</option>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Hour Range:</label>
            <input type="number" id="startHour" min="0" max="23" value="0" /> to
            <input type="number" id="endHour" min="0" max="23" value="23" />
        </div>
        <div class="filter-group">
            <label>Minimum Events:</label>
            <input type="number" id="minEvents" min="0" value="0" />
        </div>
        <button onclick="applyFilters()">Apply Filters</button>
        <button onclick="resetFilters()">Reset</button>
    </div>
    <div id="heatmap"></div>
    <script>
        var originalData = {
            z: $($z | ConvertTo-Json),
            text: $($text | ConvertTo-Json),
            x: $(0..23 | ConvertTo-Json),
            y: $($dayNames | ConvertTo-Json)
        };
        
        var data = [{
            z: originalData.z,
            text: originalData.text,
            x: originalData.x,
            y: originalData.y,
            type: 'heatmap',
            hoverongaps: false,
            hoverinfo: 'text',
            colorscale: [
                [0, '$($this.ColorScheme.Heatmap.Low)'],
                [0.33, '$($this.ColorScheme.Heatmap.Medium)'],
                [0.66, '$($this.ColorScheme.Heatmap.High)'],
                [1, '$($this.ColorScheme.Heatmap.Critical)']
            ]
        }];
        
        var layout = {
            title: {
                text: '$eventType Event Frequency Heatmap',
                font: { size: 24 }
            },
            width: $($this.Config.HeatmapSize.Width),
            height: $($this.Config.HeatmapSize.Height),
            xaxis: {
                title: 'Hour of Day',
                ticktext: Array.from({length: 24}, (_, i) => i + ':00'),
                tickvals: Array.from({length: 24}, (_, i) => i)
            },
            yaxis: {
                title: 'Day of Week'
            },
            annotations: [{
                x: 1.15,
                y: 1.05,
                xref: 'paper',
                yref: 'paper',
                text: 'Events per Hour',
                showarrow: false
            }]
        };
        
        var config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtons: [[
                'zoom2d',
                'pan2d',
                'resetScale2d',
                'toImage'
            ]],
            displaylogo: false
        };
        
        Plotly.newPlot('heatmap', data, layout, config);
        
        function applyFilters() {
            var dayFilter = Array.from(document.getElementById('dayFilter').selectedOptions)
                .map(option => option.value);
            var startHour = parseInt(document.getElementById('startHour').value);
            var endHour = parseInt(document.getElementById('endHour').value);
            var minEvents = parseInt(document.getElementById('minEvents').value);
            
            // Create filtered data
            var filteredZ = JSON.parse(JSON.stringify(originalData.z));
            var filteredText = JSON.parse(JSON.stringify(originalData.text));
            
            // Apply filters
            for (var day = 0; day < 7; day++) {
                for (var hour = 0; hour < 24; hour++) {
                    if (
                        (dayFilter[0] !== 'all' && !dayFilter.includes(day.toString())) ||
                        hour < startHour || hour > endHour ||
                        filteredZ[day][hour] < minEvents
                    ) {
                        filteredZ[day][hour] = null;
                    }
                }
            }
            
            // Update the plot
            Plotly.update('heatmap', {
                z: [filteredZ],
                text: [filteredText]
            });
        }
        
        function resetFilters() {
            document.getElementById('dayFilter').value = ['all'];
            document.getElementById('startHour').value = 0;
            document.getElementById('endHour').value = 23;
            document.getElementById('minEvents').value = 0;
            
            Plotly.update('heatmap', {
                z: [originalData.z],
                text: [originalData.text]
            });
        }
    </script>
</body>
</html>
"@
        
        Set-Content -Path $outputFile -Value $htmlContent
        return $outputFile
    }
    
    [string] GenerateTrendGraph([string]$eventType, $events, [hashtable]$predictions = $null) {
        $outputFile = Join-Path $this.OutputPath "${eventType}_Event_Trends_and_Predictions_trend.html"
        
        # Process events into time series
        $timeSeriesData = @()
        $now = Get-Date
        $startTime = $now.AddDays(-7)
        
        # Handle both array and hashtable inputs with enhanced metrics
        if ($events -is [array]) {
            # Group events by hour with additional metrics
            $groupedEvents = $events | Group-Object { $_.Timestamp.ToString("yyyy-MM-dd HH:00") }
            
            # Create hourly time series with risk metrics
            $current = $startTime
            while ($current -lt $now) {
                $key = $current.ToString("yyyy-MM-dd HH:00")
                $eventsInHour = $groupedEvents | Where-Object { $_.Name -eq $key }
                $count = if ($eventsInHour) { $eventsInHour.Count } else { 0 }
                
                # Calculate risk metrics
                $riskScores = $eventsInHour.Group.RiskScore
                $avgRisk = if ($riskScores) {
                    ($riskScores | Measure-Object -Average).Average
                } else { 0.0 }
                
                $maxRisk = if ($riskScores) {
                    ($riskScores | Measure-Object -Maximum).Maximum
                } else { 0.0 }
                
                $timeSeriesData += @{
                    x = $current.ToString("yyyy-MM-dd HH:mm:ss")
                    y = [double]$count
                    avgRisk = [double]$avgRisk
                    maxRisk = [double]$maxRisk
                    eventCount = $count
                }
                $current = $current.AddHours(1)
            }
        } else {
            # Handle hashtable input (hourly counts) with risk metrics
            $current = $startTime
            while ($current -lt $now) {
                $hour = $current.Hour
                $count = if ($events.ContainsKey($hour)) { [double]$events[$hour] } else { 0.0 }
                $timeSeriesData += @{
                    x = $current.ToString("yyyy-MM-dd HH:mm:ss")
                    y = $count
                    avgRisk = 0.0  # Default risk metrics for hashtable input
                    maxRisk = 0.0
                    eventCount = [int]$count
                }
                $current = $current.AddHours(1)
            }
        }
        
        # Process predictions if available with confidence intervals
        $predictionData = @()
        $confidenceIntervals = @()
        if ($null -ne $predictions -and $predictions.ContainsKey("TemporalPatterns") -and 
            $predictions.TemporalPatterns.ContainsKey("HourlyTrend")) {
            $current = $now
            foreach ($pred in $predictions.TemporalPatterns.HourlyTrend.GetEnumerator()) {
                $baseValue = [double]$pred.Value
                $confidence = if ($predictions.Confidence) { [double]$predictions.Confidence } else { 0.5 }
                
                $predictionData += @{
                    x = $current.ToString("yyyy-MM-dd HH:mm:ss")
                    y = $baseValue
                    confidence = $confidence
                }
                
                # Calculate confidence intervals
                $margin = $baseValue * (1 - $confidence)
                $confidenceIntervals += @{
                    x = $current.ToString("yyyy-MM-dd HH:mm:ss")
                    y = $baseValue
                    upper = $baseValue + $margin
                    lower = [Math]::Max(0, $baseValue - $margin)
                }
                
                $current = $current.AddHours(1)
            }
        }
        
        # Generate HTML content with enhanced interactivity
        $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>$eventType Event Trends and Predictions</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .dashboard-container {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .chart-container {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metrics-panel {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-card {
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
            background-color: #f8f9fa;
        }
        .metric-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 24px;
            color: #007bff;
        }
        .control-panel {
            grid-column: 1 / -1;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .view-options {
            margin: 10px 0;
        }
        .checkbox-group {
            margin: 5px 0;
        }
        button {
            padding: 8px 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            margin: 0 5px;
        }
        button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="chart-container">
            <div id="trendgraph"></div>
        </div>
        <div class="metrics-panel">
            <h3>Real-Time Metrics</h3>
            <div class="metric-card">
                <div class="metric-title">Current Event Rate</div>
                <div id="eventRate" class="metric-value">0</div>
                <div>events/hour</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Average Risk Score</div>
                <div id="avgRisk" class="metric-value">0</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Peak Risk Score</div>
                <div id="maxRisk" class="metric-value">0</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Prediction Accuracy</div>
                <div id="predAccuracy" class="metric-value">N/A</div>
            </div>
        </div>
        <div class="control-panel">
            <div class="view-options">
                <div class="checkbox-group">
                    <input type="checkbox" id="showActual" checked>
                    <label for="showActual">Show Actual Events</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="showPredicted" checked>
                    <label for="showPredicted">Show Predictions</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="showConfidence" checked>
                    <label for="showConfidence">Show Confidence Intervals</label>
                </div>
            </div>
            <div>
                <button onclick="zoomLastHour()">Last Hour</button>
                <button onclick="zoomLastDay()">Last 24 Hours</button>
                <button onclick="zoomLastWeek()">Last Week</button>
                <button onclick="resetZoom()">Reset Zoom</button>
            </div>
        </div>
    </div>
    <script>
        // Initialize data
        var timeSeriesData = $(($timeSeriesData | ConvertTo-Json -Depth 10));
        var predictionData = $(($predictionData | ConvertTo-Json -Depth 10));
        var confidenceIntervals = $(($confidenceIntervals | ConvertTo-Json -Depth 10));
        
        // Create base traces
        var traces = [{
            x: timeSeriesData.map(d => d.x),
            y: timeSeriesData.map(d => d.y),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Actual Events',
            line: {
                color: '$($this.ColorScheme.TrendGraph.Actual)',
                width: 2
            },
            marker: {
                size: 6
            },
            hovertemplate: '%{x}<br>Events: %{y}<br>Avg Risk: %{customdata[0]:.2f}<br>Max Risk: %{customdata[1]:.2f}<extra></extra>',
            customdata: timeSeriesData.map(d => [d.avgRisk, d.maxRisk])
        }];
        
        // Add prediction trace if available
        if (predictionData.length > 0) {
            traces.push({
                x: predictionData.map(d => d.x),
                y: predictionData.map(d => d.y),
                type: 'scatter',
                mode: 'lines',
                name: 'Predicted Events',
                line: {
                    color: '$($this.ColorScheme.TrendGraph.Predicted)',
                    width: 2,
                    dash: 'dot'
                },
                hovertemplate: '%{x}<br>Predicted: %{y:.1f}<br>Confidence: %{customdata[0]:.0%}<extra></extra>',
                customdata: predictionData.map(d => [d.confidence])
            });
        }
        
        // Add confidence interval traces if available
        if (confidenceIntervals.length > 0) {
            traces.push({
                x: confidenceIntervals.map(d => d.x),
                y: confidenceIntervals.map(d => d.upper),
                type: 'scatter',
                mode: 'lines',
                name: 'Upper Bound',
                line: {
                    color: '$($this.ColorScheme.TrendGraph.Predicted)',
                    width: 0
                },
                showlegend: false
            });
            
            traces.push({
                x: confidenceIntervals.map(d => d.x),
                y: confidenceIntervals.map(d => d.lower),
                type: 'scatter',
                mode: 'lines',
                name: 'Lower Bound',
                line: {
                    color: '$($this.ColorScheme.TrendGraph.Predicted)',
                    width: 0
                },
                fill: 'tonexty',
                fillcolor: 'rgba(255, 102, 0, 0.2)',
                showlegend: false
            });
        }
        
        var layout = {
            title: {
                text: '$eventType Event Trends and Predictions',
                font: { size: 24 }
            },
            xaxis: {
                title: 'Time',
                rangeslider: {}
            },
            yaxis: {
                title: 'Event Count'
            },
            showlegend: true,
            legend: {
                x: 1.1,
                y: 1
            }
        };
        
        var config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtons: [[
                'zoom2d',
                'pan2d',
                'resetScale2d',
                'toImage'
            ]],
            displaylogo: false
        };
        
        Plotly.newPlot('trendgraph', traces, layout, config);
        
        // Update real-time metrics
        function updateMetrics() {
            const latest = timeSeriesData[timeSeriesData.length - 1];
            document.getElementById('eventRate').textContent = latest.eventCount;
            document.getElementById('avgRisk').textContent = latest.avgRisk.toFixed(2);
            document.getElementById('maxRisk').textContent = latest.maxRisk.toFixed(2);
            
            // Calculate prediction accuracy if we have predictions
            if (predictionData.length > 0) {
                const actualValues = timeSeriesData.slice(-predictionData.length);
                const predictedValues = predictionData;
                let totalError = 0;
                let count = 0;
                
                for (let i = 0; i < Math.min(actualValues.length, predictedValues.length); i++) {
                    if (actualValues[i] && predictedValues[i]) {
                        totalError += Math.abs(actualValues[i].y - predictedValues[i].y);
                        count++;
                    }
                }
                
                const accuracy = count > 0 ? (1 - (totalError / count)).toFixed(2) : 'N/A';
                document.getElementById('predAccuracy').textContent = accuracy;
            }
        }
        
        // Add event listeners for view options
        document.getElementById('showActual').addEventListener('change', function(e) {
            Plotly.restyle('trendgraph', {visible: e.target.checked}, [0]);
        });
        
        document.getElementById('showPredicted').addEventListener('change', function(e) {
            const indices = predictionData.length > 0 ? [1] : [];
            Plotly.restyle('trendgraph', {visible: e.target.checked}, indices);
        });
        
        document.getElementById('showConfidence').addEventListener('change', function(e) {
            const indices = confidenceIntervals.length > 0 ? [2, 3] : [];
            Plotly.restyle('trendgraph', {visible: e.target.checked}, indices);
        });
        
        // Zoom functions
        function zoomLastHour() {
            var now = new Date();
            var hourAgo = new Date(now - 60 * 60 * 1000);
            Plotly.relayout('trendgraph', {
                'xaxis.range': [hourAgo, now]
            });
        }
        
        function zoomLastDay() {
            var now = new Date();
            var dayAgo = new Date(now - 24 * 60 * 60 * 1000);
            Plotly.relayout('trendgraph', {
                'xaxis.range': [dayAgo, now]
            });
        }
        
        function zoomLastWeek() {
            var now = new Date();
            var weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            Plotly.relayout('trendgraph', {
                'xaxis.range': [weekAgo, now]
            });
        }
        
        function resetZoom() {
            Plotly.relayout('trendgraph', {
                'xaxis.autorange': true
            });
        }
        
        // Initialize metrics
        updateMetrics();
        
        // Set up real-time updates (every 60 seconds)
        setInterval(function() {
            // In a real implementation, this would fetch new data from the server
            // For now, we'll just update the display
            updateMetrics();
        }, 60000);
    </script>
</body>
</html>
"@
        
        Set-Content -Path $outputFile -Value $htmlContent
        return $outputFile
    }
    
    [string] GenerateAnomalyDashboard([hashtable]$anomalyData) {
        $outputFile = Join-Path $this.OutputPath "anomaly_dashboard.html"
        
        # Get AI predictions if we have historical data
        $predictions = $null
        if ($null -ne $anomalyData -and $anomalyData.Count -gt 0) {
            $historicalData = @()
            foreach ($type in $anomalyData.Keys) {
                if ($null -ne $anomalyData[$type].Events) {
                    $historicalData += $anomalyData[$type].Events
                }
            }
            if ($historicalData.Count -gt 0) {
                $predictions = $this.PredictRiskTrends($historicalData)
            }
        }
        
        # Initialize empty data structures if anomalyData is null
        if ($null -eq $anomalyData) {
            $anomalyData = @{}
        }
        
        # Process anomaly data into visualization format
        [array]$eventTypes = @($anomalyData.Keys)
        [hashtable]$timeSeriesData = @{}
        [hashtable]$anomalyScores = @{}
        [hashtable]$riskPredictions = @{}
        
        # Initialize empty data structures if no event types
        if ($eventTypes.Count -eq 0) {
            $eventTypes = @("Login", "API", "SSL")  # Default event types
            foreach ($type in $eventTypes) {
                $timeSeriesData[$type] = @{ x = @(); y = @() }
                $anomalyScores[$type] = @{ x = @(); y = @(); score = @() }
                $riskPredictions[$type] = @{
                    shortTerm = @{ risk = 0.0; confidence = 0.5 }
                    longTerm = @{ risk = 0.0; confidence = 0.5 }
                }
            }
        }
        
        # Process each event type
        foreach ($type in $eventTypes) {
            $timeSeriesData[$type] = @{
                x = @()
                y = @()
            }
            $anomalyScores[$type] = @{
                x = @()
                y = @()
                score = @()
            }
            
            # Ensure RiskScores exists and is an array
            if ($null -eq $anomalyData[$type]) {
                $anomalyData[$type] = @{
                    RiskScores = @()
                    Predictions = @()
                }
            }
            
            if ($null -eq $anomalyData[$type].RiskScores) {
                $anomalyData[$type].RiskScores = @()
            }
            
            # Calculate average and standard deviation for normal behavior
            $riskScores = if ($anomalyData[$type].RiskScores -is [array]) {
                $anomalyData[$type].RiskScores
            } else {
                @()
            }
            
            $avgRisk = if ($riskScores.Count -gt 0) {
                ($riskScores | Measure-Object -Average).Average
            } else {
                0
            }
            
            $stdDev = if ($riskScores.Count -gt 1) {
                [Math]::Sqrt(($riskScores | ForEach-Object { [Math]::Pow($_ - $avgRisk, 2) } | Measure-Object -Average).Average)
            } else {
                0
            }
            
            # Process predictions and identify anomalies
            $now = Get-Date
            $startTime = $now.AddHours(-$riskScores.Count)
            for ($i = 0; $i -lt $riskScores.Count; $i++) {
                $timestamp = $startTime.AddHours($i)
                $timeSeriesData[$type].x += $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
                $timeSeriesData[$type].y += $riskScores[$i]
                
                # Calculate z-score for anomaly detection
                $zScore = if ($stdDev -ne 0) {
                    [Math]::Abs(($riskScores[$i] - $avgRisk) / $stdDev)
                } else {
                    0
                }
                
                if ($zScore -gt 2) {  # More than 2 standard deviations from mean
                    $anomalyScores[$type].x += $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
                    $anomalyScores[$type].y += $riskScores[$i]
                    $anomalyScores[$type].score += $zScore
                }
            }
            
            # Add prediction data if available
            if ($null -ne $predictions -and $predictions.ShortTerm.ContainsKey($type)) {
                $riskPredictions[$type] = @{
                    shortTerm = @{
                        risk = $predictions.ShortTerm[$type]
                        confidence = $predictions.Confidence[$type]
                    }
                    longTerm = @{
                        risk = $predictions.LongTerm[$type]
                        confidence = $predictions.Confidence[$type]
                    }
                    factors = $predictions.Factors[$type]
                }
            }
        }
        
        # Generate HTML content
        $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Security Anomaly Dashboard</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .dashboard-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .control-panel {
            grid-column: 1 / -1;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .chart-container {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .filter-group {
            margin: 10px 0;
        }
        select, input {
            margin: 5px;
            padding: 5px;
            border-radius: 3px;
            border: 1px solid #ccc;
        }
        button {
            padding: 8px 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            margin: 0 5px;
        }
        button:hover {
            background-color: #0056b3;
        }
        .threshold-slider {
            width: 200px;
        }
        #anomalyDetails {
            grid-column: 1 / -1;
            display: none;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .prediction-panel {
            grid-column: 1 / -1;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 20px;
        }
        
        .prediction-card {
            display: inline-block;
            width: calc(50% - 40px);
            margin: 10px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        
        .risk-factor {
            margin: 5px 0;
            padding: 5px;
            background-color: #fff;
            border-radius: 3px;
        }
        
        .confidence-bar {
            height: 5px;
            background-color: #e9ecef;
            border-radius: 2px;
            margin-top: 5px;
        }
        
        .confidence-level {
            height: 100%;
            background-color: #007bff;
            border-radius: 2px;
        }
        
        .risk-level {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            color: white;
            font-weight: bold;
        }
        
        .risk-low { background-color: $($this.ColorScheme.RiskMap.Low); }
        .risk-medium { background-color: $($this.ColorScheme.RiskMap.Medium); }
        .risk-high { background-color: $($this.ColorScheme.RiskMap.High); }
        .risk-critical { background-color: $($this.ColorScheme.RiskMap.Critical); }
    </style>
</head>
<body>
    <div class="control-panel">
        <div class="filter-group">
            <label>Event Type:</label>
            <select id="eventTypeFilter" onchange="updateDashboard()">
                <option value="all">All Events</option>
                $(foreach ($type in $eventTypes) {
                    "                <option value=`"$type`">$type</option>"
                })
            </select>
        </div>
        <div class="filter-group">
            <label>Anomaly Threshold (Z-Score):</label>
            <input type="range" id="anomalyThreshold" class="threshold-slider" 
                   min="1" max="4" step="0.1" value="2" oninput="updateThreshold()">
            <span id="thresholdValue">2.0</span>
        </div>
        <div class="filter-group">
            <label>Time Range:</label>
            <select id="timeRange" onchange="updateTimeRange()">
                <option value="1">Last Hour</option>
                <option value="24">Last 24 Hours</option>
                <option value="168" selected>Last Week</option>
            </select>
        </div>
    </div>
    
    <div class="dashboard-container">
        <div class="chart-container">
            <div id="timeSeriesChart"></div>
        </div>
        <div class="chart-container">
            <div id="anomalyScatterPlot"></div>
        </div>
        <div id="anomalyDetails">
            <h3>Anomaly Details</h3>
            <div id="anomalyContext"></div>
        </div>
    </div>
    
    <div class="prediction-panel">
        <h3>AI Risk Predictions</h3>
        <div id="predictions"></div>
    </div>
    
    <script>
        // Store the original data
        var originalData = {
            eventTypes: $(ConvertTo-Json $eventTypes -Compress),
            timeSeries: $(ConvertTo-Json $timeSeriesData -Depth 10 -Compress),
            anomalies: $(ConvertTo-Json $anomalyScores -Depth 10 -Compress),
            predictions: $(ConvertTo-Json $riskPredictions -Depth 10 -Compress)
        };
        
        // Initialize the dashboard
        function initDashboard() {
            updateDashboard();
            setupEventListeners();
        }
        
        // Update the dashboard based on current filters
        function updateDashboard() {
            var eventType = document.getElementById('eventTypeFilter').value;
            var threshold = parseFloat(document.getElementById('anomalyThreshold').value);
            
            // Update time series chart
            var timeSeriesTraces = [];
            if (eventType === 'all') {
                Object.keys(originalData.timeSeries).forEach(type => {
                    if (originalData.timeSeries[type] && originalData.timeSeries[type].x && originalData.timeSeries[type].y) {
                        timeSeriesTraces.push({
                            x: originalData.timeSeries[type].x,
                            y: originalData.timeSeries[type].y,
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: type,
                            hovertemplate: '%{x}<br>Risk Score: %{y}<extra></extra>'
                        });
                    }
                });
            } else if (originalData.timeSeries[eventType] && originalData.timeSeries[eventType].x && originalData.timeSeries[eventType].y) {
                timeSeriesTraces.push({
                    x: originalData.timeSeries[eventType].x,
                    y: originalData.timeSeries[eventType].y,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: eventType,
                    hovertemplate: '%{x}<br>Risk Score: %{y}<extra></extra>'
                });
            }
            
            var timeSeriesLayout = {
                title: 'Event Risk Scores Over Time',
                xaxis: { title: 'Time' },
                yaxis: { title: 'Risk Score' },
                showlegend: true,
                legend: { x: 1.1, y: 1 }
            };
            
            Plotly.newPlot('timeSeriesChart', timeSeriesTraces, timeSeriesLayout);
            
            // Update anomaly scatter plot
            var anomalyTraces = [];
            if (eventType === 'all') {
                Object.keys(originalData.anomalies).forEach(type => {
                    if (originalData.anomalies[type] && originalData.anomalies[type].x && originalData.anomalies[type].score) {
                        anomalyTraces.push({
                            x: originalData.anomalies[type].x,
                            y: originalData.anomalies[type].score,
                            type: 'scatter',
                            mode: 'markers',
                            name: type,
                            marker: {
                                size: 10,
                                color: originalData.anomalies[type].score,
                                colorscale: [
                                    [0, '$($this.ColorScheme.RiskMap.Low)'],
                                    [0.5, '$($this.ColorScheme.RiskMap.Medium)'],
                                    [1, '$($this.ColorScheme.RiskMap.Critical)']
                                ]
                            },
                            hovertemplate: '%{x}<br>Z-Score: %{y}<extra></extra>'
                        });
                    }
                });
            } else if (originalData.anomalies[eventType] && originalData.anomalies[eventType].x && originalData.anomalies[eventType].score) {
                anomalyTraces.push({
                    x: originalData.anomalies[eventType].x,
                    y: originalData.anomalies[eventType].score,
                    type: 'scatter',
                    mode: 'markers',
                    name: eventType,
                    marker: {
                        size: 10,
                        color: originalData.anomalies[eventType].score,
                        colorscale: [
                            [0, '$($this.ColorScheme.RiskMap.Low)'],
                            [0.5, '$($this.ColorScheme.RiskMap.Medium)'],
                            [1, '$($this.ColorScheme.RiskMap.Critical)']
                        ]
                    },
                    hovertemplate: '%{x}<br>Z-Score: %{y}<extra></extra>'
                });
            }
            
            var anomalyLayout = {
                title: 'Anomaly Detection',
                xaxis: { title: 'Time' },
                yaxis: { title: 'Z-Score' },
                showlegend: true,
                legend: { x: 1.1, y: 1 }
            };
            
            Plotly.newPlot('anomalyScatterPlot', anomalyTraces, anomalyLayout);
            
            // Add predictions if available
            if (originalData.predictions && Object.keys(originalData.predictions).length > 0) {
                Object.keys(originalData.predictions).forEach(type => {
                    if (eventType === 'all' || eventType === type) {
                        if (originalData.predictions[type] && originalData.predictions[type].x && originalData.predictions[type].y) {
                            timeSeriesTraces.push({
                                x: originalData.predictions[type].x,
                                y: originalData.predictions[type].y,
                                type: 'scatter',
                                mode: 'lines',
                                name: type + ' (Predicted)',
                                line: { dash: 'dot' },
                                hovertemplate: '%{x}<br>Predicted Risk: %{y}<extra></extra>'
                            });
                        }
                    }
                });
                
                Plotly.newPlot('timeSeriesChart', timeSeriesTraces, timeSeriesLayout);
            }
        }
        
        // Update threshold display value
        function updateThreshold() {
            var threshold = document.getElementById('anomalyThreshold').value;
            document.getElementById('thresholdValue').textContent = threshold;
            updateDashboard();
        }
        
        // Update time range
        function updateTimeRange() {
            var hours = parseInt(document.getElementById('timeRange').value);
            var now = new Date();
            var start = new Date(now - hours * 60 * 60 * 1000);
            
            Plotly.relayout('timeSeriesChart', {
                'xaxis.range': [start, now]
            });
            
            Plotly.relayout('anomalyScatterPlot', {
                'xaxis.range': [start, now]
            });
        }
        
        // Setup event listeners
        function setupEventListeners() {
            document.getElementById('anomalyScatterPlot').on('plotly_click', function(data) {
                if (data.points.length > 0) {
                    var point = data.points[0];
                    showAnomalyDetails(point);
                }
            });
        }
        
        // Show anomaly details
        function showAnomalyDetails(point) {
            var details = document.getElementById('anomalyDetails');
            var context = document.getElementById('anomalyContext');
            
            context.innerHTML = [
                '<p><strong>Time:</strong> ' + point.x + '</p>',
                '<p><strong>Z-Score:</strong> ' + point.y.toFixed(2) + '</p>',
                '<p><strong>Event Type:</strong> ' + point.data.name + '</p>'
            ].join('\n');
            
            details.style.display = 'block';
        }
        
        // Initialize the dashboard when the page loads
        window.onload = initDashboard;
        
        // Initialize predictions
        function initPredictions() {
            var predictions = $(ConvertTo-Json $riskPredictions -Depth 10);
            var container = document.getElementById('predictions');
            
            Object.keys(predictions).forEach(type => {
                var pred = predictions[type];
                var card = document.createElement('div');
                card.className = 'prediction-card';
                
                // Create prediction content
                var content = [
                    '<h4>' + type + '</h4>',
                    '<div class="risk-factor">',
                    '    <strong>Short-term Risk (24h):</strong>',
                    '    <span class="risk-level ' + getRiskLevelClass(pred.shortTerm.risk) + '">',
                    '        ' + (pred.shortTerm.risk * 100).toFixed(1) + '%',
                    '    </span>',
                    '    <div class="confidence-bar">',
                    '        <div class="confidence-level" style="width: ' + (pred.shortTerm.confidence * 100) + '%"></div>',
                    '    </div>',
                    '</div>',
                    '<div class="risk-factor">',
                    '    <strong>Long-term Risk (7d):</strong>',
                    '    <span class="risk-level ' + getRiskLevelClass(pred.longTerm.risk) + '">',
                    '        ' + (pred.longTerm.risk * 100).toFixed(1) + '%',
                    '    </span>',
                    '    <div class="confidence-bar">',
                    '        <div class="confidence-level" style="width: ' + (pred.longTerm.confidence * 100) + '%"></div>',
                    '    </div>',
                    '</div>'
                ];
                
                // Add risk factors if available
                if (pred.factors) {
                    content.push('<div class="risk-factor">');
                    content.push('    <strong>Key Risk Factors:</strong>');
                    content.push('    <ul>');
                    if (pred.factors.AnomalyFrequency > 0) {
                        content.push('        <li>Anomaly Frequency: ' + pred.factors.AnomalyFrequency + '</li>');
                    }
                    if (pred.factors.RiskDistribution) {
                        const total = Object.values(pred.factors.RiskDistribution).reduce((a, b) => a + b, 0);
                        if (total > 0) {
                            const criticalPct = (pred.factors.RiskDistribution.Critical / total * 100).toFixed(1);
                            const highPct = (pred.factors.RiskDistribution.High / total * 100).toFixed(1);
                            content.push('        <li>Critical Events: ' + criticalPct + '%</li>');
                            content.push('        <li>High-Risk Events: ' + highPct + '%</li>');
                        }
                    }
                    content.push('    </ul>');
                    content.push('</div>');
                }
                
                card.innerHTML = content.join('\n');
                container.appendChild(card);
            });
        }
        
        function getRiskLevelClass(risk) {
            if (risk >= 0.8) return 'risk-critical';
            if (risk >= 0.6) return 'risk-high';
            if (risk >= 0.4) return 'risk-medium';
            return 'risk-low';
        }
        
        // Initialize predictions when the page loads
        window.addEventListener('load', function() {
            initPredictions();
        });
    </script>
</body>
</html>
"@
        
        Set-Content -Path $outputFile -Value $htmlContent
        return $outputFile
    }
    
    [string] GenerateResourceRiskMap([hashtable]$resourceData) {
        $outputFile = Join-Path $this.OutputPath "resource_risk_map.html"
        
        # Process resource risks into visualization data
        $nodes = @()
        $edges = @()
        $nodeIndex = 0
        
        foreach ($eventType in $resourceData.Keys) {
            $data = $resourceData[$eventType]
            $risk = $data.AverageRisk
            $color = if ($risk -ge 0.8) {
                $this.ColorScheme.RiskMap.Critical
            } elseif ($risk -ge 0.6) {
                $this.ColorScheme.RiskMap.High
            } elseif ($risk -ge 0.4) {
                $this.ColorScheme.RiskMap.Medium
            } else {
                $this.ColorScheme.RiskMap.Low
            }
            
            $nodes += @{
                id = $nodeIndex
                label = "$eventType (Events: $($data.TotalEvents))"
                color = $color
                value = $risk
            }
            $nodeIndex++
        }
        
        # Generate HTML content
        $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Resource Risk Map</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .chart-container {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #details {
            margin-top: 20px;
            padding: 15px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: none;
        }
    </style>
</head>
<body>
    <div class="chart-container">
        <div id="riskmap"></div>
    </div>
    <div id="details">
        <h3>Resource Details</h3>
        <div id="detailContent"></div>
    </div>
    <script>
        var data = [{
            type: 'scatter',
            mode: 'markers',
            x: $(($nodes | Select-Object -ExpandProperty id) | ConvertTo-Json),
            y: $(($nodes | Select-Object -ExpandProperty value) | ConvertTo-Json),
            text: $(($nodes | Select-Object -ExpandProperty label) | ConvertTo-Json),
            marker: {
                size: 30,
                color: $(($nodes | Select-Object -ExpandProperty color) | ConvertTo-Json),
                line: {
                    color: 'black',
                    width: 1
                }
            },
            hovertemplate: '%{text}<br>Risk Score: %{y:.2f}<extra></extra>'
        }];
        
        var layout = {
            title: {
                text: 'Resource Risk Map',
                font: { size: 24 }
            },
            width: $($this.Config.RiskMapSize.Width),
            height: $($this.Config.RiskMapSize.Height),
            xaxis: {
                title: 'Resource Index',
                showticklabels: false
            },
            yaxis: {
                title: 'Risk Score',
                range: [0, 1]
            },
            showlegend: false
        };
        
        var config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtons: [[
                'zoom2d',
                'pan2d',
                'resetScale2d',
                'toImage'
            ]],
            displaylogo: false
        };
        
        var plot = document.getElementById('riskmap');
        Plotly.newPlot('riskmap', data, layout, config);
        
        // Add click event handler
        plot.on('plotly_click', function(data) {
            var point = data.points[0];
            var details = document.getElementById('details');
            var content = document.getElementById('detailContent');
            
            details.style.display = 'block';
            content.innerHTML = '<p><strong>Resource:</strong> ' + point.text + '</p>' +
                '<p><strong>Risk Score:</strong> ' + point.y.toFixed(2) + '</p>' +
                '<p><strong>Risk Level:</strong> ' + getRiskLevel(point.y) + '</p>';
        });
        
        function getRiskLevel(risk) {
            if (risk >= 0.8) return 'Critical';
            if (risk >= 0.6) return 'High';
            if (risk >= 0.4) return 'Medium';
            return 'Low';
        }
    </script>
</body>
</html>
"@
        
        Set-Content -Path $outputFile -Value $htmlContent
        return $outputFile
    }
    
    # Add new method for AI-powered risk predictions
    hidden [hashtable] PredictRiskTrends([array]$historicalData) {
        # Initialize prediction results
        $predictions = @{
            ShortTerm = @{}  # Next 24 hours
            LongTerm = @{}   # Next 7 days
            Confidence = @{}
            Factors = @{}
        }
        
        # Group events by type and calculate baseline metrics
        $eventTypes = $historicalData | Group-Object -Property Type
        foreach ($type in $eventTypes) {
            $typeData = $type.Group
            
            # Calculate baseline statistics
            $riskScores = $typeData.RiskScore | Where-Object { $null -ne $_ }
            $avgRisk = ($riskScores | Measure-Object -Average).Average
            $stdDev = if ($riskScores.Count -gt 1) {
                ($riskScores | Measure-Object -StandardDeviation).StandardDeviation
            } else { 0 }
            
            # Identify risk factors
            $factors = @{
                TemporalPatterns = @{}
                RiskDistribution = @{}
                AnomalyFrequency = 0
            }
            
            # Analyze temporal patterns
            $hourlyEvents = $typeData | Group-Object { $_.Timestamp.Hour }
            foreach ($hour in $hourlyEvents) {
                $factors.TemporalPatterns[$hour.Name] = @{
                    Count = $hour.Count
                    AvgRisk = ($hour.Group.RiskScore | Measure-Object -Average).Average
                }
            }
            
            # Calculate risk distribution
            $riskLevels = @{
                Low = 0
                Medium = 0
                High = 0
                Critical = 0
            }
            foreach ($score in $riskScores) {
                if ($score -ge 0.8) { $riskLevels.Critical++ }
                elseif ($score -ge 0.6) { $riskLevels.High++ }
                elseif ($score -ge 0.4) { $riskLevels.Medium++ }
                else { $riskLevels.Low++ }
            }
            $factors.RiskDistribution = $riskLevels
            
            # Count anomalies (events > 2 std dev from mean)
            $factors.AnomalyFrequency = ($riskScores | Where-Object { 
                $_ -gt ($avgRisk + 2 * $stdDev) 
            }).Count
            
            # Generate predictions
            $shortTermRisk = $this.CalculateShortTermRisk($factors)
            $longTermRisk = $this.CalculateLongTermRisk($factors)
            
            $predictions.ShortTerm[$type.Name] = $shortTermRisk
            $predictions.LongTerm[$type.Name] = $longTermRisk
            $predictions.Confidence[$type.Name] = $this.CalculatePredictionConfidence($factors)
            $predictions.Factors[$type.Name] = $factors
        }
        
        return $predictions
    }
    
    # Add method for calculating short-term risk predictions
    hidden [double] CalculateShortTermRisk([hashtable]$factors) {
        $baseRisk = 0.0
        
        # Weight temporal patterns more heavily for short-term predictions
        $hourOfDay = (Get-Date).Hour
        if ($factors.TemporalPatterns.ContainsKey($hourOfDay)) {
            $baseRisk += $factors.TemporalPatterns[$hourOfDay].AvgRisk * 0.4
        }
        
        # Consider recent anomalies
        $baseRisk += [Math]::Min(($factors.AnomalyFrequency * 0.1), 0.3)
        
        # Factor in current risk distribution
        $total = $factors.RiskDistribution.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum
        if ($total -gt 0) {
            $baseRisk += (
                ($factors.RiskDistribution.Critical * 0.4) +
                ($factors.RiskDistribution.High * 0.2)
            ) / $total * 0.3
        }
        
        return [Math]::Min($baseRisk, 1.0)
    }
    
    # Add method for calculating long-term risk predictions
    hidden [double] CalculateLongTermRisk([hashtable]$factors) {
        $baseRisk = 0.0
        
        # Weight historical patterns more heavily for long-term predictions
        $total = $factors.RiskDistribution.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum
        if ($total -gt 0) {
            $baseRisk += (
                ($factors.RiskDistribution.Critical * 0.3) +
                ($factors.RiskDistribution.High * 0.2) +
                ($factors.RiskDistribution.Medium * 0.1)
            ) / $total * 0.5
        }
        
        # Consider overall anomaly frequency
        $baseRisk += [Math]::Min(($factors.AnomalyFrequency * 0.05), 0.2)
        
        # Factor in temporal stability
        $temporalVariance = $this.CalculateTemporalVariance($factors.TemporalPatterns)
        $baseRisk += $temporalVariance * 0.3
        
        return [Math]::Min($baseRisk, 1.0)
    }
    
    # Add method for calculating prediction confidence
    hidden [double] CalculatePredictionConfidence([hashtable]$factors) {
        $confidence = 0.5  # Base confidence
        
        # More data points increase confidence
        $total = $factors.RiskDistribution.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum
        $confidence += [Math]::Min(($total / 1000), 0.2)  # Cap at 20% boost
        
        # Consistent patterns increase confidence
        $temporalVariance = $this.CalculateTemporalVariance($factors.TemporalPatterns)
        $confidence += (1 - $temporalVariance) * 0.2
        
        # Recent anomalies decrease confidence
        $confidence -= [Math]::Min(($factors.AnomalyFrequency * 0.05), 0.2)
        
        return [Math]::Max(0.1, [Math]::Min($confidence, 0.9))  # Keep between 10% and 90%
    }
    
    # Add method for calculating temporal variance
    hidden [double] CalculateTemporalVariance([hashtable]$patterns) {
        if ($patterns.Count -eq 0) { return 1.0 }
        
        $values = $patterns.Values | ForEach-Object { $_.AvgRisk }
        $avg = ($values | Measure-Object -Average).Average
        $variance = ($values | ForEach-Object { [Math]::Pow($_ - $avg, 2) } | Measure-Object -Average).Average
        
        return [Math]::Min($variance, 1.0)
    }
}

# Create a function to return a new instance of the class
function New-SecurityVisualizer {
    param([string]$outputPath)
    return [SecurityVisualizer]::new($outputPath)
}

# Export only the function
Export-ModuleMember -Function New-SecurityVisualizer 
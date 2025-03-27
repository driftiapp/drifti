# Import required modules
Import-Module "$PSScriptRoot/SecurityVisualizer.psm1" -Force
Import-Module "$PSScriptRoot/SecurityReporter.psm1" -Force

# Create output directory if it doesn't exist
$outputPath = Join-Path $PSScriptRoot "../../security_reports"
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

# Initialize security reporter
$reporter = New-SecurityReporter -outputPath $outputPath

# Configure notifications (using test settings)
$reporter.ConfigureNotifications(@{
    Email = @{
        Enabled = $true
        SmtpServer = "smtp.test.com"
        Port = 587
        UseSsl = $true
        From = "security@test.com"
        To = @("admin@test.com")
        Username = "security@test.com"
        Password = "test123"  # In production, use secure credential storage
    }
    Slack = @{
        Enabled = $true
        WebhookUrl = "https://hooks.slack.com/services/test"
        Channel = "#security-alerts"
    }
})

# Create test events
$testEvents = @(
    @{
        Type = "Login"
        Timestamp = (Get-Date).AddHours(-2)
        RiskScore = 0.85
        Description = "Multiple failed login attempts from suspicious IP"
        Source = "192.168.1.100"
        FailedAttempts = 6
    },
    @{
        Type = "API"
        Timestamp = (Get-Date).AddHours(-1)
        RiskScore = 0.75
        Description = "Unusual API access pattern detected"
        Source = "api.example.com"
        RequestRate = 1000
        BaselineRate = 100
    },
    @{
        Type = "SSL"
        Timestamp = (Get-Date).AddMinutes(-30)
        RiskScore = 0.95
        Description = "SSL certificate validation failure"
        Source = "secure.example.com"
        CertificateErrors = 2
    }
)

# Generate AI predictions
$predictions = @{
    Login = @{
        ShortTerm = 0.8
        LongTerm = 0.6
        Confidence = 0.75
        Factors = @{
            TemporalPatterns = @{
                (Get-Date).Hour = @{
                    AvgRisk = 0.7
                }
            }
            RiskDistribution = @{
                Critical = 2
                High = 3
                Medium = 5
                Low = 10
            }
            AnomalyFrequency = 4
        }
    }
    API = @{
        ShortTerm = 0.7
        LongTerm = 0.5
        Confidence = 0.8
        Factors = @{
            TemporalPatterns = @{
                (Get-Date).Hour = @{
                    AvgRisk = 0.6
                }
            }
            RiskDistribution = @{
                Critical = 1
                High = 2
                Medium = 8
                Low = 15
            }
            AnomalyFrequency = 2
        }
    }
    SSL = @{
        ShortTerm = 0.9
        LongTerm = 0.7
        Confidence = 0.85
        Factors = @{
            TemporalPatterns = @{
                (Get-Date).Hour = @{
                    AvgRisk = 0.8
                }
            }
            RiskDistribution = @{
                Critical = 3
                High = 4
                Medium = 3
                Low = 5
            }
            AnomalyFrequency = 5
        }
    }
}

# Process events and generate alerts
Write-Host "Processing security events..."
$reporter.ProcessSecurityEvents($testEvents, $predictions)

# Generate reports
Write-Host "Generating daily report..."
$dailyReportPath = $reporter.GenerateDailyReport()
Write-Host "Daily report generated: $dailyReportPath"

Write-Host "Generating weekly report..."
$weeklyReportPath = $reporter.GenerateWeeklyReport()
Write-Host "Weekly report generated: $weeklyReportPath"

# Clean up old data
Write-Host "Cleaning up old data..."
$reporter.CleanupOldData()

Write-Host "Testing complete!" 
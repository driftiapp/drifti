# Import required modules
Import-Module "$PSScriptRoot\SecurityReporter.psd1" -Force
Import-Module "$PSScriptRoot\SecurityConfig.psm1" -Force

Write-Host "`n🔒 Testing Security Notifications"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

Write-Host "📝 Initializing Security Configuration..."
Write-Host "`n🔑 Loading credentials from environment..."

# Initialize test configuration
$config = @{
    Notifications = @{
        Email = @{
            Enabled = $true
            SmtpServer = "smtp.test.com"
            Port = 587
            UseSsl = $true
            From = "security@test.com"
            To = @("admin@test.com")
            Username = "test-user"
            Password = "test-password"
        }
        Slack = @{
            Enabled = $true
            WebhookUrl = "https://hooks.slack.com/test"
            Channel = "#security-test"
        }
        Teams = @{
            Enabled = $true
            WebhookUrl = "https://teams.microsoft.com/test"
        }
        Twilio = @{
            Enabled = $true
            AccountSid = "test-sid"
            AuthToken = "test-token"
            From = "+1234567890"
            To = @("+0987654321")
            MinimumSeverity = "High"
        }
        Webhooks = @{
            "CustomWebhook1" = @{
                Enabled = $true
                Url = "https://api.custom1.com/webhook"
                Method = "POST"
                Headers = @{
                    "Authorization" = "Bearer test-token"
                    "Content-Type" = "application/json"
                }
                MinimumSeverity = "Medium"
                Format = "JSON"
            }
            "CustomWebhook2" = @{
                Enabled = $true
                Url = "https://api.custom2.com/webhook"
                Method = "POST"
                Headers = @{
                    "X-API-Key" = "test-key"
                    "Content-Type" = "application/json"
                }
                MinimumSeverity = "Critical"
                Format = "Template"
                Template = "{severity}: {message}"
            }
        }
    }
}

Write-Host "No environment variables found, using test configuration..."
Write-Host "`n📊 Initializing Security Reporter..."

try {
    # Create output directory if it doesn't exist
    $outputPath = Join-Path $PSScriptRoot "..\..\security_reports"
    if (-not (Test-Path $outputPath)) {
        New-Item -ItemType Directory -Path $outputPath | Out-Null
    }

    # Initialize reporter
    $reporter = New-SecurityReporter -OutputPath $outputPath
    $reporter.ConfigureNotifications($config.Notifications)

    # Store test results
    $testResults = @{
        Email = $false
        Slack = $false
        Teams = $false
        Twilio = $false
        Webhooks = @{}
    }

    # Test each notification channel
    $testResults.Email = Test-EmailConnection -Reporter $reporter
    $testResults.Slack = Test-SlackConnection -Reporter $reporter
    $testResults.Teams = Test-TeamsConnection -Reporter $reporter
    $testResults.Twilio = Test-TwilioConnection -Reporter $reporter

    foreach ($hook in $config.Notifications.Webhooks.Keys) {
        $testResults.Webhooks[$hook] = Test-WebhookConnection -Reporter $reporter -WebhookName $hook
    }

    # Display test results
    Write-Host "`n📋 Test Results:"
    $emailStatus = if ($testResults.Email) { "✅ Connected" } else { "❌ Failed" }
    $slackStatus = if ($testResults.Slack) { "✅ Connected" } else { "❌ Failed" }
    $teamsStatus = if ($testResults.Teams) { "✅ Connected" } else { "❌ Failed" }
    $twilioStatus = if ($testResults.Twilio) { "✅ Connected" } else { "❌ Failed" }
    
    Write-Host ("Email Channel: {0}" -f $emailStatus)
    Write-Host ("Slack Channel: {0}" -f $slackStatus)
    Write-Host ("Teams Channel: {0}" -f $teamsStatus)
    Write-Host ("Twilio SMS: {0}" -f $twilioStatus)
    Write-Host "`nWebhook Results:"
    foreach ($hook in $testResults.Webhooks.Keys) {
        $hookStatus = if ($testResults.Webhooks[$hook]) { "✅ Connected" } else { "❌ Failed" }
        Write-Host ("{0}: {1}" -f $hook, $hookStatus)
    }
}
catch {
    Write-Error "❌ Error during notification testing: $_"
    exit 1
}

Write-Host "`n✨ Testing complete!" 
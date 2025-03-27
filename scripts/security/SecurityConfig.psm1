using namespace System.Security
using namespace System.Security.Cryptography

class SecurityConfig {
    hidden [string]$ConfigPath
    hidden [hashtable]$Settings
    hidden [string]$KeyFile
    
    SecurityConfig([string]$configPath) {
        $this.ConfigPath = $configPath
        $this.KeyFile = Join-Path $configPath "config.key"
        $this.Settings = @{}
        
        # Create config directory if it doesn't exist
        if (-not (Test-Path $configPath)) {
            New-Item -ItemType Directory -Path $configPath | Out-Null
        }
        
        # Generate or load encryption key
        if (-not (Test-Path $this.KeyFile)) {
            $this.GenerateEncryptionKey()
        }
        
        $this.LoadConfig()
    }
    
    # Generate a new encryption key
    hidden [void] GenerateEncryptionKey() {
        $key = New-Object byte[] 32
        $rng = [RNGCryptoServiceProvider]::new()
        $rng.GetBytes($key)
        $key | Set-Content $this.KeyFile -AsByteStream
    }
    
    # Load encryption key
    hidden [byte[]] GetEncryptionKey() {
        return Get-Content $this.KeyFile -AsByteStream
    }
    
    # Encrypt sensitive data
    hidden [string] EncryptString([string]$data) {
        if ([string]::IsNullOrEmpty($data)) { return "" }
        
        try {
            $key = $this.GetEncryptionKey()
            $secureString = ConvertTo-SecureString $data -AsPlainText -Force
            $encrypted = ConvertFrom-SecureString $secureString -Key $key
            return $encrypted
        }
        catch {
            Write-Error "Encryption failed: $_"
            return ""
        }
    }
    
    # Decrypt sensitive data
    hidden [string] DecryptString([string]$encryptedData) {
        if ([string]::IsNullOrEmpty($encryptedData)) { return "" }
        
        try {
            $key = $this.GetEncryptionKey()
            $secureString = ConvertTo-SecureString $encryptedData -Key $key
            $decrypted = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
            )
            return $decrypted
        }
        catch {
            Write-Error "Decryption failed: $_"
            return ""
        }
    }
    
    # Configure notification settings with encryption
    [void] ConfigureNotifications([hashtable]$settings) {
        # Email configuration
        if ($settings.ContainsKey("Email")) {
            $emailConfig = $settings.Email
            $this.Settings.Email = @{
                Enabled = $emailConfig.Enabled
                SmtpServer = $emailConfig.SmtpServer
                Port = $emailConfig.Port
                UseSsl = $emailConfig.UseSsl
                From = $emailConfig.From
                To = $emailConfig.To
                Username = $emailConfig.Username
                Password = $this.EncryptString($emailConfig.Password)
            }
        }
        
        # Slack configuration
        if ($settings.ContainsKey("Slack")) {
            $slackConfig = $settings.Slack
            $this.Settings.Slack = @{
                Enabled = $slackConfig.Enabled
                Channel = $slackConfig.Channel
                WebhookUrl = $this.EncryptString($slackConfig.WebhookUrl)
            }
        }
        
        # Teams configuration
        if ($settings.ContainsKey("Teams")) {
            $teamsConfig = $settings.Teams
            $this.Settings.Teams = @{
                Enabled = $teamsConfig.Enabled
                WebhookUrl = $this.EncryptString($teamsConfig.WebhookUrl)
            }
        }
        
        # Twilio SMS configuration
        if ($settings.ContainsKey("Twilio")) {
            $twilioConfig = $settings.Twilio
            $this.Settings.Twilio = @{
                Enabled = $twilioConfig.Enabled
                AccountSid = $twilioConfig.AccountSid
                AuthToken = $this.EncryptString($twilioConfig.AuthToken)
                From = $twilioConfig.From
                To = $twilioConfig.To
                MinimumSeverity = $twilioConfig.MinimumSeverity
            }
        }
        
        # Webhooks configuration
        if ($settings.ContainsKey("Webhooks")) {
            $this.Settings.Webhooks = @{}
            foreach ($hook in $settings.Webhooks) {
                $this.Settings.Webhooks[$hook.Name] = @{
                    Enabled = $hook.Enabled
                    Url = $this.EncryptString($hook.Url)
                    Method = $hook.Method
                    Headers = $hook.Headers
                    MinimumSeverity = $hook.MinimumSeverity
                    Format = $hook.Format
                    CustomTemplate = $hook.CustomTemplate
                }
            }
        }
        
        $this.SaveConfig()
    }
    
    # Save configuration to file
    hidden [void] SaveConfig() {
        $configFile = Join-Path $this.ConfigPath "config.json"
        $this.Settings | ConvertTo-Json -Depth 10 | Set-Content $configFile
    }
    
    # Load configuration from file
    hidden [void] LoadConfig() {
        $configFile = Join-Path $this.ConfigPath "config.json"
        if (Test-Path $configFile) {
            $this.Settings = Get-Content $configFile | ConvertFrom-Json -AsHashtable
        }
    }
    
    # Get decrypted configuration
    [hashtable] GetNotificationConfig() {
        $config = @{}
        
        # Decrypt email configuration
        if ($this.Settings.ContainsKey("Email")) {
            $config.Email = @{
                Enabled = $this.Settings.Email.Enabled
                SmtpServer = $this.Settings.Email.SmtpServer
                Port = $this.Settings.Email.Port
                UseSsl = $this.Settings.Email.UseSsl
                From = $this.Settings.Email.From
                To = $this.Settings.Email.To
                Username = $this.Settings.Email.Username
                Password = $this.DecryptString($this.Settings.Email.Password)
            }
        }
        
        # Decrypt Slack configuration
        if ($this.Settings.ContainsKey("Slack")) {
            $config.Slack = @{
                Enabled = $this.Settings.Slack.Enabled
                Channel = $this.Settings.Slack.Channel
                WebhookUrl = $this.DecryptString($this.Settings.Slack.WebhookUrl)
            }
        }
        
        # Decrypt Teams configuration
        if ($this.Settings.ContainsKey("Teams")) {
            $config.Teams = @{
                Enabled = $this.Settings.Teams.Enabled
                WebhookUrl = $this.DecryptString($this.Settings.Teams.WebhookUrl)
            }
        }
        
        # Decrypt Twilio configuration
        if ($this.Settings.ContainsKey("Twilio")) {
            $config.Twilio = @{
                Enabled = $this.Settings.Twilio.Enabled
                AccountSid = $this.Settings.Twilio.AccountSid
                AuthToken = $this.DecryptString($this.Settings.Twilio.AuthToken)
                From = $this.Settings.Twilio.From
                To = $this.Settings.Twilio.To
                MinimumSeverity = $this.Settings.Twilio.MinimumSeverity
            }
        }
        
        # Decrypt webhooks configuration
        if ($this.Settings.ContainsKey("Webhooks")) {
            $config.Webhooks = @{}
            foreach ($hookName in $this.Settings.Webhooks.Keys) {
                $hook = $this.Settings.Webhooks[$hookName]
                $config.Webhooks[$hookName] = @{
                    Enabled = $hook.Enabled
                    Url = $this.DecryptString($hook.Url)
                    Method = $hook.Method
                    Headers = $hook.Headers
                    MinimumSeverity = $hook.MinimumSeverity
                    Format = $hook.Format
                    CustomTemplate = $hook.CustomTemplate
                }
            }
        }
        
        return $config
    }
    
    # Load credentials from environment variables
    [void] LoadFromEnvironment() {
        $envConfig = @{
            Email = @{
                Enabled = $true
                SmtpServer = $env:SECURITY_SMTP_SERVER
                Port = [int]$env:SECURITY_SMTP_PORT
                UseSsl = $true
                From = $env:SECURITY_SMTP_FROM
                To = $env:SECURITY_SMTP_TO -split ','
                Username = $env:SECURITY_SMTP_USERNAME
                Password = $env:SECURITY_SMTP_PASSWORD
            }
            Slack = @{
                Enabled = $true
                Channel = $env:SECURITY_SLACK_CHANNEL
                WebhookUrl = $env:SECURITY_SLACK_WEBHOOK
            }
            Teams = @{
                Enabled = $true
                WebhookUrl = $env:SECURITY_TEAMS_WEBHOOK
            }
            Twilio = @{
                Enabled = $true
                AccountSid = $env:SECURITY_TWILIO_ACCOUNT_SID
                AuthToken = $env:SECURITY_TWILIO_AUTH_TOKEN
                From = $env:SECURITY_TWILIO_FROM
                To = $env:SECURITY_TWILIO_TO -split ','
                MinimumSeverity = $env:SECURITY_TWILIO_MIN_SEVERITY
            }
            Webhooks = @(
                @{
                    Name = "CustomWebhook1"
                    Enabled = $true
                    Url = $env:SECURITY_WEBHOOK1_URL
                    Method = $env:SECURITY_WEBHOOK1_METHOD
                    Headers = @{
                        Authorization = $env:SECURITY_WEBHOOK1_AUTH
                        "Content-Type" = "application/json"
                    }
                    MinimumSeverity = $env:SECURITY_WEBHOOK1_MIN_SEVERITY
                    Format = "JSON"
                }
            )
        }
        
        $this.ConfigureNotifications($envConfig)
    }
    
    # Test notification configurations
    [hashtable] TestConnections() {
        $results = @{
            Email = $false
            Slack = $false
            Teams = $false
            Twilio = $false
            Webhooks = @{}
        }
        
        $config = $this.GetNotificationConfig()
        
        # Test Email
        if ($config.ContainsKey("Email") -and $config.Email.Enabled) {
            try {
                $smtp = [System.Net.Mail.SmtpClient]::new(
                    $config.Email.SmtpServer,
                    $config.Email.Port
                )
                $smtp.EnableSsl = $config.Email.UseSsl
                $smtp.Credentials = [System.Net.NetworkCredential]::new(
                    $config.Email.Username,
                    $config.Email.Password
                )
                $smtp.TargetName = "SMTPSVC/" + $config.Email.SmtpServer
                $smtp.Connect()
                $smtp.Disconnect()
                $results.Email = $true
                Write-Host "✅ Email connection test successful"
            }
            catch {
                Write-Error "❌ Email connection test failed: $_"
            }
        }
        
        # Test Slack
        if ($config.ContainsKey("Slack") -and $config.Slack.Enabled) {
            try {
                $testPayload = @{
                    channel = $config.Slack.Channel
                    text = "🔒 Connection test from Security Reporter"
                }
                $body = ConvertTo-Json $testPayload -Compress
                Invoke-RestMethod `
                    -Uri $config.Slack.WebhookUrl `
                    -Method Post `
                    -Body $body `
                    -ContentType 'application/json'
                $results.Slack = $true
                Write-Host "✅ Slack connection test successful"
            }
            catch {
                Write-Error "❌ Slack connection test failed: $_"
            }
        }
        
        # Test Teams
        if ($config.ContainsKey("Teams") -and $config.Teams.Enabled) {
            try {
                $testPayload = @{
                    "@type" = "MessageCard"
                    "@context" = "http://schema.org/extensions"
                    text = "🔒 Connection test from Security Reporter"
                }
                $body = ConvertTo-Json $testPayload -Compress
                Invoke-RestMethod `
                    -Uri $config.Teams.WebhookUrl `
                    -Method Post `
                    -Body $body `
                    -ContentType 'application/json'
                $results.Teams = $true
                Write-Host "✅ Teams connection test successful"
            }
            catch {
                Write-Error "❌ Teams connection test failed: $_"
            }
        }
        
        # Test Twilio
        if ($config.ContainsKey("Twilio") -and $config.Twilio.Enabled) {
            try {
                $twilioUri = "https://api.twilio.com/2010-04-01/Accounts/$($config.Twilio.AccountSid)/Messages.json"
                $twilioAuth = [Convert]::ToBase64String(
                    [Text.Encoding]::ASCII.GetBytes("$($config.Twilio.AccountSid):$($config.Twilio.AuthToken)")
                )
                
                $testPayload = @{
                    To = $config.Twilio.To[0]
                    From = $config.Twilio.From
                    Body = "🔒 Connection test from Security Reporter"
                }
                
                $response = Invoke-RestMethod `
                    -Uri $twilioUri `
                    -Method Post `
                    -Headers @{ Authorization = "Basic $twilioAuth" } `
                    -Body $testPayload
                
                $results.Twilio = $true
                Write-Host "✅ Twilio connection test successful"
            }
            catch {
                Write-Error "❌ Twilio connection test failed: $_"
            }
        }
        
        # Test Webhooks
        if ($config.ContainsKey("Webhooks")) {
            foreach ($hookName in $config.Webhooks.Keys) {
                $hook = $config.Webhooks[$hookName]
                if ($hook.Enabled) {
                    try {
                        $testPayload = @{
                            type = "connection_test"
                            timestamp = Get-Date -Format o
                            message = "🔒 Connection test from Security Reporter"
                        }
                        
                        $body = switch ($hook.Format) {
                            "JSON" { ConvertTo-Json $testPayload -Compress }
                            "Template" { 
                                $template = $hook.CustomTemplate
                                foreach ($key in $testPayload.Keys) {
                                    $template = $template.Replace("{{$key}}", $testPayload[$key])
                                }
                                $template
                            }
                            default { ConvertTo-Json $testPayload -Compress }
                        }
                        
                        $response = Invoke-RestMethod `
                            -Uri $hook.Url `
                            -Method $hook.Method `
                            -Headers $hook.Headers `
                            -Body $body
                        
                        $results.Webhooks[$hookName] = $true
                        Write-Host "✅ Webhook '$hookName' connection test successful"
                    }
                    catch {
                        Write-Error "❌ Webhook '$hookName' connection test failed: $_"
                        $results.Webhooks[$hookName] = $false
                    }
                }
            }
        }
        
        return $results
    }
}

# Create a function to return a new instance of the class
function New-SecurityConfig {
    param([string]$configPath)
    return [SecurityConfig]::new($configPath)
}

# Export only the function
Export-ModuleMember -Function New-SecurityConfig 